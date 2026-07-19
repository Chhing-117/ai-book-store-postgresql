# Feature upgrade checklist

## Apply the upgrade

```powershell
cd "D:\Project-Code\ai-book-store-postgresql\backend"
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal:

```powershell
cd "D:\Project-Code\ai-book-store-postgresql\frontend"
npm install
npm run dev
```

## Test user access

1. Sign in with `reader@booknest.local / Reader123!`.
2. Confirm the navbar shows **For You** and **Profile**.
3. Confirm it does not show **Dashboard**.
4. Open several book pages, submit ratings, and complete a demo checkout.
5. Open **For You** and request recommendations.
6. Open **Profile** to see views, purchases, and ratings.

## Test administrator access

1. Sign out.
2. Sign in with `admin@booknest.local / Admin123!`.
3. Confirm the navbar shows **Dashboard**.
4. Open the dashboard to see user, order, revenue, view, rating, and AI-request metrics.

## pgAdmin tables

Refresh:

```text
Servers → BookNest → Databases → booknest → Schemas → public → Tables
```

The new tables are:

```text
users
user_sessions
book_views
book_ratings
purchases
purchase_items
recommendation_logs
```
