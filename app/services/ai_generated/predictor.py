"""
predictor.py

Runs inference using the loaded SigLIP AI-generated image detector
and returns a clean, structured prediction result.

Accepts a raw OpenCV/numpy BGR image (as returned by detect_face()'s
"face_image" key) and handles the BGR->RGB->PIL conversion internally,
so the router can pass the cropped face directly without extra steps.
"""

import torch
import logging
import numpy as np
import cv2
from typing import TypedDict
from PIL import Image

from app.services.ai_generated.model_loader import get_model, get_processor, DEVICE

logger = logging.getLogger("ai_generated.predictor")


class AiGeneratedPrediction(TypedDict):
    prediction: str   # "Real" or "AI Generated"
    confidence: float # 0.0 - 100.0


DECISION_THRESHOLD = 0.5


def predict_ai_generated(face_image: np.ndarray) -> AiGeneratedPrediction:
    """
    Runs the given OpenCV BGR image (cropped face) through the SigLIP
    model and returns a human-readable prediction with confidence.

    Args:
        face_image: numpy array (H, W, 3) in BGR format, as returned by
                    detect_face()'s "face_image" key.

    Returns:
        AiGeneratedPrediction: {"prediction": "Real"|"AI Generated", "confidence": float}

    Raises:
        RuntimeError: if inference fails for any reason.
    """
    if face_image is None or face_image.size == 0:
        raise RuntimeError("predict_ai_generated received an empty or invalid image.")

    model = get_model()
    processor = get_processor()

    try:
        # Convert OpenCV BGR numpy array -> RGB -> PIL Image
        rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        pil_image = Image.fromarray(rgb_image)

        inputs = processor(images=pil_image, return_tensors="pt").to(DEVICE)

        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probabilities = torch.softmax(logits, dim=1)[0]

        predicted_idx = int(torch.argmax(probabilities).item())
        confidence = float(probabilities[predicted_idx].item())

        raw_label = model.config.id2label[predicted_idx]

        logger.info(f"Raw model label: '{raw_label}' | Confidence: {round(confidence * 100, 2)}%")

        normalized_label = _normalize_label(raw_label)
        confidence_percent = round(confidence * 100, 2)

        return {
            "prediction": normalized_label,
            "confidence": confidence_percent,
        }

    except Exception as exc:
        raise RuntimeError(f"AI-generated image inference failed: {exc}") from exc


def _normalize_label(raw_label: str) -> str:
    """
    Maps the model's raw label string to our standardized output vocabulary.

    Model's actual raw labels (confirmed via testing): "hum" (human/real)
    and presumably "ai" (AI-generated) — checked via substring match
    since the model uses shortened label strings rather than full words.
    """
    label_lower = raw_label.lower()

    if "ai" in label_lower or "fake" in label_lower or "generated" in label_lower or "art" in label_lower:
        return "AI Generated"
    elif "hum" in label_lower or "real" in label_lower:
        return "Real"
    else:
        logger.warning(f"Unrecognized label from model: '{raw_label}' — returning raw value.")
        return raw_label