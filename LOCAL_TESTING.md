# Local testing & sharing (VS Code Ports, Wi‑Fi, classmates)

## Why login showed “Cannot reach the server”

The UI calls `POST {API}/auth/login`. That fails when:

1. **Backend is not running** — start uvicorn first.
2. **Only port 5173 is forwarded** — the browser still needs **port 8000** for the API.
3. **`VITE_API_URL=http://localhost:8000`** while someone opens your app via a **forwarded URL** — on their machine `localhost` is *their* PC, not yours.

**Fix:** use `VITE_API_URL=auto` in `frontend/.env` (already set). The app uses `same hostname as the page + port 8000`.

---

## Same computer (simplest)

**Terminal 1 — API (listen on all interfaces):**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — UI:**

```powershell
cd frontend
npm run dev
```

Open http://localhost:5173 and sign in.

Check API: http://localhost:8000/health → `"status":"healthy"`.

---

## VS Code / Cursor dev tunnels (recommended: **proxy** mode)

Dev tunnels use **two different URLs** for 5173 and 8000. Browsers block cross-origin calls (CORS), and tunnels often strip CORS headers — so `auto` and `pca_api_base_override` are unreliable.

**Use `VITE_API_URL=proxy` in `frontend/.env`** (default). The Vite dev server forwards `/auth`, `/predict`, etc. to `http://127.0.0.1:8000` on the same machine. The browser only talks to the **5173** tunnel — **no CORS**.

1. **Terminal A** — backend (must run on the same PC / Codespace as Vite):
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```
2. **Terminal B** — frontend:
   ```powershell
   cd frontend
   npm run dev
   ```
3. Ports tab → forward **5173**. Set visibility to **Public** (not Private).
   - **Private** → classmates get **HTTP 403 Access denied** (must be signed in as you on Microsoft/GitHub).
   - **Public** → anyone with the link can open the app (fine for classroom demos).
   - Right‑click port **5173** → **Port Visibility** → **Public**, or use the globe icon.
4. Share the **5173** URL (e.g. `https://….devtunnels.ms`).
5. Remove any old override on that site:
   ```javascript
   localStorage.removeItem('pca_api_base_override')
   location.reload()
   ```

**Other ways to share (no Vercel):**

| Method | How |
|--------|-----|
| Same Wi‑Fi | `npm run dev` shows `Network: http://192.168.x.x:5173` — phone uses that IP; keep `VITE_API_URL=proxy` |
| ngrok / Cloudflare Tunnel | Tunnel port **5173** only; backend local on 8000 |
| Full deploy | Vercel + Railway — for final demo, not required for daily testing |

### Classmate sees “Access denied” / HTTP 403 on the tunnel URL

The tunnel is **Private**. Change it to **Public** (step 3 above), copy the new link, and send that. Your classmate does **not** need port 8000 forwarded.

---

Test the API directly: open `https://YOUR-8000-URL/health` — you should see JSON with `"status":"healthy"`.

---

## Phone or laptop on same Wi‑Fi

1. On your PC, run `ipconfig` and note **IPv4** (e.g. `192.168.1.42`).
2. Backend: `uvicorn ... --host 0.0.0.0 --port 8000`
3. Frontend: `npm run dev` (Vite prints `Network: http://192.168.1.42:5173`).
4. On the phone, open `http://192.168.1.42:5173` (not localhost).
5. Keep `VITE_API_URL=auto` so API = `http://192.168.1.42:8000`.

Allow Windows Firewall for Python and Node on private networks if prompted.

---

## Clean system (no mock farms / queue / registrations)

**One-time reset** (SQLite):

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts/reset_db.py
```

This leaves only **3 login accounts**:

| Role | ID | Password |
|------|-----|----------|
| Officer | `PCA-2024-0012` | `officer123` |
| Farmer | `FARMER-001` | `magsasaka123` |
| Admin | `PCA-ADMIN-001` | `admin2024` |

Lists start **empty** until users register, submit photos, schedule visits, etc.

Optional HTML-mockup filler (presentations only):

```powershell
python scripts/seed_demo_data.py
```

Set `SEED_DEMO_DATA=true` in `backend/.env` only if you want mock rows auto-loaded on every API start (not recommended for a clean thesis demo).

---

## Do farmer, officer, and admin align?

| Flow | Status |
|------|--------|
| Login → JWT → role portals | Aligned (same backend auth) |
| Farmer registration → Admin approvals | Aligned (API `/registrations`) |
| Farmer photo CNN → “Send to PCA” submissions | Aligned (saved per farmer in DB) |
| Officer queue validate, schedule visits | Aligned (API when lists exist in DB) |
| Admin officers / farms / surveys | Aligned (bootstrap from DB) |
| Officer **analytics charts** (province trends) | Still **static demo numbers** in UI — not from DB yet |
| Farmer **sector summary** block on results | Static demo copy — not tied to officer sectors |
| Officer map “Add photos” | Demo alert only — not wired |

So **core workflows share one database** after reset; a few dashboard charts are still presentation placeholders.

---

## Quick checklist before a demo

- [ ] `python scripts/reset_db.py` if you want empty data  
- [ ] Backend running on `0.0.0.0:8000`  
- [ ] Frontend running; `frontend/.env` has `VITE_API_URL=auto` for sharing  
- [ ] Both ports forwarded if using Ports tab  
- [ ] `/health` loads in browser  
