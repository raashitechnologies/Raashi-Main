from fastapi import Request
import logging

logger = logging.getLogger(__name__)

def get_client_ip(request: Request) -> str:
    """
    Extract the real client IP from Cloudflare headers.
    Cloudflare always sets CF-Connecting-IP for requests passing through it.
    If not present (e.g. local development), fall back to request.client.host.
    """
    # CF-Connecting-IP is the primary header provided by Cloudflare
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.split(",")[0].strip()

    # Fallback to X-Forwarded-For if behind another proxy, but be aware this can be spoofed
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()

    # Final fallback to ASGI connection detail
    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"
