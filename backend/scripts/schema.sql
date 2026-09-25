-- Cloudflare D1 SQLite Schema for Raashi Cognitive Technologies
-- All datetimes should be stored as ISO8601 UTC TEXT
-- Existing MongoDB ObjectIds will be preserved in TEXT PRIMARY KEY fields

-- 1. Domains
CREATE TABLE IF NOT EXISTS domains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    overview_json TEXT NOT NULL, -- stores image_url, image_gridfs_id/key, description
    hero_json TEXT NOT NULL,     -- title, subtitle
    offers_json TEXT NOT NULL,
    tech_json TEXT NOT NULL,
    apps_json TEXT NOT NULL,
    why_json TEXT NOT NULL,
    internship_json TEXT NOT NULL,
    future_json TEXT NOT NULL,
    faqs_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_domains_slug ON domains (slug);

-- 2. Users (Admin / Coordinator)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin' or 'coordinator'
    is_active INTEGER NOT NULL DEFAULT 1,
    email_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    last_login TEXT
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 3. Internship Listings
CREATE TABLE IF NOT EXISTS internship_listings (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain_slug TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements_json TEXT NOT NULL, -- JSON array
    duration TEXT NOT NULL,
    eligibility TEXT,
    mode TEXT,
    positions INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 4. Internship Applications
CREATE TABLE IF NOT EXISTS internship_applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    domain_slug TEXT NOT NULL,
    college TEXT,
    course_year TEXT,
    mode TEXT NOT NULL,
    message TEXT,
    resume_url TEXT,         -- legacy URL
    resume_object_key TEXT,  -- R2 object key
    status TEXT NOT NULL,
    terms_document_id TEXT NOT NULL,
    terms_version INTEGER NOT NULL,
    terms_agreed_at TEXT NOT NULL,
    rules_document_id TEXT NOT NULL,
    rules_version INTEGER NOT NULL,
    rules_agreed_at TEXT NOT NULL,
    screening_remarks_json TEXT, -- JSON array of objects: {remark, added_by, date}
    reviewed_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_internship_apps_status ON internship_applications (status);
CREATE INDEX IF NOT EXISTS idx_internship_apps_email ON internship_applications (email);
CREATE INDEX IF NOT EXISTS idx_internship_apps_domain ON internship_applications (domain_slug);

-- 5. Job Openings
CREATE TABLE IF NOT EXISTS job_openings (
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

-- 6. Career Applications
CREATE TABLE IF NOT EXISTS career_applications (
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
    rules_document_id TEXT NOT NULL,
    rules_version INTEGER NOT NULL,
    rules_agreed_at TEXT NOT NULL,
    screening_remarks_json TEXT,
    reviewed_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_career_apps_status ON career_applications (status);
CREATE INDEX IF NOT EXISTS idx_career_apps_email ON career_applications (email);

-- 7. Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL, -- 'new', 'in_progress', 'resolved'
    handled_by TEXT,
    notes_json TEXT,      -- JSON array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contact_messages (status);

-- 8. Website Content
CREATE TABLE IF NOT EXISTS website_content (
    section_key TEXT PRIMARY KEY,
    content_json TEXT NOT NULL,
    is_published INTEGER NOT NULL DEFAULT 1,
    updated_by TEXT,
    updated_at TEXT NOT NULL,
    title TEXT,
    created_at TEXT
);

-- 9. Policies
CREATE TABLE IF NOT EXISTS policies (
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
CREATE INDEX IF NOT EXISTS idx_policies_type_audience ON policies (document_type, audience);
CREATE INDEX IF NOT EXISTS idx_policies_active_lookup ON policies (document_type, audience, status);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    timestamp TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs (user_id);

-- 11. Brochure
CREATE TABLE IF NOT EXISTS brochure (
    id TEXT PRIMARY KEY,
    key_name TEXT NOT NULL UNIQUE, -- usually 'current'
    filename TEXT NOT NULL,
    gridfs_id TEXT,                -- legacy GridFS ID reference (if any)
    object_key TEXT,               -- new R2 object key
    size_bytes INTEGER NOT NULL,
    uploaded_by TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 12. Login Attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    ip TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    success INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts (email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts (ip);
CREATE INDEX IF NOT EXISTS idx_login_attempts_timestamp ON login_attempts (timestamp);

-- 13. Revoked Tokens
CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti TEXT PRIMARY KEY,
    revoked_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens (expires_at);

-- Worker-safe application rate limiting. Cloudflare WAF remains the edge layer.
CREATE TABLE IF NOT EXISTS rate_limit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    window_start INTEGER NOT NULL,
    rate_key TEXT NOT NULL,
    route TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_events (window_start, rate_key, route);
