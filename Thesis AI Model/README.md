# Thesis AI Model — Coconut Leaf CNN

Four-class **EfficientNetB0** classifier for the four confirmed coconut conditions:

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
2. Run softmax outputs for all four classes
3. Apply the uncertainty cutoff from `label_config.json`
4. Select the condition with the actual highest model score. The system does not use a
   hard-coded pest priority, so Rhino cannot win merely because it is present.
5. Flag **uncertain** when max score is below the configured cutoff or no label passes.

## Balanced Dataset and Retraining

`backend/scripts/prepare_balanced_cnn_dataset.py` creates a deterministic dataset in
`balanced_dataset/`. The active `Thesis AI Model/` folder includes the verified unique
legacy source images, so it is the only default training source. The preparation step
removes exact duplicate files and old `f_aug_` generated source variants,
quality-screens images, limits every class to the same count, then creates fresh train,
validation, and test splits. The manifest records the origin of every selected image.

The selected count is determined by the smallest clean class. Training augmentation
is applied only to the train split; validation and test photos remain real source
images.

- Healthy
- Yellowing
- Coconut Scale Insect
- Rhinoceros Beetle

`Non-palms/` is intentionally not read by the preparation or training scripts. It
will only be introduced after the non-palm collection has been reviewed and expanded.
`Rhinoceros_Beetle_excluded_actual_pest/` is also excluded because it is not a
confirmed training label. CSI candidates must visibly show scale clusters or white
spots on the leaf; Rhino candidates must show characteristic fan-shaped leaflet cuts.

To create a replacement model in a TensorFlow-enabled environment, run:

```text
backend/.cnn-venv/Scripts/python.exe backend/scripts/prepare_balanced_cnn_dataset.py
backend/.cnn-venv/Scripts/python.exe backend/scripts/train_balanced_cnn.py
```

Training first saves a dated candidate in `model_outputs/candidates/` with its
confusion matrix, per-class Precision, Recall, and F1. The candidate does not alter
farmer results. To promote it, rerun with `--promote`; promotion is blocked unless
overall held-out accuracy and all four class F1 scores are at least **80%**.

```text
backend/.cnn-venv/Scripts/python.exe backend/scripts/train_balanced_cnn.py --promote
```

## Backend integration

The FastAPI app loads this folder via `ML_MODEL_PATH` / `ML_LABEL_CONFIG_PATH` in `backend/.env` (paths relative to **Thesis Website** root).

```env
ML_MODEL_PATH=Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras
ML_LABEL_CONFIG_PATH=Thesis AI Model/model_outputs/label_config.json
```

Endpoint: `POST /predict` (multipart `file`, JWT required).
