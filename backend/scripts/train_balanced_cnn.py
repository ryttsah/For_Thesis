"""Train a balanced coconut condition classifier from curated_dataset.

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
DATASET_DIR = PROJECT_ROOT / "Thesis AI Model" / "curated_dataset"
OUTPUT_DIR = PROJECT_ROOT / "Thesis AI Model" / "model_outputs"
CLASS_NAMES = ["Healthy", "Yellowing", "Coconut_Scale_Insect", "Rhinoceros_Beetle"]
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16
SEED = 20260907


def main() -> None:
    tf.keras.utils.set_random_seed(SEED)
    random.seed(SEED)
    np.random.seed(SEED)

    missing = [name for name in CLASS_NAMES if not (DATASET_DIR / name).is_dir()]
    if missing:
        raise SystemExit(f"Missing curated class folders: {', '.join(missing)}")

    common = dict(
        directory=DATASET_DIR,
        labels="inferred",
        label_mode="int",
        class_names=CLASS_NAMES,
        validation_split=0.2,
        seed=SEED,
        image_size=IMAGE_SIZE,
        batch_size=BATCH_SIZE,
    )
    train = tf.keras.utils.image_dataset_from_directory(subset="training", shuffle=True, **common)
    # Use the same seed and shuffle behavior as training so both subsets are a
    # true complementary split, rather than two differently ordered selections.
    valid = tf.keras.utils.image_dataset_from_directory(subset="validation", shuffle=True, **common)

    autotune = tf.data.AUTOTUNE
    train = train.prefetch(autotune)
    valid = valid.prefetch(autotune)

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
    model.save(OUTPUT_DIR / "coconut_leaf_multilabel_cnn.keras")
    (OUTPUT_DIR / "label_config.json").write_text(
        json.dumps(
            {
                "class_names": CLASS_NAMES,
                "thresholds": {name: 0.5 for name in CLASS_NAMES},
                # Scores under 35% are too ambiguous to accept. A modest cutoff
                # avoids rejecting real field photos where lighting lowers the
                # model's confidence.
                "uncertain_threshold": 0.35,
                "image_size": list(IMAGE_SIZE),
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print("Saved balanced model and label configuration to", OUTPUT_DIR)


if __name__ == "__main__":
    main()
