"""
Minimal startup configuration for Cloudflare Workers.

Reads environment variables directly via os.environ to avoid importing
pydantic / pydantic-settings at Worker startup time (which is expensive).

The full validated Settings object is still used at request time via
get_settings() from app.core.config — those imports happen lazily when
endpoint modules are loaded during the lifespan phase.
"""
import os


class _StartupSettings:
    """Lightweight settings for use during Worker startup only.

    Reads directly from environment variables — no pydantic overhead.
    """

    def __init__(self):
        self.ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
        self.CORS_ORIGINS = os.environ.get(
            "CORS_ORIGINS",
            "https://raashitech.com,https://www.raashitech.com,https://admin.raashitech.com",
        )
        self.PUBLIC_FRONTEND_URL = os.environ.get("PUBLIC_FRONTEND_URL", "https://raashitech.com")
        self.ADMIN_FRONTEND_URL = os.environ.get("ADMIN_FRONTEND_URL", "https://admin.raashitech.com")
        self.FRONTEND_URL = os.environ.get("FRONTEND_URL", "")
        self.BOT_DETECTION_ENABLED = os.environ.get("BOT_DETECTION_ENABLED", "true").lower() in ("true", "1", "yes")
        self.FORCE_HTTPS = os.environ.get("FORCE_HTTPS", "false").lower() in ("true", "1", "yes")
        self.ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "")
        self.LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")
        self.LOG_FORMAT = os.environ.get("LOG_FORMAT", "text")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def cors_origins_list(self) -> list[str]:
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
    def allowed_hosts_list(self) -> list[str]:
        if not self.ALLOWED_HOSTS:
            return []
        return [h.strip() for h in self.ALLOWED_HOSTS.split(",") if h.strip()]


def get_startup_settings() -> _StartupSettings:
    """Return lightweight settings for use during module-level initialization.

    This avoids importing pydantic/pydantic-settings at startup.
    """
    return _StartupSettings()
