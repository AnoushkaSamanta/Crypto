"""Dataset loading, splitting, and hygiene verification for FL-MIA-Demo.

Uses Fashion-MNIST via torchvision. Builds fixed, disjoint splits:
- members_pool: 3,000 samples -> split across 5 clients (600 each) = ONLY training data
- nonmembers_pool: 3,000 samples never used in training
- attack_calibration: 1,000 members + 1,000 non-members (ONLY for threshold tuning)
- attack_eval: 1,000 members + 1,000 non-members (ONLY for final metrics)
- global_test: 2,000 samples from official test set for model accuracy
"""

from dataclasses import dataclass
from typing import List, Tuple, Optional
import os
import numpy as np
import torch
from torch.utils.data import Dataset, Subset
from torchvision import datasets, transforms
from config import FLMIAConfig

# Standard Fashion-MNIST class label names
CLASS_NAMES = [
    "T-shirt/top",
    "Trouser",
    "Pullover",
    "Dress",
    "Coat",
    "Sandal",
    "Shirt",
    "Sneaker",
    "Bag",
    "Ankle boot",
]


class AttackDataset(Dataset):
    """Dataset wrapper for attack evaluation samples.

    Stores the candidate sample (x, y), along with ground truth membership flag
    (1 = member, 0 = non-member) and unique identifier index.
    The membership flag is strictly for ground truth evaluation and must NEVER
    be passed to the attack scoring function.
    """

    def __init__(
        self,
        base_dataset: Dataset,
        indices: List[int],
        is_member_flags: List[int],
    ):
        assert len(indices) == len(is_member_flags), "Indices and flags must match in length"
        self.base_dataset = base_dataset
        self.indices = list(indices)
        self.is_member_flags = list(is_member_flags)

    def __len__(self) -> int:
        return len(self.indices)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, int, int, int]:
        """Returns (image, label, is_member, original_index)."""
        orig_idx = self.indices[idx]
        image, label = self.base_dataset[orig_idx]
        is_member = self.is_member_flags[idx]
        return image, int(label), int(is_member), orig_idx


@dataclass
class DataSplits:
    """Encapsulates all datasets and disjoint splits for FL and MIA evaluation."""

    client_datasets: List[Subset]          # 5 client training subsets (600 each)
    members_pool: Subset                   # All 3,000 training members
    nonmembers_pool: Subset                # All 3,000 non-training samples
    attack_calibration: AttackDataset      # 1,000 members + 1,000 non-members
    attack_eval: AttackDataset             # 1,000 members + 1,000 non-members (disjoint from calib)
    global_test: Subset                    # 2,000 official test samples
    class_names: List[str]                 # Human-readable class names
    seed: int                              # Random seed used for reproducibility


