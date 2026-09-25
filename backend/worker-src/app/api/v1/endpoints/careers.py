from typing import Optional
import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, Depends, Request, status, HTTPException
from typing import Any
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from pydantic import ValidationError
from app.core.database import get_database
from app.core.config import get_settings
from app.repositories import CareerRepository, JobOpeningRepository, PolicyRepository
from app.schemas import CareerApplicationOut, CareerApplicationCreate
from app.core.validators import sanitize_filename, validate_file_magic_bytes
from app.schemas.policies import DocumentType, Audience
from datetime import datetime, timezone
import asyncio
import logging

router = APIRouter(prefix="/careers", tags=["careers"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

MAX_RESUME_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}


def get_career_repo(db: Any = Depends(get_database)) -> CareerRepository:
    return CareerRepository(db)


def get_jobs_repo(db: Any = Depends(get_database)) -> JobOpeningRepository:
    return JobOpeningRepository(db)


def get_policy_repo(db: Any = Depends(get_database)) -> PolicyRepository:
    return PolicyRepository(db)


@router.get("/", summary="List active job openings")
async def list_jobs(repo: JobOpeningRepository = Depends(get_jobs_repo)):
    jobs = await repo.get_active()
    return {"jobs": jobs}


@router.post("/apply", response_model=CareerApplicationOut, status_code=status.HTTP_201_CREATED, summary="Submit career application")
@limiter.limit(get_settings().RATE_LIMIT_APPLY)
async def apply_career(
    request: Request,
    full_name: str = Form(""),
    email: str = Form(""),
    phone: str = Form(""),
    position: str = Form(""),
    portfolio_url: str = Form(""),
    message: str = Form(""),
    terms_document_id: str = Form(""),
    terms_version: int = Form(0),
    rules_document_id: str = Form(""),
    rules_version: int = Form(0),
    resume: Optional[UploadFile] = File(None),
    repo: CareerRepository = Depends(get_career_repo),
    policy_repo: PolicyRepository = Depends(get_policy_repo),
):
    # Validate with pydantic schema
    try:
        application = CareerApplicationCreate(
            full_name=full_name, email=email, phone=phone,
            position=position, portfolio_url=portfolio_url or None,
            message=message or None,
            terms_document_id=terms_document_id,
            terms_version=terms_version,
            rules_document_id=rules_document_id,
            rules_version=rules_version
        )
    except ValidationError as e:
        errors = []
        for err in e.errors():
            field = err.get("loc", ["unknown"])[-1]
            msg = err.get("msg", "Invalid value")
            errors.append(f"{field}: {msg}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="; ".join(errors),
        )

    # Lazy imports — avoid loading httpx/r2 at module level for Worker startup
    from app.services.r2_storage import upload_file, delete_file, R2StorageError

    # Handle resume upload with validation then R2 storage.
    resume_object_key = None
    if resume and resume.filename:
        # 1. Validate file extension
        ext = os.path.splitext(resume.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid file type '{ext}'. Allowed: PDF, DOC, DOCX.",
            )

        # 2. Read and validate file size
        content = await resume.read()
        if len(content) > MAX_RESUME_SIZE:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Resume file is too large ({len(content) // (1024*1024)}MB). Maximum allowed: 5MB.",
            )

        # 3. Validate magic bytes (content must match extension)
        if not validate_file_magic_bytes(content, ext):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="File content does not match its extension.",
            )

        # 4. Sanitize original filename (kept for reference — not used as key)
        _safe_filename = sanitize_filename(resume.filename)

        # 5. Build unique, non-guessable R2 object key — no personal info
        year = datetime.now(timezone.utc).year
        object_key = f"careers/{year}/{uuid.uuid4()}{ext}"

        # 6. Upload validated bytes to R2 (never touch local filesystem)
        try:
            content_type = resume.content_type or f"application/{ext.lstrip('.')}"
            await upload_file(request.scope["env"], content, object_key, content_type)
        except R2StorageError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="File storage is temporarily unavailable. Please try again.",
            )

        resume_object_key = object_key

    data = application.model_dump()
    # New records store only resume_object_key — NOT resume_url
    data["resume_object_key"] = resume_object_key

    # Validate terms and rules
    terms_doc = await policy_repo.get_by_id(terms_document_id)
    rules_doc = await policy_repo.get_by_id(rules_document_id)

    if not terms_doc or terms_doc["document_type"] != DocumentType.TERMS.value or terms_doc["audience"] != Audience.CAREER.value or terms_doc["version"] != terms_version:
        if resume_object_key:
            await delete_file(request.scope["env"], resume_object_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Terms & Conditions acceptance")

    if not rules_doc or rules_doc["document_type"] != DocumentType.RULES.value or rules_doc["audience"] != Audience.CAREER.value or rules_doc["version"] != rules_version:
        if resume_object_key:
            await delete_file(request.scope["env"], resume_object_key)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Rules & Regulations acceptance")

    data["terms_document_id"] = terms_document_id
    data["terms_version"] = terms_version
    data["terms_agreed_at"] = datetime.now(timezone.utc).isoformat()

    data["rules_document_id"] = rules_document_id
    data["rules_version"] = rules_version
    data["rules_agreed_at"] = datetime.now(timezone.utc).isoformat()

    # Create D1 record — if this fails after a successful R2 upload, clean up
    try:
        doc_id = await repo.create(data)
    except Exception as exc:
        if resume_object_key:
            cleanup_ok = await delete_file(request.scope["env"], resume_object_key)
            if not cleanup_ok:
                logger.error(
                    "R2 orphan cleanup failed after D1 error: key=%s",
                    resume_object_key,
                )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to submit your application right now. Please try again.",
        ) from exc

    from app.services.email_service import send_career_notification, send_application_thank_you_email
    await send_career_notification(
        full_name=full_name,
        email=email,
        phone=phone,
        position=position,
        portfolio_url=portfolio_url,
        message=message,
    )

    await send_application_thank_you_email(
        to_email=email,
        applicant_name=full_name,
        application_type="career",
    )

    return CareerApplicationOut(id=doc_id)
