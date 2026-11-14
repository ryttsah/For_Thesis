"""Dataset and reporting utilities for the official model.ipynb workflow."""
from __future__ import annotations

import hashlib
import json
import random
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageOps

CLASSES = ["Healthy", "Yellowing", "Coconut_Scale_Insect", "Rhinoceros_Beetle"]
FOLDERS = ["Healthy_Leaves", "Yellowing", "Coconut_Scale_Insect", "Rhinoceros_Beetle"]
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
_PIXEL_HASH_CACHE = {}


def file_hash(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def pixel_hash(path):
    content_hash = file_hash(path)
    if content_hash in _PIXEL_HASH_CACHE:
        return _PIXEL_HASH_CACHE[content_hash]
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        digest = hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()
        _PIXEL_HASH_CACHE[content_hash] = digest
        return digest


def external_test_status(root, expected_per_class=50, reference_dataset=None):
    """Audit a separately curated, original-image benchmark before evaluation.

    The external test folder is deliberately never read by ``prepare_dataset``.
    Each class needs at least ``expected_per_class`` readable images and every
    image must have a matching provenance record. Exact pixel duplicates of the
    training/validation/test dataset are rejected to prevent a reporting leak.
    """
    root = Path(root)
    provenance_path = root / "provenance.json"
    result = {
        "root": str(root),
        "expected_per_class": expected_per_class,
        "ready": False,
        "counts": {},
        "missing_provenance": [],
        "invalid_provenance": [],
        "duplicates_with_reference": [],
        "invalid_images": [],
    }
    if not provenance_path.is_file():
        result["reason"] = f"Missing provenance file: {provenance_path.name}"
        return result

    records = json.loads(provenance_path.read_text(encoding="utf-8"))
    by_file = {str(row.get("file", "")).replace("\\", "/"): row for row in records}
    reference_hashes = set()
    if reference_dataset:
        reference_dataset = Path(reference_dataset)
        # prepare_dataset writes the original-image pixel hashes to its manifest.
        # Reusing those values avoids decoding thousands of exported augmented
        # files merely to reject an external image copied from the source set.
        manifest_path = reference_dataset / "manifest.json"
        if manifest_path.is_file():
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
            reference_hashes = {
                row["pixel_hash"]
                for row in manifest.get("records", [])
                if row.get("pixel_hash")
            }
        else:
            for path in reference_dataset.rglob("*"):
                if path.suffix.lower() in EXTENSIONS:
                    reference_hashes.add(pixel_hash(path))

    for label in CLASSES:
        paths = sorted(path for path in (root / label).glob("*") if path.suffix.lower() in EXTENSIONS)
        result["counts"][label] = len(paths)
        for path in paths:
            relative = str(path.relative_to(root)).replace("\\", "/")
            record = by_file.get(relative)
            if record is None:
                result["missing_provenance"].append(relative)
                continue
            required = ("source_url", "source_title", "license", "claimed_condition", "reviewed")
            if (
                any(not record.get(field) for field in required)
                or record["claimed_condition"] != label
                or record["reviewed"] is not True
            ):
                result["invalid_provenance"].append(relative)
                continue
            try:
                digest = pixel_hash(path)
            except (OSError, ValueError):
                result["invalid_images"].append(relative)
                continue
            if digest in reference_hashes:
                result["duplicates_with_reference"].append(relative)

    sufficient = all(count >= expected_per_class for count in result["counts"].values())
    no_leaks = (
        not result["missing_provenance"]
        and not result["invalid_provenance"]
        and not result["duplicates_with_reference"]
        and not result["invalid_images"]
    )
    result["ready"] = sufficient and no_leaks
    if not result["ready"]:
        result["reason"] = "Need %s original, documented, non-duplicate images per class." % expected_per_class
    return result


def prepare_dataset(root, target=400, seed=20261008):
    """Build curated splits when a review exists; otherwise preserve legacy holdouts."""
    root = Path(root)
    cache_path = root / 'pixel_hash_cache.json'
    if cache_path.is_file():
        _PIXEL_HASH_CACHE.update(json.loads(cache_path.read_text(encoding='utf-8')))
    old = root / "balanced_dataset"
    curated = (root / 'dataset_review.json').is_file()
    if curated:
        # A removed image must never be recovered from an older generated split.
        old = root / '__no_legacy_sources_for_curated_dataset__'
    assignments, records, skipped, repaired = {}, [], [], []
    conflicts = set()
    # Existing holdouts take precedence over any matching source-folder copies.
    for split in ("test", "validation", "train"):
        for label in CLASSES:
            for path in sorted((old / split / label).glob("*")):
                if path.suffix.lower() not in EXTENSIONS:
                    continue
                digest = pixel_hash(path)
                previous = assignments.get(digest)
                if previous and previous[1] != label:
                    conflicts.add(digest)
                if previous and previous[0] != split:
                    repaired.append({"path": str(path), "removed_from": split, "kept_in": previous[0]})
                assignments.setdefault(digest, (split, label))
    for folder, label in zip(FOLDERS, CLASSES):
        for path in sorted((root / folder).rglob("*")):
            if path.suffix.lower() not in EXTENSIONS:
                continue
            if path.name.lower().startswith("f_aug_"):
                skipped.append({"path": str(path), "reason": "legacy augmentation with unknown parent"})
                continue
            try:
                digest = pixel_hash(path)
            except (OSError, ValueError):
                skipped.append({"path": str(path), "reason": "unreadable image"})
                continue
            if digest in assignments and assignments[digest][1] != label:
                conflicts.add(digest)
            assignments.setdefault(digest, ("train", label))
            records.append({"path": str(path), "pixel_hash": digest, "label": label,
                            "split": assignments[digest][0]})
    # Preserve holdout images even when an original source was moved.
    seen = {r["pixel_hash"] for r in records}
    for split in ("test", "validation", "train"):
        for label in CLASSES:
            for path in sorted((old / split / label).glob("*")):
                if path.suffix.lower() in EXTENSIONS:
                    digest = pixel_hash(path)
                    if digest not in seen:
                        records.append({"path": str(path), "pixel_hash": digest,
                                        "label": label, "split": assignments[digest][0]})
                        seen.add(digest)
    conflict_records = [row for row in records if row['pixel_hash'] in conflicts]
    records = [row for row in records if row['pixel_hash'] not in conflicts]
    if curated:
        split_path = root / 'curated_split_manifest.json'
        if split_path.exists():
            frozen = json.loads(split_path.read_text(encoding='utf-8'))
        else:
            frozen = {}
            for label in CLASSES:
                groups = sorted({r['pixel_hash'] for r in records if r['label'] == label})
                if len(groups) < 7:
                    raise ValueError(f'Too few reviewed originals to split {label}: {len(groups)}')
                random.Random(seed + sum(map(ord, label))).shuffle(groups)
                n_test = max(1, round(len(groups) * .15))
                n_validation = max(1, round(len(groups) * .15))
                for index, digest in enumerate(groups):
                    split = 'test' if index < n_test else 'validation' if index < n_test + n_validation else 'train'
                    frozen[digest] = {'label': label, 'split': split}
            split_path.write_text(json.dumps(frozen, indent=2), encoding='utf-8')
        for row in records:
            assigned = frozen.get(row['pixel_hash'], {'label': row['label'], 'split': 'train'})
            if assigned['label'] != row['label']:
                raise ValueError(f"Reviewed label changed; review split manifest for {row['path']}")
            row['split'] = assigned['split']
    identity = {"version": 3, "curated": curated, "target": target, "seed": seed, "records": records}
    signature = hashlib.sha256(json.dumps(identity, sort_keys=True).encode()).hexdigest()
    output = root / "notebook_dataset" / signature[:12]
    manifest_path = output / "manifest.json"
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())
        for item in manifest["files"]:
            path = output / item["file"]
            if not path.exists() or file_hash(path) != item["sha256"]:
                raise ValueError(f"Dataset changed since preparation: {path}")
        return output, manifest
    if output.exists():
        raise ValueError(f"Incomplete dataset exists; inspect it before retrying: {output}")
    unique = {r["pixel_hash"]: r for r in records}
    train_counts = {label: sum(r["split"] == "train" and r["label"] == label for r in unique.values()) for label in CLASSES}
    balanced_target = max(target, *train_counts.values())
    files, counts = [], {}
    rng = random.Random(seed)
    for split in ("train", "validation", "test"):
        counts[split] = {}
        for label in CLASSES:
            originals = sorted((r for r in unique.values() if r["split"] == split and r["label"] == label), key=lambda r: r["pixel_hash"])
            if not originals:
                raise ValueError(f"Missing {split}/{label}; prepare an original split first.")
            destination = output / split / label
            destination.mkdir(parents=True, exist_ok=True)
            for row in originals:
                source = Path(row["path"])
                target_path = destination / (row["pixel_hash"] + source.suffix.lower())
                if source.suffix.lower() == '.webp':
                    target_path = target_path.with_suffix('.png')
                    with Image.open(source) as image:
                        image.convert('RGB').save(target_path)
                else:
                    shutil.copy2(source, target_path)
                files.append({"file": str(target_path.relative_to(output)), "parent": row["pixel_hash"], "augmented": False, "sha256": file_hash(target_path)})
            extra = balanced_target - len(originals) if split == "train" else 0
            parents = originals.copy()
            rng.shuffle(parents)
            for index in range(extra):
                row = parents[index % len(parents)]
                with Image.open(row["path"]) as source:
                    image = ImageOps.exif_transpose(source).convert("RGB").resize((256, 256))
                if rng.random() < .5:
                    image = ImageOps.mirror(image)
                # Preserve the complete field of view; no new tight crops or black borders.
                image = image.resize((224, 224))
                image = ImageEnhance.Brightness(image).enhance(rng.uniform(.92, 1.08))
                image = ImageEnhance.Contrast(image).enhance(rng.uniform(.92, 1.08))
                target_path = destination / f"aug_{row['pixel_hash']}_{index:04d}.jpg"
                image.save(target_path, quality=95)
                files.append({"file": str(target_path.relative_to(output)), "parent": row["pixel_hash"], "augmented": True, "sha256": file_hash(target_path)})
            counts[split][label] = {"originals": len(originals), "augmented": extra, "total": len(originals) + extra}
    manifest = {**identity, "signature": signature, "counts": counts, "files": files, "skipped": skipped,
                "repaired_pixel_duplicate_leakage": repaired,
                "excluded_conflicting_labels": conflict_records,
                "duplicate_copies_retained_in_source": len(records) - len(unique),
                "limitation": "Pixel-identical copies grouped. Recompressed/cropped photos and same-tree series still need manual review. Curated splits are new assignments of existing photos, which earlier models may have seen; evaluate a freshly trained model and do not claim an independent external test." if curated else "Pixel-identical copies grouped. Recompressed/cropped photos and same-tree series still need manual review. Existing holdouts have been used in past experiments; they are not a new external test set."}
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    cache_path.write_text(json.dumps(_PIXEL_HASH_CACHE), encoding='utf-8')
    return output, manifest


