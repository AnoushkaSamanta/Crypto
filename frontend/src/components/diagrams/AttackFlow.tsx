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
import { Target, ShieldWarning, ArrowRight } from "@phosphor-icons/react";

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
        position: { x: 0, y: 80 },
        data: { label: candidateLabel },
      },
      {
        id: "node-model",
        type: "targetModelNode",
        position: { x: 260, y: 70 },
        data: { isProtected: false },
      },
      {
        id: "node-gate",
        type: "decisionGateNode",
        position: { x: 550, y: 70 },
        data: { threshold },
      },
      {
        id: "node-member",
        position: { x: 820, y: 20 },
        data: { label: "MEMBER (Training Set)" },
        style: {
          background: isMemberGuess ? "rgba(16, 185, 129, 0.25)" : "rgba(30, 41, 59, 0.5)",
          borderColor: isMemberGuess ? "#10b981" : "#475569",
          borderWidth: 2,
          color: isMemberGuess ? "#6ee7b7" : "#94a3b8",
          borderRadius: "12px",
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "12px",
          boxShadow: isMemberGuess ? "0 0 15px rgba(16, 185, 129, 0.3)" : "none",
        },
      },
      {
        id: "node-nonmember",
        position: { x: 820, y: 125 },
        data: { label: "NON-MEMBER (Unseen)" },
        style: {
          background: !isMemberGuess ? "rgba(244, 63, 94, 0.25)" : "rgba(30, 41, 59, 0.5)",
          borderColor: !isMemberGuess ? "#f43f5e" : "#475569",
          borderWidth: 2,
          color: !isMemberGuess ? "#fda4af" : "#94a3b8",
          borderRadius: "12px",
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: "12px",
          boxShadow: !isMemberGuess ? "0 0 15px rgba(244, 63, 94, 0.3)" : "none",
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
        style: { stroke: "#a855f7", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7" },
      },
      {
        id: "e-model-gate",
        source: "node-model",
        target: "node-gate",
        animated: true,
        label: `Loss ➔ Score (${score.toFixed(3)})`,
        labelStyle: { fill: "#cbd5e1", fontSize: 10, fontFamily: "monospace" },
        labelBgStyle: { fill: "#0f172a", fillOpacity: 0.9 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        style: { stroke: "#f59e0b", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#f59e0b" },
      },
      {
        id: "e-gate-member",
        source: "node-gate",
        sourceHandle: "member",
        target: "node-member",
        animated: isMemberGuess,
        style: {
          stroke: isMemberGuess ? "#10b981" : "#475569",
          strokeWidth: isMemberGuess ? 3 : 1.5,
          opacity: isMemberGuess ? 1 : 0.4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isMemberGuess ? "#10b981" : "#475569",
        },
      },
      {
        id: "e-gate-nonmember",
        source: "node-gate",
        sourceHandle: "nonmember",
        target: "node-nonmember",
        animated: !isMemberGuess,
        style: {
          stroke: !isMemberGuess ? "#f43f5e" : "#475569",
          strokeWidth: !isMemberGuess ? 3 : 1.5,
          opacity: !isMemberGuess ? 1 : 0.4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: !isMemberGuess ? "#f43f5e" : "#475569",
        },
      },
    ];
  }, [score, isMemberGuess]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 overflow-hidden shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Target size={18} weight="bold" className="text-purple-400" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Black-Box Loss-Threshold Attack Pipeline (Yeom et al.)
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-mono">
            Boundary: Black-Box Model Access Only
          </span>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-slate-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#334155" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      <div className="px-5 py-2.5 border-t border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono">
          <span>Current Rule:</span>
          <span className="text-slate-200">Predict Member if Score = -Loss ≥ τ</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 font-mono">
          <span>Active Prediction:</span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              isMemberGuess
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            }`}
          >
            {guess}
          </span>
        </div>
      </div>
    </div>
  );
};
