# Phase 6 — Deploy & production wiring

Phase 6 connects the React app to the live FastAPI API and publishes both services. **It is the last planned build phase** for the thesis stack (Phases 1–2 + deploy). After this, only optional polish remains (see [After Phase 6](#after-phase-6-optional)).

## Architecture (production)

```
[Vercel]  React + Vite          HTTPS  JWT
    └── VITE_API_URL ──────────────► [Cloud Run] FastAPI + TensorFlow
                                           │
                                           └── [Supabase] PostgreSQL
```

CNN weights ship inside the Cloud Run Docker image (`Thesis AI Model/model_outputs/`).

The official training source is `Thesis AI Model/model.ipynb`. Run the notebook with
the CocoAnalytica TensorFlow kernel; its release cell exports the model, label config,
and evaluation report to that directory. The Dockerfile bundles those exact files.
`backend/app/api/predict.py` receives uploads and calls `backend/app/ml/predictor.py`,
which loads the exported model. After deployment compare `/predict/status`'s
`model_sha256` and `config_sha256` with the notebook evaluation report.
The notebook itself does not execute in the deployed container.

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

## 2. Google Cloud Run (recommended backend + CNN)

Cloud Run is the recommended host for this TensorFlow model. The current model uses
about 404 MB during a local post-inference measurement, so Railway Free and Render
Free (each capped at 512 MB) do not leave enough reliable memory headroom for the API.

### One-time Google Cloud setup

1. Create or select a Google Cloud project and enable billing. Cloud Run has a
   monthly free allowance, but Google requires a billing account to deploy.
2. Enable **Cloud Run**, **Cloud Build**, **Artifact Registry**, and **Secret Manager** APIs.
3. In **Secret Manager**, create these secrets. Do not place their values in Git or a
   frontend environment file:

   | Secret name | Value |
   |---|---|
   | `cocoanalytics-database-url` | Supabase session-pooler `DATABASE_URL` |
   | `cocoanalytics-jwt-secret` | Production `JWT_SECRET` |

4. Ensure the Cloud Run service identity can access both secrets with the
   **Secret Manager Secret Accessor** role.
5. Install Google Cloud CLI, then sign in with `gcloud auth login`.

### Deploy from this repository

Run from PowerShell at the repository root. The script builds from the existing
`Dockerfile`, deploys with 1 GiB RAM, one CPU, single-request concurrency, and
scale-to-zero. It does not upload raw model-training datasets because `.gcloudignore`
and `.dockerignore` exclude them.

```powershell
.\scripts\deploy-cloud-run.ps1 `
  -ProjectId "your-gcp-project-id" `
  -CorsOrigins "https://your-app.vercel.app,http://localhost:5173"
```

The script prints the HTTPS API URL. Verify it before changing the frontend:

```text
GET https://<cloud-run-url>/health
GET https://<cloud-run-url>/predict/status
```

`/predict/status` must return the same `model_sha256` and `config_sha256` as
`Thesis AI Model/model_outputs/evaluation.json`.

### Connect Vercel

Set Vercel's Production variable to the Cloud Run URL, without a trailing slash:

```text
VITE_API_URL=https://<cloud-run-url>
```

Redeploy the Vercel frontend after saving the variable.

---

## 3. Railway (legacy alternative; not recommended on Free)

Railway's Free tier has 512 MB RAM and $1 of monthly credit. This is too close to
the current TensorFlow runtime requirement for dependable use. Use Cloud Run above
or a paid Railway service with at least 1 GiB RAM instead.

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
   | `ML_MODEL_PATH` | `/app/model_outputs/coconut_leaf_multilabel_cnn.keras` (Dockerfile default) |
   | `ML_LABEL_CONFIG_PATH` | `/app/model_outputs/label_config.json` (Dockerfile default) |

5. Deploy. First `/predict` call may take ~30s while TensorFlow loads the model.
6. Copy the public URL (e.g. `https://pca-api-production.up.railway.app`).
7. Check: `GET https://<railway-url>/health` → `database: connected`, `ml_model: ready` or `loaded`.

**Notes**

- Use at least **2 GB RAM** on Railway for TensorFlow.
- Do not use SQLite on Railway (ephemeral filesystem).

---

## 4. Vercel (frontend)

1. [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Environment variable** (Production):

   ```
   VITE_API_URL=https://<your-cloud-run-url>
   ```

   No trailing slash.

5. Deploy. `frontend/vercel.json` enables SPA routing for `/officer`, `/farmer`, `/admin`.
6. Add the Vercel URL to Cloud Run `CORS_ORIGINS` and redeploy the backend if needed.

---

## 5. Local full-stack (before deploy)

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

## 6. Verification checklist

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
| `503` on `/predict` | Model path wrong or TensorFlow OOM — check Cloud Run revision logs |
| Login works locally, not prod | Run `seed_db.py` on Supabase; match `JWT_SECRET` |
| 401 on API calls | Sign in again; token expires per `JWT_EXPIRE_MINUTES` |
