"""
The actual FastAPI application logic for Raashi Cognitive Technologies.
"""
import json
import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.datastructures import MutableHeaders
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings, bind_worker_env, reset_worker_env


class WorkerBindingsMiddleware:
    """Pure ASGI middleware that scopes Worker bindings to one request.

    Starlette's HTTP response-wrapper middleware turns downstream responses
    into an async stream, which is incompatible with the Cloudflare Python
    ASGI adapter under load.
    """

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        token = bind_worker_env(scope.get("env"))
        try:
            await self.app(scope, receive, send)
        finally:
            reset_worker_env(token)

def setup_logging(settings):
    class JSONFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            log_entry = {
                "timestamp": self.formatTime(record, self.datefmt),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            if record.exc_info and record.exc_info[0] is not None:
                log_entry["exception"] = self.formatException(record.exc_info)
            return json.dumps(log_entry, default=str)

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    if settings.LOG_FORMAT == "json":
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )

    root_handler = logging.StreamHandler()
    root_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers.clear()
    root_logger.addHandler(root_handler)

    security_logger = logging.getLogger("security")
    security_logger.setLevel(logging.INFO)

class SecurityHeadersMiddleware:
    def __init__(self, app, settings):
        self.app = app
        self.settings = settings

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        is_upload = scope["path"].startswith("/uploads/")
        use_hsts = self.settings.is_production or scope.get("scheme") == "https"

        async def send_with_security_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(raw=message.setdefault("headers", []))
                headers["X-Content-Type-Options"] = "nosniff"
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
                if is_upload:
                    if "content-disposition" not in headers:
                        headers["Content-Disposition"] = "inline"
                else:
                    headers["X-Frame-Options"] = "DENY"
                    headers["X-XSS-Protection"] = "1; mode=block"
                    headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
                    headers["Content-Security-Policy"] = (
                        "default-src 'self'; script-src 'self'; "
                        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                        "font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; "
                        "connect-src 'self'; frame-ancestors 'none'"
                    )
                    headers["X-Robots-Tag"] = "noindex, nofollow"
                if use_hsts:
                    headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
            await send(message)

        await self.app(scope, receive, send_with_security_headers)

def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(settings)
    logger = logging.getLogger(__name__)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        logger.info("Starting Raashi CT API on Cloudflare Workers (environment=%s)", settings.ENVIRONMENT)
        yield
        logger.info("Shutting down Raashi CT API")

    _docs_url = None if settings.is_production else "/api/docs"
    _redoc_url = None if settings.is_production else "/api/redoc"

    app = FastAPI(
        title="Raashi Cognitive Technologies API",
        description="Backend API for Raashi Cognitive Technologies Pvt. Ltd. website.",
        version="1.0.0",
        lifespan=lifespan,
        docs_url=_docs_url,
        redoc_url=_redoc_url,
    )
    return app

def wire_app(app: FastAPI, settings) -> None:
    """
    Wire routers, middleware, exception handlers and health endpoints onto an
    existing FastAPI app instance.
    """
    logger = logging.getLogger(__name__)

    # --- Routers ---
    from app.api.v1.router import api_router
    from app.api.v1.endpoints.seo import router as seo_router
    app.include_router(api_router, prefix="/api/v1")
    app.include_router(seo_router)

    # --- Middleware ---
    app.add_middleware(WorkerBindingsMiddleware)

    from app.core.rate_limiter import RateLimitExceeded
    async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
        return JSONResponse(
            status_code=429,
            content={"code": 429, "error": "RATE_LIMITED", "message": "Too many requests. Please wait and try again."},
            headers={"Retry-After": str(exc.retry_after)},
        )
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)
    from app.core.security_middleware import SecurityAuditMiddleware
    app.add_middleware(SecurityAuditMiddleware)

    if settings.BOT_DETECTION_ENABLED:
        from app.core.bot_detection import BotDetectionMiddleware
        app.add_middleware(BotDetectionMiddleware)

    app.add_middleware(SecurityHeadersMiddleware, settings=settings)

    if settings.FORCE_HTTPS:
        from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
        app.add_middleware(HTTPSRedirectMiddleware)

    if settings.allowed_hosts_list:
        from fastapi.middleware.trustedhost import TrustedHostMiddleware
        app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts_list)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )

    # --- Health endpoints ---
    @app.get("/", tags=["health"], summary="Root endpoint")
    async def root():
        return {
            "status": "ok",
            "service": "Raashi Cognitive Technologies API",
            "version": "1.0.0",
            "health": "/health",
        }

    @app.get("/health", tags=["health"], summary="Health check")
    async def health():
        return {"status": "ok", "service": "Raashi Cognitive Technologies API"}

    # --- Exception handlers ---
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        fields = {}
        for err in exc.errors():
            field_name = ".".join(str(loc) for loc in err["loc"] if loc not in ("body", "query", "path", "header"))
            if not field_name:
                field_name = "_root_"
            if field_name not in fields:
                fields[field_name] = err.get("msg", "Invalid field.")
        return JSONResponse(
            status_code=422,
            content={
                "code": 422,
                "error": "VALIDATION_ERROR",
                "message": "Please correct the highlighted fields.",
                "fields": fields,
            },
        )

    STATUS_ERROR_MAPPING = {
        400: "BAD_REQUEST", 401: "UNAUTHORIZED", 403: "FORBIDDEN", 404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED", 409: "CONFLICT", 413: "PAYLOAD_TOO_LARGE",
        415: "UNSUPPORTED_MEDIA_TYPE", 422: "VALIDATION_ERROR", 429: "RATE_LIMITED",
        500: "INTERNAL_SERVER_ERROR", 502: "BAD_GATEWAY", 503: "SERVICE_UNAVAILABLE", 504: "GATEWAY_TIMEOUT"
    }

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        status_code = exc.status_code
        error_code = STATUS_ERROR_MAPPING.get(status_code, "UNKNOWN_ERROR")
        message = str(exc.detail) if exc.detail else "An error occurred."
        return JSONResponse(
            status_code=status_code,
            content={"code": status_code, "error": error_code, "message": message, "details": None},
            headers=getattr(exc, "headers", None)
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        req_id = str(uuid.uuid4())[:8].upper()
        logger.error("Unhandled exception: [ReqID: %s] %s", req_id, exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "code": 500,
                "error": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong on our server.",
                "details": None,
                "request_id": req_id,
            },
        )

    logger.info("Raashi CT API wired (environment=%s)", settings.ENVIRONMENT)

# Fully configure the app at the module level
app = create_app()
wire_app(app, get_settings())
