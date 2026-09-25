-- Preserve legacy Mongo data without fabricating values. Production metadata
-- was audited before this migration: these tables have no foreign keys or
-- triggers; career_applications has the two recreated indexes below.
-- Make website_content.updated_by nullable and add nullable legacy metadata.
CREATE TABLE website_content__replacement (
    section_key TEXT PRIMARY KEY,
    content_json TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    updated_at TEXT NOT NULL,
    title TEXT,
    created_at TEXT
);
INSERT INTO website_content__replacement (
    section_key, content_json, is_published, updated_by, updated_at
)
SELECT section_key, content_json, is_published, updated_by, updated_at
FROM website_content;
DROP TABLE website_content;
ALTER TABLE website_content__replacement RENAME TO website_content;

-- Make career_applications.experience nullable, retaining every other column.
CREATE TABLE career_applications__replacement (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    position TEXT NOT NULL,
    experience TEXT,
    portfolio_url TEXT,
    message TEXT,
    resume_url TEXT,
    resume_object_key TEXT,
    status TEXT NOT NULL,
    terms_document_id TEXT NOT NULL,
    terms_version INTEGER NOT NULL,
    terms_agreed_at TEXT NOT NULL,
    screening_remarks_json TEXT,
    reviewed_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    rules_document_id TEXT,
    rules_version INTEGER,
    rules_agreed_at TEXT
);
INSERT INTO career_applications__replacement (
    id, full_name, email, phone, position, experience, portfolio_url, message,
    resume_url, resume_object_key, status, terms_document_id, terms_version,
    terms_agreed_at, screening_remarks_json, reviewed_by, created_at, updated_at,
    rules_document_id, rules_version, rules_agreed_at
)
SELECT
    id, full_name, email, phone, position, experience, portfolio_url, message,
    resume_url, resume_object_key, status, terms_document_id, terms_version,
    terms_agreed_at, screening_remarks_json, reviewed_by, created_at, updated_at,
    rules_document_id, rules_version, rules_agreed_at
FROM career_applications;
DROP TABLE career_applications;
ALTER TABLE career_applications__replacement RENAME TO career_applications;
CREATE INDEX idx_career_apps_status ON career_applications (status);
CREATE INDEX idx_career_apps_email ON career_applications (email);

-- Make job_openings.experience nullable, retaining every other column.
CREATE TABLE job_openings__replacement (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL,
    experience TEXT,
    description TEXT NOT NULL,
    requirements_json TEXT NOT NULL,
    responsibilities_json TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
INSERT INTO job_openings__replacement (
    id, title, department, location, type, experience, description,
    requirements_json, responsibilities_json, is_active, created_at, updated_at
)
SELECT
    id, title, department, location, type, experience, description,
    requirements_json, responsibilities_json, is_active, created_at, updated_at
FROM job_openings;
DROP TABLE job_openings;
ALTER TABLE job_openings__replacement RENAME TO job_openings;

-- Add legacy internship metadata as nullable columns.
ALTER TABLE internship_listings ADD COLUMN eligibility TEXT;
ALTER TABLE internship_listings ADD COLUMN mode TEXT;
ALTER TABLE internship_listings ADD COLUMN positions INTEGER;
