"""One-time, rerunnable migration of legacy MongoDB GridFS assets to R2.

This is an operator script, never Worker code. It reads legacy binary objects
from MongoDB/GridFS, writes them to the private ``raashi-technologies`` R2
bucket through the S3-compatible API, and updates only the D1 metadata needed
by the current R2-backed endpoints.

Required environment variables (load them in the local credentialed shell):
    MONGO_URI, CF_ACCOUNT_ID, CF_API_TOKEN, D1_DATABASE_ID,
    R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY

Optional:
    R2_BUCKET (defaults to ``raashi-technologies``)

Install the operator-only dependencies without changing Worker dependencies:
    uv run --with pymongo --with boto3 --with requests python scripts/migrate_gridfs_to_r2.py
"""

from __future__ import annotations

import json
import mimetypes
import os
from collections import defaultdict
from dataclasses import dataclass
from typing import Any

import requests


R2_BUCKET = os.getenv("R2_BUCKET", "raashi-technologies")
REQUIRED_ENVIRONMENT = (
    "MONGO_URI", "CF_ACCOUNT_ID", "CF_API_TOKEN", "D1_DATABASE_ID",
    "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
)


@dataclass
class Counts:
    mongo_gridfs: int = 0
    r2: int = 0
    migrated: int = 0
    skipped_existing: int = 0
    missing_source: int = 0
    errors: int = 0
    metadata_updated: int = 0


def require_environment() -> None:
    missing = [name for name in REQUIRED_ENVIRONMENT if not os.getenv(name)]
    if missing:
        raise SystemExit("Missing required environment variables: " + ", ".join(missing))


def d1_client() -> tuple[str, dict[str, str]]:
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{os.environ['CF_ACCOUNT_ID']}/d1/database/{os.environ['D1_DATABASE_ID']}/query"
    )
    return url, {
        "Authorization": f"Bearer {os.environ['CF_API_TOKEN']}",
        "Content-Type": "application/json",
    }


