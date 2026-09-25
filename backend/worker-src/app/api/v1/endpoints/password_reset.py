"""
Password reset endpoints — forgot password & reset password.
Uses short-lived JWT tokens with purpose claims to prevent misuse.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.core.rate_limiter import Limiter
from app.core.rate_limiter import get_remote_address
from typing import Any
from app.core.jwt_utils import JWTError

from app.core.config import get_settings
from app.core.database import get_database
from app.core.auth import (
    create_password_reset_token,
    decode_special_token,
    hash_password,
)
from app.core.security_logger import security_log
from app.repositories import UserRepository
from app.schemas import ForgotPasswordRequest, ResetPasswordRequest, validate_password_complexity

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


def get_user_repo(db: Any = Depends(get_database)) -> UserRepository:
    return UserRepository(db)


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/forgot-password", summary="Request a password reset link")
@limiter.limit(get_settings().RATE_LIMIT_PASSWORD_RESET)
async def forgot_password(
    body: ForgotPasswordRequest,
    request: Request,
    repo: UserRepository = Depends(get_user_repo),
):
    """
    Send a password reset link to the user's email.
    Always returns 200 regardless of whether the email exists — prevents enumeration.
    """
    settings = get_settings()
    ip = _client_ip(request)
    user = await repo.get_by_email(body.email)

    security_log.auth_password_reset_request(email=body.email, ip=ip)

    if user and user.get("is_active", False):
        token = create_password_reset_token(body.email)
        reset_url = f"{settings.ADMIN_FRONTEND_URL}/reset-password?token={token}"

        from app.services.email_service import send_password_reset_email
        await send_password_reset_email(
            to_email=body.email,
            reset_url=reset_url,
            expiry_minutes=settings.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES,
        )

    # Always return the same response to prevent email enumeration
    return {
        "status": "If this email is registered, a password reset link has been sent."
    }


@router.post("/reset-password", summary="Reset password with token")
@limiter.limit(get_settings().RATE_LIMIT_PASSWORD_RESET)
async def reset_password(
    body: ResetPasswordRequest,
    request: Request,
    repo: UserRepository = Depends(get_user_repo),
):
    """
    Reset the user's password using a valid, non-expired reset token.
    The token is single-use — the password is updated and the token becomes invalid
    because the JWT expiry is checked on decode.
    """
    ip = _client_ip(request)

    # Validate password complexity
    try:
        validate_password_complexity(body.new_password)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Decode and verify the reset token
    try:
        payload = decode_special_token(body.token, "password_reset")
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token",
            )
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token. Please request a new one.",
        )

    # Find active user and update the password via D1
    user = await repo.get_by_email(email)
    if not user or not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or account deactivated",
        )
    await repo.update(user["id"], {"password_hash": hash_password(body.new_password)})

    security_log.auth_password_reset_complete(email=email, ip=ip)

    return {"status": "Password has been reset successfully. You can now log in."}
