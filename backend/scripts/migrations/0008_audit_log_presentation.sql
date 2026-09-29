-- Preserve immutable, human-readable context for audit history.
ALTER TABLE audit_logs ADD COLUMN resource_label TEXT;
ALTER TABLE audit_logs ADD COLUMN summary TEXT;
