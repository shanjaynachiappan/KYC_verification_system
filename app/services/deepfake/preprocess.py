"""
preprocess.py

Prepares a cropped face image (as returned by the existing OpenCV
face_detection service) for input into the Xception deepfake model.

Pipeline: resize -> BGR to RGB -> normalize -> tensor conversion.

This module does NOT touch face detection logic — it only consumes
the already-cropped face array produced upstream.
"""

import cv2
import numpy as np
import torch

# Xception expects 299x299 RGB input
TARGET_SIZE = (299, 299)

# Normalization constants for this Xception variant (range approx [-1, 1])
NORM_MEAN = 0.5
NORM_STD = 0.5


def preprocess_face(face_image: np.ndarray) -> torch.Tensor:
    """
    Converts a cropped face (OpenCV BGR numpy array) into a normalized
    PyTorch tensor ready for model inference.

    Args:
        face_image: numpy array (H, W, 3) in BGR format, as returned by
                    the existing detect_face() function's "face_image" key.

    Returns:
        torch.Tensor of shape (1, 3, 299, 299), dtype float32.

    Raises:
        ValueError: if the input image is empty or malformed.
    """
    if face_image is None or face_image.size == 0:
        raise ValueError("preprocess_face received an empty or invalid face image.")

    if len(face_image.shape) != 3 or face_image.shape[2] != 3:
        raise ValueError(
            f"Expected a 3-channel color image, got shape {face_image.shape}."
        )

    # Step 1: Resize to model's expected input dimensions
    resized = cv2.resize(face_image, TARGET_SIZE, interpolation=cv2.INTER_AREA)

    # Step 2: Convert OpenCV's default BGR to RGB (model was trained on RGB)
    rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)

    # Step 3: Convert to float32 and scale pixel values from [0, 255] to [0, 1]
    normalized = rgb_image.astype(np.float32) / 255.0

    # Step 4: Normalize to roughly [-1, 1] range using mean/std
    normalized = (normalized - NORM_MEAN) / NORM_STD

    # Step 5: Convert HWC -> CHW (channels-first, as PyTorch expects)
    chw_image = np.transpose(normalized, (2, 0, 1))

    # Step 6: Add batch dimension -> (1, 3, 299, 299)
    tensor = torch.from_numpy(chw_image).unsqueeze(0)

    return tensor.float()