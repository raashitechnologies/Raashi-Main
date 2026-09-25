"""
Security-focused middleware for Raashi Cognitive Technologies.

**SecurityAuditMiddleware** — logs API errors (4xx/5xx) with request context.

NOTE: Per-IP request volume tracking has been removed because Cloudflare Workers
run in distributed isolates that do not share process memory. Traffic volume
monitoring should be configured via Cloudflare Analytics and WAF Rate Limiting
rules at the zone level.
"""
import logging

from starlette.datastructures import Headers
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.security_logger import security_log

logger = logging.getLogger(__name__)


class SecurityAuditMiddleware:
    """
    Middleware that logs all 4xx and 5xx API responses with request context.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        client = scope.get("client")
        ip = client[0] if client else "unknown"
        user_agent = headers.get("user-agent", "")
        method = scope["method"]
        path = scope["path"]

        async def send_with_audit(message: Message) -> None:
            # Inspect only the response start event. The body is never read,
            # buffered, replaced, or iterated, so R2 image/PDF responses pass
            # through unchanged.
            if message["type"] == "http.response.start":
                status_code = message["status"]
                if status_code >= 400 and path.startswith("/api"):
                    security_log.api_error(
                        status_code=status_code,
                        method=method,
                        path=path,
                        ip=ip,
                        user_agent=user_agent,
                        error_type=None if status_code < 500 else "server_error",
                    )
            await send(message)

        await self.app(scope, receive, send_with_audit)
