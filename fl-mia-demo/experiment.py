"""Experiment orchestration module for FL-MIA-Demo.

Runs multi-seed benchmarks for:
1. Federated Learning Baseline (Standard FedAvg, no DP)
2. Federated Learning with DP-SGD (Opacus PrivacyEngine, noise_multiplier=1.0)
3. Differential Privacy noise multiplier sweep (privacy-utility trade-off)

Evaluates identical loss-threshold Membership Inference Attacks (MIA) on both models,
saves scalar results, histories, ROC curves, loss distributions, and model checkpoints.
CLI usage:
  python experiment.py --quick   # Fast smoke test (~1-2 min)
  python experiment.py           # Full multi-seed experiment
"""

import os
import sys
import argparse
import json
import time
from typing import Dict, List, Any
import numpy as np
import torch

from config import FLMIAConfig
from data import get_data_splits, CLASS_NAMES
from model import create_model
from fl import run_fl, evaluate_model
from attack import calibrate_threshold, evaluate_attack


def run_experiment_pipeline(cfg: FLMIAConfig) -> Dict[str, Any]:
    """Runs the complete experimental evaluation across all specified seeds."""
    os.makedirs(cfg.results_dir, exist_ok=True)
    t_start = time.time()

    print("=" * 78)
    print("  FL-MIA-DEMO: FEDERATED LEARNING MEMBERSHIP INFERENCE ATTACK & DEFENSE  ")
    print("=" * 78)
    print(f"Mode: {'QUICK SMOKE TEST' if cfg.quick_mode else 'FULL EXPERIMENT'}")
    print(f"Seeds: {cfg.seeds} | Communication Rounds: {cfg.rounds} | Clients: {cfg.num_clients}")
    print(f"DP Noise: {cfg.noise_multiplier} | Max Grad Norm: {cfg.max_grad_norm} | Delta: {cfg.delta:.6f}")
    print("-" * 78)

    seed_results: List[Dict[str, Any]] = []
    seed0_models: Dict[str, Any] = {}
    seed0_eval_samples: List[Dict[str, Any]] = []

    def make_progress_cb(label: str):
        def _cb(r: int, total: int, m: Dict[str, Any]):
            if r % 5 == 0 or r == total:
                eps_str = f" | eps: {m['epsilon']:.2f}" if m.get("epsilon") is not None else ""
                print(
                    f"        [{label}] Round {r:2d}/{total} | Test Acc: {m['test_acc']*100:5.2f}% | Test Loss: {m['test_loss']:.4f}{eps_str}",
                    flush=True,
                )
        return _cb

    for seed in cfg.seeds:
        print(f"\n>>> Running Experiment for Seed {seed}...", flush=True)
        splits = get_data_splits(cfg, seed=seed)

        # ---------------------------------------------------------------------
        # 1. Baseline Federated Learning (FedAvg, No Privacy)
        # ---------------------------------------------------------------------
        print("  [1/4] Training Baseline FL Model (FedAvg)...", flush=True)
        t0 = time.time()
        base_model, base_hist = run_fl(
            cfg, splits, seed=seed, dp=False, progress_callback=make_progress_cb("Baseline")
        )
        t_base = time.time() - t0
        base_final_acc, base_final_loss = evaluate_model(base_model, splits.global_test)
        print(
            f"        Baseline Finished in {t_base:.1f}s | Test Acc: {base_final_acc*100:.2f}% | Test Loss: {base_final_loss:.4f}",
            flush=True,
        )

        # ---------------------------------------------------------------------
        # 2. DP-SGD Federated Learning (Opacus Differential Privacy)
        # ---------------------------------------------------------------------
        print("  [2/4] Training Protected FL Model (DP-SGD FedAvg)...", flush=True)
        t0 = time.time()
        dp_model, dp_hist = run_fl(
            cfg, splits, seed=seed, dp=True, progress_callback=make_progress_cb("DP-SGD")
        )
        t_dp = time.time() - t0
        dp_final_acc, dp_final_loss = evaluate_model(dp_model, splits.global_test)
        dp_final_eps = dp_hist["epsilon"][-1]
        print(
            f"        DP-SGD Finished in {t_dp:.1f}s | Test Acc: {dp_final_acc*100:.2f}% | Epsilon: {dp_final_eps:.2f}",
            flush=True,
        )

        # ---------------------------------------------------------------------
        # 3. Membership Inference Attack (Baseline Model)
        # ---------------------------------------------------------------------
        print("  [3/4] Calibrating & Executing MIA on Baseline Model...", flush=True)
        base_threshold, base_calib_acc = calibrate_threshold(base_model, splits.attack_calibration)
        base_attack = evaluate_attack(base_model, splits.attack_eval, base_threshold)
        print(
            f"        Baseline Attack AUC: {base_attack['roc_auc']:.4f} | "
            f"Attack Acc: {base_attack['attack_accuracy']*100:.2f}% | "
            f"TPR @ 1% FPR: {base_attack['tpr_at_1_fpr']*100:.2f}%",
            flush=True,
        )

        # ---------------------------------------------------------------------
        # 4. Membership Inference Attack (DP Model)
        # ---------------------------------------------------------------------
        print("  [4/4] Calibrating & Executing MIA on DP-SGD Model...", flush=True)
        dp_threshold, dp_calib_acc = calibrate_threshold(dp_model, splits.attack_calibration)
        dp_attack = evaluate_attack(dp_model, splits.attack_eval, dp_threshold)
        print(
            f"        DP Attack AUC: {dp_attack['roc_auc']:.4f} | "
            f"Attack Acc: {dp_attack['attack_accuracy']*100:.2f}% | "
            f"TPR @ 1% FPR: {dp_attack['tpr_at_1_fpr']*100:.2f}%",
            flush=True,
        )

        # Record seed record
        record = {
            "seed": seed,
            "baseline": {
                "test_acc": base_final_acc,
                "test_loss": base_final_loss,
                "history": base_hist,
                "attack": base_attack,
                "threshold": base_threshold,
            },
            "dp": {
                "test_acc": dp_final_acc,
                "test_loss": dp_final_loss,
                "history": dp_hist,
                "attack": dp_attack,
                "threshold": dp_threshold,
                "epsilon": dp_final_eps,
                "delta": cfg.delta,
            },
        }
        seed_results.append(record)

        # Cache seed 0 models and interactive candidate records for Streamlit UI
        if seed == 0:
            seed0_models["baseline"] = base_model.state_dict()
            seed0_models["dp"] = dp_model.state_dict()

            # Pre-extract evaluation samples so UI can render them instantly
            print("        Caching seed 0 evaluation records for Streamlit UI...", flush=True)
            for idx in range(len(splits.attack_eval)):
                img, label, is_member, orig_idx = splits.attack_eval[idx]
                seed0_eval_samples.append(
                    {
                        "index": idx,
                        "orig_idx": int(orig_idx),
                        "label": int(label),
                        "label_name": CLASS_NAMES[label],
                        "is_member": int(is_member),
                        "image": img.squeeze().numpy().tolist(),  # 28x28 array
                    }
                )

    # -------------------------------------------------------------------------
    # 5. Noise Multiplier Sweep (Privacy-Utility Trade-off on Seed 0)
    # -------------------------------------------------------------------------
    noise_sweep_results: List[Dict[str, Any]] = []
    print("\n>>> Running Differential Privacy Noise Multiplier Sweep (Seed 0)...", flush=True)
    splits0 = get_data_splits(cfg, seed=0)

    for sigma in cfg.noise_sweep_values:
        # If sigma matches default noise multiplier, reuse seed 0 DP results directly
        if abs(sigma - cfg.noise_multiplier) < 1e-5 and len(seed_results) > 0:
            print(f"  Testing Noise Multiplier sigma = {sigma} (reusing seed 0 DP-SGD results)...", flush=True)
            dp_seed0 = seed_results[0]["dp"]
            noise_sweep_results.append(
                {
                    "noise_multiplier": sigma,
                    "epsilon": dp_seed0["epsilon"],
                    "test_acc": dp_seed0["test_acc"],
                    "test_loss": dp_seed0["test_loss"],
                    "attack_auc": dp_seed0["attack"]["roc_auc"],
                    "attack_accuracy": dp_seed0["attack"]["attack_accuracy"],
                    "tpr_at_1_fpr": dp_seed0["attack"]["tpr_at_1_fpr"],
                }
            )
            print(
                f"    sigma={sigma:.1f} -> Epsilon: {dp_seed0['epsilon']:.2f} | Test Acc: {dp_seed0['test_acc']*100:.2f}% | MIA AUC: {dp_seed0['attack']['roc_auc']:.4f}",
                flush=True,
            )
            continue

        print(f"  Testing Noise Multiplier sigma = {sigma}...", flush=True)
        sweep_cfg = FLMIAConfig(**cfg.to_dict())
        sweep_cfg.noise_multiplier = sigma
        sweep_cfg.dp_enabled = True

        sweep_model, sweep_hist = run_fl(
            sweep_cfg, splits0, seed=0, dp=True, progress_callback=make_progress_cb(f"Sweep-sigma{sigma:.1f}")
        )
        sw_acc, sw_loss = evaluate_model(sweep_model, splits0.global_test)
        sw_thresh, _ = calibrate_threshold(sweep_model, splits0.attack_calibration)
        sw_attack = evaluate_attack(sweep_model, splits0.attack_eval, sw_thresh)
        sw_eps = sweep_hist["epsilon"][-1]

        noise_sweep_results.append(
            {
                "noise_multiplier": sigma,
                "epsilon": sw_eps,
                "test_acc": sw_acc,
                "test_loss": sw_loss,
                "attack_auc": sw_attack["roc_auc"],
                "attack_accuracy": sw_attack["attack_accuracy"],
                "tpr_at_1_fpr": sw_attack["tpr_at_1_fpr"],
            }
        )
        print(
            f"    sigma={sigma:.1f} -> Epsilon: {sw_eps:.2f} | Test Acc: {sw_acc*100:.2f}% | MIA AUC: {sw_attack['roc_auc']:.4f}",
            flush=True,
        )

    # -------------------------------------------------------------------------
    # 6. Statistical Aggregation Across Seeds
    # -------------------------------------------------------------------------
    base_accs = [r["baseline"]["test_acc"] for r in seed_results]
    base_losses = [r["baseline"]["test_loss"] for r in seed_results]
    base_aucs = [r["baseline"]["attack"]["roc_auc"] for r in seed_results]
    base_attack_accs = [r["baseline"]["attack"]["attack_accuracy"] for r in seed_results]
    base_tprs = [r["baseline"]["attack"]["tpr_at_1_fpr"] for r in seed_results]

    dp_accs = [r["dp"]["test_acc"] for r in seed_results]
    dp_losses = [r["dp"]["test_loss"] for r in seed_results]
    dp_aucs = [r["dp"]["attack"]["roc_auc"] for r in seed_results]
    dp_attack_accs = [r["dp"]["attack"]["attack_accuracy"] for r in seed_results]
    dp_tprs = [r["dp"]["attack"]["tpr_at_1_fpr"] for r in seed_results]
    dp_eps = [r["dp"]["epsilon"] for r in seed_results]

    summary = {
        "config": cfg.to_dict(),
        "aggregate": {
            "baseline": {
                "test_acc_mean": float(np.mean(base_accs)),
                "test_acc_std": float(np.std(base_accs)),
                "test_loss_mean": float(np.mean(base_losses)),
                "test_loss_std": float(np.std(base_losses)),
                "attack_auc_mean": float(np.mean(base_aucs)),
                "attack_auc_std": float(np.std(base_aucs)),
                "attack_acc_mean": float(np.mean(base_attack_accs)),
                "attack_acc_std": float(np.std(base_attack_accs)),
                "tpr_at_1_fpr_mean": float(np.mean(base_tprs)),
                "tpr_at_1_fpr_std": float(np.std(base_tprs)),
            },
            "dp": {
                "test_acc_mean": float(np.mean(dp_accs)),
                "test_acc_std": float(np.std(dp_accs)),
                "test_loss_mean": float(np.mean(dp_losses)),
                "test_loss_std": float(np.std(dp_losses)),
                "attack_auc_mean": float(np.mean(dp_aucs)),
                "attack_auc_std": float(np.std(dp_aucs)),
                "attack_acc_mean": float(np.mean(dp_attack_accs)),
                "attack_acc_std": float(np.std(dp_attack_accs)),
                "tpr_at_1_fpr_mean": float(np.mean(dp_tprs)),
                "tpr_at_1_fpr_std": float(np.std(dp_tprs)),
                "epsilon_mean": float(np.mean(dp_eps)),
                "epsilon_std": float(np.std(dp_eps)),
                "delta": cfg.delta,
            },
        },
        "seeds": seed_results,
        "noise_sweep": noise_sweep_results,
        "seed0_details": {
            "baseline_history": seed_results[0]["baseline"]["history"],
            "dp_history": seed_results[0]["dp"]["history"],
            "baseline_attack": seed_results[0]["baseline"]["attack"],
            "dp_attack": seed_results[0]["dp"]["attack"],
            "baseline_threshold": seed_results[0]["baseline"]["threshold"],
            "dp_threshold": seed_results[0]["dp"]["threshold"],
        },
    }

    # -------------------------------------------------------------------------
    # 7. Persist Checkpoints and Outputs to results/
    # -------------------------------------------------------------------------
    summary_path = os.path.join(cfg.results_dir, "summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    # Save Seed 0 PyTorch Checkpoints for interactive UI inference
    torch.save(
        seed0_models["baseline"],
        os.path.join(cfg.results_dir, "baseline_model_seed0.pt"),
    )
    torch.save(
        seed0_models["dp"],
        os.path.join(cfg.results_dir, "dp_model_seed0.pt"),
    )

    # Save Seed 0 pre-extracted candidate records
    candidates_path = os.path.join(cfg.results_dir, "eval_candidates_seed0.json")
    with open(candidates_path, "w", encoding="utf-8") as f:
        json.dump(seed0_eval_samples, f)

    elapsed = time.time() - t_start
    print("\n" + "=" * 78)
    print(f"EXPERIMENT COMPLETED SUCCESSFULLY IN {elapsed:.1f}s")
    print("=" * 78)
    print(f"{'Metric':<25} | {'Baseline (No DP)':<22} | {'DP-SGD Protected':<22}")
    print("-" * 78)
    print(
        f"{'Test Accuracy':<25} | {summary['aggregate']['baseline']['test_acc_mean']*100:>5.2f}% +/- {summary['aggregate']['baseline']['test_acc_std']*100:<4.2f}%   | {summary['aggregate']['dp']['test_acc_mean']*100:>5.2f}% +/- {summary['aggregate']['dp']['test_acc_std']*100:<4.2f}%"
    )
    print(
        f"{'Attack ROC-AUC':<25} | {summary['aggregate']['baseline']['attack_auc_mean']:>6.4f} +/- {summary['aggregate']['baseline']['attack_auc_std']:<5.4f}  | {summary['aggregate']['dp']['attack_auc_mean']:>6.4f} +/- {summary['aggregate']['dp']['attack_auc_std']:<5.4f}"
    )
    print(
        f"{'Attack Accuracy':<25} | {summary['aggregate']['baseline']['attack_acc_mean']*100:>5.2f}% +/- {summary['aggregate']['baseline']['attack_acc_std']*100:<4.2f}%   | {summary['aggregate']['dp']['attack_acc_mean']*100:>5.2f}% +/- {summary['aggregate']['dp']['attack_acc_std']*100:<4.2f}%"
    )
    print(
        f"{'Attack TPR @ 1% FPR':<25} | {summary['aggregate']['baseline']['tpr_at_1_fpr_mean']*100:>5.2f}% +/- {summary['aggregate']['baseline']['tpr_at_1_fpr_std']*100:<4.2f}%   | {summary['aggregate']['dp']['tpr_at_1_fpr_mean']*100:>5.2f}% +/- {summary['aggregate']['dp']['tpr_at_1_fpr_std']*100:<4.2f}%"
    )
    print(
        f"{'Privacy Epsilon (eps)':<25} | {'N/A (Infinite)':<22} | {summary['aggregate']['dp']['epsilon_mean']:>5.2f} +/- {summary['aggregate']['dp']['epsilon_std']:<4.2f}"
    )
    print(f"{'Target Delta (delta)':<25} | {'N/A':<22} | {cfg.delta:.6f}")
    print("=" * 78)
    print(f"Results saved to: {os.path.abspath(cfg.results_dir)}")

    return summary


def main():
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="Run FL-MIA and DP Defense experiments.")
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Run rapid smoke test (1 seed, 10 rounds) in ~1-2 minutes.",
    )
    parser.add_argument(
        "--rounds",
        type=int,
        default=None,
        help="Override total communication rounds.",
    )
    args = parser.parse_args()

    cfg = FLMIAConfig()
    if args.quick:
        cfg.apply_quick_mode()
    if args.rounds is not None:
        cfg.rounds = args.rounds

    run_experiment_pipeline(cfg)


if __name__ == "__main__":
    main()
