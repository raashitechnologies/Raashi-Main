-- Bring the legacy published-only policy table in line with the existing
-- draft/publish API contract. Existing rows are preserved as published (or
-- archived where their legacy active flag is false); drafts retain NULL
-- publication metadata until they are published.
CREATE TABLE policies__replacement (
    id TEXT PRIMARY KEY,
    document_type TEXT NOT NULL,
    audience TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    published_by TEXT,
    published_at TEXT,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    effective_from TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

INSERT INTO policies__replacement (
    id, document_type, audience, content, version, is_active, published_by,
    published_at, title, status, effective_from, created_by, created_at,
    updated_at
)
SELECT
    id,
    document_type,
    audience,
    content,
    version,
    is_active,
    published_by,
    published_at,
    CASE
        WHEN document_type = 'TERMS' AND audience = 'INTERNSHIP'
            THEN 'Terms & Conditions for Internship Applications'
        WHEN document_type = 'RULES' AND audience = 'INTERNSHIP'
            THEN 'Rules & Regulations for Internship Applications'
        WHEN document_type = 'TERMS' AND audience = 'CAREER'
            THEN 'Terms & Conditions for Career Applications'
        WHEN document_type = 'RULES' AND audience = 'CAREER'
            THEN 'Rules & Regulations for Career Applications'
        ELSE document_type || ' for ' || audience || ' Applications'
    END,
    CASE WHEN is_active = 1 THEN 'PUBLISHED' ELSE 'ARCHIVED' END,
    NULL,
    published_by,
    published_at,
    published_at
FROM policies;

DROP TABLE policies;
ALTER TABLE policies__replacement RENAME TO policies;

-- Preserve the legacy lookup index and add the status-aware lookup used by
-- the public active-policy endpoint.
CREATE INDEX idx_policies_type_audience ON policies (document_type, audience);
CREATE INDEX idx_policies_active_lookup ON policies (document_type, audience, status);
