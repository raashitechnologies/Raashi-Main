"""
Generate seed SQL for Cloudflare D1 local/remote database from app.scripts.seed
"""
import json
import uuid
from datetime import datetime, timezone
import sys
import os

# Add worker-src to sys.path so we can import app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "worker-src"))

from app.scripts.seed import DOMAINS, DEFAULT_CONTENT

def sql_escape(text: str) -> str:
    if text is None:
        return "NULL"
    return "'" + str(text).replace("'", "''") + "'"

def main():
    now = datetime.now(timezone.utc).isoformat()
    lines = ["-- Seed data for Cloudflare D1 (Domains & Website Content)"]

    # 1. Domains
    for d in DOMAINS:
        domain_id = f"domain-{d['slug']}"
        name = d["name"]
        slug = d["slug"]
        overview_json = json.dumps(d.get("overview", {}))
        hero_json = json.dumps(d.get("hero", {}))
        
        # offers
        offer_cards = d.get("offers") or d.get("offer_section", {}).get("cards", [])
        offers_json = json.dumps(offer_cards)
        
        tech_json = json.dumps(d.get("tech", d.get("tech_section", {})))
        apps_json = json.dumps(d.get("apps", d.get("apps_section", {})))
        why_json = json.dumps(d.get("why", d.get("why_section", {})))
        internship_json = json.dumps(d.get("internship", {}))
        future_json = json.dumps(d.get("future", d.get("future_services", {})))
        
        faqs = d.get("faqs") or d.get("faq_section", {}).get("items", [])
        faqs_json = json.dumps(faqs)

        sql = f"""INSERT OR REPLACE INTO domains (
    id, name, slug, overview_json, hero_json, offers_json,
    tech_json, apps_json, why_json, internship_json, future_json, faqs_json,
    created_at, updated_at
) VALUES (
    {sql_escape(domain_id)}, {sql_escape(name)}, {sql_escape(slug)}, {sql_escape(overview_json)}, {sql_escape(hero_json)}, {sql_escape(offers_json)},
    {sql_escape(tech_json)}, {sql_escape(apps_json)}, {sql_escape(why_json)}, {sql_escape(internship_json)}, {sql_escape(future_json)}, {sql_escape(faqs_json)},
    {sql_escape(now)}, {sql_escape(now)}
);"""
        lines.append(sql)

    # 2. Website Content
    for c in DEFAULT_CONTENT:
        sec_key = c["section_key"]
        title = c.get("title", "")
        content_json = json.dumps(c.get("content", {}))
        is_published = 1 if c.get("is_published", True) else 0

        sql = f"""INSERT OR REPLACE INTO website_content (
    section_key, title, content_json, is_published, updated_by, created_at, updated_at
) VALUES (
    {sql_escape(sec_key)}, {sql_escape(title)}, {sql_escape(content_json)}, {is_published}, 'system', {sql_escape(now)}, {sql_escape(now)}
);"""
        lines.append(sql)

    output_path = os.path.join(os.path.dirname(__file__), "seed_data.sql")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(lines) + "\n")
    print(f"Generated {output_path} with {len(DOMAINS)} domains and {len(DEFAULT_CONTENT)} content sections.")

if __name__ == "__main__":
    main()
