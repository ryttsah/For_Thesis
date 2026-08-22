# Monorepo image: FastAPI + CNN weights (EfficientNet, ~37 MB)
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend/app /app/backend/app
COPY backend/scripts /app/backend/scripts
COPY backend/db /app/backend/db
COPY "Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras" \
    "/app/Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras"
COPY "Thesis AI Model/model_outputs/label_config.json" \
    "/app/Thesis AI Model/model_outputs/label_config.json"

WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1 \
    TF_CPP_MIN_LOG_LEVEL=2 \
    ML_MODEL_PATH="Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras" \
    ML_LABEL_CONFIG_PATH="Thesis AI Model/model_outputs/label_config.json"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
