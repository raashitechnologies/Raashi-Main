-- Add canonical, queryable Domain CMS metadata without rewriting historical
-- migrations. SEO stays nullable because no pre-existing authoritative values
-- exist for it.
ALTER TABLE domains ADD COLUMN display_order INTEGER;
ALTER TABLE domains ADD COLUMN short_name TEXT;
ALTER TABLE domains ADD COLUMN tagline TEXT;
ALTER TABLE domains ADD COLUMN description TEXT;
ALTER TABLE domains ADD COLUMN accent_color TEXT;
ALTER TABLE domains ADD COLUMN seo_title TEXT;
ALTER TABLE domains ADD COLUMN seo_description TEXT;
ALTER TABLE domains ADD COLUMN seo_image TEXT;

-- Backfill only the authoritative existing domain definitions. These values
-- come from worker-src/app/scripts/seed.py and frontend-public/src/data/domains.ts.
UPDATE domains
SET
    display_order = CASE slug
        WHEN 'artificial-intelligence' THEN 1
        WHEN 'research-innovation' THEN 2
        WHEN 'iot-smart-automation' THEN 3
        WHEN 'engineering-design' THEN 4
        WHEN 'education-training' THEN 5
    END,
    short_name = CASE slug
        WHEN 'artificial-intelligence' THEN 'Artificial Intelligence'
        WHEN 'research-innovation' THEN 'Research & Innovation'
        WHEN 'iot-smart-automation' THEN 'IoT & Automation'
        WHEN 'engineering-design' THEN 'Engineering Design'
        WHEN 'education-training' THEN 'Education & Training'
    END,
    tagline = CASE slug
        WHEN 'artificial-intelligence' THEN 'Building intelligent systems that learn, reason and solve complex problems using data-driven insights.'
        WHEN 'research-innovation' THEN 'Driving innovation through research, technology development and commercialization of new ideas.'
        WHEN 'iot-smart-automation' THEN 'Creating connected and intelligent systems that automate processes and enhance efficiency.'
        WHEN 'engineering-design' THEN 'From concept to prototype — we design, simulate and manufacture innovative products with precision.'
        WHEN 'education-training' THEN 'Empowering students, researchers and institutions with knowledge, skills and consulting support.'
    END,
    description = CASE slug
        WHEN 'artificial-intelligence' THEN 'We deliver cutting-edge AI and data intelligence solutions that transform raw data into actionable insights.'
        WHEN 'research-innovation' THEN 'We fuel the next wave of technological breakthroughs through applied research and systematic R&D processes.'
        WHEN 'iot-smart-automation' THEN 'We build comprehensive IoT ecosystems from device firmware to cloud dashboards, enabling smarter environments.'
        WHEN 'engineering-design' THEN 'We provide comprehensive engineering design, simulation, and digital manufacturing services.'
        WHEN 'education-training' THEN 'We bridge the gap between academic learning and industry requirements through structured training and consultancy.'
    END,
    accent_color = CASE slug
        WHEN 'artificial-intelligence' THEN '#0560DF'
        WHEN 'research-innovation' THEN '#D11753'
        WHEN 'iot-smart-automation' THEN '#4D9FFF'
        WHEN 'engineering-design' THEN '#F94F0E'
        WHEN 'education-training' THEN '#F94F0E'
    END
WHERE slug IN (
    'artificial-intelligence', 'research-innovation', 'iot-smart-automation',
    'engineering-design', 'education-training'
);

-- Legacy seeds stored these as arrays. Wrap them in the current canonical
-- structured sections while retaining every card/FAQ item verbatim.
UPDATE domains
SET offers_json = json_object('eyebrow', 'WHAT WE OFFER', 'heading', '', 'cards', json(offers_json))
WHERE json_valid(offers_json) AND json_type(offers_json) = 'array';

UPDATE domains
SET faqs_json = json_object(
    'eyebrow', 'FAQ',
    'contact_heading', 'Have more questions?',
    'contact_description', 'We''re here to help. Reach out and our team will respond within 24 hours.',
    'contact_cta_label', 'Contact Us',
    'contact_cta_link', '/contact',
    'items', json(faqs_json)
)
WHERE json_valid(faqs_json) AND json_type(faqs_json) = 'array';

CREATE INDEX IF NOT EXISTS idx_domains_display_order ON domains (display_order, created_at, id);
