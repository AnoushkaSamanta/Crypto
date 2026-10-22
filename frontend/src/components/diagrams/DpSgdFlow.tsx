"use client";

import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import {
  ShieldCheck,
  Scissors,
  Waveform,
  Sliders,
  ChartLineUp,
  LockKey,
} from "@phosphor-icons/react";

interface DpSgdFlowProps {
  maxGradNorm?: number;
  noiseMultiplier?: number;
  epsilon?: number;
}

export const DpSgdFlow: React.FC<DpSgdFlowProps> = ({
  maxGradNorm = 1.0,
  noiseMultiplier = 1.0,
  epsilon = 6.72,
}) => {
  const [dpEnabled, setDpEnabled] = useState(true);

  const nodes: Node[] = useMemo(() => {
    return [
      {
        id: "step-1-batch",
        position: { x: 0, y: 70 },
        data: { label: "1. Client Private Batch" },
        style: {
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          color: "#e2e8f0",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
          minWidth: "170px",
        },
      },
      {
        id: "step-2-grad",
        position: { x: 220, y: 70 },
        data: { label: "2. Per-Sample Gradients (g_i)" },
        style: {
          background: "rgba(15, 23, 42, 0.9)",
          border: "1px solid rgba(148, 163, 184, 0.3)",
          color: "#cbd5e1",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
          minWidth: "180px",
        },
      },
      {
        id: "step-3-clip",
        position: { x: 450, y: 70 },
        data: { label: `3. Clip Gradients (C = ${maxGradNorm.toFixed(1)})` },
        style: {
          background: dpEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(30, 41, 59, 0.5)",
          border: dpEnabled ? "1.5px solid #10b981" : "1px solid #475569",
          color: dpEnabled ? "#6ee7b7" : "#64748b",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "180px",
        },
      },
      {
        id: "step-4-noise",
        position: { x: 680, y: 70 },
        data: { label: `4. Add Noise (σ = ${noiseMultiplier.toFixed(1)})` },
        style: {
          background: dpEnabled ? "rgba(139, 92, 246, 0.2)" : "rgba(30, 41, 59, 0.5)",
          border: dpEnabled ? "1.5px solid #8b5cf6" : "1px solid #475569",
          color: dpEnabled ? "#c4b5fd" : "#64748b",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "170px",
        },
      },
      {
        id: "step-5-update",
        position: { x: 900, y: 20 },
        data: { label: "5. Private Descent Update" },
        style: {
          background: "rgba(15, 23, 42, 0.9)",
          border: "1.5px solid #3b82f6",
          color: "#93c5fd",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "160px",
        },
      },
      {
        id: "step-6-rdp",
        position: { x: 900, y: 120 },
        data: { label: `RDP Budget: ε = ${epsilon.toFixed(2)}` },
        style: {
          background: dpEnabled ? "rgba(16, 185, 129, 0.2)" : "rgba(30, 41, 59, 0.4)",
          border: dpEnabled ? "1.5px solid #10b981" : "1px solid #475569",
          color: dpEnabled ? "#34d399" : "#64748b",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "160px",
        },
      },
    ];
  }, [maxGradNorm, noiseMultiplier, epsilon, dpEnabled]);

  const edges: Edge[] = useMemo(() => {
    return [
      {
        id: "e1-2",
        source: "step-1-batch",
        target: "step-2-grad",
        animated: true,
        style: { stroke: "#64748b", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" },
      },
      {
        id: "e2-3",
        source: "step-2-grad",
        target: "step-3-clip",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#10b981" : "#475569", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#10b981" : "#475569" },
      },
      {
        id: "e3-4",
        source: "step-3-clip",
        target: "step-4-noise",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#8b5cf6" : "#475569", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#8b5cf6" : "#475569" },
      },
      {
        id: "e4-5",
        source: "step-4-noise",
        target: "step-5-update",
        animated: true,
        style: { stroke: "#3b82f6", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#3b82f6" },
      },
      {
        id: "e4-6",
        source: "step-4-noise",
        target: "step-6-rdp",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#10b981" : "#475569", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#10b981" : "#475569" },
      },
    ];
  }, [dpEnabled]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 overflow-hidden shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} weight="duotone" className="text-emerald-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Client-Side DP-SGD Gradient Processing Pipeline (Opacus)
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDpEnabled(!dpEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              dpEnabled
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
          >
            {dpEnabled ? "🛡️ DP-SGD Enabled" : "⚠️ Standard SGD (No DP)"}
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-slate-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-300">Clipping ($C$):</span> Bounds individual sample influence.
          <span className="font-semibold text-slate-300 ml-3">Gaussian Noise ($\sigma$):</span> Guarantees plausible deniability.
        </div>
        <div className="font-mono text-emerald-400">
          Target δ = 0.00167 (1/600)
        </div>
      </div>
    </div>
  );
};