def get_data_splits(cfg: FLMIAConfig, seed: int = 42) -> DataSplits:
    """Loads Fashion-MNIST, constructs disjoint FL and attack splits, and verifies hygiene.

    Hygiene guarantees verified by assertions:
    1. Members pool and Non-members pool are strictly disjoint.
    2. Calibration members and Eval members are strictly disjoint subsets of the members pool.
    3. Calibration non-members and Eval non-members are strictly disjoint subsets of non-members.
    4. Client datasets partition the members pool with no overlap.

    Args:
        cfg: Master configuration object.
        seed: Random seed for deterministic index permutations.

    Returns:
        DataSplits dataclass holding all partitions.
    """
    # Locate data directory (check relative paths or existing cache)
    data_dir = cfg.data_dir
    if not os.path.exists(os.path.join(data_dir, "FashionMNIST")) and os.path.exists(
        os.path.join("..", data_dir, "FashionMNIST")
    ):
        data_dir = os.path.join("..", data_dir)

    transform = transforms.ToTensor()

    # Load official Fashion-MNIST datasets
    train_dataset = datasets.FashionMNIST(
        root=data_dir, train=True, download=True, transform=transform
    )
    test_dataset = datasets.FashionMNIST(
        root=data_dir, train=False, download=True, transform=transform
    )

    rng = np.random.RandomState(seed)

    # Permute training indices (total 60,000 available)
    train_indices = rng.permutation(len(train_dataset))

    # 1. Carve 3,000 members and 3,000 non-members from training dataset
    members_size = cfg.num_clients * cfg.client_samples  # 5 * 600 = 3000
    nonmembers_size = cfg.nonmembers_pool_size           # 3000

    member_indices = train_indices[:members_size].tolist()
    nonmember_indices = train_indices[members_size : members_size + nonmembers_size].tolist()

    # Assert mutual exclusivity between members and non-members
    member_set = set(member_indices)
    nonmember_set = set(nonmember_indices)
    assert member_set.isdisjoint(nonmember_set), "CRITICAL: Members and Non-members overlap!"

    # 2. Carve disjoint Calibration and Evaluation sets
    # Attack calibration: 1,000 members + 1,000 non-members
    # Attack eval: 1,000 members + 1,000 non-members
    calib_size = cfg.attack_calibration_size  # 1000
    eval_size = cfg.attack_eval_size          # 1000

    calib_member_indices = member_indices[:calib_size]
    eval_member_indices = member_indices[calib_size : calib_size + eval_size]
    remaining_member_indices = member_indices[calib_size + eval_size :]

    calib_nonmember_indices = nonmember_indices[:calib_size]
    eval_nonmember_indices = nonmember_indices[calib_size : calib_size + eval_size]

    # Hygiene Assertions
    assert set(calib_member_indices).isdisjoint(set(eval_member_indices)), (
        "CRITICAL: Calibration members and Eval members overlap!"
    )
    assert set(calib_nonmember_indices).isdisjoint(set(eval_nonmember_indices)), (
        "CRITICAL: Calibration non-members and Eval non-members overlap!"
    )
    assert len(calib_member_indices) == calib_size
    assert len(eval_member_indices) == eval_size
    assert len(remaining_member_indices) == members_size - (calib_size + eval_size)

    # 3. Partition all 3,000 members across 5 clients (IID random partition, 600 each)
    # Note: Calibration and eval members are contained within the client training data,
    # precisely reflecting the threat model where the attacker probes samples from the training set.
    client_datasets: List[Subset] = []
    allocated_client_indices: List[int] = []

    for i in range(cfg.num_clients):
        client_slice = member_indices[i * cfg.client_samples : (i + 1) * cfg.client_samples]
        client_datasets.append(Subset(train_dataset, client_slice))
        allocated_client_indices.extend(client_slice)

    # Verify clients partition members pool without duplication
    assert len(allocated_client_indices) == members_size
    assert len(set(allocated_client_indices)) == members_size
    assert set(allocated_client_indices) == member_set

    # 4. Construct Attack Datasets (with ground-truth membership flags)
    # Calibration set: 1000 members (flag=1) + 1000 non-members (flag=0)
    calib_combined_indices = calib_member_indices + calib_nonmember_indices
    calib_flags = [1] * len(calib_member_indices) + [0] * len(calib_nonmember_indices)
    attack_calibration = AttackDataset(train_dataset, calib_combined_indices, calib_flags)

    # Evaluation set: 1000 members (flag=1) + 1000 non-members (flag=0)
    eval_combined_indices = eval_member_indices + eval_nonmember_indices
    eval_flags = [1] * len(eval_member_indices) + [0] * len(eval_nonmember_indices)
    attack_eval = AttackDataset(train_dataset, eval_combined_indices, eval_flags)

    # 5. Global test dataset for model evaluation (2,000 samples from official test set)
    test_indices = rng.permutation(len(test_dataset))[: cfg.global_test_size].tolist()
    global_test = Subset(test_dataset, test_indices)

    return DataSplits(
        client_datasets=client_datasets,
        members_pool=Subset(train_dataset, member_indices),
        nonmembers_pool=Subset(train_dataset, nonmember_indices),
        attack_calibration=attack_calibration,
        attack_eval=attack_eval,
        global_test=global_test,
        class_names=CLASS_NAMES,
        seed=seed,
    )
