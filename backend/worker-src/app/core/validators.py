"""
Centralized input validation and sanitization utilities.

Provides functions to sanitize user input, validate formats, verify file
uploads, and enforce pagination limits. Used by Pydantic schemas and
API endpoint handlers.

NOTE: HTML sanitization uses Python stdlib (html.parser) instead of bleach
to avoid bundling the heavy bleach package in Cloudflare Workers.
"""
import re
import os
import html
from html.parser import HTMLParser
from typing import Optional, Set, Tuple


# ── Stdlib-based HTML sanitizer (replaces bleach) ────────────────────────────

class _HTMLStripper(HTMLParser):
    """HTMLParser subclass that strips ALL tags and returns plain text."""

    def __init__(self):
        super().__init__()
        self.fed = []

    def handle_data(self, d):
        self.fed.append(d)

    def handle_entityref(self, name):
        self.fed.append(f"&{name};")

    def handle_charref(self, name):
        self.fed.append(f"&#{name};")

    def get_data(self):
        return "".join(self.fed)


class _HTMLSanitizer(HTMLParser):
    """HTMLParser subclass that allows only whitelisted tags and attributes."""

    def __init__(self, allowed_tags, allowed_attrs):
        super().__init__()
        self._allowed_tags = set(allowed_tags)
        self._allowed_attrs = allowed_attrs  # dict of tag -> list of attrs
        self.fed = []

    def handle_starttag(self, tag, attrs):
        if tag in self._allowed_tags:
            allowed = self._allowed_attrs.get(tag, [])
            safe_attrs = [(k, v) for k, v in attrs if k in allowed and self._is_safe_attr(k, v)]
            attr_str = ""
            for k, v in safe_attrs:
                if v is None:
                    attr_str += f" {html.escape(k)}"
                else:
                    attr_str += f' {html.escape(k)}="{html.escape(v, quote=True)}"'
            self.fed.append(f"<{html.escape(tag)}{attr_str}>")

    def handle_endtag(self, tag):
        if tag in self._allowed_tags:
            self.fed.append(f"</{html.escape(tag)}>")

    def handle_data(self, d):
        self.fed.append(html.escape(d))

    def handle_entityref(self, name):
        self.fed.append(f"&{name};")

    def handle_charref(self, name):
        self.fed.append(f"&#{name};")

    def _is_safe_attr(self, name, value):
        """Reject dangerous attribute values (javascript:, data:, etc.)."""
        if value is None:
            return True
        lower_val = value.lower().strip()
        if name == "href":
            if lower_val.startswith(("javascript:", "data:", "vbscript:")):
                return False
        return True

    def get_data(self):
        return "".join(self.fed)


def _strip_all_tags(value: str) -> str:
    """Strip ALL HTML tags and return plain text."""
    s = _HTMLStripper()
    s.feed(value)
    return html.unescape(s.get_data())


def _sanitize_with_whitelist(value: str, tags, attrs) -> str:
    """Allow only whitelisted tags/attributes, strip everything else."""
    s = _HTMLSanitizer(tags, attrs)
    s.feed(value)
    return s.get_data()


# ── Text sanitization ────────────────────────────────────────────────────────

def sanitize_text(value: str) -> str:
    """Strip ALL HTML tags and trim whitespace from user-supplied plain text.

    Use for fields like names, subjects, messages, remarks — anything
    that should never contain HTML.
    """
    if not value:
        return value
    # Strip all HTML tags using stdlib parser
    cleaned = _strip_all_tags(value)
    # Collapse excessive whitespace but preserve single newlines
    cleaned = re.sub(r"[^\S\n]+", " ", cleaned)
    # Remove null bytes and other control characters (except newline, tab)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", cleaned)
    return cleaned.strip()


# Safe HTML tags for rich-text fields (policy documents, website content)
_SAFE_HTML_TAGS = [
    "p", "br", "b", "i", "u", "strong", "em", "a",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6",
    "blockquote", "pre", "code", "span", "div", "table",
    "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup",
]
_SAFE_HTML_ATTRS = {
    "a": ["href", "title", "target", "rel"],
    "span": ["class"],
    "div": ["class"],
    "td": ["colspan", "rowspan"],
    "th": ["colspan", "rowspan"],
}


def sanitize_html(value: str) -> str:
    """Allow a safe subset of HTML tags for rich-text content.

    Use for CMS content and policy documents where formatting is needed.
    Strips dangerous tags like <script>, <iframe>, event handlers, etc.
    """
    if not value:
        return value
    cleaned = _sanitize_with_whitelist(value, _SAFE_HTML_TAGS, _SAFE_HTML_ATTRS)
    # Remove null bytes and dangerous control characters
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", cleaned)
    return cleaned.strip()


# ── Format validators ────────────────────────────────────────────────────────

# Slug: lowercase alphanumeric + hyphens, 2-100 chars
_SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9\-]{0,98}[a-z0-9]$")

# Section key: lowercase alphanumeric + underscores, 2-100 chars
_SECTION_KEY_PATTERN = re.compile(r"^[a-z0-9][a-z0-9_]{0,98}[a-z0-9]$")

# Phone: digits, spaces, +, -, (, ) — 7-20 chars
_PHONE_PATTERN = re.compile(r"^[\d\s\+\-\(\)]{7,20}$")


