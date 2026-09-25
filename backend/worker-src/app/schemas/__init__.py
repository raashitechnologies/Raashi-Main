import re
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, Annotated
from pydantic import BeforeValidator
from datetime import datetime
import json

# ── Lightweight email validation (replaces email-validator + dnspython) ──────
_EMAIL_RE = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$"
)


def _validate_email(v: str) -> str:
    if not isinstance(v, str):
        raise ValueError("Email must be a string")
    v = v.strip().lower()
    if not v or len(v) > 254:
        raise ValueError("Invalid email address")
    if not _EMAIL_RE.match(v):
        raise ValueError("Invalid email address format")
    return v


EmailStr = Annotated[str, BeforeValidator(_validate_email)]

from app.core.validators import (
    sanitize_text,
    validate_phone,
    validate_slug,
    validate_url,
    validate_dict_depth,
    MAX_CONTENT_SIZE_BYTES,
    ALLOWED_STATUSES_INTERN,
    ALLOWED_STATUSES_CAREER,
    ALLOWED_STATUSES_CONTACT,
)

from .policies import (
    DocumentType, Audience, PolicyStatus,
    PolicyDocumentBase, PolicyDocumentCreate, PolicyDocumentUpdate, PolicyDocumentOut
)

# ── Domain CMS sub-models ────────────────────────────────────────────────────

class DomainOffer(BaseModel):
    title: str
    description: str


class DomainFaq(BaseModel):
    question: str
    answer: str


class DomainHero(BaseModel):
    eyebrow: str = "OUR DOMAIN"
    heading: str = ""
    heading_highlight: str = ""
    description: str = ""


class DomainOverview(BaseModel):
    eyebrow: str = "OVERVIEW"
    heading: str = ""
    paragraphs: list[str] = Field(default_factory=list)
    image_url: Optional[str] = None
    image_gridfs_id: Optional[str] = None


class DomainOfferCard(BaseModel):
    title: str
    description: str


class DomainOfferSection(BaseModel):
    eyebrow: str = "WHAT WE OFFER"
    heading: str = ""
    cards: list[DomainOfferCard] = Field(default_factory=list)


class DomainTechSection(BaseModel):
    eyebrow: str = "TECHNOLOGIES WE USE"
    heading: str = "Tools & Frameworks"
    items: list[str] = Field(default_factory=list)


class DomainAppsSection(BaseModel):
    eyebrow: str = "APPLICATIONS"
    heading: str = "Industries We Serve"
    description: str = ""
    items: list[str] = Field(default_factory=list)


class DomainWhyCard(BaseModel):
    title: str
    description: str = ""
    icon: str = "Check"
    order: int = 0
    enabled: bool = True


class DomainWhySection(BaseModel):
    eyebrow: str = "WHY CHOOSE RAASHI?"
    heading: str = "Your Trusted Technology Partner"
    cards: list[DomainWhyCard] = Field(default_factory=list)


class DomainInternship(BaseModel):
    heading: str = "Internship Opportunities"
    checklist: list[str] = Field(default_factory=list)
    cta_label: str = "Apply for Internship"
    cta_link: str = "/apply"


class DomainFutureServices(BaseModel):
    enabled: bool = True
    heading: str = "Expanding Capabilities"
    description: str = ""


class DomainFaqSection(BaseModel):
    eyebrow: str = "FAQ"
    contact_heading: str = "Have more questions?"
    contact_description: str = "We're here to help. Reach out and our team will respond within 24 hours."
    contact_cta_label: str = "Contact Us"
    contact_cta_link: str = "/contact"
    items: list[DomainFaq] = Field(default_factory=list)


# ── Domain output / create / update schemas ──────────────────────────────────

class DomainOut(BaseModel):
    # General
    slug: str
    order: int
    name: str
    short_name: str
    tagline: str
    description: str
    accent_color: str
    # Legacy fields retained for backward compat
    overview_paragraphs: list[str] = Field(default_factory=list)
    what_we_offer: list[DomainOffer] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)
    applications: list[str] = Field(default_factory=list)
    faqs: list[DomainFaq] = Field(default_factory=list)
    # Structured CMS sections
    hero: Optional[DomainHero] = None
    overview: Optional[DomainOverview] = None
    offer_section: Optional[DomainOfferSection] = None
    tech_section: Optional[DomainTechSection] = None
    apps_section: Optional[DomainAppsSection] = None
    why_section: Optional[DomainWhySection] = None
    internship: Optional[DomainInternship] = None
    future_services: Optional[DomainFutureServices] = None
    faq_section: Optional[DomainFaqSection] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    seo_image: Optional[str] = None
    updated_at: Optional[datetime] = None


