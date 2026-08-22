"""
model_loader.py

Loads the pretrained XceptionDeepfakeModel (pytorchcv Xception backbone +
custom binary classification head) exactly once and exposes a singleton
instance for use across the FastAPI app.

Do NOT import torch model loading logic anywhere else — always go
through get_model() so we guarantee a single load.
"""

import os
import torch
import logging

from app.services.deepfake.xception_arch import build_xception_model, XceptionDeepfakeModel

logger = logging.getLogger("deepfake.model_loader")

# Path to the pretrained weights file (model_v3.pth, renamed per setup steps)
WEIGHTS_PATH = os.path.join(
    os.path.dirname(__file__), "weights", "xception_ffpp.pth"
)

# Device selection — use GPU if available, else fall back to CPU
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Module-level singleton — populated by load_model(), reused by get_model()
_model_instance: XceptionDeepfakeModel | None = None


def load_model() -> XceptionDeepfakeModel:
    """
    Loads the XceptionDeepfakeModel and its pretrained weights into memory.

    This checkpoint was confirmed (via direct inspection of its state_dict
    keys and shapes) to be a raw OrderedDict — not wrapped in a
    {"state_dict": ...} or full pickled model object — so loading is
    straightforward here. If a different checkpoint is swapped in later,
    re-run inspect_checkpoint.py before assuming this still holds.

    This should be called exactly once, at FastAPI startup.
    """
    global _model_instance

    if _model_instance is not None:
        logger.info("Model already loaded — reusing existing instance.")
        return _model_instance

    if not os.path.exists(WEIGHTS_PATH):
        raise FileNotFoundError(
            f"Deepfake model weights not found at '{WEIGHTS_PATH}'. "
            f"Place the renamed checkpoint (model_v3.pth -> xception_ffpp.pth) "
            f"there before starting the server."
        )

    logger.info(f"Loading deepfake detection model from {WEIGHTS_PATH} on {DEVICE}...")

    model = build_xception_model()

    checkpoint = torch.load(WEIGHTS_PATH, map_location=DEVICE)

    try:
        # Confirmed via inspect_checkpoint.py: this is a plain OrderedDict
        # state_dict, not nested under a "state_dict" key.
        model.load_state_dict(checkpoint, strict=True)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to load weights into XceptionDeepfakeModel. "
            f"This means the architecture in xception_arch.py doesn't exactly "
            f"match the checkpoint's layer names/shapes. Re-check against "
            f"checkpoint_layers.txt. Original error: {exc}"
        ) from exc

    model.to(DEVICE)
    model.eval()  # inference mode — disables dropout/batchnorm updates

    _model_instance = model
    logger.info("Deepfake detection model loaded successfully.")
    return _model_instance


def get_model() -> XceptionDeepfakeModel:
    """
    Returns the already-loaded model singleton.
    Raises if load_model() hasn't been called yet (e.g. at FastAPI startup).
    """
    if _model_instance is None:
        raise RuntimeError(
            "Deepfake model has not been loaded yet. "
            "Ensure load_model() is called during FastAPI startup."
        )
    return _model_instance