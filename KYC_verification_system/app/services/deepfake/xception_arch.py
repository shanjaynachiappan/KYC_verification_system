"""
xception_arch.py

Defines the model architecture matching the specific pretrained checkpoint
(model_v3.pth) — a pytorchcv Xception backbone with a custom binary
classification head, trained with BCE loss (single sigmoid output).

Architecture reconstructed directly from the checkpoint's own layer
names and shapes (see checkpoint_layers.txt) since the original training
notebook's source could not be directly retrieved.

Do NOT modify layer names/order — they must match the checkpoint's
state_dict keys exactly:
    base.0.*              -> pytorchcv Xception feature extractor
    h1.b1.*, h1.l.*        -> first BatchNorm + Linear (2048 -> 512)
    h1.b2.*, h1.o.*        -> second BatchNorm + Linear (512 -> 1)
"""

import torch
import torch.nn as nn
from pytorchcv.model_provider import get_model as ptcv_get_model


class ClassifierHead(nn.Module):
    """
    Custom binary classification head added on top of the Xception backbone.
    Matches checkpoint keys: h1.b1, h1.l, h1.b2, h1.o
    """

    def __init__(self, in_features: int = 2048, hidden_features: int = 512):
        super().__init__()
        self.b1 = nn.BatchNorm1d(in_features)
        self.l = nn.Linear(in_features, hidden_features)
        self.relu = nn.ReLU(inplace=True)
        self.b2 = nn.BatchNorm1d(hidden_features)
        self.dropout = nn.Dropout(0.5)
        self.o = nn.Linear(hidden_features, 1)  # single logit output

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.b1(x)
        x = self.dropout(x)
        x = self.l(x)
        x = self.relu(x)
        x = self.b2(x)
        x = self.dropout(x)
        x = self.o(x)
        return x  # raw logit — apply sigmoid downstream


class XceptionDeepfakeModel(nn.Module):
    """
    Full model: pytorchcv Xception backbone (feature extractor only,
    classifier stripped) + custom binary head.
    """

    def __init__(self):
        super().__init__()

        backbone = ptcv_get_model("xception", pretrained=False)
        self.base = nn.Sequential(*list(backbone.children())[:-1])

        self.pool = nn.AdaptiveAvgPool2d(1)
        self.h1 = ClassifierHead(in_features=2048, hidden_features=512)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.base(x)                  # (B, 2048, H, W)
        x = self.pool(x)                  # (B, 2048, 1, 1)
        x = x.view(x.size(0), -1)         # (B, 2048)
        x = self.h1(x)                    # (B, 1) raw logit
        return x


def build_xception_model() -> XceptionDeepfakeModel:
    """Factory function to instantiate the architecture before loading weights."""
    return XceptionDeepfakeModel()