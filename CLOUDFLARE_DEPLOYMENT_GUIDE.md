# Raashi Cognitive Technologies – Cloudflare Migration & Deployment Guide

This guide details the steps required to deploy the Raashi Cognitive Technologies platform entirely on Cloudflare infrastructure, finalizing the migration away from Render (FastAPI), Vercel (Frontends), MongoDB Atlas, and Backblaze B2.

---

## 1. Prerequisites

You will need the following tools installed:
- Node.js (v18+)
- Python (3.13+)
- Wrangler CLI (`npm install -g wrangler`)
- Access to the Cloudflare Dashboard for `raashitech.com`.

Log in to Cloudflare via CLI:
```bash
wrangler login
```

---

## 2. Setting Up Cloudflare Resources (D1 & R2)

### A. Create the D1 Database
Create the production D1 database for the backend.
```bash
wrangler d1 create raashi-db
```
*Note the `database_id` output by this command.*

Update `backend/wrangler.json` with the generated `database_id`.

### B. Apply the Database Schema
Initialize the database structure using the provided SQL schema script:
```bash
wrangler d1 execute raashi-db --remote --file=backend/scripts/schema.sql
```

### C. Create the R2 Bucket
Create the R2 bucket for storing resumes, domain overview images, and other file assets.
```bash
wrangler r2 bucket create raashi-storage
```

---

## 3. Data Migration (Optional / First-time Setup)

We have provided migration scripts in `backend/scripts/` to move your existing data from MongoDB and Backblaze B2 to Cloudflare.

1. **Migrate MongoDB to D1:**
   Populate `.env` in `backend/scripts/` with `MONGO_URI`, `CF_ACCOUNT_ID`, `CF_API_TOKEN`, and `D1_DATABASE_ID`. Run the script:
   ```bash
   cd backend/scripts
   python3 migrate_mongo_to_d1.py
   ```

2. **Migrate Backblaze B2 to R2:**
   Populate `.env` with B2 credentials and R2 S3 API credentials.
   ```bash
   python3 migrate_storage_to_r2.py
   ```

---

## 4. Frontend Deployment (Cloudflare Pages)

The public site and admin dashboard are SPAs (React/Vite) that will be hosted on Cloudflare Pages. Both projects have been configured with `_redirects` for client-side routing.

### A. Public Website (`frontend-public`)
1. Create the Pages project:
   ```bash
   wrangler pages project create raashi-web-public --production-branch main
   ```
2. Build and Deploy:
   ```bash
   cd frontend-public
   npm install
   npm run build
   wrangler pages deploy dist --project-name raashi-web-public
   ```
3. Custom Domain (Optional): Map it to `raashitech.com` or `www.raashitech.com` in the Cloudflare Dashboard.

### B. Admin Dashboard (`frontend-admin`)
1. Create the Pages project:
   ```bash
   wrangler pages project create raashi-web-admin --production-branch main
   ```
2. Build and Deploy:
   ```bash
   cd frontend-admin
   npm install
   npm run build
   wrangler pages deploy dist --project-name raashi-web-admin
   ```
3. Custom Domain: Map it to `admin.raashitech.com`.

---

## 5. Backend Deployment (Cloudflare Workers + Python)

The backend is built with FastAPI and runs natively on Cloudflare Workers using the Python worker beta (`workers.asgi`).

### A. Configure Environment Variables
You must set your production secrets via Wrangler. Run these commands and paste the respective values when prompted:
```bash
cd backend
wrangler secret put JWT_SECRET_KEY
wrangler secret put RESEND_API_KEY
```

### B. Deploy the Worker
Deploy the FastAPI application to Cloudflare Workers. 
```bash
wrangler deploy
```

### C. Map Custom Domain
In `backend/wrangler.json`, the route `api.raashitech.com/*` is configured. Ensure the DNS record for `api.raashitech.com` points to the deployed Worker in the Cloudflare Dashboard (Custom Domains -> Add Custom Domain).

---

## 6. Architecture & Maintenance Notes

- **Database (D1):** You can query your production database directly via CLI:
  ```bash
  wrangler d1 execute raashi-db --remote --command="SELECT * FROM admin_users;"
  ```
- **Storage (R2):** R2 provides an S3-compatible API. The application uses Worker bindings (`env.R2`) which have zero egress fees.
- **Emails (Resend):** Background tasks have been converted to `await` calls, as `asyncio.create_task` (fire-and-forget) is not supported in the Cloudflare Python Worker runtime for outgoing requests.
- **Dependency Limitations:** Packages containing native C extensions (e.g., `pymongo`, `motor`, `boto3`) cannot be used in Cloudflare Python Workers. We use built-in D1 bindings and `httpx` (or `urllib.request`) for HTTP calls.

---

**End of Migration Guide.**
