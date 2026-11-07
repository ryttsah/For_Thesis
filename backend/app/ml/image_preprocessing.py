"""TensorFlow-compatible image preparation used by the lightweight runtime."""

from __future__ import annotations

import numpy as np


def resize_bilinear_half_pixel(image: np.ndarray, target_size: tuple[int, int]) -> np.ndarray:
    """Resize RGB pixels using TensorFlow's default bilinear geometry."""

    source = np.asarray(image, dtype=np.float32)
    source_height, source_width, channels = source.shape
    target_height, target_width = target_size
    if channels != 3:
        raise ValueError("Expected an RGB image with three channels.")

    y = (np.arange(target_height, dtype=np.float32) + 0.5) * source_height / target_height - 0.5
    x = (np.arange(target_width, dtype=np.float32) + 0.5) * source_width / target_width - 0.5
    y_floor = np.floor(y)
    x_floor = np.floor(x)
    y0 = np.clip(y_floor.astype(np.intp), 0, source_height - 1)
    x0 = np.clip(x_floor.astype(np.intp), 0, source_width - 1)
    y1 = np.clip(y0 + 1, 0, source_height - 1)
    x1 = np.clip(x0 + 1, 0, source_width - 1)
    y_weight = (y - y_floor).reshape(target_height, 1, 1)
    x_weight = (x - x_floor).reshape(1, target_width, 1)

    top = source[y0] * (1.0 - y_weight) + source[y1] * y_weight
    return top[:, x0] * (1.0 - x_weight) + top[:, x1] * x_weight
