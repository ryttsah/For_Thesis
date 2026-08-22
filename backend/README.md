# PCA Backend (FastAPI)



Phase 2 — built step by step.



| Step | Status |

|------|--------|

| 1. Scaffold + CORS | Done |

| 2. JWT auth | Done |

| 3. Database (PostgreSQL / Supabase + SQLite local) | Done |

| 4. Domain APIs | Done |

| 5. `/predict` (CNN) | Done |



## Setup



```powershell

cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

copy .env.example .env

```



Default `.env` uses **SQLite** (`sqlite:///./pca_local.db`). Tables and demo users are created automatically on startup.



### Supabase (production)



1. Create a Supabase project and copy the **connection string** (Session mode or direct).

2. In Supabase SQL Editor, run `db/001_users.sql`.

3. Set in `.env`:



   ```

   DATABASE_URL=postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres

   AUTO_CREATE_DB=false

   ```



4. Seed demo users:



   ```powershell

   python scripts/seed_db.py

   ```



## Run



```powershell

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

```



- API: http://127.0.0.1:8000

- Health: http://127.0.0.1:8000/health — reports `database: connected` or `not_configured`



## Auth



| Method | Path | Description |

|--------|------|-------------|

| POST | `/auth/login` | `{ id, password, role }` → JWT (DB first, seed fallback) |

| GET | `/auth/me` | `Authorization: Bearer <token>` |



Demo passwords: `officer123`, `magsasaka123`, `admin2024`.

### Registrations (admin JWT required except submit)

| Method | Path | Auth |
|--------|------|------|
| POST | `/registrations` | Public — farmer signup |
| GET | `/registrations/pending` | Admin |
| GET | `/registrations/approved` | Admin |
| GET | `/registrations/rejected` | Admin |
| POST | `/registrations/{id}/approve` | Admin |
| POST | `/registrations/{id}/reject` | Admin |

Run `db/002_farmer_registrations.sql` and `db/003_domain.sql` on Supabase after `001_users.sql`.

### Domain bootstrap & mutations

| Method | Path | Role |
|--------|------|------|
| GET | `/bootstrap/officer` | Officer / Admin |
| GET | `/bootstrap/admin` | Admin |
| GET | `/bootstrap/farmer` | Farmer |
| PATCH | `/queue/{id}/validate` | Officer / Admin |
| POST | `/visits/scheduled` | Officer / Admin |
| PATCH | `/visits/priority/{id}/complete` | Officer / Admin |
| PATCH | `/officers/{emp_id}` | Admin |
| DELETE | `/officers/{emp_id}` | Admin |
| POST | `/farmers/me/submissions` | Farmer |

### CNN pest detection (`Thesis AI Model/`)

| Method | Path | Auth |
|--------|------|------|
| GET | `/predict/status` | Public |
| POST | `/predict` | Farmer / Officer / Admin (multipart `file`) |

Default model: `Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras`

Requires `tensorflow-cpu` (see `requirements.txt`). First request loads the model (~30s).



## Scripts



| Script | Purpose |

|--------|---------|

| `scripts/seed_db.py` | Create tables + insert demo users |

| `scripts/hash_password.py` | Generate bcrypt hash for a new password |



## Frontend

Set `VITE_API_URL=http://127.0.0.1:8000` in `frontend/.env`.

## Production (Phase 6)

Deploy with the repo-root `Dockerfile` on Railway and `frontend/` on Vercel. Full steps: **[../DEPLOY.md](../DEPLOY.md)**.

