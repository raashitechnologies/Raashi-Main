"""
Admin-only API endpoints — protected with require_role("admin").
Covers: website content, domains, internships, careers, applications,
contacts, users, reports, audit logs, and brochure management.
"""
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from typing import Optional, Any

from app.core.config import get_settings
from app.core.database import get_database
from app.core.auth import require_role, hash_password
from app.core.validators import cap_pagination, validate_section_key
from app.repositories import (
    DomainRepository, ContactRepository, InternshipRepository,
    CareerRepository, JobOpeningRepository, UserRepository,
    WebsiteContentRepository, AuditLogRepository, InternshipListingRepository,
)
from app.services.indexnow import trigger_indexnow_background
from app.schemas import (
    DomainCreate, DomainUpdate, ContactStatusUpdate,
    ApplicationStatusUpdate, ScreeningRemarkCreate,
    JobOpeningCreate, JobOpeningUpdate,
    InternshipListingCreate, InternshipListingUpdate,
    UserCreate, UserUpdate, UserOut,
    WebsiteContentUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])
limiter = Limiter(key_func=get_remote_address)

# All endpoints require admin role
admin_dep = require_role("admin")


# ── Dependency helpers ───────────────────────────────────────────────────────

def get_domain_repo(db: Any = Depends(get_database)) -> DomainRepository:
    return DomainRepository(db)

def get_contact_repo(db: Any = Depends(get_database)) -> ContactRepository:
    return ContactRepository(db)

def get_internship_repo(db: Any = Depends(get_database)) -> InternshipRepository:
    return InternshipRepository(db)

def get_career_repo(db: Any = Depends(get_database)) -> CareerRepository:
    return CareerRepository(db)

def get_job_repo(db: Any = Depends(get_database)) -> JobOpeningRepository:
    return JobOpeningRepository(db)

def get_user_repo(db: Any = Depends(get_database)) -> UserRepository:
    return UserRepository(db)

def get_content_repo(db: Any = Depends(get_database)) -> WebsiteContentRepository:
    return WebsiteContentRepository(db)

def get_audit_repo(db: Any = Depends(get_database)) -> AuditLogRepository:
    return AuditLogRepository(db)

def get_listing_repo(db: Any = Depends(get_database)) -> InternshipListingRepository:
    return InternshipListingRepository(db)


# ═══════════════════════════════════════════════════════════════════════════════
#  WEBSITE CONTENT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/content", summary="List all website content sections")
async def list_content(
    current_user: dict = Depends(admin_dep),
    repo: WebsiteContentRepository = Depends(get_content_repo),
):
    sections = await repo.get_all()
    return {"sections": sections}


