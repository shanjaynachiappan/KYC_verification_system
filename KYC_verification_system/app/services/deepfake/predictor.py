"""
predictor.py

Runs inference using the loaded XceptionDeepfakeModel and returns a
clean, structured prediction result.

This model outputs a single raw logit (BCE-trained, sigmoid activation),
NOT 2-class softmax logits — this is different from a standard
multi-class classifier and the logic below reflects that.

This module has no knowledge of FastAPI, HTTP, or file uploads —
it only deals with tensors in, structured predictions out.
"""

import torch
import logging
from typing import TypedDict

from app.services.deepfake.model_loader import get_model, DEVICE

logger = logging.getLogger("deepfake.predictor")


class DeepfakePrediction(TypedDict):
    prediction: str   # "Real" or "Fake"
    confidence: float # 0.0 - 100.0

# CONFIRMED VIA TESTING (2026-08-03): this checkpoint's sigmoid output
# treats REAL as the positive class (label 1), not Fake as initially
# assumed from typical DFDC conventions. Verified against a known real
# selfie, which correctly returned "Real" at ~98% confidence after this fix.
POSITIVE_CLASS_LABEL = "Real"
NEGATIVE_CLASS_LABEL = "Fake"

# Decision threshold — standard midpoint for a sigmoid binary classifier
DECISION_THRESHOLD = 0.5


def predict(face_tensor: torch.Tensor) -> DeepfakePrediction:
    """
    Runs the preprocessed face tensor through the deepfake model and
    returns a human-readable prediction with confidence percentage.

    Args:
        face_tensor: torch.Tensor of shape (1, 3, 299, 299), already
                     normalized by preprocess_face().

    Returns:
        DeepfakePrediction: {"prediction": "Real"|"Fake", "confidence": float}

    Raises:
        RuntimeError: if inference fails for any reason.
    """
    model = get_model()

    try:
        face_tensor = face_tensor.to(DEVICE)

        with torch.no_grad():
            logits = model(face_tensor)                  # shape: (1, 1) — single raw logit
            probability = torch.sigmoid(logits).item()    # scalar in [0, 1]

        if probability >= DECISION_THRESHOLD:
            predicted_label = POSITIVE_CLASS_LABEL
            confidence = probability
        else:
            predicted_label = NEGATIVE_CLASS_LABEL
            confidence = 1.0 - probability

        confidence_percent = round(confidence * 100, 2)

        logger.info(
            f"Prediction: {predicted_label} ({confidence_percent}%) "
            f"[raw sigmoid probability: {round(probability, 4)}]"
        )

        return {
            "prediction": predicted_label,
            "confidence": confidence_percent,
        }

    except Exception as exc:
        raise RuntimeError(f"Deepfake inference failed: {exc}") from exc