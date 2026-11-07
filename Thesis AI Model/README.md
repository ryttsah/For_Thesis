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
| `model.ipynb` | Official training, evaluation, augmentation export and release workflow |

The only model used by the API is `model_outputs/coconut_leaf_multilabel_cnn.keras`.

## Inference

1. Resize image to **224×224**
2. Run the model on the original and horizontally flipped image, then average the scores
3. Apply the validation-derived temperature calibration from `label_config.json`
4. Apply the uncertainty cutoff and top-two score margin from `label_config.json`
5. Select the condition with the actual highest model score. The system does not use a
   hard-coded pest priority, so Rhino cannot win merely because it is present.
6. Flag **uncertain** when the photo quality is poor, the max score is below the cutoff,
   the top two classes are too close, or no label passes.

## Balanced Dataset and Retraining

### Broad-view curation (2026-10-08)

The four source folders were visually reviewed for field-camera framing. Close-up
insect photos, isolated leaf crops, legacy synthetic variants, and two copies with
conflicting class labels were removed from the active sources. Retained files are
flattened into their class folder: Healthy 120, Yellowing 56, CSI 155, Rhino 362.
Framing review does not certify the disease labels.

`dataset_review.json` records every decision. `curated_split_manifest.json` freezes
the new deterministic source groups across train/validation/test. Old generated
splits are never imported in curated mode. Saved augmentation preserves the full
field of view, without zoom crops or black rotation borders. Old notebook outputs
were cleared; train a new model before reporting results for this revision.

Removed sources, obsolete generated datasets, experiment outputs and unused
non-palm/pest collections are recoverable in `../dataset_archive/broad_view_20261008/`.
The current deployed weights and label configuration remain in `model_outputs`.

Open `model.ipynb` and run its cells in order using the TensorFlow Python environment.
Install `matplotlib` and `ipykernel` in that environment for charts and a notebook kernel.
The notebook exports balanced training augmentation into `notebook_dataset/<version>/train/`.
Curated source folders are used. Curated validation/test memberships are frozen;
additional originals go into training. Pixel-identical duplicates share a split and count
as one independent photo. Review related photos manually for near-duplicate leakage.

Validation F1 and confusion matrices display after each epoch. Final metrics use
`backend/app/ml/predictor.py`, exactly as the API does. Reports include model and config
hashes, dataset provenance, per-class F1, and a confusion matrix. The explicit release
cell backs up the previous model and exports to the API's existing model path. Restart
or redeploy the backend, then compare `/predict/status` hashes with the notebook report.
Individual upload confidence is not test accuracy or F1.

The following describes the **legacy** preparation/training commands. Do not rerun
them to regenerate holdouts while comparing official notebook experiments.

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

### Official notebook

`model.ipynb` uses four-class **softmax**, `224x224` input, and saved training
augmentation. Every run saves a separate candidate, `evaluation.json`,
`per_class_metrics.csv`, and `confusion_matrix.csv`. The 80% target is reported,
not assumed. Release is controlled by `RELEASE_TO_WEBSITE` after review.

Open it with the `CocoAnalytica (TensorFlow)` kernel. Compare experiments using
validation; reserve test evaluation for the selected model. The existing holdouts
have been used in previous experiments, so disclose that limitation in reports.
The last section links every file connecting the notebook export to Railway and
the frontend. `/predict/status` returns model/config hashes for verification.

## Backend integration

The FastAPI app loads this folder via `ML_MODEL_PATH` / `ML_LABEL_CONFIG_PATH` in `backend/.env` (paths relative to **Thesis Website** root).

```env
ML_MODEL_PATH=Thesis AI Model/model_outputs/coconut_leaf_multilabel_cnn.keras
ML_LABEL_CONFIG_PATH=Thesis AI Model/model_outputs/label_config.json
```

Endpoint: `POST /predict` (multipart `file`, JWT required).
