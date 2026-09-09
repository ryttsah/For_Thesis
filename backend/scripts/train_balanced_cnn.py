"""Train a balanced four-class coconut condition classifier.

Run after installing TensorFlow in a dedicated local environment:
  backend/.cnn-venv/Scripts/python.exe backend/scripts/train_balanced_cnn.py

The script writes a model and label configuration that the FastAPI predictor loads.
"""

from __future__ import annotations

import json
import random
from pathlib import Path

import numpy as np
import tensorflow as tf

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "Thesis AI Model" / "balanced_dataset"
OUTPUT_DIR = PROJECT_ROOT / "Thesis AI Model" / "model_outputs"
CLASS_NAMES = ["Healthy", "Yellowing", "Coconut_Scale_Insect", "Rhinoceros_Beetle"]
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16
SEED = 20260907


def main() -> None:
    tf.keras.utils.set_random_seed(SEED)
    random.seed(SEED)
    np.random.seed(SEED)

    missing = [name for name in CLASS_NAMES if not (DATASET_DIR / "train" / name).is_dir()]
    if missing:
        raise SystemExit(f"Missing balanced training class folders: {', '.join(missing)}")

    common = dict(
        labels="inferred",
        label_mode="int",
        class_names=CLASS_NAMES,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
    )
    train = tf.keras.utils.image_dataset_from_directory(DATASET_DIR / "train", shuffle=True, seed=SEED, **common)
    valid = tf.keras.utils.image_dataset_from_directory(DATASET_DIR / "validation", shuffle=False, **common)
    test = tf.keras.utils.image_dataset_from_directory(DATASET_DIR / "test", shuffle=False, **common)

    autotune = tf.data.AUTOTUNE
    train = train.prefetch(autotune)
    valid = valid.prefetch(autotune)
    test = test.prefetch(autotune)

    augmentation = tf.keras.Sequential(
        [
            tf.keras.layers.RandomFlip("horizontal"),
            tf.keras.layers.RandomRotation(0.08),
            tf.keras.layers.RandomZoom(0.12),
            tf.keras.layers.RandomContrast(0.12),
        ],
        name="augmentation",
    )
    base = tf.keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(*IMAGE_SIZE, 3),
    )
    base.trainable = False
    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3), name="image")
    x = augmentation(inputs)
    x = tf.keras.applications.efficientnet.preprocess_input(x)
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.25)(x)
    outputs = tf.keras.layers.Dense(len(CLASS_NAMES), activation="softmax", name="condition")(x)
    model = tf.keras.Model(inputs, outputs, name="coconut_condition_efficientnetb0")
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )

    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor="val_accuracy", patience=4, restore_best_weights=True),
    ]
    model.fit(train, validation_data=valid, epochs=15, callbacks=callbacks)

    # A brief fine-tuning stage improves adaptation to real field photos.
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss=tf.keras.losses.SparseCategoricalCrossentropy(),
        metrics=["accuracy"],
    )
    model.fit(train, validation_data=valid, epochs=8, callbacks=callbacks)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    test_loss, test_accuracy = model.evaluate(test, verbose=0)
    probabilities = model.predict(test, verbose=0)
    predicted = np.argmax(probabilities, axis=1)
    actual = np.concatenate([labels.numpy() for _, labels in test], axis=0)
    confusion = np.zeros((len(CLASS_NAMES), len(CLASS_NAMES)), dtype=int)
    for truth, guess in zip(actual, predicted):
        confusion[int(truth), int(guess)] += 1
    per_class_metrics: dict[str, dict[str, float]] = {}
    for index, name in enumerate(CLASS_NAMES):
        true_positive = int(confusion[index, index])
        false_positive = int(confusion[:, index].sum() - true_positive)
        false_negative = int(confusion[index, :].sum() - true_positive)
        precision = true_positive / max(true_positive + false_positive, 1)
        recall = true_positive / max(true_positive + false_negative, 1)
        f1_score = 2 * precision * recall / max(precision + recall, 1e-12)
        per_class_metrics[name] = {
            "precision": float(precision),
            "recall": float(recall),
            "f1_score": float(f1_score),
            "support": int(confusion[index, :].sum()),
        }

    model.save(OUTPUT_DIR / "coconut_leaf_multilabel_cnn.keras")
    (OUTPUT_DIR / "label_config.json").write_text(
        json.dumps(
            {
                "class_names": CLASS_NAMES,
                # A four-way softmax has one mutually exclusive winning class.
                # Scores under 50% remain too ambiguous to surface as a condition.
                "thresholds": {name: 0.5 for name in CLASS_NAMES},
                "uncertain_threshold": 0.5,
                "image_size": list(IMAGE_SIZE),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    (OUTPUT_DIR / "evaluation.json").write_text(
        json.dumps(
            {
                "test_loss": float(test_loss),
                "test_accuracy": float(test_accuracy),
                "classes": CLASS_NAMES,
                "confusion_matrix": confusion.tolist(),
                "per_class_metrics": per_class_metrics,
                "dataset_split": "balanced_dataset: source photos only; generated variants applied during training only",
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print("Saved balanced model and label configuration to", OUTPUT_DIR)


if __name__ == "__main__":
    main()
