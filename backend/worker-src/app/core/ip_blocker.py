"""
IP auto-blocking middleware (Disabled for Cloudflare Workers)

In a serverless distributed environment (Cloudflare Workers), process-local
memory cannot be used to track IP violations globally.
This middleware has been converted to a no-op.
Actual IP blocking and rate limiting should be configured via Cloudflare WAF
and Cloudflare Rate Limiting rules at the zone level.
"""
from typing import Optional, Tuple


def record_violation(ip: str) -> None:
    """No-op: In-memory violation tracking is disabled."""
    pass


def is_blocked(ip: str) -> bool:
    """No-op: Always returns False."""
    return False


def get_block_info(ip: str) -> Optional[Tuple[float, int]]:
    """No-op: Always returns None."""
    return None
