# External 50-Per-Class Test Set

This folder is an **independent benchmark only**. It is never read by the
training dataset builder and must never contain generated or augmented images.

Use the four class folders below. A provisional result can be generated after
every class contains at least one accepted original; the final external
benchmark requires at least 50 accepted originals in every class:

```text
external_test_set/
  Healthy/
  Yellowing/
  Coconut_Scale_Insect/
  Rhinoceros_Beetle/
  provenance.json
```

Every image requires one `provenance.json` record. The `file` field is relative
to this folder and uses forward slashes.

```json
[
  {
    "file": "Healthy/example-001.jpg",
    "source_url": "https://source.example/original-photo",
    "source_title": "Source page title",
    "license": "Documented source terms",
    "claimed_condition": "Healthy",
    "reviewed": true,
    "review_note": "Broad coconut crown; green, intact fronds; no overlay or people."
  }
]
```

The notebook checks every image for provenance, readability, and exact pixel
duplicates against the prepared model dataset. A small, reviewed collection is
written to `model_outputs/external_test_provisional_evaluation.json` and is
clearly labelled **provisional**. Only a collection with 50 documented,
non-duplicate images per class is written as the final **external benchmark**.
Neither result replaces the existing deployment holdout report.

The raw benchmark photographs and rejected candidates are intentionally ignored
by Git. Their source records remain in `provenance.json`.
