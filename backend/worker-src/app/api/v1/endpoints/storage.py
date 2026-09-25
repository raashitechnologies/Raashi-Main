from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import Response
from app.core.config import get_settings
from app.core.jwt_utils import decode as jwt_decode, JWTError

router = APIRouter(prefix="/storage", tags=["storage"])

@router.get("/download")
async def download_file(request: Request, token: str):
    settings = get_settings()
    try:
        payload = jwt_decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("purpose") != "r2_download":
            raise HTTPException(400, "Invalid token purpose.")
    except JWTError:
        raise HTTPException(401, "Invalid or expired token.")

    object_key = payload["object_key"]
    filename = payload.get("filename", "download")

    from app.services.r2_storage import get_file
    r2_obj = await get_file(request.scope["env"], object_key)
    if not r2_obj:
        raise HTTPException(404, "File not found.")

    try:
        buffer = await r2_obj.arrayBuffer()
        content = bytes(buffer)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Error reading file from R2: {e}")
        raise HTTPException(500, "Error reading file.")

    content_type = getattr(r2_obj.httpMetadata, "contentType", "application/octet-stream") if hasattr(r2_obj, "httpMetadata") else "application/octet-stream"
    
    return Response(
        content=content,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{filename}"',
            "Cache-Control": "public, max-age=3600"
        }
    )
