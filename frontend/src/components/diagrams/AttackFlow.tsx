"use client";

import React, { useMemo } from "react";
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
  CandidateNode,
  TargetModelNode,
  DecisionGateNode,
} from "./nodes/CustomNodes";
import { Target } from "@phosphor-icons/react";

const nodeTypes = {
  candidateNode: CandidateNode,
  targetModelNode: TargetModelNode,
  decisionGateNode: DecisionGateNode,
};

interface AttackFlowProps {
  candidateLabel?: string;
  score?: number;
  threshold?: number;
  guess?: "Member" | "Non-member";
}

export const AttackFlow: React.FC<AttackFlowProps> = ({
  candidateLabel = "Sample #0 (Sandal)",
  score = -0.42,
  threshold = -0.56,
  guess = "Member",
}) => {
  const isMemberGuess = guess === "Member";

  const nodes: Node[] = useMemo(() => {
    return [
      {
        id: "node-candidate",
        type: "candidateNode",
        position: { x: 0, y: 75 },
        data: { label: candidateLabel },
      },
      {
        id: "node-model",
        type: "targetModelNode",
        position: { x: 250, y: 65 },
        data: { isProtected: false },
      },
      {
        id: "node-gate",
        type: "decisionGateNode",
        position: { x: 540, y: 65 },
        data: { threshold },
      },
      {
        id: "node-member",
        position: { x: 800, y: 20 },
        data: { label: "MEMBER (Training Set)" },
        style: {
          background: isMemberGuess ? "#ECFDF5" : "#FFFFFF",
          borderColor: isMemberGuess ? "#10B981" : "#E2E8F0",
          borderWidth: 1.5,
          color: isMemberGuess ? "#065F46" : "#64748B",
          borderRadius: "12px",
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "12px",
          boxShadow: isMemberGuess ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
        },
      },
      {
        id: "node-nonmember",
        position: { x: 800, y: 120 },
        data: { label: "NON-MEMBER (Unseen)" },
        style: {
          background: !isMemberGuess ? "#FFF1F2" : "#FFFFFF",
          borderColor: !isMemberGuess ? "#F43F5E" : "#E2E8F0",
          borderWidth: 1.5,
          color: !isMemberGuess ? "#9F1239" : "#64748B",
          borderRadius: "12px",
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "12px",
          boxShadow: !isMemberGuess ? "0 4px 12px rgba(244, 63, 94, 0.15)" : "0 1px 3px rgba(0,0,0,0.04)",
        },
      },
    ];
  }, [candidateLabel, threshold, isMemberGuess]);

  const edges: Edge[] = useMemo(() => {
    return [
      {
        id: "e-cand-model",
        source: "node-candidate",
        target: "node-model",
        animated: true,
        style: { stroke: "#7C3AED", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#7C3AED" },
      },
      {
        id: "e-model-gate",
        source: "node-model",
        target: "node-gate",
        animated: true,
        label: `Loss ➔ Score (${score.toFixed(3)})`,
        labelStyle: { fill: "#1E232F", fontSize: 10, fontFamily: "monospace", fontWeight: 600 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.95, stroke: "#E2E8F0", strokeWidth: 1 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 6,
        style: { stroke: "#D97706", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#D97706" },
      },
      {
        id: "e-gate-member",
        source: "node-gate",
        sourceHandle: "member",
        target: "node-member",
        animated: isMemberGuess,
        style: {
          stroke: isMemberGuess ? "#059669" : "#CBD5E1",
          strokeWidth: isMemberGuess ? 2.5 : 1.5,
          opacity: isMemberGuess ? 1 : 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isMemberGuess ? "#059669" : "#CBD5E1",
        },
      },
      {
        id: "e-gate-nonmember",
        source: "node-gate",
        sourceHandle: "nonmember",
        target: "node-nonmember",
        animated: !isMemberGuess,
        style: {
          stroke: !isMemberGuess ? "#E11D48" : "#CBD5E1",
          strokeWidth: !isMemberGuess ? 2.5 : 1.5,
          opacity: !isMemberGuess ? 1 : 0.6,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: !isMemberGuess ? "#E11D48" : "#CBD5E1",
        },
      },
    ];
  }, [score, isMemberGuess]);

  return (
    <div className="relative w-full clay-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2">
          <Target size={18} weight="bold" className="text-purple-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Black-Box Loss-Threshold Attack Pipeline (Yeom et al.)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-[11px] font-mono font-semibold">
            Boundary: Black-Box Query Access Only
          </span>
        </div>
      </div>

      <div className="h-[270px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-[#F8FAFC]"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#CBD5E1" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      <div className="px-5 py-2.5 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-500 font-sans">Decision Rule:</span>
          <span className="text-slate-800 font-semibold">Predict Member if Score = -Loss ≥ τ</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-500 font-sans">Active Prediction:</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] ${
              isMemberGuess
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {guess}
          </span>
        </div>
      </div>
    </div>
  );
};