def d1_query(url: str, headers: dict[str, str], sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
    response = requests.post(url, headers=headers, json={"sql": sql, "params": params or []}, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success"):
        raise RuntimeError("D1 rejected statement")
    return payload.get("result", [{}])[0].get("results", [])


def object_extension(filename: str | None, content_type: str, asset_type: str) -> str:
    extension = os.path.splitext(filename or "")[1].lower()
    allowed_images = {".jpg", ".jpeg", ".png", ".webp"}
    if asset_type == "domain_overview" and extension in allowed_images:
        return extension
    if asset_type == "brochure" and extension == ".pdf":
        return extension
    guessed = mimetypes.guess_extension(content_type or "")
    if asset_type == "domain_overview" and guessed in allowed_images:
        return guessed
    if asset_type == "brochure" and content_type == "application/pdf":
        return ".pdf"
    raise ValueError(f"unsupported {asset_type} content type")


def gridfs_content_type(grid_out: Any, asset_type: str) -> str:
    metadata = getattr(grid_out, "metadata", None) or {}
    content_type = (
        getattr(grid_out, "content_type", None)
        or metadata.get("content_type")
        or metadata.get("contentType")
        or mimetypes.guess_type(getattr(grid_out, "filename", "") or "")[0]
    )
    if asset_type == "domain_overview" and content_type in {"image/jpeg", "image/png", "image/webp"}:
        return content_type
    if asset_type == "brochure" and content_type == "application/pdf":
        return content_type
    raise ValueError(f"unsupported {asset_type} content type")


def r2_head(r2: Any, key: str) -> dict[str, Any] | None:
    from botocore.exceptions import ClientError
    try:
        return r2.head_object(Bucket=R2_BUCKET, Key=key)
    except ClientError as exc:
        if str(exc.response.get("Error", {}).get("Code", "")) in {"404", "NoSuchKey", "NotFound"}:
            return None
        raise


def upload_or_verify(r2: Any, grid_out: Any, key: str, content_type: str, counts: Counts) -> None:
    """Ensure R2 has the exact source asset at the deterministic key."""
    expected_size = int(grid_out.length)
    existing = r2_head(r2, key)
    if existing:
        if existing.get("ContentLength") != expected_size or existing.get("ContentType") != content_type:
            raise RuntimeError("existing R2 object does not match legacy source")
        counts.r2 += 1
        counts.skipped_existing += 1
        return
    content = grid_out.read()
    if len(content) != expected_size:
        raise RuntimeError("GridFS source size changed while reading")
    r2.put_object(Bucket=R2_BUCKET, Key=key, Body=content, ContentType=content_type)
    verified = r2_head(r2, key)
    if not verified or verified.get("ContentLength") != expected_size or verified.get("ContentType") != content_type:
        raise RuntimeError("R2 upload verification failed")
    counts.r2 += 1
    counts.migrated += 1


def load_gridfs(fs: Any, raw_id: str) -> Any | None:
    from bson import ObjectId
    from gridfs.errors import NoFile
    try:
        return fs.get(ObjectId(str(raw_id)))
    except (NoFile, ValueError, TypeError):
        return None


def run() -> dict[str, Counts]:
    require_environment()
    try:
        import boto3
        from botocore.config import Config
        from pymongo import MongoClient
        import gridfs
    except ImportError as exc:
        raise SystemExit("Install operator dependencies with: uv run --with pymongo --with boto3 --with requests python scripts/migrate_gridfs_to_r2.py") from exc

    database = MongoClient(os.environ["MONGO_URI"]).get_default_database()
    fs = gridfs.GridFS(database)
    r2 = boto3.client(
        "s3", endpoint_url=os.environ["R2_ENDPOINT"],
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"], region_name="auto",
        config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
    )
    d1_url, d1_headers = d1_client()
    counts: dict[str, Counts] = defaultdict(Counts)

    # ``image_gridfs_id`` is retained as the R2-key field for runtime
    # compatibility. This replaces only its legacy GridFS identifier.
    for domain in d1_query(d1_url, d1_headers, "SELECT id, slug, overview_json FROM domains"):
        asset_type = "domain_overview"
        try:
            overview = json.loads(domain["overview_json"])
            legacy_id = overview.get("image_gridfs_id") if isinstance(overview, dict) else None
            if not legacy_id or str(legacy_id).startswith("domains/"):
                continue
            grid_out = load_gridfs(fs, str(legacy_id))
            if not grid_out:
                counts[asset_type].missing_source += 1
                print(f"MISSING_SOURCE asset_type={asset_type} domain_id={domain['id']}")
                continue
            counts[asset_type].mongo_gridfs += 1
            content_type = gridfs_content_type(grid_out, asset_type)
            extension = object_extension(getattr(grid_out, "filename", None), content_type, asset_type)
            key = f"domains/{domain['slug']}/legacy/{legacy_id}{extension}"
            upload_or_verify(r2, grid_out, key, content_type, counts[asset_type])
            overview["image_gridfs_id"] = key
            overview["image_url"] = f"/api/v1/domains/{domain['slug']}/image"
            d1_query(d1_url, d1_headers, "UPDATE domains SET overview_json = ? WHERE id = ?", [json.dumps(overview, separators=(",", ":")), domain["id"]])
            counts[asset_type].metadata_updated += 1
        except Exception as exc:
            counts[asset_type].errors += 1
            print(f"ERROR asset_type={asset_type} domain_id={domain.get('id')} error={type(exc).__name__}")

    brochures = d1_query(d1_url, d1_headers, "SELECT id, key_name, filename, gridfs_id, object_key FROM brochure WHERE gridfs_id IS NOT NULL")
    for brochure in brochures:
        asset_type = "brochure"
        try:
            legacy_id = brochure["gridfs_id"]
            grid_out = load_gridfs(fs, str(legacy_id))
            if not grid_out:
                counts[asset_type].missing_source += 1
                print(f"MISSING_SOURCE asset_type={asset_type} brochure_id={brochure['id']}")
                continue
            counts[asset_type].mongo_gridfs += 1
            content_type = gridfs_content_type(grid_out, asset_type)
            extension = object_extension(brochure.get("filename") or getattr(grid_out, "filename", None), content_type, asset_type)
            key = f"brochure/legacy/{legacy_id}{extension}"
            upload_or_verify(r2, grid_out, key, content_type, counts[asset_type])
            if brochure.get("object_key") != key:
                d1_query(d1_url, d1_headers, "UPDATE brochure SET object_key = ? WHERE id = ?", [key, brochure["id"]])
                counts[asset_type].metadata_updated += 1
        except Exception as exc:
            counts[asset_type].errors += 1
            print(f"ERROR asset_type={asset_type} brochure_id={brochure.get('id')} error={type(exc).__name__}")
    return counts


def main() -> None:
    counts = run()
    print("asset type | Mongo/GridFS count | R2 count | migrated | skipped_existing | missing_source | errors")
    for asset_type in ("domain_overview", "brochure"):
        count = counts[asset_type]
        print(f"{asset_type} | {count.mongo_gridfs} | {count.r2} | {count.migrated} | {count.skipped_existing} | {count.missing_source} | {count.errors}")
    if any(count.errors or count.missing_source for count in counts.values()):
        raise SystemExit("GridFS-to-R2 migration completed with unresolved assets.")


if __name__ == "__main__":
    main()
