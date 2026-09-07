"""Create a quality-screened, balanced training set from the supplied labeled images.

Usage (run from the repository root):
  python backend/scripts/prepare_balanced_cnn_dataset.py --source C:/Users/ahwri/Downloads/Dataset

The command keeps the same number of sharp, readable images per condition. It writes
only a local training folder, which is intentionally excluded from source control.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

from PIL import Image, ImageFilter, ImageStat

LABELS = {
    "HEALTHY 3": "Healthy",
    "YELLOWING 4": "Yellowing",
    "CSI 2": "Coconut_Scale_Insect",
    "RHINOCEROS 1": "Rhinoceros_Beetle",
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
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("Thesis AI Model/curated_dataset"))
    parser.add_argument("--per-class", type=int, default=54)
    args = parser.parse_args()

    chosen: dict[str, list[Path]] = {}
    for source_name, label in LABELS.items():
        candidates = []
        for path in (args.source / source_name).rglob("*"):
            if path.suffix.lower() in IMAGE_EXTENSIONS:
                score = quality_score(path)
                if score is not None:
                    candidates.append((score, path))
        candidates.sort(key=lambda pair: (-pair[0], pair[1].name.lower()))
        chosen[label] = [path for _, path in candidates[: args.per_class]]
        if len(chosen[label]) < args.per_class:
            raise SystemExit(f"{source_name} has only {len(chosen[label])} usable images; need {args.per_class}.")

    if args.output.exists():
        shutil.rmtree(args.output)
    manifest: dict[str, list[str]] = {}
    for label, paths in chosen.items():
        target = args.output / label
        target.mkdir(parents=True, exist_ok=True)
        manifest[label] = []
        for index, path in enumerate(paths, start=1):
            destination = target / f"{index:03d}_{path.name.lower()}"
            shutil.copy2(path, destination)
            manifest[label].append(str(path))

    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({label: len(paths) for label, paths in chosen.items()}, indent=2))


if __name__ == "__main__":
    main()
