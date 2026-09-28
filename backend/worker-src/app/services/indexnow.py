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
    if not urls:
        logger.info("IndexNow notification skipped: no URLs supplied")
        return False

    settings = get_settings()

    host = "raashitech.com"

    # Normally this key is a minimum 8 character hexadecimal string.
    key = getattr(settings, "INDEXNOW_KEY", None)
    if not key:
        logger.info("IndexNow notification skipped: INDEXNOW_KEY is unavailable")
        return False

    indexnow_url = "https://api.indexnow.org/indexnow"

    payload = {
        "host": host,
        "key": key,
        "keyLocation": f"https://{host}/{key}.txt",
        "urlList": urls
    }

    try:
        # Use the Python Workers SDK rather than raw JS constructors. In
        # particular, Headers.new({...}) receives a Python proxy instead of a
        # JS HeadersInit and can raise the Pyodide "not of type Sequence" error.
        # workers.fetch performs the supported Python-to-JS header conversion.
        from workers import fetch
        import json as _json

        response = await fetch(
            indexnow_url,
            method="POST",
            headers={"Content-Type": "application/json"},
            body=_json.dumps(payload),
        )
        if response.status in (200, 202):
            logger.info("IndexNow notification succeeded for %s URL(s)", len(urls))
            return True
        body = await response.text()
        logger.warning("IndexNow HTTP failure: status=%s body=%s", response.status, body[:500])
        return False
    except ImportError:
        # Fallback for local development
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.post(indexnow_url, json=payload, timeout=5.0)
                if response.status_code in (200, 202):
                    logger.info("IndexNow notification succeeded for %s URL(s)", len(urls))
                    return True
                logger.warning("IndexNow HTTP failure: status=%s", response.status_code)
                return False
        except Exception as e:
            logger.exception("IndexNow local runtime failure: %s", e)
            return False
    except Exception as e:
        logger.exception("IndexNow Workers runtime/interoperability failure: %s", e)
        return False


async def trigger_indexnow_background(urls: List[str]) -> None:
    """
    Notify IndexNow — awaitable function.

    NOTE: asyncio.create_task() is not supported on Cloudflare Python Workers.
    The current ASGI adapter does not pass request execution contexts through
    to endpoints, so this is awaited after persistence. notify_indexnow catches
    every network/runtime error; its result never determines request success.
    """
    try:
        await notify_indexnow(urls)
    except BaseException as exc:
        # Last-resort isolation for third-party notification code. D1 mutations
        # and their API responses must survive even unexpected interop failures.
        logger.exception("IndexNow isolation boundary caught an unexpected failure: %s", exc)
