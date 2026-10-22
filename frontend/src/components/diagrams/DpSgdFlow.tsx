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
          border: "none",
          color: "#11141A",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "165px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        },
      },
      {
        id: "step-2-grad",
        position: { x: 215, y: 70 },
        data: { label: "2. Per-Sample Gradients (g_i)" },
        style: {
          background: "#FFFFFF",
          border: "none",
          color: "#11141A",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "12px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "175px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        },
      },
      {
        id: "step-3-clip",
        position: { x: 440, y: 70 },
        data: { label: `3. Clip Gradients (C = ${maxGradNorm.toFixed(1)})` },
        style: {
          background: dpEnabled ? "#D4FF00" : "#F1F5F9",
          border: "none",
          color: "#000000",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "12px",
          fontWeight: 800,
          textAlign: "center",
          minWidth: "175px",
          boxShadow: dpEnabled ? "0 4px 14px rgba(212, 255, 0, 0.4)" : "none",
        },
      },
      {
        id: "step-4-noise",
        position: { x: 665, y: 70 },
        data: { label: `4. Add Noise (σ = ${noiseMultiplier.toFixed(1)})` },
        style: {
          background: dpEnabled ? "#D4FF00" : "#F1F5F9",
          border: "none",
          color: "#000000",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "12px",
          fontWeight: 800,
          textAlign: "center",
          minWidth: "165px",
          boxShadow: dpEnabled ? "0 4px 14px rgba(212, 255, 0, 0.4)" : "none",
        },
      },
      {
        id: "step-5-update",
        position: { x: 880, y: 20 },
        data: { label: "5. Private Descent Step" },
        style: {
          background: "#11141A",
          border: "none",
          color: "#FFFFFF",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "160px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        },
      },
      {
        id: "step-6-rdp",
        position: { x: 880, y: 120 },
        data: { label: `RDP Budget: ε = ${epsilon.toFixed(2)}` },
        style: {
          background: dpEnabled ? "#D4FF00" : "#F1F5F9",
          border: "none",
          color: "#000000",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 800,
          textAlign: "center",
          minWidth: "160px",
          boxShadow: dpEnabled ? "0 4px 12px rgba(212, 255, 0, 0.4)" : "none",
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
        style: { stroke: "#000000", strokeWidth: 1.8 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
      {
        id: "e2-3",
        source: "step-2-grad",
        target: "step-3-clip",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#000000" : "#CBD5E1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#000000" : "#CBD5E1" },
      },
      {
        id: "e3-4",
        source: "step-3-clip",
        target: "step-4-noise",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#000000" : "#CBD5E1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#000000" : "#CBD5E1" },
      },
      {
        id: "e4-5",
        source: "step-4-noise",
        target: "step-5-update",
        animated: true,
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
      {
        id: "e4-6",
        source: "step-4-noise",
        target: "step-6-rdp",
        animated: dpEnabled,
        style: { stroke: dpEnabled ? "#000000" : "#CBD5E1", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: dpEnabled ? "#000000" : "#CBD5E1" },
      },
    ];
  }, [dpEnabled]);

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Client-Side DP-SGD Gradient Processing Pipeline (Opacus)
          </h4>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDpEnabled(!dpEnabled)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              dpEnabled
                ? "bg-[#D4FF00] text-black shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {dpEnabled ? "DP-SGD Defense Enabled" : "Standard SGD (No DP)"}
          </button>
        </div>
      </div>

      <div className="h-[270px] w-full rounded-3xl overflow-hidden bg-[#F7F8FA]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-[#F7F8FA]"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E2E8F0" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      <div className="px-5 py-3 rounded-2xl bg-[#F7F8FA] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div>
          <span className="font-bold text-black">Clipping (C):</span> Bounds individual sample influence.
          <span className="font-bold text-black ml-3">Gaussian Noise (σ):</span> Guarantees plausible deniability.
        </div>
        <div className="font-mono text-black font-bold">
          Target δ = 0.00167 (1/600)
        </div>
      </div>
    </div>
  );
};
