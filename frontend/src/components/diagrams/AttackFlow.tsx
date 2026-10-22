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
          background: isMemberGuess ? "#D4FF00" : "#FFFFFF",
          borderColor: isMemberGuess ? "#D4FF00" : "transparent",
          color: isMemberGuess ? "#000000" : "#64748B",
          borderRadius: "9999px",
          padding: "10px 20px",
          fontWeight: 800,
          fontSize: "12px",
          boxShadow: isMemberGuess ? "0 4px 14px rgba(212, 255, 0, 0.4)" : "0 2px 6px rgba(0,0,0,0.03)",
        },
      },
      {
        id: "node-nonmember",
        position: { x: 800, y: 120 },
        data: { label: "NON-MEMBER (Unseen)" },
        style: {
          background: !isMemberGuess ? "#11141A" : "#FFFFFF",
          borderColor: !isMemberGuess ? "#11141A" : "transparent",
          color: !isMemberGuess ? "#FFFFFF" : "#64748B",
          borderRadius: "9999px",
          padding: "10px 20px",
          fontWeight: 800,
          fontSize: "12px",
          boxShadow: !isMemberGuess ? "0 4px 14px rgba(0,0,0,0.15)" : "0 2px 6px rgba(0,0,0,0.03)",
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
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
      {
        id: "e-model-gate",
        source: "node-model",
        target: "node-gate",
        animated: true,
        label: `Loss ➔ Score (${score.toFixed(3)})`,
        labelStyle: { fill: "#000000", fontSize: 10, fontFamily: "monospace", fontWeight: 700 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.95 },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 9999,
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
      {
        id: "e-gate-member",
        source: "node-gate",
        sourceHandle: "member",
        target: "node-member",
        animated: isMemberGuess,
        style: {
          stroke: isMemberGuess ? "#000000" : "#CBD5E1",
          strokeWidth: isMemberGuess ? 2.5 : 1.5,
          opacity: isMemberGuess ? 1 : 0.4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isMemberGuess ? "#000000" : "#CBD5E1",
        },
      },
      {
        id: "e-gate-nonmember",
        source: "node-gate",
        sourceHandle: "nonmember",
        target: "node-nonmember",
        animated: !isMemberGuess,
        style: {
          stroke: !isMemberGuess ? "#000000" : "#CBD5E1",
          strokeWidth: !isMemberGuess ? 2.5 : 1.5,
          opacity: !isMemberGuess ? 1 : 0.4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: !isMemberGuess ? "#000000" : "#CBD5E1",
        },
      },
    ];
  }, [score, isMemberGuess]);

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Black-Box Loss-Threshold Attack Pipeline
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-mono font-semibold">
            Black-Box Output Queries Only
          </span>
        </div>
      </div>

      <div className="h-[270px] w-full rounded-3xl overflow-hidden bg-[#F7F8FA]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-[#F7F8FA]"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E2E8F0" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      <div className="px-5 py-3 rounded-2xl bg-[#F7F8FA] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-slate-400 font-sans">Decision:</span>
          <span className="text-black font-semibold">Member if Score ≥ τ</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-slate-400 font-sans">Prediction:</span>
          <span
            className={`font-black px-3 py-1 rounded-full text-[11px] ${
              isMemberGuess
                ? "bg-[#D4FF00] text-black"
                : "bg-black text-white"
            }`}
          >
            {guess}
          </span>
        </div>
      </div>
    </div>
  );
};
