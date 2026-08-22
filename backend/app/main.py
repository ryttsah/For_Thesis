from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.analytics import router as analytics_router
from app.api.auth import router as auth_router
from app.api.domain import router as domain_router
from app.api.predict import router as predict_router
from app.api.registrations import router as registrations_router
from app.core.config import get_settings
from app.db.seed import init_local_database
from app.db.session import check_database_connection
from app.ml.predictor import get_model_status

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if (
        settings.database_url
        and settings.auto_create_db
        and settings.database_url.startswith("sqlite")
    ):
        init_local_database(seed_demo_data=settings.seed_demo_data)
    yield


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
    description="PCA Negros Occidental thesis API — Phase 2.",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(registrations_router)
app.include_router(domain_router)
app.include_router(analytics_router)
app.include_router(predict_router)

# Explicit origins (localhost + production) plus regex for VS Code dev tunnels / Vercel previews.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https?://.*\.devtunnels\.ms|https?://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health")
def health() -> dict[str, str]:
    payload: dict[str, str] = {}

    if not settings.database_url:
        payload.update(database="not_configured", auth_source="seed_fallback")
    elif check_database_connection():
        payload.update(database="connected", auth_source="database")
    else:
        payload.update(database="unreachable", auth_source="seed_fallback")

    ml_status = get_model_status(
        settings.resolved_ml_model_path(),
        settings.resolved_ml_label_config_path(),
    )
    payload["ml_model"] = str(ml_status.get("status", "unknown"))

    overall = "healthy" if payload.get("database") != "unreachable" else "degraded"
    return {"status": overall, **payload}
