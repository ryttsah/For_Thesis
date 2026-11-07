# Monorepo image: FastAPI + verified TensorFlow Lite CNN artifact.
FROM python:3.11-slim-bookworm

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements-base.txt /app/backend/requirements-base.txt
COPY backend/requirements.hosted.txt /app/backend/requirements.hosted.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.hosted.txt

COPY backend/app /app/backend/app
COPY backend/scripts /app/backend/scripts
COPY backend/db /app/backend/db
COPY ["Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.tflite", "/app/model_outputs/coconut_leaf_multilabel_cnn.tflite"]
COPY ["Thesis AI Model/model_outputs/label_config.json", "/app/model_outputs/label_config.json"]
COPY ["Thesis AI Model/model_outputs/evaluation.json", "/app/model_outputs/evaluation.json"]

WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1 \
    ML_RUNTIME="tflite" \
    ML_MODEL_PATH="/app/model_outputs/coconut_leaf_multilabel_cnn.tflite" \
    ML_LABEL_CONFIG_PATH="/app/model_outputs/label_config.json"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1

CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
