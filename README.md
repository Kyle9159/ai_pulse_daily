# AIPulse Monorepo

AI news aggregator with Grok-powered summaries for engineers and PMs.

## Structure

```
ai_pulse/
├── backend/          FastAPI + SQLAlchemy + APScheduler
│   ├── app/
│   │   ├── api/      HTTP route handlers
│   │   ├── db/       SQLAlchemy models + session
│   │   ├── lib/      xAI/Grok client
│   │   └── services/ RSS scraper + refresh orchestrator
│   ├── alembic/      Database migrations
│   └── seed.py       Sample data seed script
└── frontend/         Next.js 15 App Router
    ├── app/          Pages + layouts
    ├── components/   UI components
    └── lib/          API client + types + utilities
```

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL (local or Supabase)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, XAI_API_KEY, etc.

# Run migrations
alembic upgrade head

# (Optional) Seed sample data
python seed.py

# Start dev server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev   # → http://localhost:3000
```

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | asyncpg connection string (e.g. `postgresql+asyncpg://...`) |
| `SYNC_DATABASE_URL` | psycopg connection string for Alembic (e.g. `postgresql+psycopg://...`) |
| `XAI_API_KEY` | xAI Grok API key (get at [x.ai/api](https://x.ai/api)) |
| `ADMIN_PASSWORD` | Password for `/api/admin/refresh` |
| `FRONTEND_ORIGIN` | CORS origin (default: `http://localhost:3000`) |
| `SCHEDULER_TIMEZONE` | APScheduler timezone (default: `America/Boise`) |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL (default: `http://localhost:8000`) |

## Deployment (Railway)

See [DEPLOY.md](./DEPLOY.md) for full Railway + GoDaddy deployment guide.

## License
MIT
