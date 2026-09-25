from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
from app.core.validators import sanitize_html, sanitize_text


class DocumentType(str, Enum):
    TERMS = "TERMS"
    RULES = "RULES"


class Audience(str, Enum):
    INTERNSHIP = "INTERNSHIP"
    CAREER = "CAREER"


class PolicyStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class PolicyDocumentBase(BaseModel):
    document_type: DocumentType
    audience: Audience
    title: str = Field(min_length=2, max_length=200)
    content: str = Field(min_length=10, max_length=100000)
    effective_from: Optional[datetime] = None

    @field_validator("title")
    @classmethod
    def sanitize_title(cls, v: str) -> str:
        return sanitize_text(v)

    @field_validator("content")
    @classmethod
    def sanitize_policy_content(cls, v: str) -> str:
        return sanitize_html(v)


class PolicyDocumentCreate(PolicyDocumentBase):
    pass


class PolicyDocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    content: Optional[str] = Field(None, min_length=10, max_length=100000)
    effective_from: Optional[datetime] = None

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v):
        if v is not None:
            return sanitize_text(v)
        return v

    @field_validator("content", mode="before")
    @classmethod
    def sanitize_policy_content(cls, v):
        if v is not None:
            return sanitize_html(v)
        return v


class PolicyDocumentOut(PolicyDocumentBase):
    id: str
    version: int
    status: PolicyStatus
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
