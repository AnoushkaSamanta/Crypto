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
  const data = useMemo(() => {
    const points: { fpr: number; baselineTpr: number; dpTpr?: number; randomGuess: number }[] = [];
    const bFpr = baselineRoc.fpr;
    const bTpr = baselineRoc.tpr;

    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const targetFpr = i / steps;

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
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            {showOverlay
              ? "Overlaid ROC Curves: Baseline vs DP-SGD Protected"
              : "Receiver Operating Characteristic (ROC) Curve"}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {showOverlay
              ? "DP-SGD flattens the curve down toward the 0.50 random guess diagonal."
              : "Attacker True Positive Rate vs False Positive Rate across all thresholds."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-black font-mono text-xs font-semibold">
            Baseline AUC: {baselineAuc.toFixed(3)}
          </span>
          {showOverlay && dpAuc !== undefined && (
            <span className="px-3 py-1 rounded-full bg-[#D4FF00] text-black font-mono text-xs font-bold">
              DP-SGD AUC: {dpAuc.toFixed(3)}
            </span>
          )}
        </div>
      </div>

      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="fpr"
              stroke="#64748B"
              tick={{ fontSize: 11 }}
              label={{ value: "False Positive Rate (FPR)", position: "insideBottom", offset: -5, fill: "#64748B", fontSize: 11 }}
            />
            <YAxis
              stroke="#64748B"
              tick={{ fontSize: 11 }}
              domain={[0, 1]}
              label={{ value: "True Positive Rate (TPR)", angle: -90, position: "insideLeft", offset: 25, fill: "#64748B", fontSize: 11 }}
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
              type="monotone"
              dataKey="baselineTpr"
              name={`Baseline Model (AUC = ${baselineAuc.toFixed(3)})`}
              stroke="#E11D48"
              strokeWidth={2.2}
              dot={false}
            />

            {showOverlay && dpRoc && dpAuc !== undefined && (
              <Line
                type="monotone"
                dataKey="dpTpr"
                name={`DP-SGD Model (AUC = ${dpAuc.toFixed(3)})`}
                stroke="#059669"
                strokeWidth={2.2}
                dot={false}
              />
            )}

            <Line
              type="monotone"
              dataKey="randomGuess"
              name="Random Guess / Ideal (AUC = 0.50)"
              stroke="#94A3B8"
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
