from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from typing import Any

from app.core.database import get_database
from app.core.config import get_settings
from app.core.validators import validate_section_key
from app.repositories import WebsiteContentRepository, InternshipListingRepository

router = APIRouter(prefix="/content", tags=["public-content"])
limiter = Limiter(key_func=get_remote_address)


def get_content_repo(db: Any = Depends(get_database)) -> WebsiteContentRepository:
    return WebsiteContentRepository(db)


def get_listing_repo(db: Any = Depends(get_database)) -> InternshipListingRepository:
    return InternshipListingRepository(db)


@router.get("/", summary="Get all published content sections")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_all_published(request: Request, repo: WebsiteContentRepository = Depends(get_content_repo)):
    sections = await repo.get_published()
    # Return as a keyed dict for easy frontend consumption
    result = {}
    for s in sections:
        key = s.get("section_key", "")
        result[key] = {
            "title": s.get("title"),
            "content": s.get("content", {}),
            "updated_at": s.get("updated_at"),
        }
    return {"sections": result}


# ── Brochure endpoints (public, no auth) ─────────────────────────────────────
# These are placed BEFORE the /{section_key} catch-all route.

@router.get("/brochure/status", summary="Check if a brochure is available for download")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_brochure_status(
    request: Request,
    db: Any = Depends(get_database),
):
    doc = await db.prepare("SELECT * FROM brochure WHERE key_name = 'current'").first()
    if not doc:
        return {"available": False}
    return {
        "available": True,
        "filename": doc.get("filename"),
        "uploaded_at": doc.get("uploaded_at"),
    }


@router.get("/brochure/download", summary="Download the current brochure PDF")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def download_brochure(
    request: Request,
    db: Any = Depends(get_database),
):
    import io
    doc = await db.prepare("SELECT * FROM brochure WHERE key_name = 'current'").first()
    if not doc or not doc.get("object_key"):
        raise HTTPException(
            status_code=404,
            detail="No brochure has been uploaded yet. Please check back later.",
        )

    from app.services.r2_storage import get_file
    r2_obj = await get_file(request.scope["env"], doc["object_key"])
    if not r2_obj:
        raise HTTPException(
            status_code=404,
            detail="Brochure file could not be retrieved. Please try again later.",
        )

    try:
        buffer = await r2_obj.arrayBuffer()
        content = bytes(buffer)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Brochure file could not be retrieved. Please try again later.",
        )

    filename = doc.get("filename", "brochure.pdf")
    return Response(
        content=content,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(content)),
            "Cache-Control": "public, max-age=3600",
        },
    )


# ── Internship listings (public) ─────────────────────────────────────────────

@router.get("/internship-listings/active", summary="Get active internship listings")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_active_internships(request: Request, repo: InternshipListingRepository = Depends(get_listing_repo)):
    listings = await repo.get_active()
    return {"listings": listings}


# ── Dynamic content by section key (catch-all — must be LAST) ────────────────

@router.get("/{section_key}", summary="Get published content by section key")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_published_section(
    section_key: str,
    request: Request,
    repo: WebsiteContentRepository = Depends(get_content_repo),
):
    try:
        section_key = validate_section_key(section_key)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    section = await repo.get_published_by_key(section_key)
    if not section:
        # Return empty content rather than 404 — allows frontend fallback
        return {"section_key": section_key, "content": {}, "found": False}
    return {
        "section_key": section["section_key"],
        "title": section.get("title"),
        "content": section.get("content", {}),
        "updated_at": section.get("updated_at"),
        "found": True,
    }
