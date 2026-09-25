from fastapi import APIRouter, Request, Response, Depends
from typing import Any
from app.core.database import get_database
from app.repositories import DomainRepository
import datetime

router = APIRouter(tags=["seo"])

def get_domain_repo(db: Any = Depends(get_database)) -> DomainRepository:
    return DomainRepository(db)


def _safe_date(value: Any, fallback: str) -> str:
    """Parse an ISO datetime string (as returned by D1) to a YYYY-MM-DD string.
    Falls back to `fallback` if the value is missing or cannot be parsed.
    """
    if not value:
        return fallback
    if isinstance(value, datetime.datetime):
        return value.strftime("%Y-%m-%d")
    try:
        return datetime.datetime.fromisoformat(str(value)).strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return fallback


@router.get("/sitemap.xml", response_class=Response)
async def generate_sitemap(repo: DomainRepository = Depends(get_domain_repo)):
    domains = await repo.get_all()
    
    # Static pages
    static_routes = [
        "",
        "/about",
        "/domains",
        "/internships",
        "/careers",
        "/contact",
        "/privacy-policy",
        "/terms",
    ]
    
    base_url = "https://raashitech.com"
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    
    xml_content = ['<?xml version="1.0" encoding="UTF-8"?>']
    xml_content.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    
    # Add static routes
    for route in static_routes:
        xml_content.append("  <url>")
        xml_content.append(f"    <loc>{base_url}{route}</loc>")
        xml_content.append(f"    <lastmod>{today}</lastmod>")
        xml_content.append("    <changefreq>weekly</changefreq>")
        priority = "1.0" if route == "" else "0.8"
        xml_content.append(f"    <priority>{priority}</priority>")
        xml_content.append("  </url>")
        
    # Add domain routes
    for domain in domains:
        xml_content.append("  <url>")
        xml_content.append(f"    <loc>{base_url}/domains/{domain['slug']}</loc>")
        lastmod = _safe_date(domain.get("updated_at"), today)
        xml_content.append(f"    <lastmod>{lastmod}</lastmod>")
        xml_content.append("    <changefreq>weekly</changefreq>")
        xml_content.append("    <priority>0.9</priority>")
        xml_content.append("  </url>")
        
    xml_content.append("</urlset>")
    
    return Response(content="\n".join(xml_content), media_type="application/xml")

@router.get("/robots.txt", response_class=Response)
async def generate_robots_txt():
    content = """User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://raashitech.com/sitemap.xml
"""
    return Response(content=content, media_type="text/plain")

