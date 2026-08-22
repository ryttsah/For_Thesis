"""Coconut leaf multi-label CNN inference (ported from Thesis AI Model/model.ipynb)."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any

import numpy as np

# Quieter TensorFlow startup on Windows
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "Thesis AI Model" / "model_outputs"

LABEL_TO_PEST: dict[str, str] = {
    "Healthy": "healthy",
    "Yellowing": "yellowing",
    "Coconut_Scale_Insect": "scale insect",
    "Rhinoceros_Beetle": "rhino beetle",
}

PEST_PRIORITY = [
    "Rhinoceros_Beetle",
    "Coconut_Scale_Insect",
    "Yellowing",
    "Healthy",
]


@dataclass(frozen=True)
class LabelConfig:
    class_names: list[str]
    thresholds: dict[str, float]
    uncertain_threshold: float
    image_size: tuple[int, int]


@dataclass(frozen=True)
class PredictionResult:
    pest: str
    label: str
    confidence: float
    uncertain: bool
    predictions: dict[str, float]
    thresholded_labels: list[str]
    top_guesses: list[str]
    message: str | None = None


_model: Any = None
_config: LabelConfig | None = None
_load_error: str | None = None


def _resolve_path(path: str | None, default: Path) -> Path:
    if not path:
        return default
    candidate = Path(path)
    return candidate if candidate.is_absolute() else (PROJECT_ROOT / candidate).resolve()


def load_label_config(config_path: Path) -> LabelConfig:
    raw = json.loads(config_path.read_text(encoding="utf-8"))
    size = raw.get("image_size", [224, 224])
    return LabelConfig(
        class_names=list(raw["class_names"]),
        thresholds={str(k): float(v) for k, v in raw["thresholds"].items()},
        uncertain_threshold=float(raw.get("uncertain_threshold", 0.4)),
        image_size=(int(size[0]), int(size[1])),
    )


def _ensure_loaded(model_path: Path, config_path: Path) -> None:
    global _model, _config, _load_error

    if _model is not None and _config is not None:
        return

    if _load_error:
        raise RuntimeError(_load_error)

    try:
        import tensorflow as tf

        tf.get_logger().setLevel("ERROR")

        if not model_path.is_file():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not config_path.is_file():
            raise FileNotFoundError(f"Label config not found: {config_path}")

        _config = load_label_config(config_path)
        _model = tf.keras.models.load_model(model_path, compile=False)
    except Exception as exc:  # noqa: BLE001
        _load_error = str(exc)
        raise RuntimeError(_load_error) from exc


def is_model_available(model_path: Path, config_path: Path) -> bool:
    try:
        _ensure_loaded(model_path, config_path)
        return True
    except RuntimeError:
        return False


def get_model_status(model_path: Path, config_path: Path) -> dict[str, Any]:
    if _model is not None:
        return {"status": "loaded", "model_path": str(model_path)}
    if _load_error:
        return {"status": "error", "detail": _load_error, "model_path": str(model_path)}
    if model_path.is_file() and config_path.is_file():
        return {"status": "ready", "model_path": str(model_path)}
    return {
        "status": "missing",
        "model_path": str(model_path),
        "config_path": str(config_path),
    }


def _preprocess_image(image_bytes: bytes, image_size: tuple[int, int]) -> Any:
    import tensorflow as tf

    image = tf.io.decode_image(image_bytes, channels=3, expand_animations=False)
    image.set_shape([None, None, 3])
    image = tf.image.resize(image, image_size)
    batch = tf.expand_dims(tf.cast(image, tf.float32), axis=0)
    return batch


def _select_primary_label(selected_labels: list[str], scores: np.ndarray, class_names: list[str]) -> str:
    if not selected_labels:
        top_index = int(np.argmax(scores))
        return class_names[top_index]

    for name in PEST_PRIORITY:
        if name in selected_labels:
            return name
    return selected_labels[0]


def predict_image_bytes(
    image_bytes: bytes,
    *,
    model_path: Path,
    config_path: Path,
) -> PredictionResult:
    _ensure_loaded(model_path, config_path)
    assert _model is not None and _config is not None

    batch = _preprocess_image(image_bytes, _config.image_size)
    scores = _model.predict(batch, verbose=0)[0]
    scores = np.asarray(scores, dtype=np.float32)

    predictions = {
        class_name: float(score)
        for class_name, score in zip(_config.class_names, scores)
    }

    threshold_values = [_config.thresholds[name] for name in _config.class_names]
    selected_labels = [
        class_name
        for class_name, score, threshold in zip(_config.class_names, scores, threshold_values)
        if score >= threshold
    ]

    if "Healthy" in selected_labels and any(label != "Healthy" for label in selected_labels):
        selected_labels.remove("Healthy")

    confidence = float(np.max(scores))
    uncertain = confidence < _config.uncertain_threshold or len(selected_labels) == 0

    top_indices = np.argsort(scores)[-3:][::-1]
    top_guesses = [_config.class_names[index] for index in top_indices]

    primary_label = _select_primary_label(
        [] if uncertain else selected_labels,
        scores,
        _config.class_names,
    )
    pest = LABEL_TO_PEST.get(primary_label, "healthy")

    message = None
    if uncertain:
        message = "Low confidence across all categories. Flagged for expert review."

    return PredictionResult(
        pest=pest,
        label=primary_label.replace("_", " "),
        confidence=round(confidence * 100, 1),
        uncertain=uncertain,
        predictions={k: round(v * 100, 2) for k, v in predictions.items()},
        thresholded_labels=[] if uncertain else selected_labels,
        top_guesses=top_guesses,
        message=message,
    )


def predict_upload_file(
    file_bytes: bytes,
    *,
    model_path: Path,
    config_path: Path,
    max_bytes: int = 10 * 1024 * 1024,
) -> PredictionResult:
    if len(file_bytes) > max_bytes:
        raise ValueError("Image file is too large (max 10 MB).")
    if len(file_bytes) < 32:
        raise ValueError("Image file is empty or invalid.")

    # Validate decode early for clearer API errors
    try:
        from PIL import Image

        with Image.open(BytesIO(file_bytes)) as img:
            img.verify()
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Could not read image. Upload a JPG or PNG photo.") from exc

    return predict_image_bytes(file_bytes, model_path=model_path, config_path=config_path)
