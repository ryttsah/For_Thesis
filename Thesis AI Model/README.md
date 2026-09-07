# Thesis AI Model — Coconut Leaf CNN

Multi-label **EfficientNetB0** classifier for:

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

## Inference (same logic as notebook)

1. Resize image to **224×224**
2. Run sigmoid outputs for all four labels
3. Apply thresholds from `label_config.json`
4. Remove **Healthy** if any disease label is active
5. Flag **uncertain** when max score &lt; 0.4 or no label passes threshold

## Backend integration

The FastAPI app loads this folder via `ML_MODEL_PATH` / `ML_LABEL_CONFIG_PATH` in `backend/.env` (paths relative to **Thesis Website** root).

```env
ML_MODEL_PATH=Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras
ML_LABEL_CONFIG_PATH=Thesis AI Model/model_outputs/label_config.json
```

Endpoint: `POST /predict` (multipart `file`, JWT required).

## Balanced retraining

The current model should be rebuilt with the supplied field-photo folders before the
next deployment. Run `backend/scripts/prepare_balanced_cnn_dataset.py` first; it
creates `curated_dataset` with exactly 54 images for each of Healthy, Yellowing,
Coconut Scale Insect, and Rhinoceros Beetle. Then run
`backend/scripts/train_balanced_cnn.py` in the project Docker image. It replaces the
model output and label configuration used by the API.

The supplied data does not include a labeled non-palm class. The portal therefore
stops conservatively when no condition can be confirmed and identifies the affected
photos. For a trained non-palm detector, add a separate labeled `Non_Palm` collection
(people, buildings, other crops, tools, animals, blank images, and other unrelated
photos) before retraining.
