# Raashi Cognitive Technologies — SEO Deployment & Verification Guide

This guide outlines the necessary steps to verify the SEO implementation after deploying to Cloudflare Pages and Cloudflare Workers.

## 1. Domain Configuration in Cloudflare

Ensure your Cloudflare DNS and Page Rules are configured correctly:

### A. Core Domains
- `raashitech.com` -> Points to `frontend-public` Cloudflare Pages project.
- `admin.raashitech.com` -> Points to `frontend-admin` Cloudflare Pages project.
- `api.raashitech.com` -> Points to your FastAPI Cloudflare Worker.

### B. Legacy Domain Redirect (CRITICAL)
To preserve search equity, you must configure a **Bulk Redirect** or **Page Rule** for the old domain:
- **Match URL:** `*raashitechnologies.com/*`
- **Redirect URL:** `https://raashitech.com/$2`
- **Status Code:** 301 (Permanent Redirect)
- **WWW Redirect:** Ensure `www.raashitech.com` also 301 redirects to `https://raashitech.com`.

## 2. Cloudflare Pages Functions Configuration

The dynamic sitemap relies on a Cloudflare Pages Function.

- Ensure your `frontend-public` project has **Functions** enabled.
- Verify that `functions/sitemap.xml.ts` is successfully compiled during the Cloudflare Pages build process.
- Ensure the `_routes.json` file is respected so that standard assets are not routed through the function invocations, preventing unnecessary billing or performance degradation.

## 3. Post-Deployment Verification

Once deployed, run these manual checks in a browser or terminal:

### Test the Sitemap Proxy
```bash
curl -I https://raashitech.com/sitemap.xml
```
- **Expected:** `HTTP/2 200 OK`, `Content-Type: application/xml`, `Cache-Control: public, max-age=3600`.

### Test the API Noindex Header
```bash
curl -I https://api.raashitech.com/api/v1/ping
```
- **Expected:** Contains `x-robots-tag: noindex, nofollow`.

### Test the Admin Noindex Header
```bash
curl -I https://admin.raashitech.com
```
- **Expected:** Contains `x-robots-tag: noindex`.

## 4. Google Search Console & IndexNow

1. **Google Search Console (GSC):**
   - Add a Domain Property for `raashitech.com`.
   - Submit the sitemap URL explicitly: `https://raashitech.com/sitemap.xml`.
   - Use the "URL Inspection Tool" to fetch the homepage and confirm that the JSON-LD schemas (Organization, WebSite) are correctly parsed.

2. **IndexNow:**
   - The FastAPI backend uses IndexNow to ping search engines (Bing, Yandex, etc.) when Domain content changes.
   - Verify that your IndexNow key (`backend/indexnow.txt` if hosted, or via API) is correctly validated by the respective search engines.
