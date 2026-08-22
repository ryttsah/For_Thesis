# Phase 6 — Deploy & production wiring

Phase 6 connects the React app to the live FastAPI API and publishes both services. **It is the last planned build phase** for the thesis stack (Phases 1–2 + deploy). After this, only optional polish remains (see [After Phase 6](#after-phase-6-optional)).

## Architecture (production)

```
[Vercel]  React + Vite          HTTPS  JWT
    └── VITE_API_URL ──────────────► [Railway] FastAPI + TensorFlow
                                           │
                                           └── [Supabase] PostgreSQL
```

CNN weights ship inside the Railway Docker image (`Thesis AI Model/model_outputs/`).

---

## 1. Supabase (database)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run in order:
   - `backend/db/001_users.sql`
   - `backend/db/002_farmer_registrations.sql`
   - `backend/db/003_domain.sql`
3. Copy the **Session pooler** connection string (port `6543` recommended).
4. Seed demo users (from your machine, with `DATABASE_URL` set):

   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   $env:DATABASE_URL="postgresql://..."
   python scripts/seed_db.py
   ```

---

## 2. Railway (backend + CNN)

1. Push this repo to GitHub.
2. [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub** → select the repo.
3. Ensure the service uses the **repo root** (where `Dockerfile` and `railway.toml` live).
4. **Variables** (Settings → Variables):

   | Variable | Example |
   |----------|---------|
   | `DATABASE_URL` | Supabase pooler URL |
   | `AUTO_CREATE_DB` | `false` |
   | `JWT_SECRET` | Long random string (`openssl rand -hex 32`) |
   | `DEBUG` | `false` |
   | `CORS_ORIGINS` | `https://your-app.vercel.app,http://localhost:5173` |
   | `ML_MODEL_PATH` | `Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras` |
   | `ML_LABEL_CONFIG_PATH` | `Thesis AI Model/model_outputs/label_config.json` |

5. Deploy. First `/predict` call may take ~30s while TensorFlow loads the model.
6. Copy the public URL (e.g. `https://pca-api-production.up.railway.app`).
7. Check: `GET https://<railway-url>/health` → `database: connected`, `ml_model: ready` or `loaded`.

**Notes**

- Use at least **2 GB RAM** on Railway for TensorFlow.
- Do not use SQLite on Railway (ephemeral filesystem).

---

## 3. Vercel (frontend)

1. [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Environment variable** (Production):

   ```
   VITE_API_URL=https://<your-railway-url>
   ```

   No trailing slash.

5. Deploy. `frontend/vercel.json` enables SPA routing for `/officer`, `/farmer`, `/admin`.
6. Add the Vercel URL to Railway `CORS_ORIGINS` and redeploy the backend if needed.

---

## 4. Local full-stack (before deploy)

**Terminal 1 — API**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

**Terminal 2 — UI**

```powershell
cd frontend
# frontend/.env → VITE_API_URL=http://localhost:8000
npm run dev
```

Sign in as Farmer with live backend credentials (not offline demo when `VITE_API_URL` is set). Upload → Analyze should call `POST /predict`.

---

## 5. Verification checklist

| Check | Expected |
|-------|----------|
| `/health` | `status: healthy`, `database: connected` |
| Login (farmer) | JWT stored; no “demo offline” on analyze step |
| `/predict` | Real CNN scores (not random) |
| Admin approvals | Loads from API when token present |
| Officer queue validate | Persists via API |
| Refresh on `/farmer` | Stays logged in ( `/auth/me` ) |

---

## After Phase 6 (optional)

Not required for thesis defense, but useful later:

- Replace remaining **demo alerts** (export, map photo upload, chart filters)
- Store prediction images in Supabase Storage
- Email/SMS notifications
- CI (GitHub Actions) for lint + build
- Custom domain + HTTPS hardening
- Model versioning / A-B testing

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Random pest on farmer upload | `VITE_API_URL` unset or login without JWT |
| CORS error in browser | Add exact Vercel origin to `CORS_ORIGINS` |
| `503` on `/predict` | Model path wrong or TensorFlow OOM — check Railway logs |
| Login works locally, not prod | Run `seed_db.py` on Supabase; match `JWT_SECRET` |
| 401 on API calls | Sign in again; token expires per `JWT_EXPIRE_MINUTES` |
