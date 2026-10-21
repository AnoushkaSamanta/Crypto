"""Small CNN model architecture for FL-MIA-Demo.

Uses GroupNorm instead of BatchNorm to ensure full compatibility with Opacus
Differential Privacy (DP-SGD) per-sample gradient computation.
"""

from typing import List, Any
import torch
import torch.nn as nn
from opacus.validators import ModuleValidator
from config import FLMIAConfig


class SmallCNN(nn.Module):
    """Compact Convolutional Neural Network designed for fast CPU training and Opacus compatibility.

    Architecture:
      Conv1 (1 -> 16, 3x3) -> GroupNorm (4 groups) -> ReLU -> MaxPool (2x2)
      Conv2 (16 -> 32, 3x3) -> GroupNorm (4 groups) -> ReLU -> MaxPool (2x2)
      Flatten -> FC1 (32 * 7 * 7 -> 128) -> ReLU -> FC2 (128 -> 10)
    """

    def __init__(
        self,
        in_channels: int = 1,
        num_classes: int = 10,
        conv1_channels: int = 16,
        conv2_channels: int = 32,
        fc1_units: int = 128,
        num_groups: int = 4,
    ):
        super().__init__()
        # Conv block 1: (B, 1, 28, 28) -> (B, 16, 14, 14)
        self.conv1 = nn.Conv2d(in_channels, conv1_channels, kernel_size=3, padding=1)
        self.gn1 = nn.GroupNorm(num_groups=num_groups, num_channels=conv1_channels)
        self.act1 = nn.ReLU()
        self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Conv block 2: (B, 16, 14, 14) -> (B, 32, 7, 7)
        self.conv2 = nn.Conv2d(conv1_channels, conv2_channels, kernel_size=3, padding=1)
        self.gn2 = nn.GroupNorm(num_groups=num_groups, num_channels=conv2_channels)
        self.act2 = nn.ReLU()
        self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)

        # Classifier block: (B, 32 * 7 * 7) -> (B, 10)
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(conv2_channels * 7 * 7, fc1_units)
        self.act3 = nn.ReLU()
        self.fc2 = nn.Linear(fc1_units, num_classes)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """Forward pass computing raw class logits.

        Args:
            x: Input image batch of shape (B, 1, 28, 28) or (1, 28, 28).

        Returns:
            Logits of shape (B, 10).
        """
        if x.dim() == 3:
            x = x.unsqueeze(0)
        x = self.pool1(self.act1(self.gn1(self.conv1(x))))
        x = self.pool2(self.act2(self.gn2(self.conv2(x))))
        x = self.flatten(x)
        x = self.act3(self.fc1(x))
        x = self.fc2(x)
        return x


def create_model(cfg: FLMIAConfig) -> SmallCNN:
    """Instantiate SmallCNN according to configuration parameters and validate Opacus compatibility."""
    model = SmallCNN(
        in_channels=cfg.in_channels,
        num_classes=cfg.num_classes,
        conv1_channels=cfg.conv1_channels,
        conv2_channels=cfg.conv2_channels,
        fc1_units=cfg.fc1_units,
        num_groups=cfg.num_groups,
    )
    # Ensure zero Opacus validation issues (e.g. no BatchNorm, no unsupported layers)
    errors = ModuleValidator.validate(model)
    if errors:
        raise ValueError(f"Model failed Opacus validation: {errors}")
    return model


def validate_opacus_compatibility(model: nn.Module) -> List[Any]:
    """Helper to verify Opacus compatibility using ModuleValidator."""
    return ModuleValidator.validate(model)
