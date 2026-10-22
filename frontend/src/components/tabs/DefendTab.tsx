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
import { ShieldCheck } from "@phosphor-icons/react";

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
      <div className="tab-narrative !border-emerald-500 !bg-emerald-50/60 !text-slate-700">
        &ldquo;We changed the training process, not the chart.&rdquo;
      </div>

      {/* DP Settings Banner */}
      <div className="clay-card p-5 flex flex-wrap items-center justify-between gap-4 border-emerald-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck size={26} weight="duotone" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span className="uppercase tracking-wider">Differentially Private FedAvg</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
                PyTorch Opacus
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Per-sample gradient clipping + calibrated Gaussian noise + Rényi DP accountant.
            </p>
          </div>
        </div>

        {/* 4 Metric Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-xs">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Clip Norm (C)</div>
            <div className="text-sm font-bold text-slate-800">{config.max_grad_norm.toFixed(1)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-xs">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Noise Mult (σ)</div>
            <div className="text-sm font-bold text-slate-800">{config.noise_multiplier.toFixed(1)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-xs">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Target Delta (δ)</div>
            <div className="text-sm font-bold text-purple-700">{config.delta.toFixed(5)}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-xs">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Headline Epsilon (ε)</div>
            <div className="text-sm font-bold text-emerald-700">{finalEpsilon.toFixed(2)}</div>
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
        <div className="clay-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Global Test Accuracy (%) under DP-SGD
            </h4>
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Final: {chartData[chartData.length - 1]?.testAcc}%
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="round" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[40, 80]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#1E232F",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="testAcc"
                  name="DP Test Acc (%)"
                  stroke="#059669"
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: "#059669" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Privacy Budget Epsilon Accumulation */}
        <div className="clay-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Cumulative Privacy Loss ε over Rounds
            </h4>
            <span className="text-xs font-mono font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Rényi DP Composition
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="round" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#1E232F",
                    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                  }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="epsilon"
                  name="Accumulated ε (Delta = 1/600)"
                  stroke="#7C3AED"
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: "#7C3AED" }}
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
