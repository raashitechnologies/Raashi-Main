"""
Authentication endpoints — login, refresh, logout, email verification, and
current user info. Includes brute-force protection and rate limiting.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from typing import Any

from app.core.config import get_settings
from app.core.database import get_database
from app.core.auth import (
    verify_password,
    create_access_token,
    create_refresh_token,
    create_email_verification_token,
    decode_access_token,
    decode_special_token,
    get_current_user,
    record_failed_login,
    clear_failed_logins,
    is_account_locked,
    revoke_token,
    get_failed_login_count,
)
from app.core.security_logger import security_log
from app.repositories import UserRepository
from app.schemas import (
    LoginRequest,
    RefreshTokenRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    TokenResponse,
    UserOut,
)
from app.core.jwt_utils import JWTError

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def get_user_repo(db: Any = Depends(get_database)) -> UserRepository:
    return UserRepository(db)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "")


@router.post("/login", response_model=TokenResponse, summary="Authenticate user")
@limiter.limit(get_settings().RATE_LIMIT_LOGIN)
async def login(
    body: LoginRequest,
    request: Request,
    repo: UserRepository = Depends(get_user_repo),
    db: Any = Depends(get_database),
):
    settings = get_settings()
    ip = _client_ip(request)
    ua = _user_agent(request)

    # ── Check account lockout ────────────────────────────────────────────
    if await is_account_locked(db, body.email):
        failed_count = await get_failed_login_count(db, body.email)
        security_log.auth_login_locked(
            email=body.email, ip=ip, failed_count=failed_count,
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to too many failed login attempts. "
                   f"Try again in {settings.ACCOUNT_LOCKOUT_MINUTES} minutes.",
        )

    # ── Lookup user ──────────────────────────────────────────────────────
    user = await repo.get_by_email(body.email)
    if not user:
        # Record the failed attempt even for non-existent users (constant-time)
        await record_failed_login(db, body.email, ip)
        security_log.auth_login_failed(
            email=body.email, ip=ip, user_agent=ua, reason="user_not_found",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # ── Verify password ──────────────────────────────────────────────────
    if not verify_password(body.password, user.get("password_hash", "")):
        await record_failed_login(db, body.email, ip)
        security_log.auth_login_failed(
            email=body.email, ip=ip, user_agent=ua, reason="wrong_password",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # ── Check active status ──────────────────────────────────────────────
    if not user.get("is_active", False):
        security_log.auth_login_failed(
            email=body.email, ip=ip, user_agent=ua, reason="account_deactivated",
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated. Contact an administrator.",
        )

    # ── Check email verification ─────────────────────────────────────────
    if not user.get("email_verified", False):
        security_log.auth_login_failed(
            email=body.email, ip=ip, user_agent=ua, reason="email_not_verified",
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please check your inbox for a verification link.",
        )

    # ── Success — clear failed attempts & issue tokens ───────────────────
    await clear_failed_logins(db, body.email)

    token_data = {
        "sub": user["email"],
        "role": user["role"],
        "jti": str(uuid.uuid4()),
    }

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={
        "sub": user["email"],
        "jti": str(uuid.uuid4()),
    })

    security_log.auth_login_success(
        email=body.email, ip=ip, user_agent=ua,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.JWT_EXPIRATION_MINUTES,
        user=UserOut(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            is_active=user["is_active"],
            email_verified=user.get("email_verified", False),
            created_at=user.get("created_at"),
            updated_at=user.get("updated_at"),
        ),
    )


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
@limiter.limit(get_settings().RATE_LIMIT_LOGIN)
async def refresh_token(
    body: RefreshTokenRequest,
    request: Request,
    repo: UserRepository = Depends(get_user_repo),
    db: Any = Depends(get_database),
):
    """Exchange a valid refresh token for a new access + refresh token pair."""
    settings = get_settings()
    ip = _client_ip(request)

    try:
        payload = decode_access_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type — expected refresh token",
            )
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Check if the refresh token has been revoked
    old_jti = payload.get("jti")
    if old_jti:
        from app.core.auth import is_token_revoked
        if await is_token_revoked(db, old_jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token has been revoked",
            )

    # Verify user still exists and is active
    user = await repo.get_by_email(user_email)
    if not user or not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or deactivated",
        )

    # Revoke the old refresh token (rotation)
    if old_jti:
        from datetime import datetime, timezone
        await revoke_token(db, old_jti, payload.get("exp", datetime.now(timezone.utc)))

    # Issue new token pair
    new_token_data = {
        "sub": user["email"],
        "role": user["role"],
        "jti": str(uuid.uuid4()),
    }

    new_access = create_access_token(data=new_token_data)
    new_refresh = create_refresh_token(data={
        "sub": user["email"],
        "jti": str(uuid.uuid4()),
    })

    security_log.auth_token_refresh(email=user_email, ip=ip)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=settings.JWT_EXPIRATION_MINUTES,
        user=UserOut(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            role=user["role"],
            is_active=user["is_active"],
            email_verified=user.get("email_verified", False),
            created_at=user.get("created_at"),
            updated_at=user.get("updated_at"),
        ),
    )


@router.post("/logout", summary="Revoke current session tokens")
@limiter.limit(get_settings().RATE_LIMIT_LOGIN)
async def logout(
    body: RefreshTokenRequest,
    request: Request,
    db: Any = Depends(get_database),
):
    """Revoke the refresh token to end the session server-side."""
    ip = _client_ip(request)

    try:
        payload = decode_access_token(body.refresh_token)
        jti = payload.get("jti")
        if jti:
            from datetime import datetime, timezone
            await revoke_token(db, jti, payload.get("exp", datetime.now(timezone.utc)))
    except JWTError:
        pass  # Token already expired / invalid — nothing to revoke

    security_log.auth_logout(ip=ip)

    return {"status": "logged_out"}


@router.post("/verify-email", summary="Verify email address")
@limiter.limit(get_settings().RATE_LIMIT_LOGIN)
async def verify_email(
    request: Request,
    token: str = Query(..., min_length=1, max_length=4096),
    repo: UserRepository = Depends(get_user_repo),
):
    """Verify a user's email using the verification token sent via email."""
    try:
        payload = decode_special_token(token, "email_verification")
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token",
            )
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user = await repo.get_by_email(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    await repo.update(user["id"], {"email_verified": 1})

    return {"status": "email_verified", "email": email}


@router.post("/resend-verification", summary="Resend email verification")
@limiter.limit(get_settings().RATE_LIMIT_PASSWORD_RESET)
async def resend_verification(
    body: ResendVerificationRequest,
    request: Request,
    repo: UserRepository = Depends(get_user_repo),
):
    """Resend email verification link. Always returns 200 to prevent enumeration."""
    settings = get_settings()
    user = await repo.get_by_email(body.email)

    if user and not user.get("email_verified", False):
        token = create_email_verification_token(body.email)
        verify_url = f"{settings.ADMIN_FRONTEND_URL}/verify-email?token={token}"

        from app.services.email_service import send_verification_email
        await send_verification_email(
            to_email=body.email,
            verify_url=verify_url,
            expiry_hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS,
        )

    # Always return success to prevent email enumeration
    return {"status": "If this email exists and is unverified, a verification link has been sent."}


@router.get("/me", response_model=UserOut, summary="Get current authenticated user")
@limiter.limit(get_settings().RATE_LIMIT_PUBLIC_READ)
async def get_me(request: Request, current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=current_user["id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user["role"],
        is_active=current_user["is_active"],
        email_verified=current_user.get("email_verified", False),
        created_at=current_user.get("created_at"),
        updated_at=current_user.get("updated_at"),
    )
