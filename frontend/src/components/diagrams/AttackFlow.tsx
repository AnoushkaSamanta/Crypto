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
  const [modelType, setModelType] = useState<"baseline" | "dp">("baseline");
  const [activeStep, setActiveStep] = useState<number>(0); // 0: all, 1: query, 2: forward, 3: loss, 4: gate

  // Compute effective score and guess based on model type
  const effectiveScore = modelType === "baseline" ? score : score - 0.45;
  const effectiveGuess =
    effectiveScore >= threshold ? "Member" : "Non-member";
  const isMemberGuess = effectiveGuess === "Member";

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
        position: { x: 260, y: 65 },
        data: { isProtected: modelType === "dp" },
      },
      {
        id: "node-gate",
        type: "decisionGateNode",
        position: { x: 570, y: 65 },
        data: { threshold },
      },
      {
        id: "node-member",
        position: { x: 840, y: 20 },
        data: { label: "MEMBER (Training Set)" },
        style: {
          background: isMemberGuess ? "#D4FF00" : "#FFFFFF",
          borderColor: isMemberGuess ? "#D4FF00" : "transparent",
          color: isMemberGuess ? "#000000" : "#94A3B8",
          borderRadius: "9999px",
          padding: "12px 24px",
          fontWeight: 800,
          fontSize: "12px",
          boxShadow: isMemberGuess ? "0 4px 14px rgba(212, 255, 0, 0.4)" : "none",
          transition: "all 0.3s ease",
        },
      },
      {
        id: "node-nonmember",
        position: { x: 840, y: 120 },
        data: { label: "NON-MEMBER (Unseen)" },
        style: {
          background: !isMemberGuess ? "#11141A" : "#FFFFFF",
          borderColor: !isMemberGuess ? "#11141A" : "transparent",
          color: !isMemberGuess ? "#FFFFFF" : "#94A3B8",
          borderRadius: "9999px",
          padding: "12px 24px",
          fontWeight: 800,
          fontSize: "12px",
          boxShadow: !isMemberGuess ? "0 4px 14px rgba(0,0,0,0.15)" : "none",
          transition: "all 0.3s ease",
        },
      },
    ];
  }, [candidateLabel, threshold, isMemberGuess, modelType]);

  const edges: Edge[] = useMemo(() => {
    return [
      {
        id: "e-cand-model",
        source: "node-candidate",
        target: "node-model",
        animated: true,
        label: "Black-Box Query (x)",
        labelStyle: { fill: "#000000", fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.95 },
        labelBgPadding: [6, 2] as [number, number],
        labelBgBorderRadius: 9999,
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
      {
        id: "e-model-gate",
        source: "node-model",
        target: "node-gate",
        animated: true,
        label: `Loss ➔ Score (${effectiveScore.toFixed(3)})`,
        labelStyle: { fill: "#000000", fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.95 },
        labelBgPadding: [6, 2] as [number, number],
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
        label: isMemberGuess ? "Score ≥ τ (Leak)" : undefined,
        labelStyle: { fill: "#000000", fontSize: 9, fontFamily: "monospace", fontWeight: 800 },
        labelBgStyle: { fill: "#D4FF00", fillOpacity: 0.95 },
        labelBgPadding: [6, 2] as [number, number],
        labelBgBorderRadius: 9999,
        style: {
          stroke: isMemberGuess ? "#000000" : "#CBD5E1",
          strokeWidth: isMemberGuess ? 2.5 : 1.5,
          opacity: isMemberGuess ? 1 : 0.25,
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
        label: !isMemberGuess ? "Score < τ (Protected)" : undefined,
        labelStyle: { fill: "#FFFFFF", fontSize: 9, fontFamily: "monospace", fontWeight: 800 },
        labelBgStyle: { fill: "#11141A", fillOpacity: 0.95 },
        labelBgPadding: [6, 2] as [number, number],
        labelBgBorderRadius: 9999,
        style: {
          stroke: !isMemberGuess ? "#000000" : "#CBD5E1",
          strokeWidth: !isMemberGuess ? 2.5 : 1.5,
          opacity: !isMemberGuess ? 1 : 0.25,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: !isMemberGuess ? "#000000" : "#CBD5E1",
        },
      },
    ];
  }, [effectiveScore, isMemberGuess]);

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Controls / Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              Black-Box Membership Inference Pipeline
            </h4>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
            <span className="text-xs font-mono font-bold text-slate-500">
              Loss-Threshold MIA (Yeom et al.)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            The attacker queries the released global model to measure output loss without accessing training sets or client gradients.
          </p>
        </div>

        {/* Interactive Target Model Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Target Model:</span>
          <div className="inline-flex rounded-full bg-[#F7F8FA] p-1 text-xs">
            <button
              onClick={() => setModelType("baseline")}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                modelType === "baseline"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              Baseline FL (Vulnerable)
            </button>
            <button
              onClick={() => setModelType("dp")}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                modelType === "dp"
                  ? "bg-[#D4FF00] text-black shadow-xs font-black"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              DP-SGD Protected
            </button>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas - Frameless rounded-3xl container */}
      <div className="h-[290px] w-full rounded-3xl overflow-hidden bg-[#F7F8FA]">
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
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E2E8F0" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      {/* Bottom Mathematical Rationale Strip */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-7 p-5 rounded-3xl bg-[#F7F8FA] flex flex-col justify-between">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              Attacker Threat Model & Scoring Formulation
            </div>
            <div className="text-xs text-slate-700 leading-relaxed space-y-1.5">
              <p>
                <strong>Zero Knowledge Assumption:</strong> The attacker has strictly black-box access. Given candidate sample <code>(x, y)</code>, the attacker queries <code>f_θ(x)</code> to evaluate Cross-Entropy loss <code>ℒ_CE = -log f_θ(x)_y</code>.
              </p>
              <p>
                <strong>The Memorization Footprint:</strong> In the baseline model, training records have loss close to 0.0 (Score <code>-ℒ_CE &gt; τ</code>), easily separating them from non-members. In DP-SGD, per-sample clipping and noise smooth this loss distribution, flattening attacker accuracy to 50% random chance.
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 p-5 rounded-3xl bg-[#F7F8FA] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
              Live Decision Evaluation
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-mono font-semibold text-slate-600">Calculated Score:</span>
              <span className="text-base font-black font-mono text-black">
                {effectiveScore.toFixed(3)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xs font-mono font-semibold text-slate-600">Cutoff Threshold (τ):</span>
              <span className="text-xs font-mono font-bold text-slate-800">
                {threshold.toFixed(3)}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1 pt-2 border-t border-slate-200/60">
              <span className="text-xs font-sans font-bold text-black">Attacker Guess:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black font-mono ${
                  isMemberGuess
                    ? "bg-[#D4FF00] text-black"
                    : "bg-black text-white"
                }`}
              >
                {effectiveGuess.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-2">
            {modelType === "baseline"
              ? "⚠️ Baseline model memorizes this member"
              : "🛡️ DP-SGD perturbation masks membership"}
          </div>
        </div>
      </div>
    </div>
  );
};
