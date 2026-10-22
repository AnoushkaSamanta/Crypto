"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

interface LossDistributionChartProps {
  memberLosses: number[];
  nonmemberLosses: number[];
  threshold: number; // score threshold tau (loss = -tau)
}

export const LossDistributionChart: React.FC<LossDistributionChartProps> = ({
  memberLosses,
  nonmemberLosses,
  threshold,
}) => {
  // Decision threshold on loss scale: Loss_tau = -threshold
  const lossThreshold = parseFloat((-threshold).toFixed(3));

  // Build histogram bins from 0.0 to 3.0 with step 0.1
  const chartData = useMemo(() => {
    const bins: { bin: string; loss: number; members: number; nonmembers: number }[] = [];
    const minLoss = 0.0;
    const maxLoss = 3.0;
    const step = 0.1;

    for (let l = minLoss; l < maxLoss; l += step) {
      const nextL = l + step;
      const mCount = memberLosses.filter((v) => v >= l && v < nextL).length;
      const nmCount = nonmemberLosses.filter((v) => v >= l && v < nextL).length;

      bins.push({
        bin: `${l.toFixed(1)}-${nextL.toFixed(1)}`,
        loss: parseFloat((l + step / 2).toFixed(2)),
        members: mCount,
        nonmembers: nmCount,
      });
    }

    return bins;
  }, [memberLosses, nonmemberLosses]);

  return (
    <div className="glass-panel p-5 rounded-2xl w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Loss Distribution Separation (Members vs Non-members)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Members cluster at lower loss (left); Non-members spread toward higher loss (right).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs">
            Decision Threshold: Loss = {lossThreshold} (Score τ = {threshold.toFixed(3)})
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
            <XAxis
              dataKey="loss"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              unit=""
              label={{ value: "Cross-Entropy Loss", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }}
            />
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
            <ReferenceLine
              x={lossThreshold}
              stroke="#f59e0b"
              strokeWidth={2.5}
              strokeDasharray="4 4"
              label={{
                value: `Decision Cutoff τ`,
                position: "insideTopRight",
                fill: "#f59e0b",
                fontSize: 11,
              }}
            />
            <Area
              type="monotone"
              dataKey="members"
              name="Members (Training Data)"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="nonmembers"
              name="Non-members (Unseen)"
              stroke="#f43f5e"
              fill="#f43f5e"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
