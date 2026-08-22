"""Barangay label normalization (Baranggay → Brgy.)."""

import re


def normalize_brgy_label(raw: str) -> str:
    trimmed = raw.strip()
    if not trimmed:
        return trimmed
    lower = trimmed.lower()
    if lower in ("unassigned", "none", "__unassign__"):
        return "Unassigned"
    if lower.startswith("brgy."):
        rest = trimmed.split(".", 1)[-1].strip()
        return f"Brgy. {rest}" if rest else "Brgy."
    if lower.startswith("brgy "):
        return f"Brgy. {trimmed[4:].strip()}"
    if lower.startswith("baranggay "):
        return f"Brgy. {trimmed[10:].strip()}"
    if lower.startswith("barangay "):
        return f"Brgy. {trimmed[9:].strip()}"
    if re.match(r"^brgy\.?\s", lower):
        return trimmed
    return f"Brgy. {trimmed}"


def brgy_match(a: str, b: str) -> bool:
    return normalize_brgy_label(a).casefold() == normalize_brgy_label(b).casefold()
