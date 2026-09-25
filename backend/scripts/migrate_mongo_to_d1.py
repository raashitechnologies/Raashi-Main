"""Diagnostic-first, idempotent migration from legacy MongoDB to Cloudflare D1.

Run this only from an operator workstation that has the required environment
variables. The script deliberately does not use ``INSERT OR IGNORE``: every
constraint violation must be visible so no source record is silently discarded.
"""
import json
import os
from datetime import date, datetime
from typing import Any


# A source may have either historical contact collection name. Each source is
# reported separately; target primary-key checks make reruns safe.
COLLECTIONS = {
    "users": "users",
    "contacts": "contact_messages",
    "contact_messages": "contact_messages",
    "domains": "domains",
    "policies": "policies",
    "website_content": "website_content",
    "internship_listings": "internship_listings",
    "internship_applications": "internship_applications",
    "job_openings": "job_openings",
    "career_applications": "career_applications",
    "audit_logs": "audit_logs",
    "brochure": "brochure",
    "login_attempts": "login_attempts",
    "revoked_tokens": "revoked_tokens",
}

# D1 keys that differ from the normal Mongo ObjectId -> ``id`` convention.
TARGET_PRIMARY_KEYS = {
    "website_content": "section_key",
    "revoked_tokens": "jti",
}

# These are the only established source-to-target field renames. Same-named
# fields are retained; unsupported fields are reported rather than hidden.
JSON_COLUMNS = {
    "domains": {
        "overview_json": "overview",
        "hero_json": "hero",
        "offers_json": "offer_section",
        "tech_json": "tech_section",
        "apps_json": "apps_section",
        "why_json": "why_section",
        "internship_json": "internship",
        "future_json": "future_services",
        "faqs_json": "faq_section",
    },
    "internship_listings": {"requirements_json": "requirements"},
    "internship_applications": {"screening_remarks_json": "screening_remarks"},
    "job_openings": {
        "requirements_json": "requirements",
        "responsibilities_json": "responsibilities",
    },
    "career_applications": {"screening_remarks_json": "screening_remarks"},
    "contact_messages": {"notes_json": "notes"},
    "contacts": {"notes_json": "notes"},
    "website_content": {"content_json": "content"},
}

# Field names that changed without a semantic change. These mappings are
# derived from the legacy repository contracts:
# - AuditLogRepository.log(..., resource, ...) persists that value as
#   ``resource_type`` in D1.
# - The brochure singleton was addressed by ``key`` in Mongo and ``key_name``
#   in D1.
RENAMED_COLUMNS = {
    "audit_logs": {"resource_type": "resource"},
    "brochure": {"key_name": "key"},
}

# These legacy fields have the same names as the nullable compatibility columns
# introduced by 0004, so transform() preserves them without a lossy rename:
# website_content.title/created_at, internship_listings.eligibility/mode/
# positions, and career_applications/job_openings.experience.  Missing values
# intentionally remain absent and bind as NULL only where the D1 schema allows.


def scalar(value: Any) -> Any:
    """Convert Mongo-only values to D1-bindable scalar values."""
    # D1 stores application flags in INTEGER columns.  Normalize BSON/Python
    # booleans before handing parameters to the D1 HTTP API, whose serializer
    # otherwise represented them as text ("true" / "false").
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if value.__class__.__name__ == "ObjectId":
        return str(value)
    if isinstance(value, (dict, list)):
        return json.dumps(value, default=scalar, separators=(",", ":"))
    return value


def mongo_id(doc: dict[str, Any]) -> str:
    """Return an ID for diagnostics without printing document contents."""
    return str(doc.get("_id", "<missing _id>"))


def transform(source: str, table: str, doc: dict[str, Any]) -> dict[str, Any]:
    """Preserve same-named fields and apply only explicit legacy mappings."""
    out = {key: scalar(value) for key, value in doc.items() if key != "_id"}
    primary_key = TARGET_PRIMARY_KEYS.get(table, "id")

    if primary_key == "id":
        out["id"] = mongo_id(doc)
    elif table == "website_content" and "section_key" not in out:
        # Some legacy CMS documents used ``key`` for their logical identity.
        out["section_key"] = out.pop("key", None)

    for target, legacy_source in JSON_COLUMNS.get(source, {}).items():
        if legacy_source in out:
            out[target] = scalar(out.pop(legacy_source))

    for target, legacy_source in RENAMED_COLUMNS.get(source, {}).items():
        if legacy_source in out:
            out[target] = out.pop(legacy_source)

    # Legacy create paths used their creation timestamp as the initial update
    # timestamp. Preserve that historical meaning rather than inventing a new
    # migration-time value.
    if source in {
        "contacts",
        "contact_messages",
        "internship_listings",
        "internship_applications",
        "career_applications",
    } and out.get("updated_at") is None and out.get("created_at") is not None:
        out["updated_at"] = out["created_at"]

    # Legacy job documents used ``posted_at`` as their only lifecycle
    # timestamp. The D1 repository sorts by ``created_at`` and sets its first
    # ``updated_at`` at creation, so both fields faithfully carry ``posted_at``.
    if source == "job_openings" and out.get("posted_at") is not None:
        out.setdefault("created_at", out["posted_at"])
        out.setdefault("updated_at", out["posted_at"])
        out.pop("posted_at", None)

    # The D1 job repository explicitly defaults omitted requirement lists to
    # empty arrays. This is a schema-level default for legacy jobs that never
    # modeled either field, not a business-data invention.
    if source == "job_openings":
        out.setdefault("requirements_json", "[]")
        out.setdefault("responsibilities_json", "[]")

    # InternshipListingCreate has no requirements field, and its repository
    # persists data.get("requirements", []) for every listing. Preserve an
    # actual legacy requirements list when present (JSON_COLUMNS above); when
    # absent, use that established empty-list default rather than inventing
    # eligibility, mode, or positions as requirements.
    if source == "internship_listings":
        out.setdefault("requirements_json", "[]")

    return out


