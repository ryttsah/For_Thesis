from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_ML_DIR = PROJECT_ROOT / "Thesis AI Model" / "model_outputs"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PCA Negros Occidental API"
    debug: bool = True
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    jwt_secret: str = "change-me-in-production-use-openssl-rand-hex-32"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    # PostgreSQL (Supabase) or sqlite:///./pca_local.db for local dev
    database_url: str | None = None
    db_echo: bool = False
    auto_create_db: bool = True
    # When false, local SQLite init only creates tables + login users (no mock farms/queue).
    seed_demo_data: bool = False

    # Thesis AI Model (EfficientNetB0 multi-label CNN)
    ml_model_path: str | None = None
    ml_label_config_path: str | None = None
    ml_max_upload_bytes: int = 10 * 1024 * 1024
    ml_predict_timeout_seconds: int = 90

    def resolved_ml_model_path(self) -> Path:
        if self.ml_model_path:
            path = Path(self.ml_model_path)
            return path if path.is_absolute() else (PROJECT_ROOT / path).resolve()
        return (DEFAULT_ML_DIR / "coconut_leaf_multilabel_cnn.keras").resolve()

    def resolved_ml_label_config_path(self) -> Path:
        if self.ml_label_config_path:
            path = Path(self.ml_label_config_path)
            return path if path.is_absolute() else (PROJECT_ROOT / path).resolve()
        return (DEFAULT_ML_DIR / "label_config.json").resolve()

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