def metrics_for(actual, predicted):
    confusion = np.zeros((4, 4), dtype=int)
    for truth, guess in zip(actual, predicted):
        confusion[int(truth), int(guess)] += 1
    per_class = {}
    for i, label in enumerate(CLASSES):
        precision = float(confusion[i, i] / max(confusion[:, i].sum(), 1))
        recall = float(confusion[i, i] / max(confusion[i].sum(), 1))
        per_class[label] = {"precision": precision, "recall": recall,
                            "f1": 2 * precision * recall / max(precision + recall, 1e-12),
                            "support": int(confusion[i].sum())}
    total = int(confusion.sum())
    return {"accuracy": float(np.trace(confusion) / max(total, 1)),
            "macro_f1": float(np.mean([r["f1"] for r in per_class.values()])),
            "weighted_f1": sum(r["f1"] * r["support"] for r in per_class.values()) / max(total, 1),
            "per_class": per_class, "confusion_matrix": confusion.tolist()}


def evaluate_api(model_path, config_path, dataset, split="test", runtime="keras"):
    """Evaluate original image bytes through the selected deployed API runtime.

    Pass ``split=None`` when ``dataset`` itself is a class-folder benchmark such
    as ``external_test_set``. The folder is still evaluated through the exact
    same predictor used by the API.
    """
    from app.ml import predictor
    # The predictor deliberately keeps one runtime loaded per process. Reset every
    # cache field so a notebook can compare the Keras reference with TensorFlow Lite.
    predictor._model = None
    predictor._config = None
    predictor._load_error = None
    predictor._loaded_identity = None
    predictor._loaded_runtime = None
    rows, actual, predicted = [], [], []
    source_root = Path(dataset) if split is None else Path(dataset) / split
    for index, label in enumerate(CLASSES):
        for path in sorted((source_root / label).glob("*")):
            content = path.read_bytes()
            result = predictor.predict_upload_file(
                content,
                model_path=Path(model_path),
                config_path=Path(config_path),
                runtime=runtime,
                max_bytes=max(len(content), 10 * 1024 * 1024),
            )
            guess = CLASSES.index(result.label.replace(" ", "_"))
            actual.append(index)
            predicted.append(guess)
            rows.append({"file": str(path), "actual": label, "predicted": CLASSES[guess],
                         "confidence": result.confidence, "uncertain": result.uncertain,
                         "scores": result.predictions})
    report = metrics_for(actual, predicted)
    report.update({"split": split or "external", "runtime": runtime,
                   "prediction_method": "app.ml.predictor.predict_upload_file",
                   "input_note": "Original dataset bytes; transport size cap bypassed for evaluation. Browser compression of large user uploads can change predictions.",
                   "predictor_sha256": file_hash(predictor.__file__),
                   "model_sha256": file_hash(model_path), "config_sha256": file_hash(config_path),
                   "uncertain_count": sum(row["uncertain"] for row in rows), "predictions": rows})
    return report
