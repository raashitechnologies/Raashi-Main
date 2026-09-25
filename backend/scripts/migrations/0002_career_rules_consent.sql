-- Existing D1 databases: preserve the complete career-application consent record.
-- Run once with `wrangler d1 execute raashi_technologies --file=...` before deploy.
ALTER TABLE career_applications ADD COLUMN rules_document_id TEXT;
ALTER TABLE career_applications ADD COLUMN rules_version INTEGER;
ALTER TABLE career_applications ADD COLUMN rules_agreed_at TEXT;
