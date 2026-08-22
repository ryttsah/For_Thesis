# Data, access, and what each field means

## Your `localhost:5173` vs classmates on your forwarded link

| Situation | Same database? |
|-----------|----------------|
| You use **http://localhost:5173** on your PC | Only **your** backend (`127.0.0.1:8000`) and **your** SQLite file (`backend/pca_local.db`). |
| A classmate uses **their own** laptop with the project | **No** — their own DB file. |
| A classmate opens **your** VS Code dev tunnel URL (your forwarded 5173) | **Yes** — they hit **your** machine, **your** API, **your** DB. Tests on that link change **your** data, not their localhost. |

Port **5173** is only the React UI. All farms, officers, submissions, and logins live in the **backend database**, not in the browser.

---

## Farm fields (e.g. Perez Farm)

When admin **approves** a registration:

| Field | Meaning | How it is set |
|-------|---------|----------------|
| **Name** | `{LastName} Farm` (e.g. Perez Farm) | From approved registration |
| **Sector** | Compass zone on the farm map (A–D) | Starts as **— (survey pending)** until the farmer submits a CNN report with a sector |
| **Trees** | Estimated coconut palms | **~45 trees per hectare** from registered area (minimum 10), not a fixed “30” |
| **Status** | **Health / survey state** for officers | `pending` → `healthy` / `caution` / `risk` after farmer “Send to PCA” (from AI result) |
| **Last survey** | Date of last AI/field activity | Updated when farmer submits to PCA |

**Status values**

- `pending` — approved farm, no validated survey yet  
- `healthy` — AI/farmer report mostly healthy (green)  
- `caution` — yellowing / moderate concern (orange)  
- `risk` — pest / high concern (red)  

This is **not** the registration form’s “Bearing / Non-bearing” field (that stays on the registration record only).

---

## Passwords: how farmers and officers log in

| Role | When account is created | Default password rule |
|------|-------------------------|------------------------|
| **Farmer** | Admin approves registration | `Pca` + last **6 digits of phone** (e.g. `Pca5550145!`), or `PcaFarmer{###}!` from ID |
| **Officer** | Admin → **Add Officer** | `PcaOfficer{last4ofID}!` unless admin sets a custom password in the modal |
| **Demo seeds** | `reset_db.py` | See `LOCAL_TESTING.md` (FARMER-001, PCA-2024-0012, etc.) |

After approval or add-officer, the UI shows a **green box** with ID and temporary password — copy that for the user. There is no email/SMS yet; PCA gives credentials in person.

---

## What “Send to PCA” does now (connected)

1. Saves **farmer submission**  
2. Creates **validation queue** item for officers  
3. Creates **survey** row (admin Surveys + officer queue)  
4. Updates **farm** sector/status/last survey  
5. If **uncertain** CNN → **priority visit** for the barangay officer  
6. Adds a **farmer notification**

---

## Condition trend chart

- **Admin dashboard:** province-wide (all barangays), last **6 months**, includes current month when data exists.  
- **Officer dashboard:** scoped to **assigned barangay** only (if unassigned, province-wide).  
- Built from **surveys** + **farmer submissions**, not static HTML percentages.

---

## Incident reports (officer)

**Purpose:** List **high-priority / pest-related** items from the live **validation queue** and **surveys** in the officer’s barangay (replaces static demo rows). Formal PDF export is still future work.

---

## Feedback (Yes/No on results)

UI only — **not** stored for model retraining yet. Thesis should describe this as planned work, not implemented feedback loop.

---

## Admin reports page

Download buttons remain placeholders until a PDF/Excel format is defined. Use **Surveys**, **Farms**, and **Print** from the browser on specific pages for demos.

---

## After pulling these changes

Restart backend and frontend. If the DB was created before new columns:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python scripts\reset_db.py
```

Or restart uvicorn once — SQLite columns are added automatically on startup.
