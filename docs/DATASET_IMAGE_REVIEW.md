# External Image Review Rules

## Visual decisions - 2026-11-11

The project owner approved these visual styles for possible external data:

| Condition | Status | Acceptance rule |
| --- | --- | --- |
| Healthy | Approved | Broad or ground-up coconut-palm/frond photograph with intact, green leaflets. |
| Rhinoceros Beetle | Approved | Natural V-shaped/notched damage on a coconut frond or crown. No circles, arrows, text, logos, diagrams, or pest-only photos. |
| Coconut Scale Insect | Approved | A whole coconut frond or palm with visible CSI-related symptoms. Never an insect-only macro image. |
| Yellowing | Approved | Broad coconut crown/frond view with obvious yellowing and drooping. No people, text, logos, or graphics. |
| Yellowing field-inspection photo | Rejected | People are present. |

## Source-policy decision

The initial public pages were used **only to choose the visual style**. Their
images are not automatically reusable training data, so they must not be copied
into the repository.

Actual external imports must come from a dataset that publishes an explicit
license and must preserve the source URL, license, original filename, claimed
source class, and review decision in a provenance manifest.

## External-benchmark scope

Previously reviewed bulk datasets are intentionally not candidates for this
benchmark because their imagery does not match the approved broad-view field
photographs. The benchmark must be assembled from separately sourced,
individually reviewed originals that meet the rules above.

It starts only when there are 50 accepted photographs for each condition. The
project must not fill the quota with augmentations, crops, screenshots, or
near-duplicate versions of the same photograph.

## Import protocol

1. Stage downloads outside the active class folders.
2. Create a contact sheet for project-owner review before accepting any image.
3. Remove overlays, screenshots, people, macros, unrelated palm species, and
   pixel/perceptual duplicates.
4. Keep all accepted images as originals. Data augmentation may be used only
   when training and must never create validation or test observations.
5. Freeze a new split and retrain as a separate candidate. Do not claim its
   metrics for the currently deployed model until it passes review and release.
