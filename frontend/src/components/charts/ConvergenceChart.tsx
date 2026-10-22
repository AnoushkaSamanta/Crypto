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
import { TrainingHistory } from "@/types";

interface ConvergenceChartProps {
  history: TrainingHistory;
  maxRound?: number;
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({
  history,
  maxRound,
}) => {
  const limit = maxRound !== undefined ? maxRound : history.round.length - 1;

  const data = history.round.slice(0, limit + 1).map((r, i) => ({
    round: r,
    testAcc: parseFloat((history.test_acc[i] * 100).toFixed(2)),
    trainLoss: parseFloat(history.train_loss[i].toFixed(4)),
    testLoss: parseFloat(history.test_loss[i].toFixed(4)),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
      {/* Accuracy Chart */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Global Test Accuracy (%) over Rounds
          </h4>
          <span className="text-xs font-mono font-bold text-black bg-[#D4FF00] px-3 py-1 rounded-full">
            Current: {data[data.length - 1]?.testAcc}%
          </span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="round" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={[40, 95]} />
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
                name="Test Accuracy (%)"
                stroke="#000000"
                strokeWidth={2.4}
                dot={{ r: 2.5, fill: "#000000" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Train Loss vs Test Loss (Generalization Gap) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Generalization Gap (Train vs Test Loss)
          </h4>
          <span className="text-xs font-mono font-semibold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
            MIA Vulnerability
          </span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                dataKey="trainLoss"
                name="Train Loss (Members)"
                stroke="#059669"
                strokeWidth={2.2}
                dot={{ r: 2.5, fill: "#059669" }}
              />
              <Line
                type="monotone"
                dataKey="testLoss"
                name="Test Loss (General)"
                stroke="#E11D48"
                strokeWidth={2.2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: "#E11D48" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
