"""Membership Inference Attack (MIA) and privacy risk metrics for FL-MIA-Demo.

Implements the black-box loss-threshold attack (Yeom et al.):
- An attacker queries the released global model with a candidate sample (x, y).
- The attacker calculates the per-example cross-entropy loss: loss(f(x), y).
- Score = -loss (higher score corresponds to lower loss, indicating membership).
- The decision threshold is chosen exclusively on attack_calibration (maximizing balanced accuracy).
- Generalization of privacy vulnerability is then evaluated exclusively on attack_eval.
"""

from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from sklearn.metrics import roc_auc_score, roc_curve, accuracy_score
from data import AttackDataset, CLASS_NAMES


def compute_sample_scores(
    model: nn.Module,
    dataset: AttackDataset,
    batch_size: int = 256,
    device: torch.device = torch.device("cpu"),
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Computes attack scores (-loss), losses, true labels, and ground truth membership flags.

    Args:
        model: Target model under evaluation.
        dataset: AttackDataset yielding (image, label, is_member, original_index).
        batch_size: Batch size for rapid evaluation.
        device: Evaluation compute device.

    Returns:
        losses: Array of cross-entropy losses for each sample.
        scores: Array of membership scores (-loss).
        true_labels: Array of true class labels.
        is_member_flags: Ground truth membership indicators (1 = member, 0 = non-member).
    """
    model.eval()
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False)
    criterion = nn.CrossEntropyLoss(reduction="none")

    all_losses: List[float] = []
    all_labels: List[int] = []
    all_flags: List[int] = []

    with torch.no_grad():
        for batch_x, batch_y, batch_flags, _ in loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            logits = model(batch_x)
            losses = criterion(logits, batch_y)
            all_losses.extend(losses.cpu().numpy().tolist())
            all_labels.extend(batch_y.cpu().numpy().tolist())
            all_flags.extend(batch_flags.numpy().tolist())

    losses_arr = np.array(all_losses, dtype=np.float64)
    scores_arr = -losses_arr
    labels_arr = np.array(all_labels, dtype=np.int64)
    flags_arr = np.array(all_flags, dtype=np.int64)

    return losses_arr, scores_arr, labels_arr, flags_arr


def calibrate_threshold(
    model: nn.Module,
    calibration_dataset: AttackDataset,
    device: torch.device = torch.device("cpu"),
) -> Tuple[float, float]:
    """Calibrates the optimal attack decision threshold on the calibration split.

    The threshold is selected to maximize balanced accuracy (0.5 * (TPR + TNR))
    on calibration samples ONLY, preventing data snooping or threshold overfitting.

    Args:
        model: Evaluated global model.
        calibration_dataset: Calibration partition (1,000 members + 1,000 non-members).
        device: Compute device.

    Returns:
        best_threshold: Calibrated score threshold tau.
        best_balanced_acc: Calibration balanced accuracy at tau.
    """
    losses, scores, _, y_true = compute_sample_scores(
        model, calibration_dataset, device=device
    )

    fpr, tpr, thresholds = roc_curve(y_true, scores)
    balanced_accs = 0.5 * (tpr + (1.0 - fpr))
    best_idx = int(np.argmax(balanced_accs))

    best_threshold = float(thresholds[best_idx])
    best_balanced_acc = float(balanced_accs[best_idx])

    return best_threshold, best_balanced_acc


def compute_tpr_at_fixed_fpr(
    fpr_array: np.ndarray,
    tpr_array: np.ndarray,
    target_fpr: float = 0.01,
) -> float:
    """Computes True Positive Rate (TPR) at low False Positive Rate (FPR), e.g. 1% FPR.

    High TPR at low FPR reflects severe privacy breaches for the most vulnerable users.
    """
    valid_indices = np.where(fpr_array <= target_fpr)[0]
    if len(valid_indices) == 0:
        return 0.0
    return float(np.max(tpr_array[valid_indices]))


def evaluate_attack(
    model: nn.Module,
    eval_dataset: AttackDataset,
    threshold: float,
    device: torch.device = torch.device("cpu"),
) -> Dict[str, Any]:
    """Evaluates the loss-threshold MIA on the unseen evaluation partition.

    Args:
        model: Target model under attack.
        eval_dataset: Evaluation partition (1,000 members + 1,000 non-members).
        threshold: Pre-calibrated decision threshold tau.
        device: Compute device.

    Returns:
        Dictionary of attack performance metrics, loss statistics, and ROC curve coordinates.
    """
    losses, scores, _, y_true = compute_sample_scores(model, eval_dataset, device=device)

    # Predictions: score >= threshold (i.e. loss <= -threshold) -> Member (1)
    predictions = (scores >= threshold).astype(int)

    # Metric 1: ROC-AUC on the evaluation partition
    roc_auc = float(roc_auc_score(y_true, scores))

    # Metric 2: ROC curve coordinates
    fpr, tpr, _ = roc_curve(y_true, scores)

    # Metric 3: Attack accuracy at calibrated threshold
    attack_acc = float(accuracy_score(y_true, predictions))

    # Metric 4: TPR at 1% FPR (high-confidence privacy risk)
    tpr_at_1_fpr = compute_tpr_at_fixed_fpr(fpr, tpr, target_fpr=0.01)

    # Metric 5: Distribution statistics for member and non-member losses
    member_losses = losses[y_true == 1]
    nonmember_losses = losses[y_true == 0]

    return {
        "roc_auc": roc_auc,
        "attack_accuracy": attack_acc,
        "tpr_at_1_fpr": tpr_at_1_fpr,
        "calibrated_threshold": float(threshold),
        "mean_member_loss": float(np.mean(member_losses)),
        "std_member_loss": float(np.std(member_losses)),
        "mean_nonmember_loss": float(np.mean(nonmember_losses)),
        "std_nonmember_loss": float(np.std(nonmember_losses)),
        "member_losses": member_losses.tolist(),
        "nonmember_losses": nonmember_losses.tolist(),
        "roc_curve": {
            "fpr": fpr.tolist(),
            "tpr": tpr.tolist(),
        },
    }


def attack_single(
    model: nn.Module,
    x: torch.Tensor,
    y: int,
    threshold: float,
    device: torch.device = torch.device("cpu"),
) -> Dict[str, Any]:
    """Executes a black-box membership query on an individual candidate (x, y).

    CRITICAL HYGIENE: This function NEVER receives or inspects the true membership label.
    It operates purely from the attacker's perspective, querying the model on (x, y),
    observing logits, confidence, and loss, and comparing the resulting score against
    the pre-calibrated threshold.

    Args:
        model: Released target model.
        x: Candidate input image tensor of shape (1, 28, 28) or (1, 1, 28, 28).
        y: Candidate ground truth class index (e.g. 7 for Sneaker).
        threshold: Attacker's decision threshold tau.
        device: Compute device.

    Returns:
        dict containing predicted class, confidence, loss, score, threshold, and guess.
    """
    model.eval()
    if x.dim() == 3:
        x = x.unsqueeze(0)
    x = x.to(device)

    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=-1)
        pred_class = int(logits.argmax(dim=-1).item())
        confidence = float(probs[0, pred_class].item())

        target_tensor = torch.tensor([y], dtype=torch.long, device=device)
        criterion = nn.CrossEntropyLoss()
        loss_val = float(criterion(logits, target_tensor).item())

    score = -loss_val
    guess = "Member" if score >= threshold else "Non-member"
    pred_label = CLASS_NAMES[pred_class] if 0 <= pred_class < len(CLASS_NAMES) else str(pred_class)

    return {
        "predicted_class": pred_class,
        "predicted_label": pred_label,
        "confidence": confidence,
        "loss": loss_val,
        "score": score,
        "threshold": threshold,
        "guess": guess,
    }
