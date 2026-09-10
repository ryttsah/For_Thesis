"""Train guarded CocoAnalytica CNN candidates with controlled experiments."""
from __future__ import annotations

import csv
import json
import random
import shutil
from argparse import ArgumentParser
from datetime import datetime
from pathlib import Path

import numpy as np
import tensorflow as tf

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = PROJECT_ROOT / "Thesis AI Model" / "balanced_dataset"
OUTPUT_DIR = PROJECT_ROOT / "Thesis AI Model" / "model_outputs"
CLASS_NAMES = ["Healthy", "Yellowing", "Coconut_Scale_Insect", "Rhinoceros_Beetle"]
IMAGE_SIZE, BATCH_SIZE, SEED, RELEASE_THRESHOLD = (224, 224), 16, 20260910, 0.80
EXPERIMENTS = {
    "stronger-head": {"head_units": 256, "dropout": 0.30, "fine_tune_layers": 40, "loss": "cross_entropy"},
    "focal-loss": {"head_units": 256, "dropout": 0.30, "fine_tune_layers": 40, "loss": "focal"},
}


class SparseCategoricalFocalLoss(tf.keras.losses.Loss):
    def __init__(self, gamma: float = 1.5) -> None:
        super().__init__(name="sparse_categorical_focal_loss")
        self.gamma = gamma

    def call(self, y_true, y_pred):
        y_true = tf.cast(tf.reshape(y_true, [-1]), tf.int32)
        y_pred = tf.clip_by_value(y_pred, tf.keras.backend.epsilon(), 1.0)
        chosen = tf.gather(y_pred, y_true, axis=1, batch_dims=1)
        return -tf.pow(1.0 - chosen, self.gamma) * tf.math.log(chosen)


def datasets():
    common = dict(labels="inferred", label_mode="int", class_names=CLASS_NAMES, image_size=IMAGE_SIZE, batch_size=BATCH_SIZE)
    data = [tf.keras.utils.image_dataset_from_directory(DATASET_DIR / split, shuffle=split == "train", seed=SEED if split == "train" else None, **common) for split in ("train", "validation", "test")]
    return tuple(item.prefetch(tf.data.AUTOTUNE) for item in data)


def build_model(config):
    augmentation = tf.keras.Sequential([tf.keras.layers.RandomFlip("horizontal", seed=SEED), tf.keras.layers.RandomRotation(.06, seed=SEED), tf.keras.layers.RandomZoom(.10, seed=SEED), tf.keras.layers.RandomContrast(.10, seed=SEED)])
    base = tf.keras.applications.EfficientNetB0(include_top=False, weights="imagenet", input_shape=(*IMAGE_SIZE, 3))
    base.trainable = False
    inputs = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
    x = tf.keras.applications.efficientnet.preprocess_input(augmentation(inputs))
    x = base(x, training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.BatchNormalization()(x)
    x = tf.keras.layers.Dense(config["head_units"], activation="relu")(x)
    x = tf.keras.layers.Dropout(config["dropout"])(x)
    return tf.keras.Model(inputs, tf.keras.layers.Dense(len(CLASS_NAMES), activation="softmax", name="condition")(x)), base


def compile_model(model, lr, loss_name):
    loss = SparseCategoricalFocalLoss() if loss_name == "focal" else tf.keras.losses.SparseCategoricalCrossentropy()
    model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=lr), loss=loss, metrics=["accuracy"])


def prediction_data(model, dataset, tta=False):
    scores, labels = [], []
    for images, batch_labels in dataset:
        prediction = model(images, training=False)
        if tta: prediction = (prediction + model(tf.image.flip_left_right(images), training=False)) / 2
        scores.append(prediction.numpy()); labels.append(batch_labels.numpy())
    return np.concatenate(scores), np.concatenate(labels)


def report_for(scores, actual):
    predicted = np.argmax(scores, axis=1); confusion = np.zeros((4, 4), dtype=int)
    for truth, guess in zip(actual, predicted): confusion[int(truth), int(guess)] += 1
    metrics = {}
    for index, name in enumerate(CLASS_NAMES):
        tp = int(confusion[index, index]); fp = int(confusion[:, index].sum() - tp); fn = int(confusion[index, :].sum() - tp)
        precision, recall = tp / max(tp + fp, 1), tp / max(tp + fn, 1)
        metrics[name] = {"precision": precision, "recall": recall, "f1_score": 2 * precision * recall / max(precision + recall, 1e-12), "support": int(confusion[index].sum())}
    return {"test_accuracy": float(np.mean(predicted == actual)), "confusion_matrix": confusion.tolist(), "per_class_metrics": metrics}


