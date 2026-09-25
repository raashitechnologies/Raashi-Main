"""
Structured security event logger for Raashi Cognitive Technologies.

All security-relevant events (auth, API errors, traffic anomalies) are emitted
through a dedicated ``security`` logger with structured fields, making them
easy to filter, aggregate, and alert on in any log management system.

Usage:
    from app.core.security_logger import security_log
    security_log.auth_login_success(email="...", ip="...", user_agent="...")
"""
import json
import logging
from datetime import datetime, timezone
from typing import Optional

# Dedicated logger — configured separately from the application logger
_logger = logging.getLogger("security")


def _emit(
    event: str,
    *,
    level: int = logging.INFO,
    **fields: object,
) -> None:
    """Emit a structured security log entry."""
    entry = {
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **{k: v for k, v in fields.items() if v is not None},
    }
    _logger.log(level, json.dumps(entry, default=str))


# ── Authentication events ────────────────────────────────────────────────────

class SecurityLog:
    """Namespaced helper for emitting structured security events."""

    # ── Login ────────────────────────────────────────────────────────────

    @staticmethod
    def auth_login_success(
        *, email: str, ip: str, user_agent: Optional[str] = None
    ) -> None:
        _emit("auth.login.success", email=email, ip=ip, user_agent=user_agent)

    @staticmethod
    def auth_login_failed(
        *, email: str, ip: str, user_agent: Optional[str] = None, reason: str = "invalid_credentials"
    ) -> None:
        _emit(
            "auth.login.failed",
            level=logging.WARNING,
            email=email, ip=ip, user_agent=user_agent, reason=reason,
        )

    @staticmethod
    def auth_login_locked(
        *, email: str, ip: str, failed_count: int
    ) -> None:
        _emit(
            "auth.login.locked",
            level=logging.WARNING,
            email=email, ip=ip, failed_count=failed_count,
        )

    # ── Token lifecycle ──────────────────────────────────────────────────

    @staticmethod
    def auth_token_refresh(
        *, email: str, ip: str
    ) -> None:
        _emit("auth.token.refresh", email=email, ip=ip)

    @staticmethod
    def auth_token_revoked(
        *, email: Optional[str] = None, ip: str
    ) -> None:
        _emit("auth.token.revoked", email=email, ip=ip)

    @staticmethod
    def auth_logout(
        *, ip: str
    ) -> None:
        _emit("auth.logout", ip=ip)

    # ── Password reset ───────────────────────────────────────────────────

    @staticmethod
    def auth_password_reset_request(
        *, email: str, ip: str
    ) -> None:
        _emit("auth.password_reset.request", email=email, ip=ip)

    @staticmethod
    def auth_password_reset_complete(
        *, email: str, ip: str
    ) -> None:
        _emit("auth.password_reset.complete", email=email, ip=ip)

    # ── API errors ───────────────────────────────────────────────────────

    @staticmethod
    def api_error(
        *,
        status_code: int,
        method: str,
        path: str,
        ip: str,
        user_agent: Optional[str] = None,
        error_type: Optional[str] = None,
    ) -> None:
        level = logging.ERROR if status_code >= 500 else logging.WARNING
        event = "api.error.5xx" if status_code >= 500 else "api.error.4xx"
        _emit(
            event,
            level=level,
            status_code=status_code,
            method=method,
            path=path,
            ip=ip,
            user_agent=user_agent,
            error_type=error_type,
        )

    # ── Rate limiting ────────────────────────────────────────────────────

    @staticmethod
    def api_rate_limit(
        *, ip: str, path: str, limit: str
    ) -> None:
        _emit(
            "api.rate_limit",
            level=logging.WARNING,
            ip=ip, path=path, limit=limit,
        )

    # ── Suspicious traffic ───────────────────────────────────────────────

    @staticmethod
    def traffic_suspicious(
        *, ip: str, reason: str, request_count: Optional[int] = None
    ) -> None:
        _emit(
            "traffic.suspicious",
            level=logging.WARNING,
            ip=ip, reason=reason, request_count=request_count,
        )

    # ── Bot detection ────────────────────────────────────────────────────

    @staticmethod
    def bot_detected(
        *, ip: str, reason: str, path: str, user_agent: str
    ) -> None:
        _emit(
            "bot.detected",
            level=logging.WARNING,
            ip=ip, reason=reason, path=path, user_agent=user_agent,
        )

    # ── IP blocking ──────────────────────────────────────────────────────

    @staticmethod
    def ip_blocked(
        *, ip: str, reason: str, duration_minutes: int, violation_count: int
    ) -> None:
        _emit(
            "ip.blocked",
            level=logging.WARNING,
            ip=ip, reason=reason,
            duration_minutes=duration_minutes,
            violation_count=violation_count,
        )

    @staticmethod
    def ip_unblocked(
        *, ip: str, reason: str
    ) -> None:
        _emit("ip.unblocked", ip=ip, reason=reason)


# Module-level singleton
security_log = SecurityLog()
