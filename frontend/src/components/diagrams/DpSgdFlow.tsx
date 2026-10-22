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
  const [activeStepId, setActiveStepId] = useState<string>("step-3-clip");

  const stepDetails: Record<
    string,
    { title: string; math: string; purpose: string; dangerWithout: string }
  > = {
    "step-1-batch": {
      title: "Step 1: Private Client Mini-Batch Sampling",
      math: "B_t ~ PoissonSample(D_k, q = B / n_k)",
      purpose:
        "Clients sample a random sub-batch of size B = 32 from their local 600 records. Poisson subsampling provides privacy amplification by a factor of q.",
      dangerWithout:
        "Deterministic batching reduces the effective noise benefit, requiring higher artificial noise for the same privacy guarantee.",
    },
    "step-2-grad": {
      title: "Step 2: Per-Sample Gradient Computation (Opacus)",
      math: "g_i = ∇_θ ℓ(f(x_i; θ), y_i)  ∀ i ∈ [1, B]",
      purpose:
        "PyTorch Opacus computes individual gradient vectors g_i for each sample in the batch separately, before any averaging takes place.",
      dangerWithout:
        "Standard PyTorch sums gradients across the batch immediately. That hides individual vectors and makes it mathematically impossible to bound individual record influence.",
    },
    "step-3-clip": {
      title: "Step 3: Per-Sample Gradient Clipping (Norm C)",
      math: "ḡ_i = g_i / max(1, ‖g_i‖_2 / C)",
      purpose:
        "Strictly caps the ℓ_2-norm of each individual gradient vector to C = 1.0. This guarantees that no single extreme outlier or memorized sample can dominate parameter updates.",
      dangerWithout:
        "Without clipping, ℓ_2 sensitivity Δ_2 is mathematically unbounded (Δ_2 = ∞). An unusual outlier could cause arbitrarily large weight shifts, permanently embedding itself in the model.",
    },
    "step-4-noise": {
      title: "Step 4: Calibrated Gaussian Noise Injection",
      math: "g̃ = (1/B) ( Σ ḡ_i + 𝒩(0, σ² C² I) )",
      purpose:
        "Adds spherical Gaussian noise scaled to σ = 1.0 and clipping threshold C. This satisfies the Gaussian Mechanism, ensuring plausible deniability for whether sample x_i was included.",
      dangerWithout:
        "Without Gaussian perturbation, the clipped sum is entirely deterministic. An adversary comparing model outputs across rounds can invert parameter changes to reconstruct member samples.",
    },
    "step-5-update": {
      title: "Step 5: Differentially Private Descent Step",
      math: "θ_(t+1) = θ_t - η g̃",
      purpose:
        "Applies gradient descent using the sanitized private gradient g̃. The resulting model weights are provably protected under the Differential Privacy definition.",
      dangerWithout:
        "Standard updates fit exact empirical gradients, steadily narrowing the loss gap on training samples and exposing them to Membership Inference.",
    },
    "step-6-rdp": {
      title: "Step 6: Rényi Differential Privacy (RDP) Accounting",
      math: "(ε, δ)-DP via RDP Composition across T steps",
      purpose:
        "Opacus tracks Rényi divergence order α across all communication rounds and client steps, converting to tight (ε = 6.72, δ = 1/600) privacy bounds.",
      dangerWithout:
        "Naive composition theorems produce excessively loose epsilon bounds (e.g. ε > 50), obscuring the true privacy guarantees of the model.",
    },
  };

  const nodes: Node[] = useMemo(() => {
    return [
      {
        id: "step-1-batch",
        position: { x: 0, y: 70 },
        data: { label: "1. Client Batch (q = 32/600)" },
        style: {
          background: activeStepId === "step-1-batch" ? "#000000" : "#FFFFFF",
          border: activeStepId === "step-1-batch" ? "2px solid #D4FF00" : "none",
          color: activeStepId === "step-1-batch" ? "#FFFFFF" : "#11141A",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "170px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          cursor: "pointer",
        },
      },
      {
        id: "step-2-grad",
        position: { x: 220, y: 70 },
        data: { label: "2. Per-Sample Grads (g_i)" },
        style: {
          background: activeStepId === "step-2-grad" ? "#000000" : "#FFFFFF",
          border: activeStepId === "step-2-grad" ? "2px solid #D4FF00" : "none",
          color: activeStepId === "step-2-grad" ? "#FFFFFF" : "#11141A",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "175px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          cursor: "pointer",
        },
      },
      {
        id: "step-3-clip",
        position: { x: 450, y: 70 },
        data: {
          label: dpEnabled
            ? `3. Clip Gradients (C = ${maxGradNorm.toFixed(1)})`
            : "3. [BYPASSED - No Clipping]",
        },
        style: {
          background: !dpEnabled
            ? "#F1F5F9"
            : activeStepId === "step-3-clip"
            ? "#D4FF00"
            : "#FFFFFF",
          border:
            dpEnabled && activeStepId === "step-3-clip"
              ? "2px solid #000000"
              : "none",
          color: !dpEnabled ? "#94A3B8" : "#000000",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 800,
          textAlign: "center",
          minWidth: "180px",
          boxShadow:
            dpEnabled && activeStepId === "step-3-clip"
              ? "0 4px 14px rgba(212, 255, 0, 0.4)"
              : "none",
          cursor: "pointer",
        },
      },
      {
        id: "step-4-noise",
        position: { x: 685, y: 70 },
        data: {
          label: dpEnabled
            ? `4. Add Noise (σ = ${noiseMultiplier.toFixed(1)})`
            : "4. [BYPASSED - Zero Noise]",
        },
        style: {
          background: !dpEnabled
            ? "#F1F5F9"
            : activeStepId === "step-4-noise"
            ? "#D4FF00"
            : "#FFFFFF",
          border:
            dpEnabled && activeStepId === "step-4-noise"
              ? "2px solid #000000"
              : "none",
          color: !dpEnabled ? "#94A3B8" : "#000000",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 800,
          textAlign: "center",
          minWidth: "175px",
          boxShadow:
            dpEnabled && activeStepId === "step-4-noise"
              ? "0 4px 14px rgba(212, 255, 0, 0.4)"
              : "none",
          cursor: "pointer",
        },
      },
      {
        id: "step-5-update",
        position: { x: 915, y: 20 },
        data: { label: "5. Private Descent Step" },
        style: {
          background: activeStepId === "step-5-update" ? "#000000" : "#11141A",
          border: activeStepId === "step-5-update" ? "2px solid #D4FF00" : "none",
          color: "#FFFFFF",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 700,
          textAlign: "center",
          minWidth: "165px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          cursor: "pointer",
        },
      },
      {
        id: "step-6-rdp",
        position: { x: 915, y: 120 },
        data: {
          label: dpEnabled
            ? `6. RDP Budget (ε = ${epsilon.toFixed(2)})`
            : "6. ε = ∞ (No Bound)",
        },
        style: {
          background: !dpEnabled
            ? "#F1F5F9"
            : activeStepId === "step-6-rdp"
            ? "#D4FF00"
            : "#FFFFFF",
          border:
            dpEnabled && activeStepId === "step-6-rdp"
              ? "2px solid #000000"
              : "none",
          color: !dpEnabled ? "#94A3B8" : "#000000",
          borderRadius: "9999px",
          padding: "10px 18px",
          fontSize: "11px",
          fontWeight: 800,
          textAlign: "center",
          minWidth: "165px",
          boxShadow:
            dpEnabled && activeStepId === "step-6-rdp"
              ? "0 4px 14px rgba(212, 255, 0, 0.4)"
              : "none",
          cursor: "pointer",
        },
      },
    ];
  }, [maxGradNorm, noiseMultiplier, epsilon, dpEnabled, activeStepId]);

  const edges: Edge[] = useMemo(() => {
    if (!dpEnabled) {
      // Show bypass directly from Step 2 to Step 5
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
          id: "e2-bypass-5",
          source: "step-2-grad",
          target: "step-5-update",
          animated: true,
          label: "Bypass DP (Unclipped Gradients)",
          labelStyle: { fill: "#E11D48", fontSize: 9, fontFamily: "monospace", fontWeight: 800 },
          labelBgStyle: { fill: "#FFE4E6", fillOpacity: 0.95 },
          labelBgPadding: [6, 2] as [number, number],
          labelBgBorderRadius: 9999,
          style: { stroke: "#E11D48", strokeWidth: 2, strokeDasharray: "4 4" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#E11D48" },
        },
      ];
    }

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
        animated: true,
        label: "‖g_i‖_2 ≤ C",
        labelStyle: { fill: "#000000", fontSize: 8, fontFamily: "monospace", fontWeight: 700 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.9 },
        labelBgPadding: [4, 1] as [number, number],
        labelBgBorderRadius: 9999,
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
      {
        id: "e3-4",
        source: "step-3-clip",
        target: "step-4-noise",
        animated: true,
        label: "+𝒩(0, σ²C²I)",
        labelStyle: { fill: "#000000", fontSize: 8, fontFamily: "monospace", fontWeight: 700 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.9 },
        labelBgPadding: [4, 1] as [number, number],
        labelBgBorderRadius: 9999,
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
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
        animated: true,
        label: "Accountant (RDP)",
        labelStyle: { fill: "#000000", fontSize: 8, fontFamily: "monospace", fontWeight: 700 },
        labelBgStyle: { fill: "#FFFFFF", fillOpacity: 0.9 },
        labelBgPadding: [4, 1] as [number, number],
        labelBgBorderRadius: 9999,
        style: { stroke: "#000000", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#000000" },
      },
    ];
  }, [dpEnabled]);

  const activeDetail = stepDetails[activeStepId] || stepDetails["step-3-clip"];

  return (
    <div className="space-y-4 w-full">
      {/* Top Header Controls / Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              Client-Side DP-SGD Gradient Processing Pipeline
            </h4>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
            <span className="text-xs font-mono font-bold text-slate-500">
              PyTorch Opacus 1.6 (Abadi et al., 2016)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click any step node in the pipeline below to inspect its exact mathematical formulation and cryptographic sensitivity bound.
          </p>
        </div>

        {/* DP Mode Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDpEnabled(!dpEnabled)}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              dpEnabled
                ? "bg-[#D4FF00] text-black shadow-xs ring-2 ring-black"
                : "bg-rose-100 text-rose-900 hover:bg-rose-200"
            }`}
          >
            {dpEnabled ? "DP-SGD Mechanism Active" : "Standard SGD (No DP - Vulnerable)"}
          </button>
        </div>
      </div>

      {/* Main Flow Canvas - Frameless rounded-3xl container */}
      <div className="h-[280px] w-full rounded-3xl overflow-hidden bg-[#F7F8FA]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          minZoom={0.5}
          maxZoom={1.5}
          onNodeClick={(_, node) => {
            if (stepDetails[node.id]) {
              setActiveStepId(node.id);
            }
          }}
          className="bg-[#F7F8FA]"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#E2E8F0" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      {/* Deep Step Inspector Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Mathematical Formulation & Purpose */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-[#F7F8FA] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                {activeDetail.title}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Click any pipeline node to inspect
              </span>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-white font-mono text-xs font-bold text-black my-2 shadow-xs">
              <code>{activeDetail.math}</code>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed mt-2">
              <strong className="text-black">Cryptographic Mechanism:</strong> {activeDetail.purpose}
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-500 mt-3 pt-3 border-t border-slate-200/60 flex justify-between">
            <span>Clipping Threshold: C = {maxGradNorm.toFixed(1)}</span>
            <span>Noise Multiplier: σ = {noiseMultiplier.toFixed(1)}</span>
          </div>
        </div>

        {/* Right: Security & Failure Risk Without This Step */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#F7F8FA] flex flex-col justify-between">
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
              Failure Mode if Omitted
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {activeDetail.dangerWithout}
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-black">
              Differential Privacy Bound:
            </span>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold ${
                dpEnabled
                  ? "bg-[#D4FF00] text-black"
                  : "bg-rose-100 text-rose-900"
              }`}
            >
              {dpEnabled ? `(ε ≈ ${epsilon.toFixed(2)}, δ = 1/600)` : "Unbounded (ε = ∞)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