def validate_slug(value: str) -> str:
    """Validate that a value is a safe URL slug.

    Raises ValueError if the slug contains invalid characters, path
    traversal sequences, or is too long.
    """
    if not value:
        raise ValueError("Slug cannot be empty")
    value = value.strip().lower()
    if ".." in value or "/" in value or "\\" in value:
        raise ValueError("Slug contains invalid path characters")
    if not _SLUG_PATTERN.match(value):
        raise ValueError(
            "Slug must be 2-100 characters, lowercase alphanumeric and hyphens only, "
            "starting and ending with alphanumeric"
        )
    return value


def validate_section_key(value: str) -> str:
    """Validate a CMS section key format.

    Raises ValueError if the key contains invalid characters.
    """
    if not value:
        raise ValueError("Section key cannot be empty")
    value = value.strip().lower()
    if ".." in value or "/" in value or "\\" in value:
        raise ValueError("Section key contains invalid path characters")
    if not _SECTION_KEY_PATTERN.match(value):
        raise ValueError(
            "Section key must be 2-100 characters, lowercase alphanumeric and "
            "underscores only"
        )
    return value


def validate_phone(value: str) -> str:
    """Validate phone number format."""
    if not value:
        raise ValueError("Phone number cannot be empty")
    value = value.strip()
    if not _PHONE_PATTERN.match(value):
        raise ValueError(
            "Phone must be 7-20 characters containing only digits, spaces, "
            "+, -, (, )"
        )
    return value


def validate_url(value: str) -> str:
    """Validate that a URL uses a safe scheme (http or https only).

    Prevents javascript:, data:, and other dangerous URI schemes.
    """
    if not value:
        return value
    value = value.strip()
    lower = value.lower()
    if lower.startswith(("javascript:", "data:", "vbscript:", "file:")):
        raise ValueError("URL contains a disallowed scheme")
    # Must start with http:// or https:// or be a relative URL
    if "://" in value and not lower.startswith(("http://", "https://")):
        raise ValueError("URL must use http:// or https:// scheme")
    if len(value) > 2048:
        raise ValueError("URL is too long (max 2048 characters)")
    return value


# ── File upload validation ───────────────────────────────────────────────────

# Magic bytes for allowed upload types
_MAGIC_BYTES = {
    ".pdf": [b"%PDF"],
    ".doc": [b"\xd0\xcf\x11\xe0"],                      # OLE2 compound document
    ".docx": [b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"],  # ZIP-based (OOXML)
}


def validate_file_magic_bytes(content: bytes, ext: str) -> bool:
    """Verify that the file content matches the declared extension via magic bytes.

    Returns True if valid, False if the content doesn't match the extension.
    """
    ext = ext.lower()
    expected_magics = _MAGIC_BYTES.get(ext)
    if not expected_magics:
        return False  # Unknown extension — reject
    return any(content[:len(magic)] == magic for magic in expected_magics)


def sanitize_filename(filename: str) -> str:
    """Sanitize an uploaded filename to prevent path traversal and injection.

    Strips directory components, replaces dangerous characters, and
    ensures the result is a safe basename.
    """
    if not filename:
        return filename
    # Take only the basename — strip any directory components
    filename = os.path.basename(filename)
    # Remove null bytes
    filename = filename.replace("\x00", "")
    # Replace any non-alphanumeric characters (except dot, hyphen, underscore)
    filename = re.sub(r"[^\w.\-]", "_", filename)
    # Prevent double extensions that might bypass checks
    # Only keep the last extension
    name, ext = os.path.splitext(filename)
    name = re.sub(r"\.", "_", name)  # Replace dots in name part
    return f"{name}{ext}"


# ── Pagination helpers ───────────────────────────────────────────────────────

MAX_PAGE_LIMIT = 200


def cap_pagination(skip: int, limit: int) -> Tuple[int, int]:
    """Enforce safe pagination bounds.

    - skip: clamped to >= 0
    - limit: clamped to 1..MAX_PAGE_LIMIT
    """
    skip = max(0, skip)
    limit = max(1, min(limit, MAX_PAGE_LIMIT))
    return skip, limit


# ── Status allowlists ────────────────────────────────────────────────────────

ALLOWED_STATUSES_INTERN: Set[str] = {
    "submitted", "under_review", "shortlisted",
    "rejected", "accepted", "on_hold",
}

ALLOWED_STATUSES_CAREER: Set[str] = {
    "received", "under_review", "shortlisted",
    "rejected", "accepted", "on_hold",
}

ALLOWED_STATUSES_CONTACT: Set[str] = {
    "new", "in_progress", "responded", "resolved", "closed",
}

ALLOWED_ROLES: Set[str] = {"coordinator"}  # Roles that can be created via API


# ── JSON content depth validation ────────────────────────────────────────────

MAX_CONTENT_DEPTH = 5
MAX_CONTENT_SIZE_BYTES = 50 * 1024  # 50 KB


def validate_dict_depth(data: dict, max_depth: int = MAX_CONTENT_DEPTH, _current: int = 0) -> bool:
    """Check that a dict/list structure doesn't exceed max nesting depth.

    Returns True if valid, False if too deeply nested.
    """
    if _current > max_depth:
        return False
    if isinstance(data, dict):
        for v in data.values():
            if isinstance(v, (dict, list)):
                if not validate_dict_depth(v, max_depth, _current + 1):
                    return False
    elif isinstance(data, list):
        for item in data:
            if isinstance(item, (dict, list)):
                if not validate_dict_depth(item, max_depth, _current + 1):
                    return False
    return True
