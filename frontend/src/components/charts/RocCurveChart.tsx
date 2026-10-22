"use client";

import React, { useMemo } from "react";
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
import { RocCurve } from "@/types";

interface RocCurveChartProps {
  baselineRoc: RocCurve;
  baselineAuc: number;
  dpRoc?: RocCurve;
  dpAuc?: number;
  showOverlay?: boolean;
}

export const RocCurveChart: React.FC<RocCurveChartProps> = ({
  baselineRoc,
  baselineAuc,
  dpRoc,
  dpAuc,
  showOverlay = false,
}) => {
  // Downsample ROC points to ~50 points for smooth SVG rendering
  const data = useMemo(() => {
    const points: { fpr: number; baselineTpr: number; dpTpr?: number; randomGuess: number }[] = [];
    const bFpr = baselineRoc.fpr;
    const bTpr = baselineRoc.tpr;

    // Linear steps from 0 to 1
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const targetFpr = i / steps;

      // Find closest baseline index
      let bIdx = 0;
      for (let j = 0; j < bFpr.length; j++) {
        if (bFpr[j] <= targetFpr) bIdx = j;
        else break;
      }
      const bVal = bTpr[bIdx] ?? targetFpr;

      let dpVal: number | undefined = undefined;
      if (dpRoc) {
        let dIdx = 0;
        for (let j = 0; j < dpRoc.fpr.length; j++) {
          if (dpRoc.fpr[j] <= targetFpr) dIdx = j;
          else break;
        }
        dpVal = dpRoc.tpr[dIdx] ?? targetFpr;
      }

      points.push({
        fpr: parseFloat(targetFpr.toFixed(2)),
        baselineTpr: parseFloat(bVal.toFixed(3)),
        ...(dpVal !== undefined ? { dpTpr: parseFloat(dpVal.toFixed(3)) } : {}),
        randomGuess: parseFloat(targetFpr.toFixed(2)),
      });
    }

    return points;
  }, [baselineRoc, dpRoc]);

  return (
    <div className="glass-panel p-5 rounded-2xl w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            {showOverlay
              ? "Overlaid ROC Curves: Baseline vs DP-SGD Protected"
              : "Receiver Operating Characteristic (ROC) Curve"}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {showOverlay
              ? "Differential privacy flattens the curve down toward the random guess diagonal (0.50 AUC)."
              : "Attacker True Positive Rate vs False Positive Rate across all thresholds."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs">
            Baseline AUC: {baselineAuc.toFixed(3)}
          </span>
          {showOverlay && dpAuc !== undefined && (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs">
              DP-SGD AUC: {dpAuc.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.35} />
            <XAxis
              dataKey="fpr"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              label={{ value: "False Positive Rate (FPR)", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              domain={[0, 1]}
              label={{ value: "True Positive Rate (TPR)", angle: -90, position: "insideLeft", offset: 25, fill: "#64748b", fontSize: 11 }}
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
              type="monotone"
              dataKey="baselineTpr"
              name={`Baseline Model (AUC = ${baselineAuc.toFixed(3)})`}
              stroke="#f43f5e"
              strokeWidth={2.5}
              dot={false}
            />

            {showOverlay && dpRoc && dpAuc !== undefined && (
              <Line
                type="monotone"
                dataKey="dpTpr"
                name={`DP-SGD Model (AUC = ${dpAuc.toFixed(3)})`}
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
              />
            )}

            <Line
              type="monotone"
              dataKey="randomGuess"
              name="Random Guess / Ideal (AUC = 0.50)"
              stroke="#64748b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
