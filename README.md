# BookNest — React, FastAPI, PostgreSQL, Authentication, Admin, and AI

BookNest is a full-stack bookstore with a React/Tailwind frontend, FastAPI backend, PostgreSQL database, role-based access, user reading profiles, and AI-powered recommendations.

## Main features

- Home, all books, details, wishlist, cart, and AI Mood Finder
- User registration, sign-in, sign-out, and persistent server sessions
- Roles: `admin` and `user`
- Dashboard link appears only for administrators
- Backend protects `/api/admin/*` with an administrator check
- User profile page with favorite genres, favorite authors, bio, avatar, purchases, views, and ratings
- Book-view tracking while signed in
- User ratings and reading history
- Demo checkout that stores purchases in PostgreSQL
- Personalized AI recommendations based on:
  - books viewed or purchased
  - favorite genres and authors
  - ratings and reading history
  - choices from similar readers
  - the user's free-text reading request
- OpenAI Responses API integration with a local recommendation fallback

## Stack

- Frontend: React, Vite, Tailwind CSS, React Router
- Backend: Python, FastAPI, SQLAlchemy 2
- Database: PostgreSQL
- Migrations: Alembic
- AI: OpenAI Responses API
- Hosting: Vercel + Render

## PostgreSQL tables

```text
books
users
user_sessions
wishlist_items
cart_items
book_views
book_ratings
purchases
purchase_items
recommendation_logs
```

## Local setup on Windows

### 1. Start PostgreSQL

From the project root:

```powershell
docker compose up -d postgres
docker compose ps
```

Default local connection:

```text
Host: 127.0.0.1
Port: 5432
Database: booknest
Username: booknest
Password: booknest
```

When another PostgreSQL server already uses port `5432`, change the Compose port to `55432:5432` and update `backend/.env` accordingly.

### 2. Backend

```powershell
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process Bypass
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000/api/health
http://127.0.0.1:8000/docs
```

### 3. Frontend

In another PowerShell terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

## Demo accounts

Run `python -m app.seed` after the latest migration.


Change `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD` before deploying publicly.

## Upgrade an existing database

After replacing your older project files with this version:

```powershell
cd backend
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
```

The new migration is:

```text
20260715_0003_add_users_history_ai.py
```

It keeps the existing `books`, `wishlist_items`, and `cart_items` tables and adds the authentication, history, purchase, rating, and recommendation tables.

## Environment variables

Backend `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg://booknest:booknest@127.0.0.1:5432/booknest
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
SESSION_HOURS=168
SEED_ADMIN_PASSWORD=Admin123!
SEED_USER_PASSWORD=Reader123!
```

Frontend `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Never expose PostgreSQL or OpenAI secrets through a `VITE_*` variable.

## Important API endpoints

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/profile
GET    /api/profile/history
POST   /api/history/views/{book_id}
PUT    /api/ratings/{book_id}
POST   /api/orders/checkout
POST   /api/ai/mood
POST   /api/ai/recommendations
GET    /api/admin/dashboard
```

Cart and wishlist requests include `X-Client-ID`. Authenticated requests also include `Authorization: Bearer <session-token>`.

## Verify the database

```powershell
docker compose exec postgres psql -U booknest -d booknest -c "\dt"
docker compose exec postgres psql -U booknest -d booknest -c "SELECT id, full_name, email, role FROM users;"
docker compose exec postgres psql -U booknest -d booknest -c "SELECT COUNT(*) FROM book_views;"
docker compose exec postgres psql -U booknest -d booknest -c "SELECT COUNT(*) FROM purchases;"
```

## Build checks

```powershell
cd frontend
npm run build

cd ..\backend
python -m compileall app migrations
```
