# Phase 6 — Deploy & production wiring

Phase 6 connects the React app to the live FastAPI API and publishes both services. **It is the last planned build phase** for the thesis stack (Phases 1–2 + deploy). After this, only optional polish remains (see [After Phase 6](#after-phase-6-optional)).

## Architecture (production)

```
[Vercel]  React + Vite          HTTPS  JWT
    └── VITE_API_URL ──────────────► [Render Free] FastAPI + TensorFlow Lite
                                           │
                                           └── [Supabase] PostgreSQL
```

CNN artifacts ship inside the Docker image from `Thesis AI Model/model_outputs/`.

The official training source is `Thesis AI Model/model.ipynb`. Run the notebook with
the CocoAnalytica TensorFlow kernel; its release cell exports the model, label config,
and evaluation report to that directory. The Dockerfile bundles those exact files.
`backend/app/api/predict.py` receives uploads and calls `backend/app/ml/predictor.py`,
which loads the exported model. After deployment compare `/predict/status`'s
`run_id` and `config_sha256` with the notebook evaluation report. Its
`model_sha256` is the deployed TensorFlow Lite export, while the evaluation
report records the source Keras model hash.
The notebook itself does not execute in the deployed container.

The Docker image additionally contains a full-precision TensorFlow Lite export derived
from the official Keras model. The original Keras file remains the official training
and local-reference artifact.

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

## 2. Render Free (recommended no-card backend)

This repository includes render.yaml for a no-card Render Free deployment. The
container uses the compact TensorFlow Lite runtime instead of full TensorFlow.
A local container test completed a real authenticated prediction at 181.4 MiB;
Render Free provides 512 MB RAM. Free services sleep after 15 idle minutes, so
the first request after sleep can take about a minute.

1. Create a free Render account and sign in with GitHub.
2. Select New, then Blueprint, and connect this repository. Render discovers
   render.yaml automatically.
3. Supply the requested environment values:

   | Variable | Value |
   |---|---|
   | DATABASE_URL | Existing Supabase Session pooler URL |
   | CORS_ORIGINS | Exact Vercel origin, such as https://your-app.vercel.app |

   Render generates JWT_SECRET itself. Keep database credentials out of Git.

4. After the service is Live, open its health endpoint and prediction-status
   endpoint. Prediction status must report runtime: tflite and the same run ID
   as the evaluation report.
5. In Vercel, set VITE_API_URL to the Render public URL with no trailing slash,
   then redeploy the frontend.

---

## 3. Google Cloud Run (optional future host)

Cloud Run remains configured in this repository and uses the same TensorFlow Lite
container. It requires an active Google Cloud billing account, so use it only after
you can complete Google billing setup.

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

`/predict/status` must return the same `run_id` and `config_sha256` as
`Thesis AI Model/model_outputs/evaluation.json`.

### Connect Vercel

Set Vercel's Production variable to the Cloud Run URL, without a trailing slash:

```text
VITE_API_URL=https://<cloud-run-url>
```

Redeploy the Vercel frontend after saving the variable.

---

## 4. Railway (legacy alternative)

Railway can use the same lightweight Docker image, but its Free plan includes only
$1 monthly usage credit. Render Free is the better no-card option for this deployment.

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
   | `ML_RUNTIME` | `tflite` |
   | `ML_MODEL_PATH` | `/app/model_outputs/coconut_leaf_multilabel_cnn.tflite` (Dockerfile default) |
   | `ML_LABEL_CONFIG_PATH` | `/app/model_outputs/label_config.json` (Dockerfile default) |

5. Deploy. The first `/predict` call loads the TensorFlow Lite model.
6. Copy the public URL (e.g. `https://pca-api-production.up.railway.app`).
7. Check: `GET https://<railway-url>/health` → `database: connected`, `ml_model: ready` or `loaded`.

**Notes**

- Do not use SQLite on Railway (ephemeral filesystem).

---

## 5. Vercel (frontend)

1. [vercel.com](https://vercel.com) → **Add New Project** → import the same GitHub repo.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite
4. **Environment variable** (Production):

   ```
   VITE_API_URL=https://<your-render-url>
   ```

   No trailing slash.

5. Deploy. `frontend/vercel.json` enables SPA routing for `/officer`, `/farmer`, `/admin`.
6. Add the Vercel URL to Render `CORS_ORIGINS` and redeploy the backend if needed.

---

## 6. Local full-stack (before deploy)

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

## 7. Verification checklist

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
| `503` on `/predict` | Model path or Lite runtime is wrong — check Render logs |
| Login works locally, not prod | Run `seed_db.py` on Supabase; match `JWT_SECRET` |
| 401 on API calls | Sign in again; token expires per `JWT_EXPIRE_MINUTES` |