class DomainCreate(BaseModel):
    slug: str = Field(min_length=2, max_length=100)
    order: int = Field(ge=1)
    name: str = Field(min_length=2, max_length=200)
    short_name: str = Field(min_length=2, max_length=100)
    tagline: str = Field(min_length=2, max_length=500)
    description: str = Field(min_length=10, max_length=2000)
    accent_color: str = Field(min_length=4, max_length=20)
    overview_paragraphs: list[str] = []
    what_we_offer: list[DomainOffer] = []
    technologies: list[str] = []
    applications: list[str] = []
    faqs: list[DomainFaq] = []
    # Structured CMS sections
    hero: Optional[DomainHero] = None
    overview: Optional[DomainOverview] = None
    offer_section: Optional[DomainOfferSection] = None
    tech_section: Optional[DomainTechSection] = None
    apps_section: Optional[DomainAppsSection] = None
    why_section: Optional[DomainWhySection] = None
    internship: Optional[DomainInternship] = None
    future_services: Optional[DomainFutureServices] = None
    faq_section: Optional[DomainFaqSection] = None
    seo_title: Optional[str] = Field(None, max_length=200)
    seo_description: Optional[str] = Field(None, max_length=500)
    seo_image: Optional[str] = Field(None, max_length=1000)

    @field_validator("slug")
    @classmethod
    def validate_slug_format(cls, v: str) -> str:
        return validate_slug(v)

    @field_validator("name", "short_name", "tagline", "description", "accent_color", "seo_title", "seo_description", "seo_image", mode="before")
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("overview_paragraphs", "technologies", "applications")
    @classmethod
    def sanitize_string_lists(cls, v: list[str]) -> list[str]:
        return [sanitize_text(item) for item in v]


