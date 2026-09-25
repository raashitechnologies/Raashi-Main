"""
Cloudflare Workers-compatible, D1-backed fixed-window rate limiter.

It deliberately uses neither process memory nor locks: each decision is persisted
in D1, so concurrent Worker isolates observe the same window. Cloudflare WAF rate
rules should remain enabled as the first line of DDoS protection.
"""
import functools
import logging
import time
from typing import Any, Callable, List, Optional

from fastapi import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class RateLimitExceeded(Exception):
    """Raised when a rate limit is exceeded (never raised by this stub)."""
    def __init__(self, detail: str = "Rate limit exceeded", retry_after: int = 60):
        self.detail = detail
        self.retry_after = retry_after
        super().__init__(detail)


def get_remote_address(request: Request) -> str:
    """Extract the client IP from a Starlette/FastAPI request."""
    return request.headers.get("cf-connecting-ip") or (
        request.client.host if request.client else "unknown"
    )


def _parse_limit(rate: str) -> tuple[int, int]:
    count, _, unit = rate.partition("/")
    seconds = {"second": 1, "minute": 60, "hour": 3600}.get(unit.rstrip("s"))
    if not count.isdigit() or seconds is None:
        raise ValueError(f"Unsupported rate limit: {rate!r}")
    return int(count), seconds


class _LimitDecorator:
    """Callable returned by ``Limiter.limit()`` that checks D1 per request."""

    def __init__(self, rate_string: str, key_func: Callable[..., str]):
        self.rate_string = rate_string
        self.key_func = key_func

    async def _check(self, request: Request) -> None:
        max_events, period = _parse_limit(self.rate_string)
        db = request.scope.get("env") and request.scope["env"].DB
        if db is None:
            # Local tests without a D1 binding do not silently claim enforcement.
            logger.warning("Rate limiter skipped: no D1 binding for %s", request.url.path)
            return
        now = int(time.time())
        window = now - (now % period)
        key = self.key_func(request)
        route = request.scope.get("route")
        route_key = getattr(route, "path", request.url.path)
        # Opportunistic bounded cleanup keeps the small enforcement table from
        # growing forever without requiring Worker timers or process state.
        await db.prepare(
            "DELETE FROM rate_limit_events WHERE window_start < ?"
        ).bind(window - period).run()
        await db.prepare(
            "INSERT INTO rate_limit_events (window_start, rate_key, route, created_at) VALUES (?, ?, ?, ?)"
        ).bind(window, key, route_key, now).run()
        row = await db.prepare(
            "SELECT COUNT(*) AS count FROM rate_limit_events "
            "WHERE window_start = ? AND rate_key = ? AND route = ?"
        ).bind(window, key, route_key).first()
        if row and int(row["count"]) > max_events:
            raise RateLimitExceeded(self.rate_string, retry_after=period - (now - window))

    def __call__(self, func: Callable) -> Callable:
        # Preserve the original function signature for FastAPI's dependency injection
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            request = kwargs.get("request") or next(
                (arg for arg in args if isinstance(arg, Request)), None
            )
            if request is not None:
                await self._check(request)
            return await func(*args, **kwargs)
        return wrapper


class Limiter:
    """
    Small ``slowapi``-compatible facade for the existing endpoint decorators.
    """

    def __init__(
        self,
        key_func: Callable[..., str] = get_remote_address,
        default_limits: Optional[List[str]] = None,
        application_limits: Optional[List[str]] = None,
        headers_enabled: bool = False,
        strategy: Optional[str] = None,
        storage_uri: Optional[str] = None,
        storage_options: Optional[dict] = None,
        auto_check: bool = True,
        swallow_errors: bool = False,
        in_memory_fallback: Optional[List[str]] = None,
        in_memory_fallback_enabled: bool = False,
        retry_after: Optional[str] = None,
        key_prefix: str = "",
        enabled: bool = True,
        config_filename: Optional[str] = None,
        key_style: str = "url",
        **kwargs: Any,
    ) -> None:
        self._key_func = key_func
        self.enabled = enabled
        logger.debug("D1-backed rate limiter initialised")

    # ── Public decorator used on every endpoint ──────────────────────────
    def limit(
        self,
        limit_value: Any = None,
        key_func: Optional[Callable] = None,
        **kwargs: Any,
    ) -> Callable:
        """Return an enforcing decorator for a rate such as ``5/minute``."""
        rate_string = str(limit_value) if limit_value else "none"
        return _LimitDecorator(rate_string, key_func or self._key_func)

    # ── Starlette state integration (called in main.py) ──────────────────
    def _check_request_limit(self, *args: Any, **kwargs: Any) -> None:
        return None

    def _inject_headers(self, *args: Any, **kwargs: Any) -> None:
        return None
