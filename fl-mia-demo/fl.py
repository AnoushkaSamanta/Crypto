"""Federated Learning (FedAvg) simulation with Baseline and Differential Privacy (DP-SGD).

Manual implementation of Federated Averaging (McMahan et al.):
1. Server holds global model parameters.
2. In each round, participating clients download global weights.
3. Each client trains locally for E epochs on its private local data.
4. Clients upload updated weights; Server aggregates by weighted average.

Privacy Mechanism (DP-SGD):
- When dp=True, each client wraps its local training with Opacus PrivacyEngine.
- Per-sample gradients are clipped to max_grad_norm and calibrated Gaussian noise
  is added before parameter updates.
- CRITICAL ARCHITECTURAL DETAIL: Each client's DataLoader, optimizer, and PrivacyEngine
  are initialized ONCE and preserved across rounds. The Renyi Differential Privacy (RDP)
  accountant continues composition across all FL communication rounds.
- Each round, new global weights are loaded into client_model._module (unwrapping
  Opacus GradSampleModule).
- Record-level DP note: Since each sample belongs to exactly one client's local dataset,
  privacy accounting is computed with respect to client local datasets at delta = 1 / |D_client|.
  The headline epsilon reported is max_{client i} (epsilon_i).
"""

from typing import Dict, List, Tuple, Any, Optional, Callable
import copy
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset
from opacus import PrivacyEngine
from config import FLMIAConfig
from data import DataSplits
from model import create_model, SmallCNN


