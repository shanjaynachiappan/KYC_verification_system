"""
model_loader.py

Loads the pretrained SigLIP-based AI-generated image detector
(Ateeqq/ai-vs-human-image-detector) exactly once and exposes a
singleton instance for use across the FastAPI app.

Unlike the deepfake module's Xception checkpoint, this model downloads
automatically from Hugging Face Hub on first load and caches locally
(~/.cache/huggingface) — no manual weight file placement needed.

Do NOT import model loading logic anywhere else — always go through
get_model() / get_processor() so we guarantee a single load.
"""

import logging
import torch
from transformers import AutoImageProcessor, SiglipForImageClassification

logger = logging.getLogger("ai_generated.model_loader")

# Hugging Face model identifier — trained on Midjourney v6+, SD 3.5,
# GPT-4o-family generators, Apache-2.0 licensed
MODEL_IDENTIFIER = "Ateeqq/ai-vs-human-image-detector"

# Device selection — use GPU if available, else fall back to CPU
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Module-level singletons — populated by load_model(), reused by getters
_model_instance: SiglipForImageClassification | None = None
_processor_instance: AutoImageProcessor | None = None


def load_model() -> None:
    """
    Loads the SigLIP model and its image processor into memory.

    This should be called exactly once, at FastAPI startup.
    Downloads weights from Hugging Face Hub on first run (~350-400MB
    for SigLIP base); subsequent runs use the local cache.
    """
    global _model_instance, _processor_instance

    if _model_instance is not None and _processor_instance is not None:
        logger.info("AI-generated detection model already loaded — reusing existing instance.")
        return

    logger.info(f"Loading AI-generated image detector '{MODEL_IDENTIFIER}' on {DEVICE}...")

    try:
        processor = AutoImageProcessor.from_pretrained(MODEL_IDENTIFIER)
        model = SiglipForImageClassification.from_pretrained(MODEL_IDENTIFIER)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to load model/processor '{MODEL_IDENTIFIER}' from Hugging Face Hub. "
            f"Check your internet connection (first run requires downloading the model) "
            f"or Hugging Face Hub availability. Original error: {exc}"
        ) from exc

    model.to(DEVICE)
    model.eval()  # inference mode — disables dropout/batchnorm updates

    _model_instance = model
    _processor_instance = processor

    logger.info("AI-generated image detection model loaded successfully.")


def get_model() -> SiglipForImageClassification:
    """Returns the already-loaded model singleton."""
    if _model_instance is None:
        raise RuntimeError(
            "AI-generated detection model has not been loaded yet. "
            "Ensure load_model() is called during FastAPI startup."
        )
    return _model_instance


def get_processor() -> AutoImageProcessor:
    """Returns the already-loaded image processor singleton."""
    if _processor_instance is None:
        raise RuntimeError(
            "AI-generated detection processor has not been loaded yet. "
            "Ensure load_model() is called during FastAPI startup."
        )
    return _processor_instance