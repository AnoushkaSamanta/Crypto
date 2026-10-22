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
import { ShieldCheck } from "@phosphor-icons/react";

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
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          color: "#1E232F",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
          minWidth: "165px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        },
      },
      {
        id: "step-2-grad",
        position: { x: 215, y: 70 },
        data: { label: "2. Per-Sample Gradients (g_i)" },
        style: {
          background: "#FFFFFF",
          border: "1px solid #CBD5E1",
          color: "#334155",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 600,
          textAlign: "center",
          minWidth: "175px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
        },
      },
      {
        id: "step-3-clip",
        position: { x: 440, y: 70 },
        data: { label: `3. Clip Gradients (C = ${maxGradNorm.toFixed(1)})` },
        style: {
          background: dpEnabled ? "#ECFDF5" : "#F8FAFC",
          border: dpEnabled ? "1.5px solid #10B981" : "1px solid #CBD5E1",
          color: dpEnabled ? "#065F46" : "#64748B",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "175px",
          boxShadow: dpEnabled ? "0 4px 12px rgba(16, 185, 129, 0.12)" : "none",
        },
      },
      {
        id: "step-4-noise",
        position: { x: 665, y: 70 },
        data: { label: `4. Add Noise (σ = ${noiseMultiplier.toFixed(1)})` },
        style: {
          background: dpEnabled ? "#F5F3FF" : "#F8FAFC",
          border: dpEnabled ? "1.5px solid #8B5CF6" : "1px solid #CBD5E1",
          color: dpEnabled ? "#5B21B6" : "#64748B",
          borderRadius: "12px",
          padding: "12px 16px",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "165px",
          boxShadow: dpEnabled ? "0 4px 12px rgba(139, 92, 246, 0.12)" : "none",
        },
      },
      {
        id: "step-5-update",
        position: { x: 880, y: 20 },
        data: { label: "5. Private Descent Step" },
        style: {
          background: "#EFF6FF",
          border: "1.5px solid #3B82F6",
          color: "#1E40AF",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "160px",
          boxShadow: "0 2px 6px rgba(59, 130, 246, 0.1)",
        },
      },
      {
        id: "step-6-rdp",
        position: { x: 880, y: 120 },
        data: { label: `RDP Budget: ε = ${epsilon.toFixed(2)}` },
        style: {
          background: dpEnabled ? "#ECFDF5" : "#F8FAFC",
          border: dpEnabled ? "1.5px solid #10B981" : "1px solid #CBD5E1",
          color: dpEnabled ? "#047857" : "#64748B",
          borderRadius: "12px",
          padding: "10px 14px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "160px",
          boxShadow: dpEnabled ? "0 2px 6px rgba(16, 185, 129, 0.1)" : "none",
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
        style: { stroke: "#94A3B8", strokeWidth: 1.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#94A3B8" },
      },
      {
        id: "e2-3",
        source: "step-2-grad",
        target: "step-3-clip",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#059669" : "#CBD5E1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#059669" : "#CBD5E1" },
      },
      {
        id: "e3-4",
        source: "step-3-clip",
        target: "step-4-noise",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#7C3AED" : "#CBD5E1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#7C3AED" : "#CBD5E1" },
      },
      {
        id: "e4-5",
        source: "step-4-noise",
        target: "step-5-update",
        animated: true,
        style: { stroke: "#2563EB", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#2563EB" },
      },
      {
        id: "e4-6",
        source: "step-4-noise",
        target: "step-6-rdp",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#059669" : "#CBD5E1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#059669" : "#CBD5E1" },
      },
    ];
  }, [dpEnabled]);

  return (
    <div className="relative w-full clay-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2">
          <ShieldCheck size={20} weight="duotone" className="text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Client-Side DP-SGD Gradient Processing Pipeline (Opacus)
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDpEnabled(!dpEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              dpEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-xs"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dpEnabled ? "🛡️ DP-SGD Enabled" : "⚠️ Standard SGD (No DP)"}
          </button>
        </div>
      </div>

      <div className="h-[270px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-[#F8FAFC]"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#CBD5E1" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      <div className="px-5 py-2.5 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-semibold text-slate-800">Clipping (C):</span> Bounds individual sample influence.
          <span className="font-semibold text-slate-800 ml-3">Gaussian Noise (σ):</span> Guarantees plausible deniability.
        </div>
        <div className="font-mono text-emerald-700 font-semibold">
          Target δ = 0.00167 (1/600)
        </div>
      </div>
    </div>
  );
};
