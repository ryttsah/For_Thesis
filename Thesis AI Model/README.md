# Thesis AI Model — Coconut Leaf CNN

Multi-label **EfficientNetB0** classifier for the four confirmed coconut conditions:

- Healthy
- Yellowing
- Coconut_Scale_Insect
- Rhinoceros_Beetle

## Files used by the API

| File | Purpose |
|------|---------|
| `model_outputs/coconut_leaf_multilabel_cnn.keras` | Final trained model (default for `/predict`) |
| `model_outputs/label_config.json` | Class names, per-class thresholds, image size |
| `model.ipynb` | Training notebook and `predict_image()` reference |

Alternate checkpoints: `best_fine_tuned_model.keras`, `best_coconut_leaf_model.keras`.

## Inference

1. Resize image to **224×224**
2. Run sigmoid outputs for all four labels
3. Apply thresholds from `label_config.json`
4. Select the condition with the actual highest model score. The system does not use a
   hard-coded pest priority, so Rhino cannot win merely because it is present.
5. Flag **uncertain** when max score is below the configured cutoff or no label passes.

## Balanced Dataset and Retraining

`backend/scripts/prepare_balanced_cnn_dataset.py` creates a deterministic dataset in
`balanced_dataset/`. It removes exact duplicate files, quality-screens images, limits
every class to the same count, and keeps separate train, validation, and test splits.

Current prepared set: **98 images per class** (69 train, 15 validation, 14 test):

- Healthy
- Yellowing
- Coconut Scale Insect
- Rhinoceros Beetle

`Non-palms/` is intentionally not read by the preparation or training scripts. It
will only be introduced after the non-palm collection has been reviewed and expanded.
`Rhinoceros_Beetle_excluded_actual_pest/` is also excluded because it is not a
confirmed training label.

To create a replacement model in a TensorFlow-enabled environment, run:

```text
backend/.cnn-venv/Scripts/python.exe backend/scripts/prepare_balanced_cnn_dataset.py
backend/.cnn-venv/Scripts/python.exe backend/scripts/train_balanced_cnn.py
```

The training script evaluates the held-out test split and writes
`model_outputs/evaluation.json` with its test accuracy and loss.

## Backend integration

The FastAPI app loads this folder via `ML_MODEL_PATH` / `ML_LABEL_CONFIG_PATH` in `backend/.env` (paths relative to **Thesis Website** root).

```env
ML_MODEL_PATH=Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras
ML_LABEL_CONFIG_PATH=Thesis AI Model/model_outputs/label_config.json
```

Endpoint: `POST /predict` (multipart `file`, JWT required).
