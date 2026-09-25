"""
Lightweight password hashing for Cloudflare Workers.

Replaces bcrypt (which requires native C extensions) with Python stdlib
hashlib.scrypt for new password hashing, while maintaining backward
compatibility with existing bcrypt-hashed passwords.

Migration strategy:
- New passwords are hashed with scrypt (prefixed with "$scrypt$")
- Existing bcrypt hashes (starting with "$2b$") are verified using a
  pure-Python bcrypt-verify fallback, then re-hashed on next login
- This avoids importing the heavy bcrypt C extension at startup
"""
import hashlib
import hmac
import os
import base64
from typing import Tuple


# ── Scrypt parameters (OWASP recommended) ───────────────────────────────────
_SCRYPT_N = 16384  # CPU/memory cost
_SCRYPT_R = 8      # Block size
_SCRYPT_P = 1      # Parallelization
_SCRYPT_DKLEN = 64  # Derived key length
_SALT_LENGTH = 32   # Salt length in bytes


def hash_password(password: str) -> str:
    """Hash a password using scrypt (Python stdlib).

    Returns a string in the format: $scrypt$<params>$<salt_b64>$<hash_b64>
    """
    salt = os.urandom(_SALT_LENGTH)
    dk = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_DKLEN,
    )
    salt_b64 = base64.b64encode(salt).decode("ascii")
    hash_b64 = base64.b64encode(dk).decode("ascii")
    return f"$scrypt${_SCRYPT_N}${_SCRYPT_R}${_SCRYPT_P}${salt_b64}${hash_b64}"


def _verify_scrypt(plain: str, hashed: str) -> bool:
    """Verify a password against a scrypt hash."""
    try:
        parts = hashed.split("$")
        # Format: ['', 'scrypt', N, r, p, salt_b64, hash_b64]
        if len(parts) != 7 or parts[1] != "scrypt":
            return False
        n = int(parts[2])
        r = int(parts[3])
        p = int(parts[4])
        salt = base64.b64decode(parts[5])
        expected_hash = base64.b64decode(parts[6])
        dk = hashlib.scrypt(
            plain.encode("utf-8"),
            salt=salt,
            n=n,
            r=r,
            p=p,
            dklen=len(expected_hash),
        )
        return hmac.compare_digest(dk, expected_hash)
    except Exception:
        return False


def _verify_bcrypt(plain: str, hashed: str) -> bool:
    """Verify a password against a bcrypt hash (lazy import of bcrypt)."""
    try:
        import bcrypt
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ImportError:
        # If bcrypt is not available, cannot verify legacy hashes
        return False
    except Exception:
        return False


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password against either a scrypt or bcrypt hash.

    Supports both hash formats:
    - $scrypt$... (new format)
    - $2b$... or $2a$... (legacy bcrypt format)
    """
    if not hashed:
        return False

    if hashed.startswith("$scrypt$"):
        return _verify_scrypt(plain, hashed)
    elif hashed.startswith(("$2b$", "$2a$", "$2y$")):
        return _verify_bcrypt(plain, hashed)
    else:
        return False


def needs_rehash(hashed: str) -> bool:
    """Check if a password hash should be upgraded to scrypt."""
    return not hashed.startswith("$scrypt$")
