from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from typing import List, Optional

from app.schemas.policies import (
    PolicyDocumentOut,
    PolicyDocumentCreate,
    PolicyDocumentUpdate,
    DocumentType,
    Audience
)
from app.repositories import PolicyRepository, AuditLogRepository
from app.core.database import get_database
from app.core.config import get_settings
from app.core.auth import require_role

admin_dep = require_role("admin")

from typing import Any

router = APIRouter(prefix="/policies", tags=["policies"])
limiter = Limiter(key_func=get_remote_address)

def get_policy_repo(db: Any = Depends(get_database)) -> PolicyRepository:
    return PolicyRepository(db)

def get_audit_repo(db: Any = Depends(get_database)) -> AuditLogRepository:
    return AuditLogRepository(db)


@router.get("/active", response_model=List[PolicyDocumentOut])
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_active_policies(
    audience: Audience,
    request: Request,
    repo: PolicyRepository = Depends(get_policy_repo)
):
    """
    Public endpoint: Get the currently active Terms and Rules for a specific audience.
    """
    policies = []
    
    terms = await repo.get_active(DocumentType.TERMS, audience)
    if terms:
        policies.append(terms)
        
    rules = await repo.get_active(DocumentType.RULES, audience)
    if rules:
        policies.append(rules)
        
    return policies


@router.get("/admin", response_model=List[PolicyDocumentOut])
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def get_all_policies(
    request: Request,
    audience: Optional[Audience] = None,
    repo: PolicyRepository = Depends(get_policy_repo),
    current_user: dict = Depends(admin_dep)
):
    """
    Admin endpoint: Get all policies, optionally filtered by audience.
    """
    return await repo.get_all(audience)


@router.get("/admin/history", response_model=List[PolicyDocumentOut])
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def get_policy_history(
    request: Request,
    document_type: DocumentType,
    audience: Audience,
    repo: PolicyRepository = Depends(get_policy_repo),
    current_user: dict = Depends(admin_dep)
):
    """
    Admin endpoint: Get the version history for a specific document type and audience.
    """
    return await repo.get_history(document_type, audience)


@router.get("/admin/{policy_id}", response_model=PolicyDocumentOut)
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def get_policy(
    policy_id: str,
    request: Request,
    repo: PolicyRepository = Depends(get_policy_repo),
    current_user: dict = Depends(admin_dep)
):
    """
    Admin endpoint: Get a specific policy document by ID.
    """
    try:
        policy = await repo.get_by_id(policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid policy ID format")
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.post("/admin", response_model=PolicyDocumentOut, status_code=status.HTTP_201_CREATED)
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def create_policy_draft(
    policy_in: PolicyDocumentCreate,
    request: Request,
    repo: PolicyRepository = Depends(get_policy_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
    current_user: dict = Depends(admin_dep)
):
    """
    Admin endpoint: Create a new draft policy document.
    """
    policy_id = await repo.create_draft(policy_in.model_dump(), current_user["email"])
    policy = await repo.get_by_id(policy_id)
    
    await audit_repo.log(
        user_id=current_user["id"],
        user_email=current_user["email"],
        action="CREATE_POLICY_DRAFT",
        resource="policies",
        resource_id=policy_id,
        details=f"Created draft for {policy_in.document_type} - {policy_in.audience}"
    )
    
    return policy


@router.put("/admin/{policy_id}", response_model=PolicyDocumentOut)
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_policy_draft(
    policy_id: str,
    policy_in: PolicyDocumentUpdate,
    request: Request,
    repo: PolicyRepository = Depends(get_policy_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
    current_user: dict = Depends(admin_dep)
):
    """
    Admin endpoint: Update an existing draft policy document.
    """
    try:
        policy = await repo.get_by_id(policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid policy ID format")
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if policy["status"] != "DRAFT":
        raise HTTPException(status_code=400, detail="Only drafts can be updated")
        
    update_data = policy_in.model_dump(exclude_unset=True)
    if not update_data:
        return policy
        
    success = await repo.update_draft(policy_id, update_data)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update draft")
        
    updated_policy = await repo.get_by_id(policy_id)
    
    await audit_repo.log(
        user_id=current_user["id"],
        user_email=current_user["email"],
        action="UPDATE_POLICY_DRAFT",
        resource="policies",
        resource_id=policy_id,
        details=f"Updated draft {policy_id}"
    )
    
    return updated_policy


@router.post("/admin/{policy_id}/publish", response_model=PolicyDocumentOut)
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def publish_policy(
    policy_id: str,
    request: Request,
    repo: PolicyRepository = Depends(get_policy_repo),
    audit_repo: AuditLogRepository = Depends(get_audit_repo),
    current_user: dict = Depends(admin_dep)
):
    """
    Admin endpoint: Publish a draft policy document.
    """
    try:
        policy = await repo.get_by_id(policy_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid policy ID format")
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if policy["status"] != "DRAFT":
        raise HTTPException(status_code=400, detail="Only drafts can be published")
        
    success = await repo.publish(policy_id, current_user["email"])
    if not success:
        raise HTTPException(status_code=400, detail="Failed to publish policy")
        
    published_policy = await repo.get_by_id(policy_id)
    
    await audit_repo.log(
        user_id=current_user["id"],
        user_email=current_user["email"],
        action="PUBLISH_POLICY",
        resource="policies",
        resource_id=policy_id,
        details=f"Published v{published_policy['version']} for {published_policy['document_type']} - {published_policy['audience']}"
    )
    
    return published_policy
