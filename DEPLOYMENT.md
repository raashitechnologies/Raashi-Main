# Production Deployment Guide: Raashi Cognitive Technologies Web Platform

This guide provides complete, step-by-step instructions to deploy the full **Raashi Cognitive Technologies** platform to production:
- **Public Frontend**: [Vercel](https://vercel.com) (`frontend-public`: React 19 + Vite + TailwindCSS v4)
- **Admin Frontend**: [Vercel](https://vercel.com) (`frontend-admin`: React 19 + Vite + TailwindCSS v4)
- **Backend API**: [Render](https://render.com) (`backend`: FastAPI + Python 3.11 + Uvicorn + Motor)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud Managed MongoDB M0/Serverless)

---

## 1. System Architecture

The application is structured as a modern monorepo with independent frontend applications and an asynchronous FastAPI backend:

```mermaid
flowchart TD
    subgraph Clients ["End Users & Administrators"]
        PublicUser["Public Visitors / Students / Applicants"]
        AdminUser["Staff / Coordinators / Administrators"]
    end

    subgraph Vercel ["Vercel Global Edge Network"]
        subgraph PublicApp ["Project 1: Public Website (Root: frontend-public)"]
            PublicSPA["React 19 Vite SPA\nhttps://raashi-web.vercel.app\n(Home, Domains, Careers, Apply, Contact)"]
            PublicRewrites["vercel.json SPA Rewrites"]
        end

        subgraph AdminApp ["Project 2: Admin Portal (Root: frontend-admin)"]
            AdminSPA["React 19 Vite SPA\nhttps://raashi-admin.vercel.app\n(Dashboard, Content, Applications, Users)"]
            AdminRewrites["vercel.json SPA Rewrites"]
        end
    end

    subgraph Render ["Render Cloud Web Service (Root: backend)"]
        FastAPI["FastAPI App\nhttps://raashi-backend.onrender.com"]
        Uvicorn["Uvicorn ASGI Server"]
        SecurityMW["Security & Governance\n• RateLimiter & BotDetection\n• IP Auto-blocker\n• Production Validator\n• CORS & SecurityHeaders"]
        UploadsStorage["Static Uploads Directory\n(/uploads/*.pdf)"]
    end

    subgraph Atlas ["MongoDB Atlas Cluster"]
        MongoDB[("raashi_ct DB\nDomains, Users, Applications, Content")]
    end

    subgraph ResendService ["Resend Transactional Email"]
        ResendAPI["Email Service\nPassword Resets & Email Verifications"]
    end

    PublicUser -->|HTTPS Requests| PublicSPA
    AdminUser -->|HTTPS Requests| AdminSPA

    PublicSPA -->|SPA Client Routing| PublicRewrites
    AdminSPA -->|SPA Client Routing| AdminRewrites

    PublicSPA -->|API Calls (VITE_API_BASE_URL)| SecurityMW
    AdminSPA -->|API Calls (VITE_API_BASE_URL)| SecurityMW

    SecurityMW --> FastAPI
    FastAPI --> Uvicorn
    Uvicorn --> MongoDB
    Uvicorn --> UploadsStorage
    Uvicorn --> ResendAPI
```

---

## 2. Prerequisites

Before beginning, ensure you have:
1. A **GitHub account** with access to the `rashi-web` repository.
2. A free **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas)** account.
3. A free **[Render](https://render.com)** account.
4. A free **[Vercel](https://vercel.com)** account.
5. (Optional) A free **[Resend](https://resend.com)** account for sending transactional emails.

---

## 3. Phase 1: Database Setup (MongoDB Atlas)

### 3.1 Create a Cluster
1. Log into your [MongoDB Atlas Dashboard](https://cloud.mongodb.com/).
2. Click **Create** to deploy a new database.
3. Select **M0 (Free)** tier.
4. Select a cloud provider and region (choose AWS / `ap-south-1` Mumbai or the region closest to your primary audience).
5. Name your cluster (e.g. `raashi-prod`) and click **Create Deployment**.

### 3.2 Create Database Credentials
1. Go to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Authentication Method: **Password**.
4. Set a username (e.g., `raashi_admin`).
5. Click **Autogenerate Secure Password** or create your own. **Copy and save this password securely.**
6. Under **Database User Privileges**, select **Read and write to any database** (`readWriteAnyDatabase`).
7. Click **Add User**.

### 3.3 Configure Network Access (IP Whitelist)
1. Go to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. Click **Allow Access from Anywhere** (`0.0.0.0/0`) — this is required so Render's dynamic container IPs can connect to your database.
4. Click **Confirm**.

### 3.4 Retrieve Connection URI
1. Go to **Deployment** → **Database**.
2. Click **Connect** on your cluster.
3. Choose **Drivers** → Driver: **Python**, Version: **3.12 or later**.
4. Copy the connection string. It will look like:
   ```text
   mongodb+srv://raashi_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password (ensure special characters are URL-encoded if necessary).

---

## 4. Phase 2: Backblaze B2 Setup (Resume Storage)

The backend requires Backblaze B2 S3-compatible storage for private resume uploads.

### 4.1 Create a Private Bucket
1. Create a free account at [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html).
2. Go to **Buckets** → **Create a Bucket**.
3. Name it (e.g., `raashi-production-resumes`).
4. Set Files in Bucket are: **Private**.
5. Default Encryption: **Disable** (or Enable if required by your policy).
6. Click **Create a Bucket**.

### 4.2 Generate Application Keys
1. Go to **Application Keys**.
2. Click **Add a New Application Key**.
3. Name of Key: `raashi-backend`.
4. Allow access to Bucket(s): Select your newly created bucket.
5. Type of Access: **Read and Write**.
6. Click **Create New Key**.
7. **Important**: Save the `keyID` and `applicationKey` immediately. You will need them for the backend environment variables. Also note your S3 Endpoint URL (e.g., `https://s3.us-west-004.backblazeb2.com`).

---

## 5. Phase 3: Deploy Both Frontends on Vercel

> [!IMPORTANT]
> **Why Two Vercel Projects?**
> The `rashi-web` repository contains two frontends:
> - `frontend-public/`: The candidate and public marketing website.
> - `frontend-admin/`: The internal management portal.
>
> In Vercel, you import the **same GitHub repository twice** as two distinct projects, setting the **Root Directory** accordingly for each.

```
rashi-web repository
├── frontend-public/  ───▶  Deploy as Vercel Project 1: "raashi-web" (or "raashi-public")
├── frontend-admin/   ───▶  Deploy as Vercel Project 2: "raashi-admin"
└── backend/          ───▶  Deploy to Render Web Service
```

---

### 4.1 Deploy Project 1: Public Website (`frontend-public`)

1. Log into your [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** → **Project**.
3. Locate and click **Import** next to your GitHub repository `rashi-web`.
4. Configure the project settings:
   - **Project Name**: `raashi-web` (or `raashi-public`)
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** ⚠️ **(CRITICAL STEP)** and select `frontend-public`. Click **Continue**.
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)
5. Expand **Environment Variables** and enter:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://raashi-backend.onrender.com/api/v1` | URL to your Render backend API v1 (update with your actual backend URL) |
   | `VITE_BACKEND_URL` | `https://raashi-backend.onrender.com` | Root backend URL for resume downloads |
   | `VITE_SITE_URL` | `https://raashi-web.vercel.app` | Public production URL for canonical SEO tags |

6. Click **Deploy**.
7. Note down your production URL (e.g. `https://raashi-web.vercel.app`).

---

### 4.2 Deploy Project 2: Admin Portal (`frontend-admin`)

1. In the [Vercel Dashboard](https://vercel.com/), click **Add New...** → **Project** again.
2. Select the **same repository** (`rashi-web`).
3. Configure the project settings:
   - **Project Name**: `raashi-admin`
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** ⚠️ **(CRITICAL STEP)** and select `frontend-admin`. Click **Continue**.
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
   - **Install Command**: `npm install` (Default)
4. Expand **Environment Variables** and enter:

   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | `https://raashi-backend.onrender.com/api/v1` | URL to your Render backend API v1 |
   | `VITE_BACKEND_URL` | `https://raashi-backend.onrender.com` | Root backend URL for resume downloads |
   | `VITE_ADMIN_URL` | `https://raashi-admin.vercel.app` | Admin production URL |

5. Click **Deploy**.
6. Note down your admin production URL (e.g. `https://raashi-admin.vercel.app`).

---

## 6. Phase 4: Backend API Deployment (Render)

### 5.1 Create Render Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** (top right) → Select **Web Service**.
3. Select **Build and deploy from a Git repository** and connect `raashitechnologies/rashi-web`.
4. Fill in the deployment details:

| Setting | Value |
| :--- | :--- |
| **Name** | `raashi-backend` |
| **Region** | Select region matching your MongoDB Atlas cluster (e.g. *Singapore* or *Frankfurt*) |
| **Branch** | `main` or your deployment branch (`feature/split-frontends`) |
| **Root Directory** | `backend` ⚠️ *(Crucial: sets context to backend)* |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` |

---

### 5.2 Configure Environment Variables on Render

> [!WARNING]
> **Avoid the Startup Crash**:
> In `ENVIRONMENT=production`, the backend startup validator requires both `PUBLIC_FRONTEND_URL` and `ADMIN_FRONTEND_URL` to start with `https://`. If you leave them blank, they default to `http://localhost:...` and the server will exit with:
> `RuntimeError: FATAL: 2 configuration error(s) detected:`
> Ensure you add the variables below in Render before deploying.

Under the **Environment** tab on Render, add the following variables:

| Variable Key | Required | Value / Description | Example |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | **Yes** | Set to `production` | `production` |
| `PYTHON_VERSION` | **Yes** | Pin Python version (pinned via `.python-version`) | `3.11.9` |
| `MONGODB_URI` | **Yes** | Your MongoDB Atlas connection string | `mongodb+srv://raashi_admin:Password123@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | **Yes** | Name of the database | `raashi_ct` |
| `JWT_SECRET_KEY` | **Yes** | Strong 64+ char random string | `pMV6kRRE3U4D8JJREEqESAv040...` *(See tip below)* |
| `PUBLIC_FRONTEND_URL` | **Yes** | Live HTTPS URL of `frontend-public` on Vercel | `https://raashi-web.vercel.app` |
| `ADMIN_FRONTEND_URL` | **Yes** | Live HTTPS URL of `frontend-admin` on Vercel | `https://raashi-admin.vercel.app` |
| `CORS_ORIGINS` | **Yes** | Comma-separated allowed frontend domains | `https://raashi-web.vercel.app,https://raashi-admin.vercel.app` |
| `ALLOWED_HOSTS` | *Optional* | Permitted Host headers (prevents header attacks) | `raashi-backend.onrender.com,localhost` |
| `SEED_ADMIN_PASSWORD` | **Yes** | Initial password for `admin@raashitech.com` | *Your secure admin password* |
| `SEED_COORDINATOR_PASSWORD` | **Yes** | Initial password for `coordinator@raashitech.com` | *Your secure coordinator password* |
| `RESEND_API_KEY` | *Optional* | Resend API key for transactional emails | `re_123456789...` |
| `EMAIL_FROM` | *Optional* | Verified sender email | `Raashi Technologies <onboarding@resend.dev>` |
| `NOTIFY_EMAIL` | *Optional* | Notification recipient for contact/application alerts | `raashitechnologies@gmail.com` |
| `FORCE_HTTPS` | *Optional* | Set to false behind Render reverse proxy | `false` |
| `LOG_LEVEL` | *Optional* | Logging verbosity | `INFO` |

> [!TIP]
> **Generate a secure 64-character JWT secret key**:
> Run this command in your terminal:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(64))"
> ```

5. Click **Deploy Web Service** (or **Save Changes**).
6. Verify the build logs. Once deployed, Render will provide your backend URL (e.g. `https://raashi-backend.onrender.com`).
7. **Verify Backend Health Check**:
   Open in your browser:
   ```text
   https://raashi-backend.onrender.com/health
   ```
   Expected response:
   ```json
   {"status":"ok","service":"Raashi Cognitive Technologies API"}
   ```

---

## 7. Phase 5: Database Seeding & Admin Account Setup

To populate default domains, initial website content, and create the default admin & coordinator accounts, run the database seed script:

### Option A: Via Render Shell (Recommended)
1. In the Render Dashboard, navigate to your `raashi-backend` service.
2. Click on the **Shell** tab.
3. Run the following command:
   ```bash
   python -m app.scripts.seed
   ```
4. Output will confirm:
   ```text
   Connected to MongoDB: raashi_ct
     ✓ Domain seeded: Artificial Intelligence & Data Intelligence
     ✓ Domain seeded: Research & Innovation (R&D)
     ...
     ✓ User seeded: admin@raashitech.com (role: admin)
     ✓ User seeded: coordinator@raashitech.com (role: coordinator)
     ✓ Content seeded: hero
     ...
     ✓ Indexes created
   Seeding complete!
   ```

### Option B: From Local Machine
If you have local access to Python:
```bash
cd backend
ENVIRONMENT=production \
MONGODB_URI="mongodb+srv://raashi_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority" \
SEED_ADMIN_PASSWORD="<your_admin_password>" \
SEED_COORDINATOR_PASSWORD="<your_coordinator_password>" \
python3 -m app.scripts.seed
```

---

## 8. Phase 6: Post-Deployment Verification Checklist

| # | Test Item | URL / Location | Verification Method | Expected Result |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Backend Health Check** | `https://raashi-backend.onrender.com/health` | Open in browser | Returns `{"status":"ok",...}` with HTTP 200 |
| 2 | **Public Site Home Page** | `https://raashi-web.vercel.app/` | Load homepage | Hero section, domain cards, and animations render seamlessly |
| 3 | **SPA Client Routing** | `/domains`, `/careers`, `/about` | Navigate and press F5 (hard reload) | Page reloads correctly without 404 (handled by `vercel.json`) |
| 4 | **Candidate Application** | `/apply` on public site | Submit form with resume PDF | Receives 200 OK, modal confirms application submission |
| 5 | **Contact Form** | `/contact` on public site | Fill and submit message | Success state appears, record created in database |
| 6 | **Admin Portal Login** | `https://raashi-admin.vercel.app/login` | Enter `admin@raashitech.com` + seed password | Successfully logs in and redirects to `/admin/dashboard` |
| 7 | **Admin Dashboard & Logs** | `/admin/internship-applications`, `/admin/users` | Click through tabs | Applications, metrics, and audit logs display cleanly |
| 8 | **Resume Download** | Application detail in admin | Click **Download Resume** | Uploaded resume PDF opens directly from the backend |

---

## 8. Troubleshooting & FAQ

### Issue: Backend crashes on Render with `RuntimeError: FATAL: 2 configuration error(s) detected`
- **Error Log**:
  ```text
  RuntimeError: FATAL: 2 configuration error(s) detected:
    • PUBLIC_FRONTEND_URL must use HTTPS in production (got: http://localhost:5173)
    • ADMIN_FRONTEND_URL must use HTTPS in production (got: http://localhost:5174)
  ```
- **Cause**: In `ENVIRONMENT=production`, FastAPI requires explicit HTTPS URLs for both frontends to ensure secure password reset links and email verification redirects.
- **Fix**: In the Render Dashboard under **Environment**, add:
  - `PUBLIC_FRONTEND_URL`: `https://<your-public-site>.vercel.app`
  - `ADMIN_FRONTEND_URL`: `https://<your-admin-portal>.vercel.app`
  - `CORS_ORIGINS`: `https://<your-public-site>.vercel.app,https://<your-admin-portal>.vercel.app`

### Issue: "Network Error" or "CORS Error" in browser console
- **Cause**: The backend `CORS_ORIGINS` does not match the frontend domain requesting the API.
- **Fix**: In Render environment variables, verify `CORS_ORIGINS` contains both Vercel domains separated by a comma without trailing slashes:
  ```env
  CORS_ORIGINS=https://raashi-web.vercel.app,https://raashi-admin.vercel.app
  ```

### Issue: Page shows 404 when refreshed on Vercel
- **Cause**: The Vercel server cannot locate a physical `.html` file matching the route path.
- **Fix**: Verify that each frontend contains its `vercel.json` rewrite file:
  ```json
  {
    "rewrites": [
      { "source": "/api/:path*", "destination": "https://raashi-backend.onrender.com/api/:path*" },
      { "source": "/uploads/:path*", "destination": "https://raashi-backend.onrender.com/uploads/:path*" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

### Issue: Render uses wrong Python version (e.g. Python 3.14)
- **Cause**: Render defaults to the newest installed Python if unpinned.
- **Fix**: A `.python-version` file containing `3.11.9` is included in both the repository root and `backend/` directory, ensuring Render uses stable Python 3.11.9.

### Issue: Backend Free Tier takes 30-50s to respond on first visit
- **Cause**: Free tier instances on Render sleep after 15 minutes of inactivity (cold start).
- **Fix**: Use a free uptime monitor (such as UptimeRobot or Cron-Job.org) to ping `https://raashi-backend.onrender.com/health` every 10 minutes to keep the container warm.

---

## 9. Complete Environment Variables Reference

### Public Frontend (`frontend-public/.env` / Vercel Project 1)
```env
VITE_API_BASE_URL=https://raashi-backend.onrender.com/api/v1
VITE_BACKEND_URL=https://raashi-backend.onrender.com
VITE_SITE_URL=https://raashi-web.vercel.app
```

### Admin Frontend (`frontend-admin/.env` / Vercel Project 2)
```env
VITE_API_BASE_URL=https://raashi-backend.onrender.com/api/v1
VITE_BACKEND_URL=https://raashi-backend.onrender.com
VITE_ADMIN_URL=https://raashi-admin.vercel.app
```

### Backend (`backend/.env` / Render Environment Variables)
```env
ENVIRONMENT=production
PYTHON_VERSION=3.11.9
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=raashi_ct
JWT_SECRET_KEY=<your-secure-64-char-random-key>
PUBLIC_FRONTEND_URL=https://raashi-web.vercel.app
ADMIN_FRONTEND_URL=https://raashi-admin.vercel.app
CORS_ORIGINS=https://raashi-web.vercel.app,https://raashi-admin.vercel.app
ALLOWED_HOSTS=raashi-backend.onrender.com,localhost
SEED_ADMIN_PASSWORD=<your-admin-password>
SEED_COORDINATOR_PASSWORD=<your-coordinator-password>
RESEND_API_KEY=<your-resend-api-key>
EMAIL_FROM=Raashi Technologies <onboarding@resend.dev>
NOTIFY_EMAIL=raashitechnologies@gmail.com
FORCE_HTTPS=false
LOG_LEVEL=INFO
LOG_FORMAT=text
```
