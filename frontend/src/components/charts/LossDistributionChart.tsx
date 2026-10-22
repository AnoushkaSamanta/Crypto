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
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Loss Distribution Separation (Members vs Non-members)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Members cluster at low loss (left); Non-members spread toward high loss (right).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-slate-100 text-black font-mono text-xs font-bold">
            Threshold: Loss = {lossThreshold} (Score τ = {threshold.toFixed(3)})
          </span>
        </div>
      </div>

      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="loss"
              stroke="#64748B"
              tick={{ fontSize: 11 }}
              label={{ value: "Cross-Entropy Loss", position: "insideBottom", offset: -5, fill: "#64748B", fontSize: 11 }}
            />
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
            <ReferenceLine
              x={lossThreshold}
              stroke="#D97706"
              strokeWidth={2}
              strokeDasharray="4 4"
              label={{
                value: `Cutoff τ`,
                position: "insideTopRight",
                fill: "#B45309",
                fontSize: 11,
                fontWeight: 600,
              }}
            />
            <Area
              type="monotone"
              dataKey="members"
              name="Members (Training Data)"
              stroke="#059669"
              fill="#059669"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="nonmembers"
              name="Non-members (Unseen)"
              stroke="#E11D48"
              fill="#E11D48"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
