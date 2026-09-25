"""
Configuration management for Raashi Cognitive Technologies backend.
Reads local development settings from os.environ and Worker settings/secrets from
the Cloudflare request binding. Worker bindings are deliberately request scoped:
they must never be cached globally.
"""
import logging
import os
from contextvars import ContextVar, Token
from typing import List, Optional

logger = logging.getLogger(__name__)
_worker_env: ContextVar[object | None] = ContextVar("worker_env", default=None)


def bind_worker_env(env: object | None) -> Token:
    """Set the Cloudflare env binding for the lifetime of one ASGI request."""
    return _worker_env.set(env)


def reset_worker_env(token: Token) -> None:
    _worker_env.reset(token)


def _binding(name: str, default: str = "") -> str:
    """Read a Worker binding, falling back only to local process environment."""
    env = _worker_env.get()
    if env is not None:
        try:
            value = env[name] if isinstance(env, dict) else getattr(env, name)
            if value is not None:
                return str(value)
        except (AttributeError, KeyError, TypeError):
            pass
    return os.environ.get(name, default)

_WEAK_SECRETS = {
    "CHANGE-ME-IN-PRODUCTION-raashi-secret-key-2024",
    "your-secure-random-secret-key-change-in-production",
    "DEV-ONLY-NOT-FOR-PRODUCTION-replace-this-key-with-a-secure-random-value-at-least-64-chars",
    "REPLACE-WITH-SECURE-RANDOM-KEY",
    "REPLACE_WITH_SECURE_RANDOM_KEY",
    "secret",
    "changeme",
    "change-me",
}

class Settings:
    def __init__(self):
        self.ENVIRONMENT = _binding("ENVIRONMENT", "development")
        self.CORS_ORIGINS = _binding(
            "CORS_ORIGINS",
            "https://raashitech.com,https://www.raashitech.com,https://admin.raashitech.com"
        )

        # Resend
        self.RESEND_API_KEY = _binding("RESEND_API_KEY")
        self.EMAIL_FROM = _binding("EMAIL_FROM")
        self.NOTIFY_EMAIL = _binding("NOTIFY_EMAIL", "raashitechnologies@gmail.com")

        # Rate limits
        self.RATE_LIMIT_CONTACT = _binding("RATE_LIMIT_CONTACT", "5/minute")
        self.RATE_LIMIT_APPLY = _binding("RATE_LIMIT_APPLY", "3/minute")
        self.RATE_LIMIT_LOGIN = _binding("RATE_LIMIT_LOGIN", "5/minute")
        self.RATE_LIMIT_PASSWORD_RESET = _binding("RATE_LIMIT_PASSWORD_RESET", "3/minute")
        self.RATE_LIMIT_ACCOUNT_CREATE = _binding("RATE_LIMIT_ACCOUNT_CREATE", "3/minute")
        self.RATE_LIMIT_PUBLIC_READ = _binding("RATE_LIMIT_PUBLIC_READ", "60/minute")
        self.RATE_LIMIT_ADMIN = _binding("RATE_LIMIT_ADMIN", "30/minute")
        self.RATE_LIMIT_GLOBAL = _binding("RATE_LIMIT_GLOBAL", "100/minute")

        self.BOT_DETECTION_ENABLED = _binding("BOT_DETECTION_ENABLED", "true").lower() in ("true", "1", "yes")

        # JWT
        self.JWT_SECRET_KEY = _binding("JWT_SECRET_KEY")
        self.JWT_ALGORITHM = _binding("JWT_ALGORITHM", "HS256")
        self.JWT_EXPIRATION_MINUTES = int(_binding("JWT_EXPIRATION_MINUTES", "60"))
        self.REFRESH_TOKEN_EXPIRE_DAYS = int(_binding("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = int(_binding("PASSWORD_RESET_TOKEN_EXPIRY_MINUTES", "15"))
        self.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = int(_binding("EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS", "24"))

        self.MAX_FAILED_LOGIN_ATTEMPTS = int(_binding("MAX_FAILED_LOGIN_ATTEMPTS", "5"))
        self.ACCOUNT_LOCKOUT_MINUTES = int(_binding("ACCOUNT_LOCKOUT_MINUTES", "15"))

        # Frontend URLs
        self.FRONTEND_URL = _binding("FRONTEND_URL")
        self.PUBLIC_FRONTEND_URL = _binding("PUBLIC_FRONTEND_URL", "https://raashitech.com")
        self.ADMIN_FRONTEND_URL = _binding("ADMIN_FRONTEND_URL", "https://admin.raashitech.com")
        self.API_BASE_URL = _binding("API_BASE_URL", "https://api.raashitech.com")

        self.FORCE_HTTPS = _binding("FORCE_HTTPS", "false").lower() in ("true", "1", "yes")
        self.ALLOWED_HOSTS = _binding("ALLOWED_HOSTS")

        self.LOG_LEVEL = _binding("LOG_LEVEL", "INFO")
        self.LOG_FORMAT = _binding("LOG_FORMAT", "text")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == "development"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            origins = []
        else:
            origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

        for fe_url in (self.PUBLIC_FRONTEND_URL, self.ADMIN_FRONTEND_URL, self.FRONTEND_URL):
            if fe_url and fe_url.startswith(("http://", "https://")):
                clean_fe = fe_url.strip().rstrip("/")
                if clean_fe not in origins:
                    origins.append(clean_fe)

        return list(set(o.rstrip("/") for o in origins))

    @property
    def allowed_hosts_list(self) -> List[str]:
        if not self.ALLOWED_HOSTS:
            return []
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]

    @property
    def resend_configured(self) -> bool:
        return bool(self.RESEND_API_KEY and self.EMAIL_FROM)


def validate_settings(settings: Settings) -> None:
    errors: List[str] = []
    warnings: List[str] = []

    secret = settings.JWT_SECRET_KEY
    if not secret:
        errors.append("JWT_SECRET_KEY is empty.")
    elif secret.lower() in {s.lower() for s in _WEAK_SECRETS}:
        if settings.is_production:
            errors.append("JWT_SECRET_KEY is set to a known-weak default.")
        else:
            warnings.append("JWT_SECRET_KEY is using a development placeholder.")

    if settings.is_production:
        for url_name, url_val in [
            ("PUBLIC_FRONTEND_URL", settings.PUBLIC_FRONTEND_URL),
            ("ADMIN_FRONTEND_URL", settings.ADMIN_FRONTEND_URL),
        ]:
            if not url_val:
                errors.append(f"{url_name} is required in production.")
            elif not url_val.startswith("https://"):
                errors.append(f"{url_name} must use HTTPS in production.")

        if "*" in settings.cors_origins_list:
            errors.append("CORS_ORIGINS contains wildcard '*'.")

        if not settings.resend_configured:
            warnings.append("Resend is not configured.")

    for w in warnings:
        logger.warning("⚠ CONFIG: %s", w)

    if errors:
        error_msg = "\n".join(f"  • {e}" for e in errors)
        raise RuntimeError(f"FATAL: {len(errors)} configuration error(s) detected:\n{error_msg}")


def get_settings() -> Settings:
    return Settings()