@router.get("/content/{section_key}", summary="Get a specific content section")
async def get_content(
    section_key: str,
    current_user: dict = Depends(admin_dep),
    repo: WebsiteContentRepository = Depends(get_content_repo),
):
    try:
        section_key = validate_section_key(section_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    section = await repo.get_by_key(section_key)
    if not section:
        raise HTTPException(404, f"Content section '{section_key}' not found")
    return section


@router.put("/content/{section_key}", summary="Update a content section")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_content(
    section_key: str,
    body: WebsiteContentUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: WebsiteContentRepository = Depends(get_content_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        section_key = validate_section_key(section_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    data = body.model_dump()
    await repo.upsert(section_key, data, updated_by=current_user["email"])
    await audit.log(current_user["id"], current_user["email"], "update", "website_content", section_key, f"Updated content: {section_key}")
    return {"status": "updated", "section_key": section_key}


@router.patch("/content/{section_key}/publish", summary="Toggle publish status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def toggle_publish(
    section_key: str,
    request: Request,
    publish: bool = True,
    current_user: dict = Depends(admin_dep),
    repo: WebsiteContentRepository = Depends(get_content_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    success = await repo.set_published(section_key, publish)
    if not success:
        raise HTTPException(404, f"Content section '{section_key}' not found")
    action = "published" if publish else "unpublished"
    await audit.log(current_user["id"], current_user["email"], action, "website_content", section_key)
    return {"status": action, "section_key": section_key}


# ═══════════════════════════════════════════════════════════════════════════════
#  DOMAIN MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/domains", summary="List all domains (admin view)")
async def list_domains(
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
):
    domains = await repo.get_all_with_ids()
    return {"domains": domains}


@router.get("/domains/{domain_id}", summary="Get a single domain by ID (admin editor)")
async def get_domain_by_id(
    domain_id: str,
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
):
    try:
        domain = await repo.get_by_id_admin(domain_id)
    except ValueError:
        raise HTTPException(400, "Invalid domain ID format")
    if not domain:
        raise HTTPException(404, "Domain not found")
    return domain


@router.post("/domains", status_code=status.HTTP_201_CREATED, summary="Create domain")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def create_domain(
    body: DomainCreate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    domain_id = await repo.create(body.model_dump())
    await audit.log(current_user["id"], current_user["email"], "create", "domains", domain_id, f"Created domain: {body.name}")
    await trigger_indexnow_background([f"https://raashitech.com/domains/{body.slug}"])
    return {"id": domain_id, "status": "created"}


@router.put("/domains/{domain_id}", summary="Update domain")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_domain(
    domain_id: str,
    body: DomainUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    # Serialize nested Pydantic sub-models to plain dicts for D1 JSON columns
    for key, val in data.items():
        if hasattr(val, "model_dump"):
            data[key] = val.model_dump()
        elif isinstance(val, list) and val and hasattr(val[0], "model_dump"):
            data[key] = [item.model_dump() for item in val]

    try:
        existing = await repo.get_by_id_admin(domain_id)
    except ValueError:
        raise HTTPException(400, "Invalid domain ID format")
    if not existing:
        raise HTTPException(404, "Domain not found")

    # If overview is being updated, preserve existing image references if not provided
    if "overview" in data and isinstance(data["overview"], dict):
        ex_ov = existing.get("overview") or {}
        if not data["overview"].get("image_url") and ex_ov.get("image_url"):
            data["overview"]["image_url"] = ex_ov["image_url"]
        if not data["overview"].get("image_gridfs_id") and ex_ov.get("image_gridfs_id"):
            data["overview"]["image_gridfs_id"] = ex_ov["image_gridfs_id"]

    try:
        success = await repo.update(domain_id, data)
    except ValueError:
        raise HTTPException(400, "Invalid domain ID format")
    if not success:
        raise HTTPException(404, "Domain not found")
    await audit.log(current_user["id"], current_user["email"], "update", "domains", domain_id)
    
    # Optional: fetch domain to get slug to notify IndexNow.
    if "slug" in existing:
        await trigger_indexnow_background([f"https://raashitech.com/domains/{existing['slug']}"])

    return {"status": "updated"}


@router.delete("/domains/{domain_id}", summary="Delete domain")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def delete_domain(
    domain_id: str,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        domain = await repo.get_by_id_admin(domain_id)
        slug = domain.get("slug") if domain else None
        success = await repo.delete(domain_id)
    except ValueError:
        raise HTTPException(400, "Invalid domain ID format")
    if not success:
        raise HTTPException(404, "Domain not found")
    await audit.log(current_user["id"], current_user["email"], "delete", "domains", domain_id)
    
    if slug:
        await trigger_indexnow_background([f"https://raashitech.com/domains/{slug}"])
        
    return {"status": "deleted"}


# ── Domain image management (GridFS) ─────────────────────────────────────────

MAX_DOMAIN_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB

_ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
_ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp"}

# Magic byte prefixes for validation
_IMAGE_MAGIC: list[tuple[bytes, str]] = [
    (b"\xff\xd8\xff", "JPEG"),
    (b"\x89PNG\r\n\x1a\n", "PNG"),
    (b"RIFF", "WEBP"),  # WEBP: starts with RIFF, bytes 8-11 are WEBP
]


def _validate_image_magic(content: bytes, ext: str) -> bool:
    """Return True if file magic bytes match the declared extension."""
    if ext in (".jpg", ".jpeg"):
        return content[:3] == b"\xff\xd8\xff"
    if ext == ".png":
        return content[:8] == b"\x89PNG\r\n\x1a\n"
    if ext == ".webp":
        return content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return False


@router.post("/domains/{domain_id}/image", summary="Upload/replace domain overview image")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def upload_domain_image(
    domain_id: str,
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    """Upload or replace the overview section image for a domain. Stored in R2."""
    import logging
    logger = logging.getLogger(__name__)

    try:
        domain = await repo.get_by_id_admin(domain_id)
    except ValueError:
        raise HTTPException(400, "Invalid domain ID format")
    if not domain:
        raise HTTPException(404, "Domain not found")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in _ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type '{ext}'. Allowed: .jpg, .jpeg, .png, .webp",
        )

    if file.content_type and file.content_type not in _ALLOWED_IMAGE_MIMES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid content type '{file.content_type}'. Allowed: image/jpeg, image/png, image/webp",
        )

    content = await file.read()
    if len(content) > MAX_DOMAIN_IMAGE_SIZE:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large ({size_mb:.1f} MB). Maximum: 10 MB",
        )

    if not _validate_image_magic(content, ext):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File content does not match the declared image type.",
        )

    from app.services.r2_storage import upload_file, delete_file
    
    overview = domain.get("overview") or {}
    existing_gridfs_id = overview.get("image_gridfs_id")
    is_replacement = existing_gridfs_id is not None

    if existing_gridfs_id:
        try:
            await delete_file(request.scope["env"], existing_gridfs_id)
        except Exception as e:
            logger.warning(f"Could not delete old domain image R2 file: {e}")

    object_key = f"domains/{domain['slug']}/{uuid.uuid4()}{ext}"
    await upload_file(
        request.scope["env"], 
        content, 
        object_key, 
        file.content_type or f"image/{ext.lstrip('.')}"
    )

    image_url = f"/api/v1/domains/{domain['slug']}/image"
    await repo.update_image(domain_id, image_url, object_key)

    action = "replace_image" if is_replacement else "upload_image"
    await audit.log(
        current_user["id"], current_user["email"],
        action, "domains", domain_id,
        f"{'Replaced' if is_replacement else 'Uploaded'} overview image: {file.filename} ({len(content)} bytes)",
    )

    return {
        "status": "replaced" if is_replacement else "uploaded",
        "image_url": image_url,
        "size_bytes": len(content),
    }


@router.delete("/domains/{domain_id}/image", summary="Remove domain overview image")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def delete_domain_image(
    domain_id: str,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: DomainRepository = Depends(get_domain_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    """Remove the overview image for a domain from R2 and the domain document."""
    import logging
    logger = logging.getLogger(__name__)

    try:
        domain = await repo.get_by_id_admin(domain_id)
    except ValueError:
        raise HTTPException(400, "Invalid domain ID format")
    if not domain:
        raise HTTPException(404, "Domain not found")

    overview = domain.get("overview") or {}
    gridfs_id = isinstance(overview, dict) and overview.get("image_gridfs_id")

    if gridfs_id:
        from app.services.r2_storage import delete_file
        try:
            await delete_file(request.scope["env"], gridfs_id)
        except Exception as e:
            logger.warning(f"Could not delete domain image R2 file: {e}")

    await repo.remove_image(domain_id)

    await audit.log(
        current_user["id"], current_user["email"],
        "delete_image", "domains", domain_id,
        "Removed overview image",
    )
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
#  INTERNSHIP LISTING MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/internships", summary="List all internship listings")
async def list_internship_listings(
    current_user: dict = Depends(admin_dep),
    repo: InternshipListingRepository = Depends(get_listing_repo),
):
    listings = await repo.get_all()
    total = await repo.count()
    return {"listings": listings, "total": total}


@router.post("/internships", status_code=status.HTTP_201_CREATED, summary="Create internship listing")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def create_internship_listing(
    body: InternshipListingCreate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: InternshipListingRepository = Depends(get_listing_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    listing_id = await repo.create(body.model_dump())
    await audit.log(current_user["id"], current_user["email"], "create", "internships", listing_id, f"Created internship: {body.title}")
    return {"id": listing_id, "status": "created"}


@router.put("/internships/{listing_id}", summary="Update internship listing")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_internship_listing(
    listing_id: str,
    body: InternshipListingUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: InternshipListingRepository = Depends(get_listing_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    try:
        success = await repo.update(listing_id, data)
    except ValueError:
        raise HTTPException(400, "Invalid listing ID format")
    if not success:
        raise HTTPException(404, "Internship listing not found")
    await audit.log(current_user["id"], current_user["email"], "update", "internships", listing_id)
    return {"status": "updated"}


@router.delete("/internships/{listing_id}", summary="Delete/deactivate internship listing")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def delete_internship_listing(
    listing_id: str,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: InternshipListingRepository = Depends(get_listing_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        success = await repo.delete(listing_id)
    except ValueError:
        raise HTTPException(400, "Invalid listing ID format")
    if not success:
        raise HTTPException(404, "Internship listing not found")
    await audit.log(current_user["id"], current_user["email"], "deactivate", "internships", listing_id)
    return {"status": "deactivated"}


# ═══════════════════════════════════════════════════════════════════════════════
#  INTERNSHIP APPLICATION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/internship-applications", summary="List all internship applications")
async def list_internship_applications(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    domain_slug: Optional[str] = None,
    current_user: dict = Depends(admin_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
):
    skip, limit = cap_pagination(skip, limit)
    apps = await repo.get_all(skip=skip, limit=limit, status=status_filter, domain_slug=domain_slug)
    total = await repo.count(status=status_filter, domain_slug=domain_slug)
    return {"applications": apps, "total": total, "skip": skip, "limit": limit}


@router.get("/internship-applications/{app_id}", summary="Get internship application detail")
async def get_internship_application(
    app_id: str,
    current_user: dict = Depends(admin_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
):
    try:
        app = await repo.get_by_id(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not app:
        raise HTTPException(404, "Application not found")
    return app


@router.patch("/internship-applications/{app_id}/status", summary="Update internship application status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_internship_app_status(
    app_id: str,
    body: ApplicationStatusUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
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


@router.post("/internship-applications/{app_id}/remarks", summary="Add screening remark")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def add_internship_remark(
    app_id: str,
    body: ScreeningRemarkCreate,
    request: Request,
    current_user: dict = Depends(admin_dep),
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


@router.get(
    "/internship-applications/{app_id}/resume",
    summary="Generate a temporary resume download URL",
)
async def get_internship_resume_url(
    app_id: str,
    current_user: dict = Depends(admin_dep),
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


@router.delete("/internship-applications/{app_id}", summary="Delete internship application")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def delete_internship_app(
    app_id: str,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: InternshipRepository = Depends(get_internship_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        app = await repo.get_by_id(app_id)
        if not app:
            raise HTTPException(404, "Application not found")
        success = await repo.delete(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not success:
        raise HTTPException(404, "Application not found")

    # Clean up R2 object if application had one
    if app and app.get("resume_object_key"):
        from app.services.r2_storage import delete_file
        await delete_file(request.scope["env"], app.get("resume_object_key"))

    await audit.log(current_user["id"], current_user["email"], "delete", "internship_applications", app_id)
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
#  JOB / CAREER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/jobs", summary="List all job openings (admin view)")
async def list_jobs(
    skip: int = 0, limit: int = 50,
    current_user: dict = Depends(admin_dep),
    repo: JobOpeningRepository = Depends(get_job_repo),
):
    jobs = await repo.get_all(skip=skip, limit=limit)
    total = await repo.count()
    return {"jobs": jobs, "total": total}


@router.post("/jobs", status_code=status.HTTP_201_CREATED, summary="Create job opening")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def create_job(
    body: JobOpeningCreate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: JobOpeningRepository = Depends(get_job_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    job_id = await repo.create(body.model_dump())
    await audit.log(current_user["id"], current_user["email"], "create", "careers", job_id, f"Created job: {body.title}")
    return {"id": job_id, "status": "created"}


@router.put("/jobs/{job_id}", summary="Update job opening")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_job(
    job_id: str,
    body: JobOpeningUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: JobOpeningRepository = Depends(get_job_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    try:
        success = await repo.update(job_id, data)
    except ValueError:
        raise HTTPException(400, "Invalid job ID format")
    if not success:
        raise HTTPException(404, "Job opening not found")
    await audit.log(current_user["id"], current_user["email"], "update", "careers", job_id)
    return {"status": "updated"}


@router.delete("/jobs/{job_id}", summary="Deactivate job opening")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def delete_job(
    job_id: str,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: JobOpeningRepository = Depends(get_job_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        success = await repo.delete(job_id)
    except ValueError:
        raise HTTPException(400, "Invalid job ID format")
    if not success:
        raise HTTPException(404, "Job opening not found")
    await audit.log(current_user["id"], current_user["email"], "deactivate", "careers", job_id)
    return {"status": "deactivated"}


# ═══════════════════════════════════════════════════════════════════════════════
#  CAREER APPLICATION MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/career-applications", summary="List all career applications")
async def list_career_applications(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(admin_dep),
    repo: CareerRepository = Depends(get_career_repo),
):
    skip, limit = cap_pagination(skip, limit)
    apps = await repo.get_all(skip=skip, limit=limit, status=status_filter)
    total = await repo.count(status=status_filter)
    return {"applications": apps, "total": total, "skip": skip, "limit": limit}


@router.get("/career-applications/{app_id}", summary="Get career application detail")
async def get_career_application(
    app_id: str,
    current_user: dict = Depends(admin_dep),
    repo: CareerRepository = Depends(get_career_repo),
):
    try:
        app = await repo.get_by_id(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not app:
        raise HTTPException(404, "Application not found")
    return app


@router.patch("/career-applications/{app_id}/status", summary="Update career application status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_career_app_status(
    app_id: str,
    body: ApplicationStatusUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: CareerRepository = Depends(get_career_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
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
    current_user: dict = Depends(admin_dep),
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


@router.get(
    "/career-applications/{app_id}/resume",
    summary="Generate a temporary resume download URL",
)
async def get_career_resume_url(
    app_id: str,
    current_user: dict = Depends(admin_dep),
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


@router.delete("/career-applications/{app_id}", summary="Delete career application")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def delete_career_app(
    app_id: str,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: CareerRepository = Depends(get_career_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        app = await repo.get_by_id(app_id)
        if not app:
            raise HTTPException(404, "Application not found")
        success = await repo.delete(app_id)
    except ValueError:
        raise HTTPException(400, "Invalid application ID format")
    if not success:
        raise HTTPException(404, "Application not found")
        
    # Clean up R2 object if application had one
    if app and app.get("resume_object_key"):
        from app.services.r2_storage import delete_file
        await delete_file(request.scope["env"], app.get("resume_object_key"))
        
    await audit.log(current_user["id"], current_user["email"], "delete", "career_applications", app_id)
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════════════════════════
#  CONTACT / ENQUIRY MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/contacts", summary="List all contact messages")
async def list_contacts(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    current_user: dict = Depends(admin_dep),
    repo: ContactRepository = Depends(get_contact_repo),
):
    skip, limit = cap_pagination(skip, limit)
    contacts = await repo.get_all(skip=skip, limit=limit, status=status_filter)
    total = await repo.count(status=status_filter)
    return {"contacts": contacts, "total": total, "skip": skip, "limit": limit}


@router.get("/contacts/{contact_id}", summary="Get contact detail")
async def get_contact(
    contact_id: str,
    current_user: dict = Depends(admin_dep),
    repo: ContactRepository = Depends(get_contact_repo),
):
    try:
        contact = await repo.get_by_id(contact_id)
    except ValueError:
        raise HTTPException(400, "Invalid contact ID format")
    if not contact:
        raise HTTPException(404, "Contact not found")
    return contact


@router.patch("/contacts/{contact_id}/status", summary="Update contact status")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_contact_status(
    contact_id: str,
    body: ContactStatusUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
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
    return {"status": "updated", "new_status": body.status}


# ═══════════════════════════════════════════════════════════════════════════════
#  USER MANAGEMENT (Coordinators)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users", summary="List coordinators")
async def list_users(
    role: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    current_user: dict = Depends(admin_dep),
    repo: UserRepository = Depends(get_user_repo),
):
    skip, limit = cap_pagination(skip, limit)
    users = await repo.get_all(role=role, skip=skip, limit=limit)
    total = await repo.count(role=role)
    return {"users": users, "total": total, "skip": skip, "limit": limit}


@router.post("/users", status_code=status.HTTP_201_CREATED, summary="Create coordinator")
@limiter.limit(get_settings().RATE_LIMIT_ACCOUNT_CREATE)
async def create_user(
    body: UserCreate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: UserRepository = Depends(get_user_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    # Only allow creating coordinators, not admins
    if body.role not in ("coordinator",):
        raise HTTPException(400, "Only coordinator accounts can be created through this endpoint")

    # Validate password complexity
    from app.schemas import validate_password_complexity
    try:
        validate_password_complexity(body.validated_password)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Check for duplicate email
    existing = await repo.get_by_email(body.email)
    if existing:
        raise HTTPException(409, "A user with this email already exists")

    email_verified = body.skip_email_verification

    user_data = {
        "name": body.name,
        "email": body.email,
        "password_hash": hash_password(body.validated_password),
        "role": body.role,
        "is_active": body.is_active,
        "email_verified": email_verified,
    }
    user_id = await repo.create(user_data)
    await audit.log(current_user["id"], current_user["email"], "create", "users", user_id, f"Created coordinator: {body.email}")

    # Send verification email if not skipped
    if not email_verified:
        from app.core.auth import create_email_verification_token
        settings = get_settings()
        token = create_email_verification_token(body.email)
        verify_url = f"{settings.ADMIN_FRONTEND_URL}/verify-email?token={token}"
        login_url = f"{settings.ADMIN_FRONTEND_URL}/login"
        
        from app.services.email_service import send_verification_email, send_welcome_email
        
        # Await emails sequentially (Worker doesn't support background tasks reliably)
        await send_welcome_email(
            to_email=body.email,
            name=body.name,
            role=body.role,
            login_url=login_url
        )
        
        await send_verification_email(
            to_email=body.email,
            verify_url=verify_url,
            expiry_hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS
        )

    return {"id": user_id, "status": "created", "email_verified": email_verified}


@router.put("/users/{user_id}", summary="Update coordinator")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def update_user(
    user_id: str,
    body: UserUpdate,
    request: Request,
    current_user: dict = Depends(admin_dep),
    repo: UserRepository = Depends(get_user_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        target_user = await repo.get_by_id(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user ID format")
    if not target_user:
        raise HTTPException(404, "User not found")

    # Don't allow editing admin users through this endpoint
    if target_user.get("role") == "admin" and user_id != current_user["id"]:
        raise HTTPException(403, "Cannot modify other admin accounts")

    data: dict = {}
    if body.name is not None:
        data["name"] = body.name
    if body.email is not None:
        # Check duplicate
        existing = await repo.get_by_email(body.email)
        if existing and existing["id"] != user_id:
            raise HTTPException(409, "A user with this email already exists")
        data["email"] = body.email
    if body.password is not None:
        data["password_hash"] = hash_password(body.validated_password)
    if body.is_active is not None:
        data["is_active"] = body.is_active

    if not data:
        raise HTTPException(400, "No fields to update")

    await repo.update(user_id, data)
    await audit.log(current_user["id"], current_user["email"], "update", "users", user_id)
    return {"status": "updated"}


@router.patch("/users/{user_id}/activate", summary="Activate or deactivate coordinator")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def toggle_user_active(
    user_id: str,
    request: Request,
    active: bool = True,
    current_user: dict = Depends(admin_dep),
    repo: UserRepository = Depends(get_user_repo),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    try:
        target_user = await repo.get_by_id(user_id)
    except ValueError:
        raise HTTPException(400, "Invalid user ID format")
    if not target_user:
        raise HTTPException(404, "User not found")
    if target_user.get("role") == "admin":
        raise HTTPException(403, "Cannot deactivate admin accounts through this endpoint")

    await repo.set_active(user_id, active)
    action = "activated" if active else "deactivated"
    await audit.log(current_user["id"], current_user["email"], action, "users", user_id)
    return {"status": action}


# ═══════════════════════════════════════════════════════════════════════════════
#  REPORTS & ANALYTICS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/reports/dashboard", summary="Admin dashboard statistics")
async def dashboard_stats(
    current_user: dict = Depends(admin_dep),
    db: Any = Depends(get_database),
):
    async def get_count(table: str, condition: str = "") -> int:
        row = await db.prepare(f"SELECT COUNT(*) as c FROM {table} {condition}").first()
        return row["c"] if row else 0

    internship_apps = await get_count("internship_applications")
    career_apps = await get_count("career_applications")
    contacts = await get_count("contact_messages")
    domains_count = await get_count("domains")
    active_jobs = await get_count("job_openings", "WHERE is_active = 1")
    coordinators = await get_count("users", "WHERE role = 'coordinator'")

    # Status breakdowns
    intern_submitted = await get_count("internship_applications", "WHERE status = 'submitted'")
    intern_shortlisted = await get_count("internship_applications", "WHERE status = 'shortlisted'")
    intern_rejected = await get_count("internship_applications", "WHERE status = 'rejected'")

    career_received = await get_count("career_applications", "WHERE status = 'received'")
    career_shortlisted = await get_count("career_applications", "WHERE status = 'shortlisted'")
    career_rejected = await get_count("career_applications", "WHERE status = 'rejected'")

    contacts_new = await get_count("contact_messages", "WHERE status = 'new'")

    # Recent applications (last 5)
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
            "domains": domains_count,
            "active_jobs": active_jobs,
            "coordinators": coordinators,
        },
        "internship_status": {
            "submitted": intern_submitted,
            "shortlisted": intern_shortlisted,
            "rejected": intern_rejected,
        },
        "career_status": {
            "received": career_received,
            "shortlisted": career_shortlisted,
            "rejected": career_rejected,
        },
        "contacts_new": contacts_new,
        "recent_internship_applications": recent_intern,
        "recent_career_applications": recent_career,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  BROCHURE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

MAX_BROCHURE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/brochure", summary="Upload or replace the company brochure (PDF only)")
@limiter.limit(get_settings().RATE_LIMIT_ADMIN)
async def upload_brochure(
    request: Request,
    file: UploadFile = File(...),
    current_user: dict = Depends(admin_dep),
    db: Any = Depends(get_database),
    audit: AuditLogRepository = Depends(get_audit_repo),
):
    """
    Upload or replace the company brochure.
    - Only admin users may upload.
    - File must be a PDF and ≤ 50 MB.
    - Validates MIME type, extension, and magic bytes.
    - Replaces any previously uploaded brochure (singleton).
    """
    import logging
    logger = logging.getLogger(__name__)
    import os
    import uuid
    from datetime import datetime, timezone

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid file type '{ext}'. Only PDF files are allowed.",
        )

    # Validate MIME type
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid content type '{file.content_type}'. Only application/pdf is allowed.",
        )

    # Read content and validate size
    content = await file.read()
    if len(content) > MAX_BROCHURE_SIZE:
        size_mb = len(content) / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File is too large ({size_mb:.1f} MB). Maximum allowed: 50 MB.",
        )

    # Validate magic bytes
    if not content[:4] == b"%PDF":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File content does not appear to be a valid PDF.",
        )

    # Delete any existing brochure files from R2
    existing_meta = await db.prepare("SELECT object_key FROM brochure WHERE key_name = 'current'").first()
    from app.services.r2_storage import upload_file, delete_file

    if existing_meta and existing_meta.get("object_key"):
        try:
            await delete_file(request.scope["env"], existing_meta["object_key"])
        except Exception as e:
            logger.warning(f"Could not delete old brochure R2 file: {e}")

    # Upload new file to R2
    object_key = f"brochure/{uuid.uuid4()}.pdf"
    await upload_file(request.scope["env"], content, object_key, "application/pdf")

    # Upsert brochure metadata (singleton document)
    now = datetime.now(timezone.utc).isoformat()
    await db.prepare(
        """
        INSERT INTO brochure (id, key_name, filename, object_key, size_bytes, uploaded_by, uploaded_at, updated_at)
        VALUES (?, 'current', ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key_name) DO UPDATE SET
            filename=excluded.filename,
            object_key=excluded.object_key,
            size_bytes=excluded.size_bytes,
            uploaded_by=excluded.uploaded_by,
            uploaded_at=excluded.uploaded_at,
            updated_at=excluded.updated_at
        """
    ).bind(
        str(uuid.uuid4()), file.filename or "brochure.pdf", object_key,
        len(content), current_user["email"], now, now
    ).run()

    await audit.log(
        current_user["id"], current_user["email"],
        "upload", "brochure", object_key,
        f"Uploaded brochure: {file.filename} ({len(content)} bytes)",
    )

    return {
        "status": "uploaded",
        "filename": file.filename,
        "size_bytes": len(content),
        "uploaded_at": now,
    }


@router.get("/brochure", summary="Get current brochure status (admin)")
async def get_brochure_status_admin(
    current_user: dict = Depends(admin_dep),
    db: Any = Depends(get_database),
):
    doc = await db.prepare("SELECT * FROM brochure WHERE key_name = 'current'").first()
    if not doc:
        return {"available": False}
    return {
        "available": True,
        "filename": doc.get("filename"),
        "size_bytes": doc.get("size_bytes"),
        "uploaded_by": doc.get("uploaded_by"),
        "uploaded_at": doc.get("uploaded_at"),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  AUDIT LOGS
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/audit-logs", summary="View system audit logs")
async def list_audit_logs(
    skip: int = 0, limit: int = 100,
    current_user: dict = Depends(admin_dep),
    repo: AuditLogRepository = Depends(get_audit_repo),
):
    skip, limit = cap_pagination(skip, limit)
    logs = await repo.get_all(skip=skip, limit=limit)
    total = await repo.count()
    return {"logs": logs, "total": total, "skip": skip, "limit": limit}
