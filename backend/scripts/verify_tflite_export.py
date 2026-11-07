"""Check that the TensorFlow Lite artifact matches the official Keras model."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import tensorflow as tf
from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_KERAS = PROJECT_ROOT / "Thesis AI Model" / "model_outputs" / "coconut_leaf_multilabel_cnn.keras"
DEFAULT_TFLITE = PROJECT_ROOT / "Thesis AI Model" / "model_outputs" / "coconut_leaf_multilabel_cnn.tflite"
# Match the held-out test split identified by the official evaluation report.
DEFAULT_IMAGES = PROJECT_ROOT / "Thesis AI Model" / "notebook_dataset" / "4e327ceeeb11" / "test"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def load_image(path: Path) -> np.ndarray:
    with Image.open(path) as image:
        resized = image.convert("RGB").resize((224, 224), Image.Resampling.BILINEAR)
        return np.expand_dims(np.asarray(resized, dtype=np.float32), axis=0)


def predict_lite(interpreter, input_detail, output_detail, batch: np.ndarray) -> np.ndarray:
    interpreter.set_tensor(input_detail["index"], batch.astype(input_detail["dtype"]))
    interpreter.invoke()
    return np.asarray(interpreter.get_tensor(output_detail["index"])[0])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--keras", type=Path, default=DEFAULT_KERAS)
    parser.add_argument("--tflite", type=Path, default=DEFAULT_TFLITE)
    parser.add_argument("--images", type=Path, default=DEFAULT_IMAGES)
    args = parser.parse_args()

    image_paths = sorted(
        path for path in args.images.rglob("*") if path.suffix.lower() in IMAGE_EXTENSIONS
    )
    if not image_paths:
        raise FileNotFoundError(f"No images found under {args.images}")

    keras_model = tf.keras.models.load_model(args.keras, compile=False)
    interpreter = tf.lite.Interpreter(model_path=str(args.tflite))
    interpreter.allocate_tensors()
    input_detail = interpreter.get_input_details()[0]
    output_detail = interpreter.get_output_details()[0]

    label_mismatches: list[str] = []
    max_score_delta = 0.0
    for image_path in image_paths:
        batch = load_image(image_path)
        keras_scores = np.asarray(keras_model(batch, training=False).numpy()[0])
        tflite_scores = predict_lite(interpreter, input_detail, output_detail, batch)
        max_score_delta = max(max_score_delta, float(np.max(np.abs(keras_scores - tflite_scores))))
        if int(np.argmax(keras_scores)) != int(np.argmax(tflite_scores)):
            label_mismatches.append(str(image_path))

    print(f"Images compared: {len(image_paths)}")
    print(f"Argmax label mismatches: {len(label_mismatches)}")
    print(f"Maximum probability delta: {max_score_delta:.8f}")
    if label_mismatches:
        print("Mismatched files:")
        print("\n".join(label_mismatches))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
