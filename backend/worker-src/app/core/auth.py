"""
Authentication utilities — JWT tokens, password hashing, FastAPI dependencies.
Supports access tokens, refresh tokens, password reset tokens, email verification
tokens, and token revocation.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import secrets
import hashlib

from app.core.config import get_settings
from app.core.database import get_database
from app.core.permissions import Role, Resource, Permission, has_permission

# ── Lightweight imports (replaces python-jose and bcrypt) ────────────────────
from app.core.jwt_utils import encode as jwt_encode, decode as jwt_decode, JWTError
from app.core.password_utils import hash_password, verify_password, needs_rehash

# ── JWT tokens ───────────────────────────────────────────────────────────────

def _jwt_secret() -> str:
    secret = get_settings().JWT_SECRET_KEY
    if not secret:
        raise RuntimeError("JWT signing secret is not configured in the Worker bindings.")
    return secret

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a short-lived access token (default: JWT_EXPIRATION_MINUTES)."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    )
    to_encode.update({"exp": int(expire.timestamp()), "type": "access"})
    return jwt_encode(to_encode, _jwt_secret(), algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a long-lived refresh token (default: REFRESH_TOKEN_EXPIRE_DAYS)."""
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": int(expire.timestamp()), "type": "refresh"})
    return jwt_encode(to_encode, _jwt_secret(), algorithm=settings.JWT_ALGORITHM)


def create_password_reset_token(email: str) -> str:
    """Create a short-lived token for password resets (default: 15 min)."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES
    )
    return jwt_encode(
        {"sub": email, "exp": int(expire.timestamp()), "purpose": "password_reset"},
        _jwt_secret(),
        algorithm=settings.JWT_ALGORITHM,
    )


def create_email_verification_token(email: str) -> str:
    """Create a token for email verification (default: 24 hours)."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        hours=settings.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS
    )
    return jwt_encode(
        {"sub": email, "exp": int(expire.timestamp()), "purpose": "email_verification"},
        _jwt_secret(),
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    return jwt_decode(token, _jwt_secret(), algorithms=[settings.JWT_ALGORITHM])


def decode_special_token(token: str, expected_purpose: str) -> dict:
    """Decode a JWT and verify it has the expected purpose claim.
    Raises JWTError or ValueError if invalid or wrong purpose.
    """
    settings = get_settings()
    payload = jwt_decode(token, _jwt_secret(), algorithms=[settings.JWT_ALGORITHM])
    if payload.get("purpose") != expected_purpose:
        raise ValueError(f"Token purpose mismatch: expected '{expected_purpose}'")
    return payload


# ── Secure random tokens (for DB-stored reset tokens) ────────────────────────

def generate_secure_token() -> str:
    """Generate a cryptographically secure URL-safe token."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """Hash a token for secure DB storage (SHA-256)."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ── Token revocation (D1 SQL) ────────────────────────────────────────────────

async def revoke_token(db: Any, token_jti: str, expires_at: Any) -> None:
    """Add a token to the revocation blocklist in D1."""
    now = datetime.now(timezone.utc).isoformat()
    # expires_at may be a timestamp int/float from JWT payload — convert to ISO
    if isinstance(expires_at, (int, float)):
        exp_iso = datetime.fromtimestamp(expires_at, tz=timezone.utc).isoformat()
    elif isinstance(expires_at, datetime):
        exp_iso = expires_at.isoformat()
    else:
        exp_iso = str(expires_at)

    await db.prepare(
        "INSERT OR IGNORE INTO revoked_tokens (jti, revoked_at, expires_at) VALUES (?, ?, ?)"
    ).bind(token_jti, now, exp_iso).run()


async def is_token_revoked(db: Any, token_jti: str) -> bool:
    """Check if a token has been revoked (D1)."""
    row = await db.prepare(
        "SELECT jti FROM revoked_tokens WHERE jti = ?"
    ).bind(token_jti).first()
    return row is not None


# ── Failed login tracking (D1 SQL) ─────────────────────────────────────────

async def record_failed_login(db: Any, email: str, ip: str) -> None:
    """Record a failed login attempt in D1."""
    from app.repositories import generate_id, now_iso
    await db.prepare(
        "INSERT INTO login_attempts (id, email, ip, timestamp, success) VALUES (?, ?, ?, ?, 0)"
    ).bind(generate_id(), email, ip, now_iso()).run()


async def clear_failed_logins(db: Any, email: str) -> None:
    """Clear failed login attempts for an email after successful login (D1)."""
    await db.prepare(
        "DELETE FROM login_attempts WHERE email = ? AND success = 0"
    ).bind(email).run()


async def get_failed_login_count(db: Any, email: str) -> int:
    """Count recent failed login attempts within the lockout window (D1)."""
    settings = get_settings()
    window_start = datetime.now(timezone.utc) - timedelta(
        minutes=settings.ACCOUNT_LOCKOUT_MINUTES
    )
    row = await db.prepare(
        "SELECT COUNT(*) as c FROM login_attempts WHERE email = ? AND success = 0 AND timestamp >= ?"
    ).bind(email, window_start.isoformat()).first()
    return row["c"] if row else 0


async def is_account_locked(db: Any, email: str) -> bool:
    """Check if account is locked due to too many failed login attempts."""
    settings = get_settings()
    failed_count = await get_failed_login_count(db, email)
    return failed_count >= settings.MAX_FAILED_LOGIN_ATTEMPTS


# ── FastAPI security scheme ──────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Any = Depends(get_database),
) -> dict:
    """
    Extract and verify the current user from the JWT bearer token.
    Returns the user dict (with id field set).
    Raises 401 if token is missing/invalid or user not found/inactive.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_access_token(credentials.credentials)
        user_email: Optional[str] = payload.get("sub")
        token_type: str = payload.get("type", "access")

        if user_email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        # Only accept access tokens for API authentication
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )

        # Check if token has been revoked
        jti = payload.get("jti")
        if jti and await is_token_revoked(db, jti):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Use D1 UserRepository to fetch the user
    from app.repositories import UserRepository
    repo = UserRepository(db)
    user = await repo.get_by_email(user_email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated",
        )

    # Ensure the 'id' field is present (D1 rows return id directly)
    if "id" not in user:
        user["id"] = user.get("_id", "")
    return user


# ── Role-based dependencies ─────────────────────────────────────────────────
def require_role(*roles: str):
    """
    Dependency factory: ensures the authenticated user has one of the specified roles.
    Usage:  current_user: dict = Depends(require_role("admin"))
    """
    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        user_role = current_user.get("role", "")
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(roles)}",
            )
        return current_user
    return _check


def require_permission(resource: Resource, permission: Permission):
    """
    Dependency factory: ensures the authenticated user's role has a specific
    permission on a resource.
    Usage:  current_user: dict = Depends(require_permission(Resource.DOMAINS, Permission.CREATE))
    """
    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        user_role_str = current_user.get("role", "")
        try:
            user_role = Role(user_role_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unknown role",
            )
        if not has_permission(user_role, resource, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission.value} on {resource.value}",
            )
        return current_user
    return _check
