"use client";

import React from "react";
import { DpHistory, ExperimentConfig, Candidate } from "@/types";
import { DpSgdFlow } from "../diagrams/DpSgdFlow";
import { CandidateComparator } from "../defend/CandidateComparator";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { ShieldCheck, LockKey, ChartLineUp } from "@phosphor-icons/react";

interface DefendTabProps {
  dpHistory: DpHistory;
  config: ExperimentConfig;
  candidate: Candidate;
  baselineThreshold: number;
  dpThreshold: number;
}

export const DefendTab: React.FC<DefendTabProps> = ({
  dpHistory,
  config,
  candidate,
  baselineThreshold,
  dpThreshold,
}) => {
  const finalEpsilon = dpHistory.epsilon[dpHistory.epsilon.length - 1];

  const chartData = dpHistory.round.slice(1).map((r, i) => ({
    round: r,
    testAcc: parseFloat((dpHistory.test_acc[i + 1] * 100).toFixed(2)),
    epsilon: parseFloat(dpHistory.epsilon[i + 1].toFixed(2)),
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Narrative Callout */}
      <div className="tab-narrative border-emerald-500">
        &ldquo;We changed the training process, not the chart.&rdquo;
      </div>

      {/* DP Settings Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/80 border border-emerald-500/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck size={28} weight="duotone" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Differentially Private FedAvg</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PyTorch Opacus
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Per-sample gradient clipping + calibrated Gaussian noise + Rényi DP accountant.
            </p>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase font-sans">Clip Norm (C)</div>
            <div className="text-sm font-bold text-slate-200">{config.max_grad_norm.toFixed(1)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase font-sans">Noise Mult (σ)</div>
            <div className="text-sm font-bold text-slate-200">{config.noise_multiplier.toFixed(1)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase font-sans">Target Delta (δ)</div>
            <div className="text-sm font-bold text-purple-300">{config.delta.toFixed(5)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-500 uppercase font-sans">Headline Epsilon (ε)</div>
            <div className="text-sm font-bold text-emerald-400">{finalEpsilon.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* React Flow DP-SGD Internal Pipeline Diagram */}
      <DpSgdFlow
        maxGradNorm={config.max_grad_norm}
        noiseMultiplier={config.noise_multiplier}
        epsilon={finalEpsilon}
      />

      {/* Dual Charts: DP Accuracy & Cumulative Epsilon Accumulation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
        {/* DP Test Accuracy */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Global Test Accuracy (%) under DP-SGD
            </h4>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Final: {chartData[chartData.length - 1]?.testAcc}%
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="round" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[40, 80]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="testAcc"
                  name="DP Test Acc (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10b981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Privacy Budget Epsilon Accumulation */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-slate-200">
              Cumulative Privacy Loss ε over Rounds
            </h4>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              Rényi DP Composition
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
                <XAxis dataKey="round" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "10px",
                    fontSize: "12px",
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="epsilon"
                  name="Accumulated ε (Delta = 1/600)"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#8b5cf6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Side-by-Side Candidate Prober Comparator */}
      <CandidateComparator
        candidate={candidate}
        baselineThreshold={baselineThreshold}
        dpThreshold={dpThreshold}
      />
    </div>
  );
};
