from typing import Optional
"""
Coordinator API endpoints — protected with require_role("coordinator", "admin").
Admins can also access coordinator endpoints.
Focused on application screening, candidate management, and coordination.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from typing import Any

from app.core.config import get_settings
from app.core.database import get_database
from app.core.auth import require_role
from app.core.validators import cap_pagination
from app.repositories import (
    InternshipRepository, CareerRepository, ContactRepository,
    AuditLogRepository, InternshipListingRepository,
)
from app.schemas import ApplicationStatusUpdate, ScreeningRemarkCreate, ContactStatusUpdate

router = APIRouter(prefix="/coordinator", tags=["coordinator"])
limiter = Limiter(key_func=get_remote_address)

# Both coordinator and admin can access these endpoints
coord_dep = require_role("coordinator", "admin")


# ── Dependency helpers ───────────────────────────────────────────────────────

def get_internship_repo(db: Any = Depends(get_database)) -> InternshipRepository:
    return InternshipRepository(db)

def get_career_repo(db: Any = Depends(get_database)) -> CareerRepository:
    return CareerRepository(db)

def get_contact_repo(db: Any = Depends(get_database)) -> ContactRepository:
    return ContactRepository(db)

def get_audit_repo(db: Any = Depends(get_database)) -> AuditLogRepository:
    return AuditLogRepository(db)

def get_listing_repo(db: Any = Depends(get_database)) -> InternshipListingRepository:
    return InternshipListingRepository(db)


# ═══════════════════════════════════════════════════════════════════════════════
#  COORDINATOR DASHBOARD
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/dashboard", summary="Coordinator dashboard stats")
async def coordinator_dashboard(
    current_user: dict = Depends(coord_dep),
    db: Any = Depends(get_database),
):
    async def get_count(table: str, condition: str = "") -> int:
        row = await db.prepare(f"SELECT COUNT(*) as c FROM {table} {condition}").first()
        return row["c"] if row else 0

    internship_apps = await get_count("internship_applications")
    career_apps = await get_count("career_applications")
    contacts = await get_count("contact_messages")

    intern_submitted = await get_count("internship_applications", "WHERE status = 'submitted'")
    intern_shortlisted = await get_count("internship_applications", "WHERE status = 'shortlisted'")
    intern_under_review = await get_count("internship_applications", "WHERE status = 'under_review'")

    career_received = await get_count("career_applications", "WHERE status = 'received'")
    career_shortlisted = await get_count("career_applications", "WHERE status = 'shortlisted'")
    career_under_review = await get_count("career_applications", "WHERE status = 'under_review'")

    contacts_new = await get_count("contact_messages", "WHERE status = 'new'")

    recent_intern_query = await db.prepare(
        "SELECT full_name, email, domain_slug, status, created_at FROM internship_applications ORDER BY created_at DESC LIMIT 5"
    ).all()
    recent_intern = recent_intern_query.results

    recent_career_query = await db.prepare(
        "SELECT full_name, email, position, status, created_at FROM career_applications ORDER BY created_at DESC LIMIT 5"
    ).all()
    recent_career = recent_career_query.results

    return {
        "totals": {
            "internship_applications": internship_apps,
            "career_applications": career_apps,
            "contacts": contacts,
        },
        "internship_status": {
            "submitted": intern_submitted,
            "shortlisted": intern_shortlisted,
            "under_review": intern_under_review,
        },
        "career_status": {
            "received": career_received,
            "shortlisted": career_shortlisted,
            "under_review": career_under_review,
        },
        "contacts_new": contacts_new,
        "recent_internship_applications": recent_intern,
        "recent_career_applications": recent_career,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  INTERNSHIP APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/internship-applications", summary="List internship applications")
async def list_internship_applications(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    domain_slug: Optional[str] = None,
    current_user: dict = Depends(coord_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
):
    skip, limit = cap_pagination(skip, limit)
    if status_filter:
        from app.core.validators import ALLOWED_STATUSES_INTERN
        if status_filter not in ALLOWED_STATUSES_INTERN:
            raise HTTPException(400, "Invalid status filter")
    apps = await repo.get_all(skip=skip, limit=limit, status=status_filter, domain_slug=domain_slug)
    total = await repo.count(status=status_filter, domain_slug=domain_slug)
    return {"applications": apps, "total": total, "skip": skip, "limit": limit}


@router.get("/internship-applications/{app_id}", summary="Get internship application detail")
async def get_internship_application(
    app_id: str,
    current_user: dict = Depends(coord_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
):
    try:
        app = await repo.get_by_id(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not app:
        raise HTTPException(404, "Application not found")
    return app


@router.patch("/internship-applications/{app_id}/status", summary="Update application status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_internship_status(
    app_id: str,
    body: ApplicationStatusUpdate,
    request: Request,
    current_user: dict = Depends(coord_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    allowed_statuses = {"submitted", "under_review", "shortlisted", "rejected", "accepted", "on_hold"}
    if body.status not in allowed_statuses:
        raise HTTPException(400, f"Invalid status. Allowed: {', '.join(sorted(allowed_statuses))}")
    try:
        success = await repo.update_status(app_id, body.status, reviewed_by=current_user["email"])
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not success:
        raise HTTPException(404, "Application not found")
        
    await audit.log(current_user["id"], current_user["email"], f"status_{body.status}", "internship_applications", app_id)
    
    # Send status update email to candidate
    app = await repo.get_by_id(app_id)
    if app:
        from app.services.email_service import send_status_update_email
        await send_status_update_email(
            to_email=app.get("email"),
            candidate_name=app.get("full_name"),
            application_type="internship",
            position_or_domain=app.get("domain_slug", "").replace("-", " ").title(),
            new_status=body.status
        )
        
    return {"status": "updated", "new_status": body.status}


@router.get(
    "/internship-applications/{app_id}/resume",
    summary="Generate a temporary resume download URL",
)
async def get_internship_resume_url(
    app_id: str,
    current_user: dict = Depends(coord_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
):
    try:
        app = await repo.get_by_id(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not app:
        raise HTTPException(404, "Application not found")

    object_key = app.get("resume_object_key")
    if not object_key:
        # Check legacy record
        legacy_url = app.get("resume_url")
        if legacy_url:
            return {"url": legacy_url, "legacy": True}
        raise HTTPException(404, "No resume on file for this application")

    from app.services.r2_storage import generate_signed_download_url, R2StorageError
    try:
        url = generate_signed_download_url(object_key, "resume.pdf")
    except R2StorageError as exc:
        raise HTTPException(503, str(exc))
    return {"url": url}


@router.post("/internship-applications/{app_id}/remarks", summary="Add screening remark")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def add_internship_remark(
    app_id: str,
    body: ScreeningRemarkCreate,
    request: Request,
    current_user: dict = Depends(coord_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        success = await repo.add_screening_remark(app_id, body.remark, current_user["id"], current_user["name"])
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not success:
        raise HTTPException(404, "Application not found")
    await audit.log(current_user["id"], current_user["email"], "add_remark", "internship_applications", app_id)
    return {"status": "remark_added"}


# ═══════════════════════════════════════════════════════════════════════════════
#  CAREER APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/career-applications", summary="List career applications")
async def list_career_applications(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(coord_dep),
    repo: CareerRepository = Depends(get_career_repo),
):
    skip, limit = cap_pagination(skip, limit)
    if status_filter:
        from app.core.validators import ALLOWED_STATUSES_CAREER
        if status_filter not in ALLOWED_STATUSES_CAREER:
            raise HTTPException(400, "Invalid status filter")
    apps = await repo.get_all(skip=skip, limit=limit, status=status_filter)
    total = await repo.count(status=status_filter)
    return {"applications": apps, "total": total, "skip": skip, "limit": limit}


@router.get("/career-applications/{app_id}", summary="Get career application detail")
async def get_career_application(
    app_id: str,
    current_user: dict = Depends(coord_dep),
    repo: CareerRepository = Depends(get_career_repo),
):
    try:
        app = await repo.get_by_id(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not app:
        raise HTTPException(404, "Application not found")
    return app


@router.get(
    "/career-applications/{app_id}/resume",
    summary="Generate a temporary resume download URL",
)
async def get_career_resume_url(
    app_id: str,
    current_user: dict = Depends(coord_dep),
    repo: CareerRepository = Depends(get_career_repo),
):
    try:
        app = await repo.get_by_id(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not app:
        raise HTTPException(404, "Application not found")

    object_key = app.get("resume_object_key")
    if not object_key:
        # Check legacy record
        legacy_url = app.get("resume_url")
        if legacy_url:
            return {"url": legacy_url, "legacy": True}
        raise HTTPException(404, "No resume on file for this application")

    from app.services.r2_storage import generate_signed_download_url, R2StorageError
    try:
        url = generate_signed_download_url(object_key, "resume.pdf")
    except R2StorageError as exc:
        raise HTTPException(503, str(exc))
    return {"url": url}


@router.patch("/career-applications/{app_id}/status", summary="Update career application status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_career_status(
    app_id: str,
    body: ApplicationStatusUpdate,
    request: Request,
    current_user: dict = Depends(coord_dep),
    repo: CareerRepository = Depends(get_career_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    allowed_statuses = {"received", "under_review", "shortlisted", "rejected", "accepted", "on_hold"}
    if body.status not in allowed_statuses:
        raise HTTPException(400, f"Invalid status. Allowed: {', '.join(sorted(allowed_statuses))}")
    try:
        success = await repo.update_status(app_id, body.status, reviewed_by=current_user["email"])
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not success:
        raise HTTPException(404, "Application not found")
        
    await audit.log(current_user["id"], current_user["email"], f"status_{body.status}", "career_applications", app_id)
    
    # Send status update email to candidate
    app = await repo.get_by_id(app_id)
    if app:
        from app.services.email_service import send_status_update_email
        await send_status_update_email(
            to_email=app.get("email"),
            candidate_name=app.get("full_name"),
            application_type="career",
            position_or_domain=app.get("position", ""),
            new_status=body.status
        )
        
    return {"status": "updated", "new_status": body.status}


@router.post("/career-applications/{app_id}/remarks", summary="Add screening remark")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def add_career_remark(
    app_id: str,
    body: ScreeningRemarkCreate,
    request: Request,
    current_user: dict = Depends(coord_dep),
    repo: CareerRepository = Depends(get_career_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        success = await repo.add_screening_remark(app_id, body.remark, current_user["id"], current_user["name"])
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not success:
        raise HTTPException(404, "Application not found")
    await audit.log(current_user["id"], current_user["email"], "add_remark", "career_applications", app_id)
    return {"status": "remark_added"}


# ═══════════════════════════════════════════════════════════════════════════════
#  INTERNSHIP LISTINGS (view only for coordinator)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/internships", summary="View internship listings")
async def list_internship_listings(
    current_user: dict = Depends(coord_dep),
    repo: InternshipListingRepository = Depends(get_listing_repo),
):
    listings = await repo.get_active()
    return {"listings": listings}


@router.get("/internships/{listing_id}", summary="View internship listing detail")
async def get_internship_listing(
    listing_id: str,
    current_user: dict = Depends(coord_dep),
    repo: InternshipListingRepository = Depends(get_listing_repo),
):
    try:
        listing = await repo.get_by_id(listing_id)
    except ValueError:
        raise HTTPException(400, "Invalid listing ID format")
    if not listing:
        raise HTTPException(404, "Internship listing not found")
    return listing


# ═══════════════════════════════════════════════════════════════════════════════
#  CONTACTS / ENQUIRIES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/contacts", summary="List contact enquiries")
async def list_contacts(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(coord_dep),
    repo: ContactRepository = Depends(get_contact_repo),
):
    skip, limit = cap_pagination(skip, limit)
    if status_filter:
        from app.core.validators import ALLOWED_STATUSES_CONTACT
        if status_filter not in ALLOWED_STATUSES_CONTACT:
            raise HTTPException(400, "Invalid status filter")
    contacts = await repo.get_all(skip=skip, limit=limit, status=status_filter)
    total = await repo.count(status=status_filter)
    return {"contacts": contacts, "total": total}


@router.patch("/contacts/{contact_id}/status", summary="Update contact status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_contact_status(
    contact_id: str,
    body: ContactStatusUpdate,
    request: Request,
    current_user: dict = Depends(coord_dep),
    repo: ContactRepository = Depends(get_contact_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        success = await repo.update_status(contact_id, body.status, handled_by=current_user["email"])
    except ValueError:
        raise HTTPException(400, "Invalid contact ID format")
    if not success:
        raise HTTPException(404, "Contact not found")
    if body.note:
        await repo.add_follow_up(contact_id, body.note, current_user["id"])
    await audit.log(current_user["id"], current_user["email"], f"status_{body.status}", "contacts", contact_id)
    return {"status": "updated"}


# ═══════════════════════════════════════════════════════════════════════════════
#  COORDINATOR REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/reports", summary="Coordinator reports")
async def coordinator_reports(
    current_user: dict = Depends(coord_dep),
    db: Any = Depends(get_database),
):
    # Application statistics accessible to coordinator
    intern_by_status_query = await db.prepare("SELECT status as _id, COUNT(*) as count FROM internship_applications GROUP BY status").all()
    career_by_status_query = await db.prepare("SELECT status as _id, COUNT(*) as count FROM career_applications GROUP BY status").all()
    intern_by_domain_query = await db.prepare("SELECT domain_slug as _id, COUNT(*) as count FROM internship_applications GROUP BY domain_slug").all()

    intern_by_status = intern_by_status_query.results if intern_by_status_query else []
    career_by_status = career_by_status_query.results if career_by_status_query else []
    intern_by_domain = intern_by_domain_query.results if intern_by_domain_query else []

    return {
        "internship_by_status": {item["_id"]: item["count"] for item in intern_by_status},
        "career_by_status": {item["_id"]: item["count"] for item in career_by_status},
        "internship_by_domain": {item["_id"]: item["count"] for item in intern_by_domain},
    }
