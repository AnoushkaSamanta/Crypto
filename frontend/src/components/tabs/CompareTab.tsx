"use client";

import React from "react";
import { AggMetrics, RocCurve, NoiseSweepItem } from "@/types";
import { RocCurveChart } from "../charts/RocCurveChart";
import { NoiseSweepChart } from "../charts/NoiseSweepChart";
import {
  Scales,
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  Info,
} from "@phosphor-icons/react";

interface CompareTabProps {
  baselineAgg: AggMetrics;
  dpAgg: AggMetrics;
  baselineRoc: RocCurve;
  dpRoc: RocCurve;
  baselineAuc: number;
  dpAuc: number;
  noiseSweep: NoiseSweepItem[];
}

export const CompareTab: React.FC<CompareTabProps> = ({
  baselineAgg,
  dpAgg,
  baselineRoc,
  dpRoc,
  baselineAuc,
  dpAuc,
  noiseSweep,
}) => {
  const metrics = [
    {
      name: "Attack ROC-AUC (Lower is safer)",
      baseline: `${baselineAgg.attack_auc_mean.toFixed(4)} ± ${baselineAgg.attack_auc_std.toFixed(4)}`,
      dp: `${dpAgg.attack_auc_mean.toFixed(4)} ± ${dpAgg.attack_auc_std.toFixed(4)}`,
      impact: `${(dpAgg.attack_auc_mean - baselineAgg.attack_auc_mean).toFixed(4)} (drops near 0.50 random guess)`,
      highlight: true,
    },
    {
      name: "Attack Accuracy @ Calibrated τ",
      baseline: `${(baselineAgg.attack_acc_mean * 100).toFixed(2)}% ± ${(baselineAgg.attack_acc_std * 100).toFixed(2)}%`,
      dp: `${(dpAgg.attack_acc_mean * 100).toFixed(2)}% ± ${(dpAgg.attack_acc_std * 100).toFixed(2)}%`,
      impact: `${((dpAgg.attack_acc_mean - baselineAgg.attack_acc_mean) * 100).toFixed(2)}% (reduced to coin-flip)`,
      highlight: true,
    },
    {
      name: "Attack TPR @ 1% FPR",
      baseline: `${(baselineAgg.tpr_at_1_fpr_mean * 100).toFixed(2)}% ± ${(baselineAgg.tpr_at_1_fpr_std * 100).toFixed(2)}%`,
      dp: `${(dpAgg.tpr_at_1_fpr_mean * 100).toFixed(2)}% ± ${(dpAgg.tpr_at_1_fpr_std * 100).toFixed(2)}%`,
      impact: `${((dpAgg.tpr_at_1_fpr_mean - baselineAgg.tpr_at_1_fpr_mean) * 100).toFixed(2)}% (outliers protected)`,
      highlight: false,
    },
    {
      name: "Global Test Accuracy (Utility)",
      baseline: `${(baselineAgg.test_acc_mean * 100).toFixed(2)}% ± ${(baselineAgg.test_acc_std * 100).toFixed(2)}%`,
      dp: `${(dpAgg.test_acc_mean * 100).toFixed(2)}% ± ${(dpAgg.test_acc_std * 100).toFixed(2)}%`,
      impact: `${((dpAgg.test_acc_mean - baselineAgg.test_acc_mean) * 100).toFixed(2)}% accuracy trade-off`,
      highlight: false,
    },
    {
      name: "Global Test Loss",
      baseline: `${baselineAgg.test_loss_mean.toFixed(4)} ± ${baselineAgg.test_loss_std.toFixed(4)}`,
      dp: `${dpAgg.test_loss_mean.toFixed(4)} ± ${dpAgg.test_loss_std.toFixed(4)}`,
      impact: `+${(dpAgg.test_loss_mean - baselineAgg.test_loss_mean).toFixed(4)}`,
      highlight: false,
    },
    {
      name: "Formal Privacy Budget (ε)",
      baseline: "∞ (No formal guarantee)",
      dp: `${dpAgg.epsilon_mean?.toFixed(2)} ± ${dpAgg.epsilon_std?.toFixed(2)}`,
      impact: `Provable bound (δ = ${dpAgg.delta?.toFixed(5)})`,
      highlight: true,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Narrative Callout */}
      <div className="tab-narrative border-amber-500">
        &ldquo;By modifying client gradient updates with clipping and Gaussian noise,
        DP-SGD substantially reduces membership leakage at an acceptable utility cost.&rdquo;
      </div>

      {/* Side-by-Side Performance Comparison Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Scales size={20} weight="duotone" className="text-amber-400" />
          <h4 className="text-sm font-bold text-slate-100">
            Multi-Seed Empirical Benchmark Matrix (3 Seeds, 30 Communication Rounds)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Evaluation Metric</th>
                <th className="py-3 px-4 text-rose-300">Baseline (No DP)</th>
                <th className="py-3 px-4 text-emerald-300">DP-SGD Protected</th>
                <th className="py-3 px-4 text-slate-300">Privacy & Utility Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {metrics.map((row, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    row.highlight ? "bg-slate-900/20" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-rose-400 font-bold">{row.baseline}</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">{row.dp}</td>
                  <td className="py-3 px-4 text-slate-300 font-sans text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {row.impact}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlaid ROC Curve (Baseline vs DP-SGD vs Random Guess) */}
      <RocCurveChart
        baselineRoc={baselineRoc}
        baselineAuc={baselineAuc}
        dpRoc={dpRoc}
        dpAuc={dpAuc}
        showOverlay={true}
      />

      {/* Noise Sweep Pareto Tradeoff */}
      {noiseSweep && noiseSweep.length > 0 && (
        <NoiseSweepChart sweepData={noiseSweep} />
      )}

      {/* Honest Limitations & Nuances Box */}
      <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/40 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <WarningCircle size={22} weight="duotone" />
          <span>Honest Limitations & Privacy Engineering Nuances</span>
        </div>
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
          <p>
            <strong className="text-amber-300">1. DP mitigates, but does not eradicate all leakage:</strong> At smaller noise multipliers (e.g. σ ≤ 0.5), residual membership signal remains detectable by empirical attacks.
          </p>
          <p>
            <strong className="text-amber-300">2. Scope of Differential Privacy:</strong> The reported ε represents record-level Differential Privacy with respect to each client&apos;s local dataset (δ = 1/600), composed across all FL communication rounds using Opacus&apos; Rényi DP accountant.
          </p>
          <p>
            <strong className="text-amber-300">3. Attacker Threat Model:</strong> This evaluation assumes a black-box attacker who queries the released global model with loss queries. Stronger white-box attackers with access to intermediate client updates could theoretically extract additional signal.
          </p>
          <p>
            <strong className="text-amber-300">4. Secure Aggregation vs DP:</strong> Secure Aggregation (SecAgg) protects model updates <em>in transit</em> from clients to the server, but offers ZERO protection for the released final model! Only Differential Privacy modifies the training mechanics to prevent the model from memorizing individual records.
          </p>
          <p>
            <strong className="text-amber-300">5. Scale of Experiment:</strong> This benchmark is designed for fast, reproducible laptop execution in &lt; 10 minutes on CPU using Fashion-MNIST. Production cross-device federated deployments involve thousands of non-IID clients and larger networks.
          </p>
        </div>
      </div>
    </div>
  );
};
