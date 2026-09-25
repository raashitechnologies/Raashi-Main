import logging
from typing import List
from app.core.config import get_settings

logger = logging.getLogger(__name__)

async def notify_indexnow(urls: List[str]) -> bool:
    """
    Notify search engines about changed or new URLs via the IndexNow protocol.
    IndexNow supports Bing, Yandex, Seznam, and Naver.
    Google does not officially support IndexNow (they have their own Indexing API),
    but submitting to Bing/IndexNow is standard practice for the others.
    """
    settings = get_settings()

    host = "raashitech.com"

    # Normally this key is a minimum 8 character hexadecimal string.
    key = getattr(settings, "INDEXNOW_KEY", "b39f8f2b7a2d4808a32a67a5c88b75f7")

    indexnow_url = "https://api.indexnow.org/indexnow"

    payload = {
        "host": host,
        "key": key,
        "keyLocation": f"https://{host}/{key}.txt",
        "urlList": urls
    }

    try:
        # Use Workers-native fetch API
        from js import fetch, Headers, Request
        import json as _json

        js_headers = Headers.new({"Content-Type": "application/json"})
        js_request = Request.new(indexnow_url, {
            "method": "POST",
            "headers": js_headers,
            "body": _json.dumps(payload),
        })
        response = await fetch(js_request)
        if response.status in (200, 202):
            logger.info(f"Successfully notified IndexNow for {len(urls)} URLs.")
            return True
        else:
            body = await response.text()
            logger.warning(f"IndexNow notification failed. Status: {response.status}, Body: {body}")
            return False
    except ImportError:
        # Fallback for local development
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(indexnow_url, json=payload, timeout=5.0)
                if response.status_code in (200, 202):
                    logger.info(f"Successfully notified IndexNow for {len(urls)} URLs.")
                    return True
                else:
                    logger.warning(f"IndexNow notification failed. Status: {response.status_code}")
                    return False
        except Exception as e:
            logger.error(f"Exception during IndexNow notification: {e}")
            return False
    except Exception as e:
        logger.error(f"Exception during IndexNow notification: {e}")
        return False


async def trigger_indexnow_background(urls: List[str]) -> None:
    """
    Notify IndexNow — awaitable function.

    NOTE: asyncio.create_task() is not supported on Cloudflare Python Workers.
    All callers must await this function directly. The network call uses a
    short timeout (5 s) and swallows errors so it never blocks the response.
    """
    await notify_indexnow(urls)
