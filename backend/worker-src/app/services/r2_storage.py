from typing import Optional, Any
import logging
import time
from app.core.jwt_utils import encode as jwt_encode
from app.core.config import get_settings

class R2StorageError(Exception):
    """Base class for R2 storage exceptions."""
    pass

async def upload_file(env: Any, content: bytes, object_key: str, content_type: str = "application/octet-stream") -> None:
    """Upload a file to Cloudflare R2 via Worker binding."""
    try:
        # In Cloudflare Python Workers, env.R2 is an R2Bucket object
        await env.R2.put(object_key, content, httpMetadata={"contentType": content_type})
    except Exception as exc:
        logging.getLogger(__name__).error("R2 upload failed: key=%s error=%s", object_key, type(exc).__name__)
        raise R2StorageError("R2 upload failed") from exc

async def delete_file(env: Any, object_key: str) -> bool:
    """Delete a file from Cloudflare R2."""
    try:
        await env.R2.delete(object_key)
        return True
    except Exception as exc:
        # Don't throw for deletion failures, just return False and log
        logging.getLogger(__name__).warning("R2 delete failed: key=%s error=%s", object_key, type(exc).__name__)
        return False

async def get_file(env: Any, object_key: str) -> Optional[Any]:
    """Get a file from Cloudflare R2. Returns the R2Object or None."""
    try:
        return await env.R2.get(object_key)
    except Exception as exc:
        logging.getLogger(__name__).error("R2 get failed: key=%s error=%s", object_key, type(exc).__name__)
        return None

def generate_signed_download_url(object_key: str, filename: str, expires_in_seconds: int = 3600) -> str:
    """
    Since R2 via Worker bindings doesn't have a built-in presigned URL generator like boto3,
    we generate a JWT token containing the object_key and create a URL to our own API.
    The API will verify the token and stream the file from R2.
    """
    settings = get_settings()
    
    payload = {
        "object_key": object_key,
        "filename": filename,
        "exp": time.time() + expires_in_seconds,
        "purpose": "r2_download"
    }
    
    token = jwt_encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    # URL to our new FastAPI endpoint that handles these downloads
    base_url = settings.API_BASE_URL.rstrip("/")
    return f"{base_url}/storage/download?token={token}"
