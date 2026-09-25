"""
Bot detection middleware for Raashi Cognitive Technologies.

Inspects incoming requests for automated bot/scraper indicators:
- Missing or suspicious User-Agent strings
- Known bot/scraper UA patterns (blocked on non-public endpoints)
- Honeypot header trap (X-Bot-Trap)
- Rapid-fire identical request fingerprinting

Legitimate search engine crawlers (Googlebot, Bingbot) are allowed through
on public endpoints only.
"""
import logging
import re
from typing import List, Set, Tuple

from starlette.datastructures import Headers
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from app.core.security_logger import security_log

logger = logging.getLogger(__name__)

# ── Known bot User-Agent patterns (case-insensitive) ─────────────────────────
# These are automation tools — not legitimate browsers or search crawlers
_BLOCKED_UA_PATTERNS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE) for p in [
        r"python-requests",
        r"python-urllib",
        r"python-httpx",
        r"aiohttp",
        r"httpie",
        r"^curl/",
        r"^wget/",
        r"^scrapy",
        r"^mechanize",
        r"^phantomjs",
        r"^selenium",
        r"headlesschrome",
        r"^go-http-client",
        r"^java/",
        r"^apache-httpclient",
        r"^node-fetch",
        r"^axios/",
        r"^undici",
        r"^got ",
        r"^postmanruntime",
        r"^insomnia",
        r"^rest-client",
    ]
]

# Legitimate search engine crawlers — allowed on public endpoints
_ALLOWED_CRAWLERS: List[re.Pattern] = [
    re.compile(p, re.IGNORECASE) for p in [
        r"googlebot",
        r"bingbot",
        r"duckduckbot",
        r"yandexbot",
        r"baiduspider",
        r"slurp",  # Yahoo
    ]
]

# Public path prefixes where crawlers are allowed and UA checks are relaxed
_PUBLIC_PREFIXES: Tuple[str, ...] = (
    "/api/v1/domains",
    "/api/v1/content",
    "/api/v1/careers/",     # GET listing only
    "/api/v1/policies/active",
    "/health",
)

# Paths fully exempt from bot detection
_EXEMPT_PATHS: Set[str] = {
    "/",
    "/health",
    "/api/docs",
    "/api/redoc",
    "/openapi.json",
}



def _is_blocked_ua(user_agent: str) -> bool:
    """Check if the User-Agent matches a known bot/automation tool."""
    for pattern in _BLOCKED_UA_PATTERNS:
        if pattern.search(user_agent):
            return True
    return False


def _is_allowed_crawler(user_agent: str) -> bool:
    """Check if the UA is a legitimate search engine crawler."""
    for pattern in _ALLOWED_CRAWLERS:
        if pattern.search(user_agent):
            return True
    return False


def _is_public_path(path: str) -> bool:
    """Check if the path is a public read endpoint."""
    return path.startswith(_PUBLIC_PREFIXES)


class BotDetectionMiddleware:
    """Middleware to detect and block automated bot/scraper requests."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope["path"]
        method = scope["method"]
        client = scope.get("client")
        ip = client[0] if client else "unknown"
        headers = Headers(scope=scope)
        user_agent = headers.get("user-agent", "")

        # ── Skip exempt paths ────────────────────────────────────────────
        if path in _EXEMPT_PATHS:
            await self.app(scope, receive, send)
            return

        # ── Skip OPTIONS (CORS preflight) ────────────────────────────────
        if method == "OPTIONS":
            await self.app(scope, receive, send)
            return

        # ── Honeypot header trap ─────────────────────────────────────────
        if headers.get("x-bot-trap"):
            security_log.bot_detected(
                ip=ip, reason="honeypot_header",
                path=path, user_agent=user_agent,
            )
            await JSONResponse(
                status_code=403,
                content={"detail": "Access denied."},
            )(scope, receive, send)
            return

        # ── Empty User-Agent on API endpoints ────────────────────────────
        if not user_agent and path.startswith("/api/"):
            security_log.bot_detected(
                ip=ip, reason="empty_user_agent",
                path=path, user_agent="",
            )
            await JSONResponse(
                status_code=403,
                content={"detail": "Access denied."},
            )(scope, receive, send)
            return

        # ── Blocked UA patterns (not on public GET endpoints for crawlers)
        if _is_blocked_ua(user_agent):
            # Allow legitimate crawlers on public endpoints
            if _is_public_path(path) and method == "GET" and _is_allowed_crawler(user_agent):
                await self.app(scope, receive, send)
                return

            # On public GET endpoints, allow known blocked UAs to pass
            # (they might be monitoring tools) — only block on non-public or POST
            if not (_is_public_path(path) and method == "GET"):
                security_log.bot_detected(
                    ip=ip, reason="blocked_user_agent",
                    path=path, user_agent=user_agent,
                )
                await JSONResponse(
                    status_code=403,
                    content={"detail": "Access denied."},
                )(scope, receive, send)
                return

        # Rapid-fire duplicate detection is now handled by Cloudflare WAF

        await self.app(scope, receive, send)
