# Thesis Chapter 3 Answer Reference

Use this as the corrected source for the black-background answer screenshots.

## Section 1: Project Design

### Final System Architecture

The final system architecture is:

Farmer / PCA Officer / Admin -> React + Vite frontend -> FastAPI backend API -> CNN prediction service and database.

| Component | Role |
|-----------|------|
| Frontend | React + Vite + Tailwind CSS user interface for login, farmer upload/results, officer validation/visits/farms, and admin approvals/officers/analytics |
| Backend API | FastAPI service for JWT authentication, role-based access control, farmer registration, domain APIs, analytics, and CNN inference through `/predict` |
| CNN model | EfficientNetB0 transfer-learning model, 224x224 RGB input, four sigmoid outputs, per-class thresholds, and primary-condition aggregation for UI display |
| Database | PostgreSQL through Supabase for production; local SQLite is used for development/testing |
| Model artifact | `.keras` model file loaded by the FastAPI service, not stored inside the database |

Planned hosting: Vercel for the frontend and Railway for the FastAPI backend/CNN service. Supabase is the production database target.

## Section 2: Project Development

### Dataset

| Class | Train | Valid | Test | Total |
|-------|------:|------:|-----:|------:|
| Healthy | 102 | 23 | 5 | 130 |
| Yellowing | 861 | 190 | 38 | 1,089 |
| Coconut Scale Insect | 153 | 25 | 6 | 184 |
| Rhinoceros Beetle | 71 | 16 | 3 | 90 |
| All classes | 1,187 | 254 | 52 | 1,493 |

Train/validation/test split ratio: about 79.5% / 17.0% / 3.5%.

Labeling method: folder-based/manual primary-condition organization. Images are stored under class folders with `train`, `valid`, and `test` subfolders. Each folder represents the main visible condition of the image. Do not claim a specific labeling platform unless you actually used one.

Image input size: 224 x 224 RGB.

### CNN Model

| Item | Final value |
|------|-------------|
| Backbone | EfficientNetB0 with ImageNet weights |
| Output design | Multi-label style: four sigmoid outputs for Healthy, Yellowing, Coconut Scale Insect, and Rhinoceros Beetle |
| UI result design | Primary-condition aggregation: one main display condition is selected per image, then multiple uploaded images are counted per category |
| Loss | Weighted binary cross-entropy |
| Head training setting | 15 configured epochs, learning rate 0.001, batch size 16 |
| Fine-tuning setting | 10 configured epochs, learning rate 0.00001, batch size 16 |
| Actual completed log | Head stopped after 12 epochs; fine-tuning stopped after 6 epochs due to early stopping |
| Final weights | `Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras` |
| Threshold config | `Thesis AI Model/model_outputs/label_config.json` |

Important wording: the CNN is **multi-label**, not a single-label softmax classifier. It uses sigmoid outputs and thresholds to produce four condition scores per image. For the farmer-facing result, the system selects the primary condition for each uploaded image, then summarizes the whole survey by counting how many images fall under each category.

### Web Application

| Item | Final choice |
|------|--------------|
| Frontend framework | React.js with Vite and Tailwind CSS |
| Backend framework | FastAPI, Python |
| Database | Supabase/PostgreSQL target; SQLite for local development |
| Hosting target | Vercel frontend + Railway backend/CNN |

Final implemented features:

- Role login for farmer, PCA officer, and admin using JWT and RBAC.
- Farmer registration, with admin approval/rejection.
- Farmer multi-photo upload, 1 to 10 images per analysis session.
- CNN analysis through `/predict`, run once per uploaded image.
- Primary-condition aggregation in the UI: each image receives a main displayed condition, then the survey summary shows majority condition, confidence, per-photo results, and photo counts for all four categories.
- Farmer "Send to PCA" saves submission data, creates a validation queue item, creates a survey row, updates farm sector/status/last survey, and adds a farmer notification.
- Officer/admin views for farms, surveys, validation queue, scheduled visits, priority visits, officers, and analytics.
- Admin officer management: add, edit, remove, assign/reassign barangay.
- Live condition trend analytics from backend survey/submission data.

Simplified or partial features:

- Feedback loop: simplified. The Yes/No result feedback exists in the UI, but it is not stored for model retraining.
- Uncertainty detection: implemented. Low confidence or no class passing its threshold marks the result as uncertain/review.
- Report export: download buttons remain placeholders until a PDF/Excel format is defined.

## Section 3: Operation and Testing Procedure

| Topic | Procedure in the app |
|-------|----------------------|
| Images per survey session | Minimum 1 image, maximum 10 images. Each image is sent to `/predict`; the UI selects a primary condition for each image, then summarizes photo counts per condition and average confidence for the majority class. |
| Sector selection | Manual every session. The farmer chooses Sector A, B, C, or D before uploading images. |
| Sector labels | A = North, B = South, C = East, D = West. |
| Officer barangay scope | Admin assigns or reassigns an officer to a barangay. Officer lists are scoped to the assigned barangay. |

## Diagram Accuracy Notes

- The architecture diagram is correct if the model file is shown as a backend/model artifact, not as a database table.
- The use case diagram is acceptable. Keep only features actually implemented or clearly mark planned exports/retraining as future work.
- The dataset flowchart uses primary-condition folder organization and the actual split: 1,187 / 254 / 52, about 79.5% / 17.0% / 3.5%.
- The CNN flowchart has been corrected to EfficientNetB0 with four sigmoid outputs.
- The web application wording has been corrected to primary-condition aggregation, not pure multi-class UI.
- The farmer usage flowchart should show registration before login for new farmers.
- The feedback step should be described as UI feedback/review note, not a complete ML retraining loop.
