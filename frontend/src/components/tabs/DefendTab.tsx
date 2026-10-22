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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Narrative Callout */}
      <div className="tab-narrative">
        &ldquo;We changed the training process, not the chart.&rdquo;
      </div>

      {/* DP Settings Banner - Frameless */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <div>
          <div className="text-xs font-bold text-black flex items-center gap-2">
            <span className="uppercase tracking-wider">Differentially Private FedAvg</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#D4FF00] text-black font-bold">
              Opacus 1.6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Per-sample gradient clipping + calibrated Gaussian noise + Rényi DP accountant.
          </p>
        </div>

        {/* 4 Metric Badges - Frameless Tonal Wells */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-4 py-2 rounded-2xl bg-[#F7F8FA] text-center">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Clip Norm (C)</div>
            <div className="text-sm font-bold text-black mt-0.5">{config.max_grad_norm.toFixed(1)}</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#F7F8FA] text-center">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Noise Mult (σ)</div>
            <div className="text-sm font-bold text-black mt-0.5">{config.noise_multiplier.toFixed(1)}</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#F7F8FA] text-center">
            <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">Target Delta (δ)</div>
            <div className="text-sm font-bold text-black mt-0.5">{config.delta.toFixed(5)}</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#D4FF00] text-center">
            <div className="text-[10px] text-black/70 uppercase font-sans font-bold">Headline Epsilon</div>
            <div className="text-sm font-black text-black mt-0.5">ε = {finalEpsilon.toFixed(2)}</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        {/* DP Test Accuracy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">
              Global Test Accuracy (%) under DP-SGD
            </h4>
            <span className="text-xs font-mono font-bold text-black bg-[#D4FF00] px-3 py-1 rounded-full">
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
                  stroke="#10B981"
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: "#10B981" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Privacy Budget Epsilon Accumulation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">
              Cumulative Privacy Loss ε over Rounds
            </h4>
            <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
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
                  stroke="#000000"
                  strokeWidth={2.2}
                  dot={{ r: 2.5, fill: "#000000" }}
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