class DomainUpdate(BaseModel):
    order: Optional[int] = Field(None, ge=1)
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    short_name: Optional[str] = Field(None, min_length=2, max_length=100)
    tagline: Optional[str] = Field(None, min_length=2, max_length=500)
    description: Optional[str] = Field(None, min_length=10, max_length=2000)
    accent_color: Optional[str] = Field(None, min_length=4, max_length=20)
    overview_paragraphs: Optional[list[str]] = None
    what_we_offer: Optional[list[DomainOffer]] = None
    technologies: Optional[list[str]] = None
    applications: Optional[list[str]] = None
    faqs: Optional[list[DomainFaq]] = None
    # Structured CMS sections
    hero: Optional[DomainHero] = None
    overview: Optional[DomainOverview] = None
    offer_section: Optional[DomainOfferSection] = None
    tech_section: Optional[DomainTechSection] = None
    apps_section: Optional[DomainAppsSection] = None
    why_section: Optional[DomainWhySection] = None
    internship: Optional[DomainInternship] = None
    future_services: Optional[DomainFutureServices] = None
    faq_section: Optional[DomainFaqSection] = None
    seo_title: Optional[str] = Field(None, max_length=200)
    seo_description: Optional[str] = Field(None, max_length=500)
    seo_image: Optional[str] = Field(None, max_length=1000)

    @field_validator("name", "short_name", "tagline", "description", "accent_color", "seo_title", "seo_description", "seo_image", mode="before")
    @classmethod
    def sanitize_optional_text(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("overview_paragraphs", "technologies", "applications", mode="before")
    @classmethod
    def sanitize_optional_lists(cls, v):
        if v is not None:
            return [sanitize_text(item) for item in v]
        return v


# ── Contact schemas ─────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    subject: str = Field(min_length=2, max_length=100)
    message: str = Field(min_length=10, max_length=2000)

    @field_validator("full_name", "subject", "message")
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        return sanitize_text(v)

    @field_validator("phone", mode="before")
    @classmethod
    def validate_phone_format(cls, v):
        if v is not None and v.strip():
            return validate_phone(v)
        return v


class ContactOut(BaseModel):
    id: str
    status: str = "received"
    message: str = "Your message has been received. We will get back to you within 24 hours."


class ContactStatusUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=50)
    note: Optional[str] = Field(None, max_length=1000)

    @field_validator("status")
    @classmethod
    def validate_contact_status(cls, v: str) -> str:
        v = sanitize_text(v)
        if v not in ALLOWED_STATUSES_CONTACT:
            raise ValueError(
                f"Invalid status '{v}'. Allowed: {', '.join(sorted(ALLOWED_STATUSES_CONTACT))}"
            )
        return v

    @field_validator("note", mode="before")
    @classmethod
    def sanitize_note(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v


# ── Internship schemas ──────────────────────────────────────────────────────

class InternshipApplicationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    domain_slug: str = Field(min_length=2, max_length=100)
    college: Optional[str] = Field(None, max_length=200)
    course_year: Optional[str] = Field(None, max_length=100)
    mode: str = "Online"
    message: Optional[str] = Field(None, max_length=1000)
    terms_document_id: str
    terms_version: int
    rules_document_id: str
    rules_version: int

    @field_validator("full_name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_text(v)

    @field_validator("phone")
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        return validate_phone(v)

    @field_validator("domain_slug")
    @classmethod
    def validate_domain_slug(cls, v: str) -> str:
        return validate_slug(v)

    @field_validator("college", "course_year", "message", mode="before")
    @classmethod
    def sanitize_optional_text(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        allowed = {"Online", "Offline", "Hybrid"}
        if v not in allowed:
            raise ValueError(f"Mode must be one of: {', '.join(sorted(allowed))}")
        return v


class InternshipApplicationOut(BaseModel):
    id: str
    status: str = "submitted"
    message: str = "Your application has been submitted successfully. Our team will contact you within 2–3 business days."
    terms_document_id: Optional[str] = None
    terms_version: Optional[int] = None
    terms_agreed_at: Optional[datetime] = None
    rules_document_id: Optional[str] = None
    rules_version: Optional[int] = None
    rules_agreed_at: Optional[datetime] = None


class InternshipListingCreate(BaseModel):
    domain_slug: str = Field(min_length=2, max_length=100)
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    eligibility: Optional[str] = Field(None, max_length=2000)
    duration: Optional[str] = Field(None, max_length=200)
    mode: str = "Online"
    positions: int = Field(ge=1, default=10)
    is_active: bool = True

    @field_validator("domain_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        return validate_slug(v)

    @field_validator("title", "description")
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        return sanitize_text(v)

    @field_validator("eligibility", "duration", mode="before")
    @classmethod
    def sanitize_optional_text(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("mode")
    @classmethod
    def validate_mode(cls, v: str) -> str:
        allowed = {"Online", "Offline", "Hybrid"}
        if v not in allowed:
            raise ValueError(f"Mode must be one of: {', '.join(sorted(allowed))}")
        return v


class InternshipListingUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    eligibility: Optional[str] = Field(None, max_length=2000)
    duration: Optional[str] = Field(None, max_length=200)
    mode: Optional[str] = None
    positions: Optional[int] = Field(None, ge=1)
    is_active: Optional[bool] = None

    @field_validator("title", "description", "eligibility", "duration", mode="before")
    @classmethod
    def sanitize_optional_text(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("mode", mode="before")
    @classmethod
    def validate_mode(cls, v):
        if v is not None:
            allowed = {"Online", "Offline", "Hybrid"}
            if v not in allowed:
                raise ValueError(f"Mode must be one of: {', '.join(sorted(allowed))}")
        return v


# ── Career schemas ──────────────────────────────────────────────────────────

class JobOpeningOut(BaseModel):
    id: str
    title: str
    department: str
    location: str
    type: str
    experience: Optional[str] = None
    description: str
    posted_at: datetime


class JobOpeningCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    department: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2, max_length=200)
    type: str = Field(min_length=2, max_length=100)
    experience: Optional[str] = Field(None, max_length=200)
    description: str = Field(min_length=10, max_length=5000)
    is_active: bool = True

    @field_validator("title", "department", "location", "type", "experience", "description")
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        return sanitize_text(v)


class JobOpeningUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    location: Optional[str] = Field(None, min_length=2, max_length=200)
    type: Optional[str] = Field(None, min_length=2, max_length=100)
    experience: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, min_length=10, max_length=5000)
    is_active: Optional[bool] = None

    @field_validator("title", "department", "location", "type", "experience", "description", mode="before")
    @classmethod
    def sanitize_optional_text(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v


class CareerApplicationCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=20)
    position: str = Field(min_length=2, max_length=200)
    portfolio_url: Optional[str] = Field(None, max_length=500)
    message: Optional[str] = Field(None, max_length=1000)
    terms_document_id: str
    terms_version: int
    rules_document_id: str
    rules_version: int

    @field_validator("full_name", "position")
    @classmethod
    def sanitize_text_fields(cls, v: str) -> str:
        return sanitize_text(v)

    @field_validator("phone")
    @classmethod
    def validate_phone_format(cls, v: str) -> str:
        return validate_phone(v)

    @field_validator("portfolio_url", mode="before")
    @classmethod
    def validate_portfolio_url(cls, v):
        if v is not None and v.strip():
            return validate_url(v)
        return v

    @field_validator("message", mode="before")
    @classmethod
    def sanitize_message(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v


class CareerApplicationOut(BaseModel):
    id: str
    status: str = "received"
    message: str = "Your application has been received. We'll review it and get back to you soon."
    terms_document_id: Optional[str] = None
    terms_version: Optional[int] = None
    terms_agreed_at: Optional[datetime] = None
    rules_document_id: Optional[str] = None
    rules_version: Optional[int] = None
    rules_agreed_at: Optional[datetime] = None


# ── Application status / screening ──────────────────────────────────────────

class ApplicationStatusUpdate(BaseModel):
    status: str = Field(min_length=2, max_length=50)

    @field_validator("status")
    @classmethod
    def sanitize_status(cls, v: str) -> str:
        return sanitize_text(v)


class ScreeningRemarkCreate(BaseModel):
    remark: str = Field(min_length=2, max_length=2000)

    @field_validator("remark")
    @classmethod
    def sanitize_remark(cls, v: str) -> str:
        return sanitize_text(v)


# ── Auth schemas ─────────────────────────────────────────────────────────────

import re
from fastapi import HTTPException

def validate_password_complexity(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if len(password) > 128:
        raise ValueError("Password must be at most 128 characters long")
    return password

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(min_length=1, max_length=4096)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1, max_length=4096)
    new_password: str = Field(min_length=8, max_length=128)

    @property
    def validated_password(self):
        return validate_password_complexity(self.new_password)


class ResendVerificationRequest(BaseModel):
    """Request body for resending email verification.

    Uses a proper body model with EmailStr instead of a raw query parameter
    to ensure email format validation and prevent injection.
    """
    email: EmailStr


class VerifyEmailRequest(BaseModel):
    """Request body for email verification token."""
    token: str = Field(min_length=1, max_length=4096)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # minutes
    user: "UserOut"


# ── User schemas ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: Literal["coordinator"] = "coordinator"
    is_active: bool = True
    skip_email_verification: bool = True

    @field_validator("name")
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        return sanitize_text(v)

    @property
    def validated_password(self):
        return validate_password_complexity(self.password)


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8, max_length=128)
    is_active: Optional[bool] = None

    @field_validator("name", mode="before")
    @classmethod
    def sanitize_name(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @property
    def validated_password(self):
        if self.password:
            return validate_password_complexity(self.password)
        return None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    is_active: bool
    email_verified: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Website Content schemas ──────────────────────────────────────────────────

class WebsiteContentUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    content: dict  # Flexible JSON content for different section types
    is_published: bool = True

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("content")
    @classmethod
    def validate_content_structure(cls, v: dict) -> dict:
        """Validate the CMS content dict is not too deeply nested or too large."""
        # Check depth
        if not validate_dict_depth(v):
            raise ValueError(
                "Content structure is too deeply nested (max 5 levels)"
            )
        # Check serialized size
        serialized = json.dumps(v, default=str)
        if len(serialized.encode("utf-8")) > MAX_CONTENT_SIZE_BYTES:
            raise ValueError(
                f"Content is too large (max {MAX_CONTENT_SIZE_BYTES // 1024}KB)"
            )
        return v


class WebsiteContentOut(BaseModel):
    id: str
    section_key: str
    title: Optional[str] = None
    content: dict
    is_published: bool = True
    updated_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Generic error shape ─────────────────────────────────────────────────────

class APIError(BaseModel):
    code: int
    error: str
    detail: Optional[str] = None


# Update forward references
TokenResponse.model_rebuild()
