from fastapi import APIRouter, HTTPException, Depends, Request, status
from typing import Any
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from app.core.database import get_database
from app.core.config import get_settings
from app.repositories import ContactRepository
from app.schemas import ContactCreate, ContactOut
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["contact"])
limiter = Limiter(key_func=get_remote_address)


def get_contact_repo(db: Any = Depends(get_database)) -> ContactRepository:
    return ContactRepository(db)


@router.post("", response_model=ContactOut, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/", response_model=ContactOut, status_code=status.HTTP_201_CREATED, summary="Submit contact message")
@limiter.limit(get_settings().RATE_LIMIT_CONTACT)
async def submit_contact(
    request: Request,
    body: ContactCreate,
    repo: ContactRepository = Depends(get_contact_repo),
):
    doc_id = await repo.create(body.model_dump())

    # The contact message is already durable in D1; notification email must not change success.
    try:
        from app.services.email_service import send_contact_notification, send_contact_thank_you_email

        await send_contact_notification(
            full_name=body.full_name,
            email=body.email,
            phone=body.phone or "N/A",
            subject=body.subject,
            message=body.message,
        )
        await send_contact_thank_you_email(
            to_email=body.email,
            contact_name=body.full_name,
        )
    except Exception:
        logger.exception("Contact notification email failed after message persistence: id=%s", doc_id)

    return ContactOut(id=doc_id)

