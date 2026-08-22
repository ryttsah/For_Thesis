# PCA Negros Occidental — Thesis System



Coconut pest and disease monitoring for PCA Negros Occidental. Flow: **Login → Officer / Farmer / Admin → Logout**.



## Stack



| Layer | Technology |

|-------|------------|

| Frontend | React + Vite + Tailwind CSS |

| Backend | FastAPI — JWT auth, domain APIs, `/predict` (CNN) |

| Auth | JWT + bcrypt + RBAC |

| Database | PostgreSQL (Supabase) |

| Deploy | Vercel (frontend) + Railway (backend) |



## Quick start (local)



From the **Thesis Website** folder:



```bash

npm run install:frontend

```



**Backend** (terminal 1):



```powershell

cd backend

python -m venv .venv

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

copy .env.example .env

uvicorn app.main:app --reload --port 8000

```



**Frontend** (terminal 2):



```powershell

copy frontend\.env.example frontend\.env

npm run dev

```



Open [http://localhost:5173](http://localhost:5173). Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` for live API + CNN.



### Demo credentials



| Role | ID | Password |

|------|-----|----------|

| Officer | `PCA-2024-0012` | `officer123` |

| Farmer | `FARMER-001` | `magsasaka123` |

| Admin | `PCA-ADMIN-001` | `admin2024` |



## Project phases



| Phase | Scope | Status |

|-------|--------|--------|

| **1** | React UI from `pca_neg_bk-copy.html` mockup | Done |

| **2** | FastAPI, auth, DB, domain APIs, CNN `/predict` | Done |

| **6** | Wire frontend to API + Vercel/Railway deploy | **Ready** — see [DEPLOY.md](./DEPLOY.md) |



Phase 6 is the **last planned implementation phase**. Optional improvements (storage, notifications, CI) are listed in DEPLOY.md.



## Phase 2 backend summary



| Step | Status |

|------|--------|

| 1. FastAPI scaffold + CORS | Done |

| 2. JWT auth (`/auth/login`, `/auth/me`) | Done |

| 3. Database (Supabase / SQLite) | Done |

| 4. Domain APIs | Done |

| 5. `/predict` (CNN) | Done |

| 6. Deploy + production wiring | Config in repo — you deploy to Vercel + Railway |



## Project layout



```

frontend/src/          # React app

backend/app/           # FastAPI

Thesis AI Model/       # Notebook + model_outputs (CNN)

Dockerfile             # Railway image (API + weights)

DEPLOY.md              # Step-by-step production guide

```



## Routes after login



| Role | Home |

|------|------|

| Officer | `/officer` |

| Farmer | `/farmer` |

| Admin | `/admin` |



## Production deploy



Follow **[DEPLOY.md](./DEPLOY.md)** for Supabase → Railway → Vercel.