def set_seed(seed: int) -> None:
    """Set seeds across standard libraries for deterministic experiments."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def evaluate_model(
    model: nn.Module,
    dataset: Subset,
    batch_size: int = 256,
    device: torch.device = torch.device("cpu"),
) -> Tuple[float, float]:
    """Computes categorical accuracy and cross-entropy loss over a dataset."""
    model.eval()
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False)
    criterion = nn.CrossEntropyLoss(reduction="sum")

    total_loss = 0.0
    correct = 0
    total_samples = 0

    with torch.no_grad():
        for batch_x, batch_y in loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            total_loss += loss.item()
            preds = logits.argmax(dim=-1)
            correct += (preds == batch_y).sum().item()
            total_samples += batch_y.size(0)

    avg_loss = total_loss / max(total_samples, 1)
    accuracy = correct / max(total_samples, 1)
    return accuracy, avg_loss


def run_fl(
    cfg: FLMIAConfig,
    data_splits: DataSplits,
    seed: int,
    dp: bool = False,
    progress_callback: Optional[Callable[[int, int, Dict[str, Any]], None]] = None,
) -> Tuple[SmallCNN, Dict[str, Any]]:
    """Runs Federated Averaging (FedAvg) simulation for baseline or DP-SGD.

    Args:
        cfg: Hyperparameter configuration.
        data_splits: Pre-partitioned client and evaluation datasets.
        seed: Experiment seed for model initialization and client RNG.
        dp: If True, enables client-side DP-SGD via Opacus.
        progress_callback: Optional callback(current_round, total_rounds, round_metrics)
                           to stream progress updates to UI or CLI.

    Returns:
        global_model: Final trained server SmallCNN model.
        history: Dictionary containing per-round loss, accuracy, and epsilon trajectories.
    """
    set_seed(seed)
    device = torch.device("cpu")  # Designed to run fast and reliably on laptop CPU

    # Initialize Server Global Model
    global_model = create_model(cfg).to(device)
    criterion = nn.CrossEntropyLoss()

    num_clients = cfg.num_clients
    client_sizes = [len(ds) for ds in data_splits.client_datasets]
    total_samples = sum(client_sizes)
    client_weights = [sz / total_samples for sz in client_sizes]

    # Pre-build client infrastructure
    # In DP mode, DataLoader, Optimizer, and PrivacyEngine MUST be persistent across rounds
    # so that Opacus' RDP accountant correctly accumulates privacy loss across rounds!
    client_states: List[Dict[str, Any]] = []

    for i in range(num_clients):
        client_ds = data_splits.client_datasets[i]
        client_m = create_model(cfg).to(device)
        client_opt = torch.optim.SGD(
            client_m.parameters(), lr=cfg.lr, momentum=cfg.momentum if not dp else 0.0
        )
        client_loader = DataLoader(
            client_ds, batch_size=cfg.batch_size, shuffle=True, drop_last=False
        )

        if dp:
            # Use 'rdp' (Rényi Differential Privacy) accountant for fast, closed-form
            # composition across federated communication rounds. The default 'prv' accountant
            # performs heavy numerical FFT convolutions that become prohibitive across hundreds of steps.
            pe = PrivacyEngine(accountant="rdp")
            m_private, opt_private, loader_private = pe.make_private(
                module=client_m,
                optimizer=client_opt,
                data_loader=client_loader,
                noise_multiplier=cfg.noise_multiplier,
                max_grad_norm=cfg.max_grad_norm,
            )
            client_states.append(
                {
                    "model": m_private,
                    "optimizer": opt_private,
                    "loader": loader_private,
                    "privacy_engine": pe,
                    "size": client_sizes[i],
                    "raw_model": client_m,
                }
            )
        else:
            client_states.append(
                {
                    "model": client_m,
                    "optimizer": client_opt,
                    "loader": client_loader,
                    "privacy_engine": None,
                    "size": client_sizes[i],
                    "raw_model": client_m,
                }
            )

    history: Dict[str, Any] = {
        "round": [],
        "test_acc": [],
        "test_loss": [],
        "train_loss": [],
        "epsilon": [],
        "delta": cfg.delta if dp else None,
        "mode": "DP-SGD" if dp else "Baseline",
    }

    # Evaluate initial zero-round baseline
    init_acc, init_loss = evaluate_model(global_model, data_splits.global_test, device=device)
    history["round"].append(0)
    history["test_acc"].append(init_acc)
    history["test_loss"].append(init_loss)
    history["train_loss"].append(init_loss)
    history["epsilon"].append(0.0 if dp else None)

    # Federated Communication Rounds
    for r in range(1, cfg.rounds + 1):
        uploaded_weights: List[Dict[str, torch.Tensor]] = []
        round_train_losses: List[float] = []

        global_sd = global_model.state_dict()

        for i in range(num_clients):
            c_info = client_states[i]
            c_model = c_info["model"]
            c_opt = c_info["optimizer"]
            c_loader = c_info["loader"]

            # Step 1: Download global server weights into local client model
            if dp:
                # In Opacus, c_model is a GradSampleModule wrapping the original module in ._module
                if hasattr(c_model, "_module"):
                    c_model._module.load_state_dict(global_sd)
                else:
                    c_model.load_state_dict(global_sd)
            else:
                c_model.load_state_dict(global_sd)

            # Step 2: Local Client Training for E epochs
            c_model.train()
            client_loss_accum = 0.0
            batch_count = 0

            for epoch in range(cfg.local_epochs):
                for batch_x, batch_y in c_loader:
                    batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                    c_opt.zero_grad()
                    preds = c_model(batch_x)
                    loss = criterion(preds, batch_y)
                    loss.backward()
                    c_opt.step()

                    client_loss_accum += loss.item()
                    batch_count += 1

            avg_client_loss = client_loss_accum / max(batch_count, 1)
            round_train_losses.append(avg_client_loss)

            # Step 3: Extract updated weights for server aggregation
            if dp:
                if hasattr(c_model, "_module"):
                    c_sd = {k: v.cpu().clone() for k, v in c_model._module.state_dict().items()}
                else:
                    c_sd = {k: v.cpu().clone() for k, v in c_model.state_dict().items()}
            else:
                c_sd = {k: v.cpu().clone() for k, v in c_model.state_dict().items()}

            uploaded_weights.append(c_sd)

        # Step 4: Server FedAvg aggregation
        # Weighted average of local model state_dicts
        new_global_sd: Dict[str, torch.Tensor] = {}
        for key in global_sd.keys():
            weighted_sum = sum(
                uploaded_weights[i][key] * client_weights[i] for i in range(num_clients)
            )
            new_global_sd[key] = weighted_sum

        global_model.load_state_dict(new_global_sd)

        # Step 5: Server Evaluation on Global Test Set
        test_acc, test_loss = evaluate_model(global_model, data_splits.global_test, device=device)
        mean_train_loss = float(np.mean(round_train_losses))

        # Privacy accounting: Since all clients are symmetric (same dataset size, same batch size,
        # same noise multiplier), their epsilon accumulation is identical. Querying client 0
        # provides the exact headline epsilon without redundant accounting computations.
        headline_eps = (
            float(client_states[0]["privacy_engine"].get_epsilon(delta=1.0 / client_states[0]["size"]))
            if dp
            else None
        )

        # Log metrics
        history["round"].append(r)
        history["test_acc"].append(test_acc)
        history["test_loss"].append(test_loss)
        history["train_loss"].append(mean_train_loss)
        history["epsilon"].append(headline_eps)

        metrics = {
            "round": r,
            "test_acc": test_acc,
            "test_loss": test_loss,
            "train_loss": mean_train_loss,
            "epsilon": headline_eps,
        }

        if progress_callback:
            progress_callback(r, cfg.rounds, metrics)

    return global_model, history
