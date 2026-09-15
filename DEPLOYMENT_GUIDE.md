# 🚀 Deployment Guide - Academic Nexus AI

This document provides instructions for deploying **Academic Nexus AI** to 24/7 cloud hosting platforms or making it instantly accessible via public tunnels.

---

## 🌟 Option 1: Live Public Tunnel (Instant Public HTTPS URL)

If you are running the backend server locally on your computer (`http://localhost:8000`), you can launch a public Cloudflare tunnel to instantly share the live website with anyone:

```powershell
# Run the Cloudflare tunnel executable:
.\cloudflared.exe tunnel --url http://127.0.0.1:8000
```

This will output a live HTTPS public link (e.g., `https://your-app-name.trycloudflare.com`).

---

## ☁️ Option 2: 24/7 Free Cloud Hosting on Render.com (Recommended)

Render provides free 24/7 cloud web hosting for Python & FastAPI applications with automatic HTTPS SSL certificates.

### Step-by-Step Render Deployment:
1. **Push your code to GitHub / GitLab**:
   Initialize a git repository in `C:\Users\Ram\.gemini\antigravity\scratch\academic-nexus-ai` and push to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Deploy Academic Nexus AI"
   git remote add origin https://github.com/YOUR_USERNAME/academic-nexus-ai.git
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [Render.com](https://render.com) and log in.
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository `academic-nexus-ai`.
   - Set the following configuration settings:
     - **Name**: `academic-nexus-ai`
     - **Environment**: `Python`
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Click **Create Web Service**.

3. **Public URL**:
   Render will build your project and give you a free permanent public URL:
   `https://academic-nexus-ai.onrender.com`

---

## 🐳 Option 3: Docker Deployment (Railway / Fly.io / Azure)

The repository includes a ready-to-use [`Dockerfile`](file:///C:/Users/Ram/.gemini/antigravity/scratch/academic-nexus-ai/Dockerfile).

```dockerfile
docker build -t academic-nexus-ai .
docker run -p 8000:8000 academic-nexus-ai
```

You can deploy this Docker container directly to [Railway.app](https://railway.app) or [Fly.io](https://fly.io) with zero additional configuration!
