"""Quick CNN smoke test. Usage: python scripts/test_predict.py [path-to-image.jpg]"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.ml.predictor import predict_upload_file


def main() -> None:
    settings = get_settings()
    model_path = settings.resolved_ml_model_path()
    config_path = settings.resolved_ml_label_config_path()

    if len(sys.argv) > 1:
        image_path = Path(sys.argv[1])
    else:
        image_path = (
            ROOT.parent
            / "Thesis AI Model"
            / "Healthy_Leaves"
            / "train"
            / "1.jpg"
        )

    if not image_path.is_file():
        print(f"Image not found: {image_path}")
        raise SystemExit(1)

    result = predict_upload_file(
        image_path.read_bytes(),
        model_path=model_path,
        config_path=config_path,
    )
    print(f"Image: {image_path}")
    print(f"Pest: {result.pest}")
    print(f"Label: {result.label}")
    print(f"Confidence: {result.confidence}%")
    print(f"Uncertain: {result.uncertain}")
    print(f"Thresholded: {result.thresholded_labels}")
    print(f"Scores: {result.predictions}")


if __name__ == "__main__":
    main()
