from datetime import datetime, timezone
import uuid
from typing import Optional, Any
from app.schemas.policies import DocumentType, Audience, PolicyStatus

def generate_id() -> str:
    return str(uuid.uuid4())

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def timestamp_value(value: Any) -> Any:
    """Bind Pydantic datetime fields using the D1 text timestamp convention."""
    return value.isoformat() if isinstance(value, datetime) else value


class PolicyRepository:
    def __init__(self, db: Any):
        self.db = db

    async def get_all(self, audience: Optional[Audience] = None, skip: int = 0, limit: int = 50) -> list[dict]:
        q = "SELECT * FROM policies WHERE 1=1"
        binds = []
        if audience:
            q += " AND audience = ?"
            binds.append(audience.value)
        q += f" ORDER BY created_at DESC LIMIT {limit} OFFSET {skip}"
        
        res = await self.db.prepare(q).bind(*binds).all()
        return res["results"]
        
    async def get_history(self, document_type: DocumentType, audience: Audience) -> list[dict]:
        res = await self.db.prepare(
            "SELECT * FROM policies WHERE document_type = ? AND audience = ? ORDER BY version DESC"
        ).bind(document_type.value, audience.value).all()
        return res["results"]

    async def count(self, audience: Optional[Audience] = None) -> int:
        q = "SELECT COUNT(*) as c FROM policies WHERE 1=1"
        binds = []
        if audience:
            q += " AND audience = ?"
            binds.append(audience.value)
        row = await self.db.prepare(q).bind(*binds).first()
        return row["c"] if row else 0

    async def get_by_id(self, policy_id: str) -> Optional[dict]:
        return await self.db.prepare("SELECT * FROM policies WHERE id = ?").bind(policy_id).first()

    async def get_active(self, document_type: DocumentType, audience: Audience) -> Optional[dict]:
        return await self.db.prepare(
            "SELECT * FROM policies WHERE document_type = ? AND audience = ? AND status = ?"
        ).bind(document_type.value, audience.value, PolicyStatus.PUBLISHED.value).first()

    async def create_draft(self, data: dict, created_by: str) -> str:
        new_id = data.get("id") or generate_id()
        now = now_iso()
        
        # Determine next version number
        highest_version_row = await self.db.prepare(
            "SELECT version FROM policies WHERE document_type = ? AND audience = ? ORDER BY version DESC LIMIT 1"
        ).bind(data["document_type"], data["audience"]).first()
        
        next_version = (highest_version_row["version"] + 1) if highest_version_row else 1
        
        await self.db.prepare("""
            INSERT INTO policies (
                id, document_type, audience, title, content, version, status,
                is_active, effective_from, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """).bind(
            new_id, data["document_type"], data["audience"], data["title"],
            data["content"], next_version, PolicyStatus.DRAFT.value, 0,
            timestamp_value(data.get("effective_from")), created_by, now,
        ).run()
        
        return new_id

    async def update_draft(self, policy_id: str, data: dict) -> bool:
        updates = []
        binds = []
        for field in ["title", "content", "effective_from"]:
            if field in data:
                updates.append(f"{field} = ?")
                binds.append(timestamp_value(data[field]) if field == "effective_from" else data[field])
                
        if not updates:
            return True
            
        updates.append("updated_at = ?")
        binds.append(now_iso())
        
        binds.append(policy_id)
        binds.append(PolicyStatus.DRAFT.value)
        
        q = f"UPDATE policies SET {', '.join(updates)} WHERE id = ? AND status = ?"
        res = await self.db.prepare(q).bind(*binds).run()
        return res.get("meta", {}).get("changes", 0) > 0

    async def publish(self, policy_id: str, published_by: str) -> bool:
        draft = await self.db.prepare(
            "SELECT * FROM policies WHERE id = ? AND status = ?"
        ).bind(policy_id, PolicyStatus.DRAFT.value).first()
        
        if not draft:
            return False
            
        now = now_iso()
        doc_type = draft["document_type"]
        audience = draft["audience"]
        
        # Archive current published versions
        await self.db.prepare(
            "UPDATE policies SET status = ?, is_active = 0, updated_at = ? "
            "WHERE document_type = ? AND audience = ? AND status = ?"
        ).bind(PolicyStatus.ARCHIVED.value, now, doc_type, audience, PolicyStatus.PUBLISHED.value).run()
        
        # Publish the draft
        res = await self.db.prepare(
            "UPDATE policies SET status = ?, is_active = 1, published_at = ?, "
            "published_by = ?, updated_at = ? WHERE id = ?"
        ).bind(PolicyStatus.PUBLISHED.value, now, published_by, now, policy_id).run()
        
        return res.get("meta", {}).get("changes", 0) > 0
