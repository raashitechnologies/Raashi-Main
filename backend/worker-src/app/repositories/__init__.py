"""
Cloudflare D1 repositories — replacing MongoDB/Motor.
"""
from datetime import datetime, timezone
import uuid
import json
from typing import Any, Optional

def generate_id() -> str:
    """Generate a UUID string for new records."""
    return str(uuid.uuid4())

def now_iso() -> str:
    """Return current UTC time in ISO8601 format."""
    return datetime.now(timezone.utc).isoformat()

def _parse_json_fields(row: dict, json_fields: list[str]) -> dict:
    """Parse JSON strings back to dicts/lists for specified fields."""
    if not row:
        return row
    result = dict(row)
    for field in json_fields:
        if field in result and result[field]:
            try:
                result[field.replace("_json", "")] = json.loads(result[field])
            except Exception:
                result[field.replace("_json", "")] = {} # Fallback
            del result[field]
    return result

class DomainRepository:
    def __init__(self, db: Any):
        self.db = db

    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, [
            "overview_json", "hero_json", "offers_json", "tech_json", 
            "apps_json", "why_json", "internship_json", "future_json", "faqs_json"
        ])

    async def get_all(self) -> list[dict]:
        res = await self.db.prepare("SELECT * FROM domains").all()
        return [self._parse(r) for r in res["results"]]

    async def get_all_with_ids(self) -> list[dict]:
        return await self.get_all()

    async def get_by_slug(self, slug: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM domains WHERE slug = ?").bind(slug).first()
        return self._parse(row) if row else None

    async def get_by_id(self, domain_id: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM domains WHERE id = ?").bind(domain_id).first()
        return self._parse(row) if row else None

    async def get_by_id_admin(self, domain_id: str) -> Optional[dict]:
        return await self.get_by_id(domain_id)

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        stmt = self.db.prepare("""
            INSERT INTO domains (id, name, slug, overview_json, hero_json, offers_json, 
                               tech_json, apps_json, why_json, internship_json, future_json, faqs_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("name", ""), data.get("slug", ""),
            json.dumps(data.get("overview", {})), json.dumps(data.get("hero", {})),
            json.dumps(data.get("offers", [])), json.dumps(data.get("tech", {})),
            json.dumps(data.get("apps", {})), json.dumps(data.get("why", {})),
            json.dumps(data.get("internship", {})), json.dumps(data.get("future", {})),
            json.dumps(data.get("faqs", [])), now, now
        )
        await stmt.run()
        return new_id

    async def update(self, domain_id: str, data: dict) -> bool:
        updates = []
        binds = []
        for field in ["name", "slug"]:
            if field in data:
                updates.append(f"{field} = ?")
                binds.append(data[field])
        
        for field in ["overview", "hero", "offers", "tech", "apps", "why", "internship", "future", "faqs"]:
            if field in data:
                updates.append(f"{field}_json = ?")
                binds.append(json.dumps(data[field]))
        
        if not updates:
            return True
            
        updates.append("updated_at = ?")
        binds.append(now_iso())
        binds.append(domain_id)
        
        q = f"UPDATE domains SET {', '.join(updates)} WHERE id = ?"
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def update_image(self, domain_id: str, image_url: str, gridfs_id: str) -> bool:
        # gridfs_id is used to store R2 key as well for compatibility
        domain = await self.get_by_id(domain_id)
        if not domain:
            return False
        
        overview = domain.get("overview", {})
        overview["image_url"] = image_url
        overview["image_gridfs_id"] = gridfs_id
        
        return await self.update(domain_id, {"overview": overview})

    async def remove_image(self, domain_id: str) -> bool:
        domain = await self.get_by_id(domain_id)
        if not domain:
            return False
            
        overview = domain.get("overview", {})
        overview.pop("image_url", None)
        overview.pop("image_gridfs_id", None)
        
        return await self.update(domain_id, {"overview": overview})

    async def delete(self, domain_id: str) -> bool:
        res = await self.db.prepare("DELETE FROM domains WHERE id = ?").bind(domain_id).run()
        return res.get("meta", {}).get("changes", 0) > 0


class ContactRepository:
    def __init__(self, db: Any):
        self.db = db
        
    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, ["notes_json"])

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        await self.db.prepare("""
            INSERT INTO contact_messages (id, full_name, email, phone, subject, message, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("full_name"), data.get("email"), data.get("phone"),
            data.get("subject"), data.get("message"), "new", now, now
        ).run()
        return new_id

    async def get_all(self, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> list[dict]:
        q = "SELECT * FROM contact_messages"
        binds = []
        if status:
            q += " WHERE status = ?"
            binds.append(status)
        q += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        res = await self.db.prepare(q).bind(*binds).all()
        return [self._parse(r) for r in res["results"]]

    async def count(self, status: Optional[str] = None) -> int:
        q = "SELECT COUNT(*) as c FROM contact_messages"
        binds = []
        if status:
            q += " WHERE status = ?"
            binds.append(status)
        row = await self.db.prepare(q).bind(*binds).first()
        return row["c"] if row else 0

    async def get_by_id(self, contact_id: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM contact_messages WHERE id = ?").bind(contact_id).first()
        return self._parse(row) if row else None

    async def update_status(self, contact_id: str, status: str, handled_by: str = "") -> bool:
        q = "UPDATE contact_messages SET status = ?, updated_at = ?"
        binds = [status, now_iso()]
        if handled_by:
            q += ", handled_by = ?"
            binds.append(handled_by)
        q += " WHERE id = ?"
        binds.append(contact_id)
        
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def add_follow_up(self, contact_id: str, note: str, user_id: str) -> bool:
        contact = await self.get_by_id(contact_id)
        if not contact:
            return False
            
        notes = contact.get("notes", [])
        notes.append({
            "note": note,
            "user_id": user_id,
            "created_at": now_iso()
        })
        
        res = await self.db.prepare(
            "UPDATE contact_messages SET notes_json = ?, updated_at = ? WHERE id = ?"
        ).bind(json.dumps(notes), now_iso(), contact_id).run()
        
        return res.get("meta", {}).get("changes", 0) > 0


class InternshipRepository:
    def __init__(self, db: Any):
        self.db = db
        
    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, ["screening_remarks_json"])

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        await self.db.prepare("""
            INSERT INTO internship_applications 
            (id, full_name, email, phone, domain_slug, college, course_year, mode, message, 
             resume_url, resume_object_key, status, terms_document_id, terms_version, terms_agreed_at, 
             rules_document_id, rules_version, rules_agreed_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("full_name"), data.get("email"), data.get("phone"),
            data.get("domain_slug"), data.get("college"), data.get("course_year"),
            data.get("mode"), data.get("message"), data.get("resume_url"),
            data.get("resume_object_key"), "submitted", 
            data.get("terms_document_id"), data.get("terms_version"), 
            data.get("terms_agreed_at", now), data.get("rules_document_id"), 
            data.get("rules_version"), data.get("rules_agreed_at", now), now, now
        ).run()
        return new_id

    async def get_all(self, skip: int = 0, limit: int = 50, status: Optional[str] = None,
                      domain_slug: Optional[str] = None) -> list[dict]:
        q = "SELECT * FROM internship_applications WHERE 1=1"
        binds = []
        if status:
            q += " AND status = ?"
            binds.append(status)
        if domain_slug:
            q += " AND domain_slug = ?"
            binds.append(domain_slug)
        q += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        res = await self.db.prepare(q).bind(*binds).all()
        return [self._parse(r) for r in res["results"]]

    async def count(self, status: Optional[str] = None, domain_slug: Optional[str] = None) -> int:
        q = "SELECT COUNT(*) as c FROM internship_applications WHERE 1=1"
        binds = []
        if status:
            q += " AND status = ?"
            binds.append(status)
        if domain_slug:
            q += " AND domain_slug = ?"
            binds.append(domain_slug)
            
        row = await self.db.prepare(q).bind(*binds).first()
        return row["c"] if row else 0

    async def get_by_id(self, app_id: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM internship_applications WHERE id = ?").bind(app_id).first()
        return self._parse(row) if row else None

    async def update_status(self, app_id: str, status: str, reviewed_by: str = "") -> bool:
        q = "UPDATE internship_applications SET status = ?, updated_at = ?"
        binds = [status, now_iso()]
        if reviewed_by:
            q += ", reviewed_by = ?"
            binds.append(reviewed_by)
        q += " WHERE id = ?"
        binds.append(app_id)
        
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def add_screening_remark(self, app_id: str, remark: str, user_id: str, user_name: str) -> bool:
        app = await self.get_by_id(app_id)
        if not app:
            return False
            
        remarks = app.get("screening_remarks", [])
        remarks.append({
            "remark": remark,
            "user_id": user_id,
            "user_name": user_name,
            "created_at": now_iso()
        })
        
        res = await self.db.prepare(
            "UPDATE internship_applications SET screening_remarks_json = ?, updated_at = ? WHERE id = ?"
        ).bind(json.dumps(remarks), now_iso(), app_id).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def delete(self, app_id: str) -> bool:
        res = await self.db.prepare("DELETE FROM internship_applications WHERE id = ?").bind(app_id).run()
        return res.get("meta", {}).get("changes", 0) > 0


class CareerRepository:
    def __init__(self, db: Any):
        self.db = db
        
    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, ["screening_remarks_json"])

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        await self.db.prepare("""
            INSERT INTO career_applications 
            (id, full_name, email, phone, position, experience, portfolio_url, message, 
             resume_url, resume_object_key, status, terms_document_id, terms_version, terms_agreed_at, 
             rules_document_id, rules_version, rules_agreed_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("full_name"), data.get("email"), data.get("phone"),
            data.get("position"), data.get("experience"), data.get("portfolio_url"),
            data.get("message"), data.get("resume_url"), data.get("resume_object_key"),
            "received", data.get("terms_document_id"), data.get("terms_version"),
            data.get("terms_agreed_at", now), data.get("rules_document_id"),
            data.get("rules_version"), data.get("rules_agreed_at", now), now, now
        ).run()
        return new_id

    async def get_all(self, skip: int = 0, limit: int = 50, status: Optional[str] = None) -> list[dict]:
        q = "SELECT * FROM career_applications WHERE 1=1"
        binds = []
        if status:
            q += " AND status = ?"
            binds.append(status)
        q += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        res = await self.db.prepare(q).bind(*binds).all()
        return [self._parse(r) for r in res["results"]]

    async def count(self, status: Optional[str] = None) -> int:
        q = "SELECT COUNT(*) as c FROM career_applications WHERE 1=1"
        binds = []
        if status:
            q += " AND status = ?"
            binds.append(status)
        row = await self.db.prepare(q).bind(*binds).first()
        return row["c"] if row else 0

    async def get_by_id(self, app_id: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM career_applications WHERE id = ?").bind(app_id).first()
        return self._parse(row) if row else None

    async def update_status(self, app_id: str, status: str, reviewed_by: str = "") -> bool:
        q = "UPDATE career_applications SET status = ?, updated_at = ?"
        binds = [status, now_iso()]
        if reviewed_by:
            q += ", reviewed_by = ?"
            binds.append(reviewed_by)
        q += " WHERE id = ?"
        binds.append(app_id)
        
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def add_screening_remark(self, app_id: str, remark: str, user_id: str, user_name: str) -> bool:
        app = await self.get_by_id(app_id)
        if not app:
            return False
            
        remarks = app.get("screening_remarks", [])
        remarks.append({
            "remark": remark,
            "user_id": user_id,
            "user_name": user_name,
            "created_at": now_iso()
        })
        
        res = await self.db.prepare(
            "UPDATE career_applications SET screening_remarks_json = ?, updated_at = ? WHERE id = ?"
        ).bind(json.dumps(remarks), now_iso(), app_id).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def delete(self, app_id: str) -> bool:
        res = await self.db.prepare("DELETE FROM career_applications WHERE id = ?").bind(app_id).run()
        return res.get("meta", {}).get("changes", 0) > 0


class JobOpeningRepository:
    def __init__(self, db: Any):
        self.db = db
        
    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, ["requirements_json", "responsibilities_json"])

    async def get_active(self) -> list[dict]:
        res = await self.db.prepare("SELECT * FROM job_openings WHERE is_active = 1 ORDER BY created_at DESC").all()
        return [self._parse(r) for r in res["results"]]

    async def get_all(self, skip: int = 0, limit: int = 50) -> list[dict]:
        res = await self.db.prepare(f"SELECT * FROM job_openings ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}").all()
        return [self._parse(r) for r in res["results"]]

    async def count(self) -> int:
        row = await self.db.prepare("SELECT COUNT(*) as c FROM job_openings").first()
        return row["c"] if row else 0

    async def get_by_id(self, job_id: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM job_openings WHERE id = ?").bind(job_id).first()
        return self._parse(row) if row else None

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        await self.db.prepare("""
            INSERT INTO job_openings 
            (id, title, department, location, type, experience, description, 
             requirements_json, responsibilities_json, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("title"), data.get("department"), data.get("location"),
            data.get("type"), data.get("experience"), data.get("description"),
            json.dumps(data.get("requirements", [])), json.dumps(data.get("responsibilities", [])),
            data.get("is_active", 1), now, now
        ).run()
        return new_id

    async def update(self, job_id: str, data: dict) -> bool:
        updates = []
        binds = []
        for field in ["title", "department", "location", "type", "experience", "description", "is_active"]:
            if field in data:
                updates.append(f"{field} = ?")
                binds.append(data[field])
                
        for field in ["requirements", "responsibilities"]:
            if field in data:
                updates.append(f"{field}_json = ?")
                binds.append(json.dumps(data[field]))
                
        if not updates:
            return True
            
        updates.append("updated_at = ?")
        binds.append(now_iso())
        binds.append(job_id)
        
        q = f"UPDATE job_openings SET {', '.join(updates)} WHERE id = ?"
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def delete(self, job_id: str) -> bool:
        res = await self.db.prepare("UPDATE job_openings SET is_active = 0 WHERE id = ?").bind(job_id).run()
        return res.get("meta", {}).get("changes", 0) > 0


class UserRepository:
    def __init__(self, db: Any):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[dict]:
        return await self.db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first()

    async def get_by_id(self, user_id: str) -> Optional[dict]:
        return await self.db.prepare("SELECT * FROM users WHERE id = ?").bind(user_id).first()

    async def get_all(self, role: Optional[str] = None, skip: int = 0, limit: int = 50) -> list[dict]:
        q = "SELECT id, email, name, role, is_active, created_at, last_login FROM users WHERE 1=1"
        binds = []
        if role:
            q += " AND role = ?"
            binds.append(role)
        q += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        res = await self.db.prepare(q).bind(*binds).all()
        return res["results"]

    async def count(self, role: Optional[str] = None) -> int:
        q = "SELECT COUNT(*) as c FROM users WHERE 1=1"
        binds = []
        if role:
            q += " AND role = ?"
            binds.append(role)
        row = await self.db.prepare(q).bind(*binds).first()
        return row["c"] if row else 0

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        await self.db.prepare("""
            INSERT INTO users (id, email, password_hash, name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("email"), data.get("password_hash"), data.get("name"),
            data.get("role"), data.get("is_active", 1), now
        ).run()
        return new_id

    async def update(self, user_id: str, data: dict) -> bool:
        updates = []
        binds = []
        for field in ["email", "password_hash", "name", "role", "is_active", "last_login"]:
            if field in data:
                updates.append(f"{field} = ?")
                binds.append(data[field])
                
        if not updates:
            return True
            
        binds.append(user_id)
        
        q = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def set_active(self, user_id: str, is_active: bool) -> bool:
        res = await self.db.prepare("UPDATE users SET is_active = ? WHERE id = ?").bind(int(is_active), user_id).run()
        return res.get("meta", {}).get("changes", 0) > 0


class WebsiteContentRepository:
    def __init__(self, db: Any):
        self.db = db
        
    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, ["content_json"])

    async def get_all(self) -> list[dict]:
        res = await self.db.prepare("SELECT * FROM website_content ORDER BY section_key ASC").all()
        return [self._parse(r) for r in res["results"]]

    async def get_published(self) -> list[dict]:
        res = await self.db.prepare("SELECT * FROM website_content WHERE is_published = 1 ORDER BY section_key ASC").all()
        return [self._parse(r) for r in res["results"]]

    async def get_by_key(self, section_key: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM website_content WHERE section_key = ?").bind(section_key).first()
        return self._parse(row) if row else None

    async def get_published_by_key(self, section_key: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM website_content WHERE section_key = ? AND is_published = 1").bind(section_key).first()
        return self._parse(row) if row else None

    async def upsert(self, section_key: str, data: dict, updated_by: str = "") -> str:
        now = now_iso()
        # Title is CMS metadata; content remains the flexible section payload.
        # Retain the raw-data fallback for older callers.
        title = data.get("title")
        content_str = json.dumps(data.get("content", data))
        is_published = int(data.get("is_published", True))
        
        await self.db.prepare("""
            INSERT INTO website_content (section_key, content_json, is_published, updated_by, updated_at, title)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(section_key) DO UPDATE SET 
                content_json = excluded.content_json,
                is_published = excluded.is_published,
                updated_by = excluded.updated_by,
                updated_at = excluded.updated_at,
                title = excluded.title
        """).bind(section_key, content_str, is_published, updated_by, now, title).run()
        return section_key

    async def set_published(self, section_key: str, is_published: bool) -> bool:
        res = await self.db.prepare(
            "UPDATE website_content SET is_published = ?, updated_at = ? WHERE section_key = ?"
        ).bind(int(is_published), now_iso(), section_key).run()
        return res.get("meta", {}).get("changes", 0) > 0


class AuditLogRepository:
    def __init__(self, db: Any):
        self.db = db

    async def log(self, user_id: str, user_email: str, action: str,
                  resource: str, resource_id: str = "", details: str = "") -> str:
        new_id = generate_id()
        await self.db.prepare("""
            INSERT INTO audit_logs (id, user_id, user_email, action, resource_type, resource_id, details, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, user_id, user_email, action, resource, resource_id, details, now_iso()
        ).run()
        return new_id

    async def get_all(self, skip: int = 0, limit: int = 100) -> list[dict]:
        # The D1 column is named ``resource_type``.  Keep it in the result and
        # also expose the historic API field name consumed by the admin UI.
        res = await self.db.prepare(
            f"SELECT *, resource_type AS resource FROM audit_logs "
            f"ORDER BY timestamp DESC LIMIT {limit} OFFSET {skip}"
        ).all()
        return res["results"]

    async def count(self) -> int:
        row = await self.db.prepare("SELECT COUNT(*) as c FROM audit_logs").first()
        return row["c"] if row else 0


class InternshipListingRepository:
    def __init__(self, db: Any):
        self.db = db
        
    def _parse(self, row: dict) -> dict:
        return _parse_json_fields(row, ["requirements_json"])

    async def get_active(self) -> list[dict]:
        res = await self.db.prepare("SELECT * FROM internship_listings WHERE is_active = 1 ORDER BY created_at DESC").all()
        return [self._parse(r) for r in res["results"]]

    async def get_all(self, skip: int = 0, limit: int = 50) -> list[dict]:
        res = await self.db.prepare(f"SELECT * FROM internship_listings ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}").all()
        return [self._parse(r) for r in res["results"]]

    async def count(self) -> int:
        row = await self.db.prepare("SELECT COUNT(*) as c FROM internship_listings").first()
        return row["c"] if row else 0

    async def get_by_id(self, listing_id: str) -> Optional[dict]:
        row = await self.db.prepare("SELECT * FROM internship_listings WHERE id = ?").bind(listing_id).first()
        return self._parse(row) if row else None

    async def create(self, data: dict) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        await self.db.prepare("""
            INSERT INTO internship_listings 
            (id, title, domain_slug, description, requirements_json, duration, eligibility, mode, positions, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data.get("title"), data.get("domain_slug"), data.get("description"),
            json.dumps(data.get("requirements", [])), data.get("duration"), data.get("eligibility"),
            data.get("mode"), data.get("positions"),
            data.get("is_active", 1), now, now
        ).run()
        return new_id

    async def update(self, listing_id: str, data: dict) -> bool:
        updates = []
        binds = []
        for field in ["title", "domain_slug", "description", "duration", "eligibility", "mode", "positions", "is_active"]:
            if field in data:
                updates.append(f"{field} = ?")
                binds.append(data[field])
                
        if "requirements" in data:
            updates.append("requirements_json = ?")
            binds.append(json.dumps(data["requirements"]))
                
        if not updates:
            return True
            
        updates.append("updated_at = ?")
        binds.append(now_iso())
        binds.append(listing_id)
        
        q = f"UPDATE internship_listings SET {', '.join(updates)} WHERE id = ?"
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def delete(self, listing_id: str) -> bool:
        res = await self.db.prepare("UPDATE internship_listings SET is_active = 0 WHERE id = ?").bind(listing_id).run()
        return res.get("meta", {}).get("changes", 0) > 0

from .policies import PolicyRepository
