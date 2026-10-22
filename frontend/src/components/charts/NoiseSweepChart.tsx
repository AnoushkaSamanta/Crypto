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
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Privacy-Utility Pareto Tradeoff (Noise Multiplier Sweep)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Increasing noise (σ) drops attack AUC (increasing privacy) with a controlled accuracy trade-off.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-black bg-[#D4FF00] px-3 py-1 rounded-full">
          Evaluated across σ ∈ [0.5, 1.0, 2.0]
        </div>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="sigma" stroke="#64748B" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="left"
              stroke="#000000"
              tick={{ fontSize: 11 }}
              domain={[50, 90]}
              label={{ value: "Accuracy (%)", angle: -90, position: "insideLeft", offset: 15, fill: "#000000", fontSize: 11 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#D97706"
              tick={{ fontSize: 11 }}
              domain={[0.45, 0.75]}
              label={{ value: "Attack AUC", angle: 90, position: "insideRight", offset: 15, fill: "#D97706", fontSize: 11 }}
            />
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
              yAxisId="left"
              type="monotone"
              dataKey="testAcc"
              name="Global Test Acc (%)"
              stroke="#000000"
              strokeWidth={2.4}
              dot={{ r: 3.5, fill: "#000000" }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="attackAuc"
              name="Attack ROC-AUC"
              stroke="#D97706"
              strokeWidth={2.2}
              dot={{ r: 3.5, fill: "#D97706" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