def emit_error(
    collection: str,
    document_id: str,
    table: str,
    reason: str,
    *,
    missing_fields: list[str] | None = None,
    unmapped_fields: list[str] | None = None,
) -> None:
    """Print a per-record diagnostic without source document contents."""
    details = [
        f"collection={collection}",
        f"mongo_id={document_id}",
        f"target_table={table}",
        f"reason={reason}",
    ]
    if missing_fields:
        details.append("missing_fields=" + ",".join(sorted(missing_fields)))
    if unmapped_fields:
        details.append("unmapped_fields=" + ",".join(sorted(unmapped_fields)))
    print("ERROR " + " ".join(details))


def main() -> None:
    required = ("MONGO_URI", "CF_ACCOUNT_ID", "CF_API_TOKEN", "D1_DATABASE_ID")
    missing_environment = [name for name in required if not os.getenv(name)]
    if missing_environment:
        raise SystemExit("Missing required environment variables: " + ", ".join(missing_environment))

    from pymongo import MongoClient
    import requests

    database = MongoClient(os.environ["MONGO_URI"]).get_default_database()
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{os.environ['CF_ACCOUNT_ID']}/d1/database/{os.environ['D1_DATABASE_ID']}/query"
    )
    headers = {
        "Authorization": f"Bearer {os.environ['CF_API_TOKEN']}",
        "Content-Type": "application/json",
    }

    def d1_query(sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
        response = requests.post(
            url, headers=headers, json={"sql": sql, "params": params or []}, timeout=30
        )
        response.raise_for_status()
        payload = response.json()
        if not payload.get("success"):
            raise RuntimeError("D1 rejected statement")
        return payload.get("result", [{}])[0].get("results", [])

    def table_schema(table: str) -> dict[str, dict[str, Any]]:
        rows = d1_query(f"PRAGMA table_info({table})")
        if not rows:
            raise RuntimeError(f"D1 table does not exist: {table}")
        return {row["name"]: row for row in rows}

    schema = {table: table_schema(table) for table in set(COLLECTIONS.values())}

    def record_exists(table: str, primary_key: str, value: Any) -> bool:
        rows = d1_query(
            f"SELECT 1 AS exists_in_d1 FROM {table} WHERE {primary_key} = ? LIMIT 1",
            [value],
        )
        return bool(rows)

    def table_count(table: str) -> int:
        rows = d1_query(f"SELECT COUNT(*) AS count FROM {table}")
        return int(rows[0]["count"])

    summary: dict[str, dict[str, int]] = {}
    for source, table in COLLECTIONS.items():
        target_schema = schema[table]
        primary_key = TARGET_PRIMARY_KEYS.get(table, "id")
        required_columns = {
            name
            for name, column in target_schema.items()
            if (column.get("notnull") and column.get("dflt_value") is None)
            or column.get("pk")
        }
        outcome = {
            "mongo": database[source].count_documents({}),
            "d1_before": table_count(table),
            "migrated": 0,
            "skipped_existing": 0,
            "errors": 0,
        }

        for doc in database[source].find().batch_size(100):
            document_id = mongo_id(doc)
            values = transform(source, table, doc)
            primary_value = values.get(primary_key)

            if primary_value is None:
                outcome["errors"] += 1
                emit_error(source, document_id, table, "missing_target_primary_key", missing_fields=[primary_key])
                continue

            try:
                if record_exists(table, primary_key, primary_value):
                    outcome["skipped_existing"] += 1
                    print(
                        "SKIPPED_EXISTING "
                        f"collection={source} mongo_id={document_id} target_table={table}"
                    )
                    continue

                # Preserve None until validation. Never silently filter a
                # required value out of an INSERT.
                target_values = {
                    name: value for name, value in values.items() if name in target_schema
                }
                missing_required = [
                    column
                    for column in required_columns
                    if column not in target_values or target_values[column] is None
                ]
                unmapped = sorted(name for name in values if name not in target_schema)
                if missing_required:
                    outcome["errors"] += 1
                    emit_error(
                        source,
                        document_id,
                        table,
                        "missing_required_target_fields",
                        missing_fields=missing_required,
                        unmapped_fields=unmapped,
                    )
                    continue
                if unmapped:
                    # Do not insert a partial row when D1 has no place for a
                    # source field. The error identifies the exact record and
                    # fields needing a schema/mapping decision.
                    outcome["errors"] += 1
                    emit_error(
                        source,
                        document_id,
                        table,
                        "unmapped_source_fields",
                        unmapped_fields=unmapped,
                    )
                    continue

                columns = list(target_values)
                placeholders = ", ".join("?" for _ in columns)
                d1_query(
                    f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})",
                    [target_values[column] for column in columns],
                )
                outcome["migrated"] += 1
            except Exception as exc:
                outcome["errors"] += 1
                emit_error(source, document_id, table, f"d1_insert_failed:{type(exc).__name__}")

        outcome["d1_after"] = table_count(table)
        summary[source] = outcome

    print("collection | Mongo count | D1 count before | migrated | skipped_existing | errors | D1 count after")
    for collection, outcome in summary.items():
        print(
            f"{collection} | {outcome['mongo']} | {outcome['d1_before']} | "
            f"{outcome['migrated']} | {outcome['skipped_existing']} | "
            f"{outcome['errors']} | {outcome['d1_after']}"
        )
    if any(outcome["errors"] for outcome in summary.values()):
        raise SystemExit("Migration completed with errors; reconcile diagnostics before cutover.")


if __name__ == "__main__":
    main()
