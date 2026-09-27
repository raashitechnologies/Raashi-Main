from typing import Optional, Any
import logging

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
    """Get a file from Cloudflare R2; ``None`` means the key is absent."""
    try:
        return await env.R2.get(object_key)
    except Exception as exc:
        logging.getLogger(__name__).error("R2 get failed: key=%s error=%s", object_key, type(exc).__name__)
        raise R2StorageError("R2 retrieval failed") from exc

async def read_file(env: Any, object_key: str) -> Optional[tuple[bytes, str]]:
    """Read an R2 object for an already-authorized download endpoint."""
    r2_obj = await get_file(env, object_key)
    if r2_obj is None:
        return None

    try:
        content = bytes(await r2_obj.arrayBuffer())
    except Exception as exc:
        logging.getLogger(__name__).error(
            "R2 read failed: key=%s error=%s", object_key, type(exc).__name__,
        )
        raise R2StorageError("R2 read failed") from exc

    metadata = getattr(r2_obj, "httpMetadata", None)
    content_type = getattr(metadata, "contentType", None)
    if not content_type and isinstance(metadata, dict):
        content_type = metadata.get("contentType")
    return content, content_type or "application/octet-stream"
