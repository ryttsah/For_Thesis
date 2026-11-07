"""Export the official CocoAnalytica Keras model as a TensorFlow Lite artifact."""

from __future__ import annotations

import argparse
import hashlib
from pathlib import Path

import tensorflow as tf


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = PROJECT_ROOT / "Thesis AI Model" / "model_outputs" / "coconut_leaf_multilabel_cnn.keras"
DEFAULT_OUTPUT = PROJECT_ROOT / "Thesis AI Model" / "model_outputs" / "coconut_leaf_multilabel_cnn.tflite"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--dynamic-range-quantization",
        action="store_true",
        help="Reduce artifact size at the cost of a possible prediction difference.",
    )
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not source.is_file():
        raise FileNotFoundError(f"Keras model not found: {source}")

    model = tf.keras.models.load_model(source, compile=False)
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    if args.dynamic_range_quantization:
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_bytes = converter.convert()

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(tflite_bytes)
    print(f"Wrote {output}")
    print(f"Size: {output.stat().st_size / 1024 / 1024:.2f} MiB")
    print(f"SHA-256: {sha256(output)}")


if __name__ == "__main__":
    main()
