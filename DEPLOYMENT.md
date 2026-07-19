# BookNest Deployment Guide

This version deploys three connected resources:

1. React frontend on Vercel
2. FastAPI backend on Render
3. PostgreSQL database on Render

## 1. Push to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Add PostgreSQL-backed BookNest"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/AI-Book-Store.git
git push -u origin main
```

Do not commit `backend/.env`, `frontend/.env`, database passwords, or OpenAI keys.

## 2. Deploy PostgreSQL and FastAPI with Render Blueprint

1. Sign in to Render.
2. Choose **New → Blueprint**.
3. Select the GitHub repository.
4. Render reads the root `render.yaml`.
5. The Blueprint creates:
   - `booknest-db`, a PostgreSQL database
   - `booknest-api`, a Python web service
6. Enter the requested secrets:
   - `OPENAI_API_KEY`, optional
   - `FRONTEND_ORIGINS`, initially `http://localhost:5173`
7. Create the Blueprint.

The backend start command automatically runs:

```bash
alembic upgrade head
python -m app.seed
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

`DATABASE_URL` is connected automatically from the Render PostgreSQL resource through `fromDatabase` in `render.yaml`.

After deployment, test:

```text
https://YOUR-API.onrender.com/api/health
https://YOUR-API.onrender.com/docs
```

The health endpoint must show:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## 3. Deploy React on Vercel

1. In Vercel, choose **Add New → Project**.
2. Import the same GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Use:

```text
Framework Preset: Vite
Install Command: npm install
Build Command: npm run build
Output Directory: dist
```

5. Add this environment variable:

```env
VITE_API_URL=https://YOUR-API.onrender.com/api
```

6. Deploy.

## 4. Update CORS

Copy the final Vercel URL, then edit the Render backend environment variable:

```env
FRONTEND_ORIGINS=https://YOUR-PROJECT.vercel.app,http://localhost:5173
```

Redeploy the backend.

## 5. Verify production

Check:

- `/api/health` reports PostgreSQL connected.
- The home page loads books from the database.
- Search, filters, sorting, and pagination work.
- Adding a wishlist item persists after refreshing.
- Adding a cart item persists after refreshing.
- AI Mood Finder recommends only books stored in PostgreSQL.
- Direct refreshes on `/books`, `/mood`, `/wishlist`, `/cart`, and book-detail routes work.

## Manual Render setup

When not using the Blueprint, create a Render PostgreSQL database first and copy its internal connection URL into the web service as `DATABASE_URL`.

Backend service settings:

```text
Runtime: Python
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port $PORT
Health Check Path: /api/health
Region: Singapore
```

Environment variables:

```env
DATABASE_URL=the Render PostgreSQL internal URL
PYTHON_VERSION=3.12.10
OPENAI_MODEL=gpt-5-mini
OPENAI_API_KEY=your optional secret
FRONTEND_ORIGINS=https://YOUR-PROJECT.vercel.app
```

## Updating production

```bash
git add .
git commit -m "Update BookNest"
git push
```

Render runs migrations and the idempotent seed command on each deployment. The seed is skipped when the books table already contains data.
