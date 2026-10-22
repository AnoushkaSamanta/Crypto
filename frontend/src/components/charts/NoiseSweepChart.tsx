"use client";

import React from "react";
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
import { NoiseSweepItem } from "@/types";

interface NoiseSweepChartProps {
  sweepData: NoiseSweepItem[];
}

export const NoiseSweepChart: React.FC<NoiseSweepChartProps> = ({ sweepData }) => {
  const data = sweepData.map((d) => ({
    sigma: `σ = ${d.noise_multiplier}`,
    noise_multiplier: d.noise_multiplier,
    epsilon: d.epsilon,
    testAcc: parseFloat((d.test_acc * 100).toFixed(2)),
    attackAuc: parseFloat(d.attack_auc.toFixed(3)),
  }));

  return (
    <div className="glass-panel p-5 rounded-2xl w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Privacy-Utility Pareto Tradeoff (Noise Sweep)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Increasing noise multiplier (σ) lowers attack AUC (higher privacy) while modestly reducing test accuracy.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
          Evaluated across σ ∈ [0.5, 1.0, 2.0]
        </div>
      </div>

      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
            <XAxis dataKey="sigma" stroke="#64748b" tick={{ fontSize: 11 }} />
            {/* Primary Y-axis for Test Acc (%) */}
            <YAxis
              yAxisId="left"
              stroke="#3b82f6"
              tick={{ fontSize: 11 }}
              domain={[50, 90]}
              label={{ value: "Accuracy (%)", angle: -90, position: "insideLeft", offset: 15, fill: "#3b82f6", fontSize: 11 }}
            />
            {/* Secondary Y-axis for Attack AUC */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              tick={{ fontSize: 11 }}
              domain={[0.45, 0.75]}
              label={{ value: "Attack AUC", angle: 90, position: "insideRight", offset: 15, fill: "#f59e0b", fontSize: 11 }}
            />
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
              yAxisId="left"
              type="monotone"
              dataKey="testAcc"
              name="Global Test Acc (%)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3b82f6" }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="attackAuc"
              name="Attack ROC-AUC"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f59e0b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
