"""
Lightweight JWT implementation using only Python stdlib.

Replaces python-jose for HS256-only JWT operations in Cloudflare Workers
to avoid the heavy cryptography/cffi import chain at startup.

Supports: HS256 signing and verification, standard claims (exp, iat, sub).
"""
import base64
import hashlib
import hmac
import json
import time
from typing import Any, Optional


class JWTError(Exception):
    """Raised when a JWT cannot be decoded or verified."""
    pass


class ExpiredSignatureError(JWTError):
    """Raised when a JWT has expired."""
    pass


def _b64url_encode(data: bytes) -> str:
    """Base64url-encode without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    """Base64url-decode with padding restoration."""
    s = s + "=" * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)


def _sign_hs256(message: bytes, secret: str) -> bytes:
    """Create HMAC-SHA256 signature."""
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).digest()


def encode(payload: dict, secret: str, algorithm: str = "HS256") -> str:
    """Encode a payload into a JWT string.

    Args:
        payload: Dict of claims (will be JSON-serialized).
        secret: The HMAC secret key.
        algorithm: Must be "HS256".

    Returns:
        A signed JWT string (header.payload.signature).
    """
    if algorithm != "HS256":
        raise JWTError(f"Unsupported algorithm: {algorithm}. Only HS256 is supported.")

    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))

    # Ensure numeric dates are integers
    encoded_payload = {}
    for k, v in payload.items():
        if isinstance(v, float) and k in ("exp", "iat", "nbf"):
            encoded_payload[k] = int(v)
        else:
            encoded_payload[k] = v

    payload_b64 = _b64url_encode(json.dumps(encoded_payload, separators=(",", ":"), default=str).encode("utf-8"))

    message = f"{header_b64}.{payload_b64}".encode("ascii")
    signature = _sign_hs256(message, secret)
    sig_b64 = _b64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode(
    token: str,
    secret: str,
    algorithms: Optional[list[str]] = None,
    options: Optional[dict] = None,
) -> dict:
    """Decode and verify a JWT string.

    Args:
        token: The JWT string.
        secret: The HMAC secret key.
        algorithms: List of allowed algorithms (must include "HS256").
        options: Optional dict with keys like "verify_exp" (default True).

    Returns:
        The decoded payload as a dict.

    Raises:
        JWTError: If the token is malformed or the signature is invalid.
        ExpiredSignatureError: If the token has expired.
    """
    if algorithms and "HS256" not in algorithms:
        raise JWTError(f"Unsupported algorithms: {algorithms}")

    opts = options or {}
    verify_exp = opts.get("verify_exp", True)

    parts = token.split(".")
    if len(parts) != 3:
        raise JWTError("Invalid token format: expected 3 parts")

    header_b64, payload_b64, sig_b64 = parts

    # Verify header
    try:
        header = json.loads(_b64url_decode(header_b64))
    except Exception:
        raise JWTError("Invalid token header")

    if header.get("alg") != "HS256":
        raise JWTError(f"Unsupported algorithm in token: {header.get('alg')}")

    # Verify signature
    message = f"{header_b64}.{payload_b64}".encode("ascii")
    expected_sig = _sign_hs256(message, secret)
    try:
        actual_sig = _b64url_decode(sig_b64)
    except Exception:
        raise JWTError("Invalid token signature encoding")

    if not hmac.compare_digest(expected_sig, actual_sig):
        raise JWTError("Signature verification failed")

    # Decode payload
    try:
        payload = json.loads(_b64url_decode(payload_b64))
    except Exception:
        raise JWTError("Invalid token payload")

    # Check expiration
    if verify_exp and "exp" in payload:
        exp = payload["exp"]
        if isinstance(exp, (int, float)):
            if time.time() > exp:
                raise ExpiredSignatureError("Token has expired")

    return payload