def temperature_from(validation_scores, labels):
    logits = np.log(np.clip(validation_scores, 1e-7, 1.0)); winner = (1.0, float("inf"))
    for temperature in np.linspace(.5, 3, 51):
        values = logits / temperature; values -= values.max(axis=1, keepdims=True); calibrated = np.exp(values); calibrated /= calibrated.sum(axis=1, keepdims=True)
        loss = -np.mean(np.log(np.clip(calibrated[np.arange(len(labels)), labels], 1e-7, 1.0)))
        if loss < winner[1]: winner = (float(temperature), float(loss))
    return winner[0]


def run(experiment_name, promote):
    tf.keras.backend.clear_session(); tf.keras.utils.set_random_seed(SEED); random.seed(SEED); np.random.seed(SEED)
    config = EXPERIMENTS[experiment_name]; train, validation, test = datasets(); model, base = build_model(config)
    run_dir = OUTPUT_DIR / "candidates" / f"{experiment_name}_{datetime.now():%Y%m%d-%H%M%S}"; run_dir.mkdir(parents=True, exist_ok=True)
    callbacks = [tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True), tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=.3, patience=2, min_lr=1e-7), tf.keras.callbacks.CSVLogger(run_dir / "head_training_log.csv")]
    compile_model(model, 1e-3, config["loss"]); history = model.fit(train, validation_data=validation, epochs=18, callbacks=callbacks, verbose=2)
    base.trainable = True; cutoff = max(len(base.layers) - config["fine_tune_layers"], 0)
    for index, layer in enumerate(base.layers): layer.trainable = index >= cutoff and not isinstance(layer, tf.keras.layers.BatchNormalization)
    compile_model(model, 1e-5, config["loss"])
    model.fit(train, validation_data=validation, initial_epoch=len(history.history["loss"]), epochs=30, callbacks=[tf.keras.callbacks.EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True), tf.keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=.3, patience=2, min_lr=1e-7), tf.keras.callbacks.CSVLogger(run_dir / "fine_tune_log.csv")], verbose=2)
    valid_scores, valid_labels = prediction_data(model, validation); test_scores, test_labels = prediction_data(model, test); tta_scores, _ = prediction_data(model, test, True)
    report = report_for(test_scores, test_labels); report.update({"experiment": experiment_name, "configuration": config, "test_time_augmented_accuracy": report_for(tta_scores, test_labels)["test_accuracy"], "calibration_temperature": temperature_from(valid_scores, valid_labels), "dataset_split": "balanced_dataset/test; untouched during training", "release_threshold": RELEASE_THRESHOLD})
    report["passed_release_gate"] = report["test_accuracy"] >= RELEASE_THRESHOLD and all(row["f1_score"] >= RELEASE_THRESHOLD for row in report["per_class_metrics"].values())
    model.save(run_dir / "coconut_leaf_model.keras")
    label_config = {"class_names": CLASS_NAMES, "thresholds": {name: .5 for name in CLASS_NAMES}, "uncertain_threshold": .5, "min_top_two_margin": .10, "temperature": report["calibration_temperature"], "image_size": list(IMAGE_SIZE)}
    (run_dir / "label_config.json").write_text(json.dumps(label_config, indent=2), encoding="utf-8"); (run_dir / "evaluation.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    summary_path = OUTPUT_DIR / "candidates" / "experiment_results.csv"
    summary = {"candidate": run_dir.name, "accuracy": report["test_accuracy"], "tta_accuracy": report["test_time_augmented_accuracy"], "passed_gate": report["passed_release_gate"], **{f"{name}_f1": row["f1_score"] for name, row in report["per_class_metrics"].items()}}
    with summary_path.open("a", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(summary))
        if file.tell() == 0: writer.writeheader()
        writer.writerow(summary)
    print(json.dumps({"candidate": str(run_dir), "accuracy": report["test_accuracy"], "tta_accuracy": report["test_time_augmented_accuracy"], "f1": {name: row["f1_score"] for name, row in report["per_class_metrics"].items()}, "passed": report["passed_release_gate"]}, indent=2))
    if promote and report["passed_release_gate"]:
        shutil.copy2(run_dir / "coconut_leaf_model.keras", OUTPUT_DIR / "coconut_leaf_multilabel_cnn.keras"); (OUTPUT_DIR / "label_config.json").write_text(json.dumps(label_config, indent=2), encoding="utf-8"); (OUTPUT_DIR / "evaluation.json").write_text(json.dumps(report, indent=2), encoding="utf-8"); print("Candidate promoted.")
    return report


def main():
    parser = ArgumentParser(); parser.add_argument("--experiment", choices=[*EXPERIMENTS, "all"], default="stronger-head"); parser.add_argument("--promote", action="store_true"); args = parser.parse_args()
    if args.promote and args.experiment == "all": raise SystemExit("Review and promote one candidate at a time.")
    if any(not (DATASET_DIR / "train" / name).is_dir() for name in CLASS_NAMES): raise SystemExit("Run prepare_balanced_cnn_dataset.py first.")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in (EXPERIMENTS if args.experiment == "all" else [args.experiment]): run(name, args.promote)


if __name__ == "__main__": main()
