-- Correct values written as legacy text by the Mongo-to-D1 migration.
-- Only canonical boolean text is converted; all other values are untouched.
UPDATE website_content
SET is_published = CASE lower(is_published)
    WHEN 'true' THEN 1
    WHEN 'false' THEN 0
END
WHERE typeof(is_published) = 'text'
  AND lower(is_published) IN ('true', 'false');

UPDATE internship_listings
SET is_active = CASE lower(is_active)
    WHEN 'true' THEN 1
    WHEN 'false' THEN 0
END
WHERE typeof(is_active) = 'text'
  AND lower(is_active) IN ('true', 'false');

UPDATE job_openings
SET is_active = CASE lower(is_active)
    WHEN 'true' THEN 1
    WHEN 'false' THEN 0
END
WHERE typeof(is_active) = 'text'
  AND lower(is_active) IN ('true', 'false');
