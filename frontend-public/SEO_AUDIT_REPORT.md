# Raashi Cognitive Technologies — SEO Audit & Implementation Report

**Domain Strategy**
- **Canonical Public Domain:** `https://raashitech.com`
- **WWW Variant:** `https://www.raashitech.com` (Should redirect to canonical)
- **API Domain:** `https://api.raashitech.com` (Configured with `X-Robots-Tag: noindex, nofollow`)
- **Admin Domain:** `https://admin.raashitech.com` (Configured with `X-Robots-Tag: noindex` and `<meta name="robots" content="noindex">`)

## 1. Technical SEO Configuration

### `robots.txt`
A static `robots.txt` has been deployed to the `frontend-public` root.
- **Directives:** Allows all crawling (`User-agent: *`, `Allow: /`) except for specific exclusion logic.
- **Sitemap Location:** Points directly to `https://raashitech.com/sitemap.xml`.

### `sitemap.xml`
A Cloudflare Pages Function (`frontend-public/functions/sitemap.xml.ts`) acts as a same-origin proxy.
- **Functionality:** When a search engine requests `https://raashitech.com/sitemap.xml`, the Pages Function fetches the dynamic XML from the backend API (`https://api.raashitech.com/api/v1/seo/sitemap.xml`).
- **Caching:** The function applies proper caching headers (`Cache-Control: public, max-age=3600`) to optimize performance and reduce backend load.
- **Routing Constraint:** A `_routes.json` file ensures that ONLY `/sitemap.xml` triggers the function, leaving all other React assets to be served statically by Cloudflare's CDN.

## 2. On-Page SEO & Structured Data

Implemented React Helmet (`<SEO>` component) to inject metadata and JSON-LD structured data on all public pages.

### Home (`/`)
- **JSON-LD:** `Organization` and `WebSite` schemas.
- **Content:** Defines the company, contact details, social links, logo, and core business functions.

### About (`/about`)
- **JSON-LD:** `AboutPage` and `BreadcrumbList`.

### Domains (`/domains`)
- **JSON-LD:** `CollectionPage` and `BreadcrumbList`.

### Domain Detail (`/domains/:slug`)
- **JSON-LD:** `WebPage` and `BreadcrumbList`. (Uses `WebPage` instead of `Service` or `JobPosting` to ensure broad compatibility and to strictly adhere to the requirement that `Service` is only used for explicit service pages).
- **Metadata:** Dynamically injects SEO Title, Description, and OG Image fetched from the database.

### Internships (`/internships`)
- **JSON-LD:** `CollectionPage` and `BreadcrumbList`.

### Careers (`/careers`)
- **JSON-LD:** `CollectionPage` and `BreadcrumbList`.

### Contact (`/contact`)
- **JSON-LD:** `ContactPage` and `BreadcrumbList`.

### Legal Pages (`/privacy-policy`, `/terms`)
- **JSON-LD:** `WebPage`.

### Not Found (`/404`)
- **Metadata:** `robots="noindex, nofollow"`.
- **Apply Flow:** Apply flow also explicitly sets `noindex, nofollow`.

## 3. Semantic HTML & Performance Optimization
- Native semantic HTML5 elements are used where applicable (`<section>`, `<main>`, `<nav>`).
- Critical above-the-fold images (e.g., logo) are marked with `loading="eager"`.
- Below-the-fold images use `loading="lazy"` with explicit `width` and `height` properties where possible to prevent Cumulative Layout Shift (CLS).

## 4. API & Admin Security
- The FastAPI backend includes a global middleware (`SecurityHeadersMiddleware`) that automatically injects `X-Robots-Tag: noindex, nofollow` on all endpoints.
- The `frontend-admin` uses a Cloudflare `_headers` file to strictly prevent search engine indexing of the admin interface.

## Verification
- Run a crawl utilizing Screaming Frog or Google Search Console after deployment.
- Ensure the old domain (`raashitechnologies.com`) is redirected with a permanent 301 redirect to `raashitech.com` via Cloudflare Page Rules to transfer existing search equity.
