"""Evaluate a TensorFlow coconut-condition checkpoint against the held-out split."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import tensorflow as tf


PROJECT_ROOT = Path(__file__).resolve().parents[2]
CLASS_NAMES = ["Healthy", "Yellowing", "Coconut_Scale_Insect", "Rhinoceros_Beetle"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", type=Path, required=True)
    parser.add_argument("--dataset", type=Path, default=PROJECT_ROOT / "Thesis AI Model" / "balanced_dataset" / "test")
    args = parser.parse_args()

    dataset = tf.keras.utils.image_dataset_from_directory(
        args.dataset,
        labels="inferred",
        label_mode="int",
        class_names=CLASS_NAMES,
        image_size=(224, 224),
        batch_size=16,
        shuffle=False,
    ).prefetch(tf.data.AUTOTUNE)
    model = tf.keras.models.load_model(args.model, compile=False)
    probabilities = model.predict(dataset, verbose=0)
    predicted = np.argmax(probabilities, axis=1)
    actual = np.concatenate([labels.numpy() for _, labels in dataset], axis=0)
    confusion = np.zeros((len(CLASS_NAMES), len(CLASS_NAMES)), dtype=int)
    for truth, guess in zip(actual, predicted):
        confusion[int(truth), int(guess)] += 1
    report = {
        "model": str(args.model),
        "test_accuracy": float(np.mean(predicted == actual)),
        "confusion_matrix": confusion.tolist(),
        "per_class_accuracy": {
            name: float(confusion[index, index] / max(confusion[index].sum(), 1))
            for index, name in enumerate(CLASS_NAMES)
        },
    }
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
