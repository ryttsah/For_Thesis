# External 50-Per-Class Test Set

This folder is an **independent benchmark only**. It is never read by the
training dataset builder and must never contain generated or augmented images.

Create the four class folders below and add exactly 50 accepted originals to
each one:

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

The notebook evaluates this folder only when each class has at least 50
documented images and none is an exact pixel duplicate of the prepared model
dataset. The report is named **external benchmark** and is not a replacement for
the existing deployment holdout report.
