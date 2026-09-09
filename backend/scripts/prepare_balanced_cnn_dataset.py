"""Create a duplicate-free, class-balanced train/validation/test dataset.

Only the four confirmed coconut-condition folders are considered. ``Non-palms`` is
deliberately excluded until its dataset is reviewed and large enough to support a
separate palm-presence model. ``Rhinoceros_Beetle_excluded_actual_pest`` is also
never folded into the rhinoceros class because it is not a verified label.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

LABELS = {
    "Healthy_Leaves": "Healthy",
    "Yellowing": "Yellowing",
    "Coconut_Scale_Insect": "Coconut_Scale_Insect",
    "Rhinoceros_Beetle": "Rhinoceros_Beetle",
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def quality_score(path: Path) -> float | None:
    try:
        with Image.open(path) as image:
            image = image.convert("L")
            if min(image.size) < 160:
                return None
            image.thumbnail((512, 512))
            # Sharpness proxy: variance after an edge filter, with a small size preference.
            edge = image.filter(ImageFilter.FIND_EDGES)
            variance = ImageStat.Stat(edge).var[0]
            return float(variance) + min(image.width * image.height / 1_000_000, 4)
    except (OSError, ValueError):
        return None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=Path("Thesis AI Model"))
    parser.add_argument("--output", type=Path, default=Path("Thesis AI Model/balanced_dataset"))
    parser.add_argument("--per-class", type=int, default=0, help="0 means use the smallest verified class.")
    args = parser.parse_args()

    candidates_by_label: dict[str, list[tuple[float, Path, str]]] = {}
    for source_name, label in LABELS.items():
        candidates: list[tuple[float, Path, str]] = []
        hashes: set[str] = set()
        for path in (args.source / source_name).rglob("*"):
            if path.suffix.lower() in IMAGE_EXTENSIONS:
                score = quality_score(path)
                if score is not None:
                    digest = hashlib.sha256(path.read_bytes()).hexdigest()
                    if digest not in hashes:
                        hashes.add(digest)
                        candidates.append((score, path, digest))
        candidates.sort(key=lambda pair: (-pair[0], pair[1].name.lower()))
        candidates_by_label[label] = candidates

    available = {label: len(items) for label, items in candidates_by_label.items()}
    per_class = args.per_class or min(available.values())
    if per_class < 10:
        raise SystemExit(f"Not enough verified images to balance classes: {available}")
    if any(count < per_class for count in available.values()):
        raise SystemExit(f"Requested {per_class} per class, but only these verified counts are available: {available}")

    if args.output.exists():
        shutil.rmtree(args.output)
    manifest: dict[str, dict[str, list[str]]] = {}
    split_names = ("train", "validation", "test")
    for label, items in candidates_by_label.items():
        # Keep the quality screen, then use a deterministic shuffle so each split
        # contains a representative mix rather than the sharpest images in train
        # and the weakest ones only in test.
        selected = items[:per_class]
        random.Random(20260909 + sum(ord(char) for char in label)).shuffle(selected)
        train_end = round(per_class * 0.70)
        validation_end = train_end + round(per_class * 0.15)
        splits = {
            "train": selected[:train_end],
            "validation": selected[train_end:validation_end],
            "test": selected[validation_end:],
        }
        manifest[label] = {}
        for split in split_names:
            target = args.output / split / label
            target.mkdir(parents=True, exist_ok=True)
            manifest[label][split] = []
            for index, (_, path, digest) in enumerate(splits[split], start=1):
                destination = target / f"{index:03d}_{digest[:12]}{path.suffix.lower()}"
                shutil.copy2(path, destination)
                manifest[label][split].append(str(path))

    audit = {
        "verified_classes": list(LABELS.values()),
        "excluded_folders": ["Non-palms", "Rhinoceros_Beetle_excluded_actual_pest"],
        "available_after_deduplication": available,
        "selected_per_class": per_class,
        "splits": manifest,
    }
    (args.output / "manifest.json").write_text(json.dumps(audit, indent=2), encoding="utf-8")
    print(json.dumps({label: {split: len(paths) for split, paths in parts.items()} for label, parts in manifest.items()}, indent=2))


if __name__ == "__main__":
    main()
