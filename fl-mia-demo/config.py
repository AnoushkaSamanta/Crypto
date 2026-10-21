"""Configuration module for FL-MIA-Demo.

Defines all hyperparameters for dataset creation, Federated Learning (FedAvg),
Differential Privacy (DP-SGD via Opacus), Membership Inference Attack (MIA),
and multi-seed experimentation.
"""

from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any
import json
import os


@dataclass
class FLMIAConfig:
    """Master configuration dataclass for the FL MIA & DP demo."""

    # -------------------------------------------------------------------------
    # Data & Split Hyperparameters
    # -------------------------------------------------------------------------
    data_dir: str = "./data"
    num_clients: int = 5
    client_samples: int = 600          # 5 clients * 600 = 3000 total training members
    nonmembers_pool_size: int = 3000   # Disjoint pool never seen during training
    attack_calibration_size: int = 1000  # 1000 members + 1000 non-members for threshold tuning
    attack_eval_size: int = 1000         # 1000 members + 1000 non-members for evaluation
    global_test_size: int = 2000         # Standard test set samples for general accuracy

    # -------------------------------------------------------------------------
    # Model Hyperparameters
    # -------------------------------------------------------------------------
    in_channels: int = 1
    num_classes: int = 10
    conv1_channels: int = 16
    conv2_channels: int = 32
    fc1_units: int = 128
    num_groups: int = 4                # GroupNorm groups (Opacus compatible)

    # -------------------------------------------------------------------------
    # Federated Learning (FedAvg) Hyperparameters
    # -------------------------------------------------------------------------
    # Default 30 rounds with lr 0.05 allows baseline to clearly overfit on small
    # client datasets (600 samples each), creating an observable MIA leakage signal.
    rounds: int = 30
    local_epochs: int = 2
    client_fraction: float = 1.0       # All clients participate each round (5/5)
    batch_size: int = 64
    lr: float = 0.05
    momentum: float = 0.9

    # -------------------------------------------------------------------------
    # Differential Privacy (DP-SGD via Opacus) Hyperparameters
    # -------------------------------------------------------------------------
    dp_enabled: bool = False
    max_grad_norm: float = 1.0         # Per-sample gradient clipping threshold C
    noise_multiplier: float = 1.0      # Gaussian noise scale sigma
    delta: float = 1.0 / 600.0         # Target delta = 1 / local_dataset_size

    # -------------------------------------------------------------------------
    # Experiment & Environment Hyperparameters
    # -------------------------------------------------------------------------
    seeds: List[int] = field(default_factory=lambda: [0, 1, 2])
    noise_sweep_values: List[float] = field(default_factory=lambda: [0.5, 1.0, 2.0])
    results_dir: str = "./results"
    quick_mode: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert dataclass to dictionary."""
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FLMIAConfig":
        """Instantiate dataclass from dictionary."""
        return cls(**data)

    def save(self, filepath: str) -> None:
        """Save configuration to JSON file."""
        os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "FLMIAConfig":
        """Load configuration from JSON file."""
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)

    def apply_quick_mode(self) -> "FLMIAConfig":
        """Configure settings for a rapid ~1-2 minute smoke test run."""
        self.quick_mode = True
        self.rounds = 10
        self.seeds = [0]
        self.noise_sweep_values = [0.5, 1.0]
        return self
