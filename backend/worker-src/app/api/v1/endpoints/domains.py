from fastapi import APIRouter, HTTPException, Depends, Request
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from app.core.database import get_database
from app.core.config import get_settings
from app.core.validators import validate_slug
from app.repositories import DomainRepository

router = APIRouter(prefix="/domains", tags=["domains"])
limiter = Limiter(key_func=get_remote_address)


from typing import Any

def get_domain_repo(db: Any = Depends(get_database)) -> DomainRepository:
    return DomainRepository(db)


@router.get("/", summary="List all domains")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def list_domains(request: Request, repo: DomainRepository = Depends(get_domain_repo)):
    domains = await repo.get_all()
    return {"domains": domains}


@router.get("/{slug}", summary="Get domain by slug")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_domain(slug: str, request: Request, repo: DomainRepository = Depends(get_domain_repo)):
    try:
        slug = validate_slug(slug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    domain = await repo.get_by_slug(slug)
    if not domain:
        raise HTTPException(status_code=404, detail=f"Domain '{slug}' not found.")
    return domain


@router.get("/{slug}/image", summary="Stream domain overview image from GridFS")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_domain_image(
    slug: str,
    request: Request,
    repo: DomainRepository = Depends(get_domain_repo),
):
    """Serve the domain overview image from R2. Returns 404 if no image exists."""
    try:
        slug = validate_slug(slug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    domain = await repo.get_by_slug(slug)
    if not domain:
        raise HTTPException(status_code=404, detail=f"Domain '{slug}' not found.")

    overview = domain.get("overview") or {}
    gridfs_id_str = isinstance(overview, dict) and overview.get("image_gridfs_id")

    if not gridfs_id_str:
        raise HTTPException(status_code=404, detail="No image available for this domain.")

    object_key = gridfs_id_str

    from app.services.r2_storage import get_file
    r2_obj = await get_file(request.scope["env"], object_key)
    
    if not r2_obj:
        raise HTTPException(status_code=404, detail="Image not found in storage.")
        
    try:
        buffer = await r2_obj.arrayBuffer()
        content = bytes(buffer)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to read image from R2: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving image.")

    content_type = getattr(r2_obj.httpMetadata, "contentType", "image/jpeg") if hasattr(r2_obj, "httpMetadata") else "image/jpeg"

    from fastapi import Response
    return Response(
        content=content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
