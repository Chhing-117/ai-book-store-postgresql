# PostgreSQL Quick Start

From the project root on Windows PowerShell:

```powershell
docker compose up -d postgres
cd backend
python -m venv .venv
Set-ExecutionPolicy -Scope Process Bypass
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload --port 8000
```

Open a second terminal:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Verify the connection at `http://localhost:8000/api/health`.
