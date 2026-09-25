<div align="center">
  <img src="https://raashi.co.in/wp-content/uploads/2021/04/Raashi-Cognitive.png" alt="Raashi Cognitive Technologies Logo" width="300" />

  # Raashi Cognitive Technologies Pvt. Ltd.
  **Transforming Knowledge into Intelligent Solutions**

  <p>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
    <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" /></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" /></a>
    <a href="https://fastapi.tiangolo.com/"><img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" /></a>
    <a href="https://developers.cloudflare.com/d1/"><img src="https://img.shields.io/badge/Cloudflare_D1-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare D1" /></a>
    <a href="https://developers.cloudflare.com/r2/"><img src="https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare R2" /></a>
  </p>
</div>

---

## 📖 About The Project

This repository contains the full-stack web application for **Raashi Cognitive Technologies Pvt. Ltd.** The platform is designed to showcase the company's domains of expertise, available internship programs, career opportunities, and provide an easy way for prospective students and clients to connect.

Built with a highly responsive **React (Vite)** frontend and a robust **FastAPI (Python)** backend. The entire infrastructure is hosted natively on **Cloudflare** using Pages, Workers, D1 (Serverless SQL Database), and R2 (Object Storage).

### ✨ Features
- **Modern UI/UX**: Designed meticulously with our specific brand guidelines (Tailwind CSS, Framer Motion).
- **Internship Portal**: Dedicated application forms with PDF resume uploads to Cloudflare R2.
- **Careers Page**: Explore open positions and apply seamlessly.
- **Service Domains**: Deep dive into our core offerings like AI, IoT, Digital Manufacturing, and more.
- **Cloud-Native Backend**: Built with FastAPI and deployed on Cloudflare Workers for lightning-fast edge performance.
- **Serverless SQL**: Backed by Cloudflare D1 for distributed relational data storage.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (custom brand tokens)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Hosting**: Cloudflare Pages

### Backend
- **Framework**: FastAPI (Python 3.13+)
- **Runtime**: Cloudflare Workers (`workers.asgi`)
- **Database**: Cloudflare D1 (Serverless SQLite)
- **Storage**: Cloudflare R2 (Object Storage)
- **Validation**: Pydantic v2
- **Email Services**: Resend via `httpx` for edge-compatible notifications

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/en/) 18+
- [Python](https://www.python.org/downloads/) 3.13+
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (`npm install -g wrangler`)

---

### 💻 Local Development Setup

#### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create the local D1 database and apply the schema
wrangler d1 execute raashi-db --local --file=scripts/schema.sql

# Set up local secrets (JWT and Resend keys)
cp .env.example .env

# Run the backend locally using Wrangler (Cloudflare Workers emulator)
wrangler dev
```

#### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend-public  # Or frontend-admin

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```
Navigate to `http://localhost:5173` in your browser to view the application.

---

## 🌍 Production Deployment (Cloudflare)

The platform is designed to be deployed completely on Cloudflare's edge network. See `CLOUDFLARE_DEPLOYMENT_GUIDE.md` for complete, exhaustive deployment instructions, including how to migrate data from old MongoDB/Backblaze environments.

**Quick Overview:**
1. **Database**: Use `wrangler d1 execute raashi-db --remote --file=backend/scripts/schema.sql` to initialize your production database.
2. **Storage**: Create a bucket with `wrangler r2 bucket create raashi-storage`.
3. **Backend**: Run `wrangler deploy` in the `backend/` directory to push the FastAPI app to Cloudflare Workers.
4. **Frontends**: Run `wrangler pages deploy dist` in both `frontend-public/` and `frontend-admin/` after running `npm run build`.

---

## 🎨 Design System

This project strictly adheres to the **Raashi Cognitive Technologies** brand guidelines, enforced via Tailwind configuration:

| Attribute | Details |
| :--- | :--- |
| **Primary Brand Color** | `#0560DF` (Royal Blue) |
| **Secondary Accent** | `#F94F0E` (Orange) |
| **Primary Font** | `Inter` (Sans Serif) |
| **Heading Font** | `Plus Jakarta Sans` |
| **Border Radii** | `12px` / `16px` (Soft rounded edges) |
| **Interactions** | Soft shadows with floating hover effects |

---

<div align="center">
  <i>Raashi Cognitive Technologies Pvt. Ltd.</i>
</div>
