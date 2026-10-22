"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

// Server Node for FedAvg Workflow - Academic & Premium
export const ServerNode = memo(({ data }: NodeProps) => {
  const round = (data?.round as number) || 30;
  const phase = (data?.phase as string) || "broadcast";

  const phaseDetails = {
    broadcast: {
      tag: "Broadcasting θ_t",
      badgeClass: "bg-black text-white",
    },
    train: {
      tag: "Clients Training",
      badgeClass: "bg-slate-200 text-slate-800",
    },
    upload: {
      tag: "Aggregating Weights",
      badgeClass: "bg-[#D4FF00] text-black font-black",
    },
  }[phase] || {
    tag: "Synchronized",
    badgeClass: "bg-black text-white",
  };

  return (
    <div className="relative px-6 py-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs min-w-[280px] max-w-[320px] text-center transition-all">
      {/* Top Accent Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-black text-[9px] font-mono font-bold uppercase tracking-wider text-white shadow-xs">
        Central Coordinator
      </div>

      <div className="mt-1 mb-2">
        <h4 className="text-xs font-black text-black tracking-tight">FedAvg Global Server</h4>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-[10px] text-slate-500 font-mono font-bold">Round {round} / 30</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${phaseDetails.badgeClass}`}>
            {phaseDetails.tag}
          </span>
        </div>
      </div>

      {/* Mathematical Aggregation Formula */}
      <div className="px-3 py-1.5 rounded-2xl bg-[#F7F8FA] border border-slate-100/80 text-[11px] font-mono text-black font-bold">
        <code>θ_(t+1) = ∑ (n_k / N) · w_k</code>
      </div>

      <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono mt-2 px-1">
        <span>5 Active Clients</span>
        <span>N = 3,000 Records</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="server-source"
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white shadow-xs"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="server-target"
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white shadow-xs"
      />
    </div>
  );
});
ServerNode.displayName = "ServerNode";

// Client Node for Federated Clients - Academic & Premium
export const ClientNode = memo(({ data }: NodeProps) => {
  const id = (data?.id as number) || 1;
  const isSelected = !!data?.isSelected;
  const isTraining = !!data?.isTraining;
  const phase = (data?.phase as string) || "broadcast";

  return (
    <div
      className={`relative px-4 py-3.5 rounded-2xl bg-white border transition-all duration-200 w-[180px] text-center cursor-pointer ${
        isSelected
          ? "border-black ring-2 ring-[#D4FF00] shadow-md scale-105"
          : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        id="client-target"
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="client-source"
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-black text-black">Client #{id}</span>
        <span className="text-[9px] font-mono text-slate-400 font-semibold">n_{id} = 600</span>
      </div>

      {/* Dynamic Status per Phase */}
      <div className="my-1.5">
        {isTraining ? (
          <div className="px-2 py-1 rounded-full bg-[#D4FF00] text-black text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
            <span>Local SGD</span>
          </div>
        ) : phase === "broadcast" ? (
          <div className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] font-mono font-bold">
            Receiving θ_t
          </div>
        ) : (
          <div className="px-2 py-1 rounded-full bg-black text-white text-[9px] font-mono font-bold">
            Uploading Δw_{id}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-1 text-[9px] font-mono text-slate-500 mt-1">
        <span>Shard D_{id}</span>
        <span>•</span>
        <span>E = 2, B = 32</span>
      </div>

      {isSelected && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#D4FF00] text-[8px] font-black uppercase text-black tracking-wider shadow-xs">
          Active Shard
        </div>
      )}
    </div>
  );
});
ClientNode.displayName = "ClientNode";

// Attack Pipeline - Candidate Node
export const CandidateNode = memo(({ data }: NodeProps) => {
  const label = (data?.label as string) || "Candidate (x, y)";
  return (
    <div className="px-5 py-4 rounded-3xl bg-white shadow-xs min-w-[180px] text-center">
      <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
        Target Query
      </div>
      <div className="text-xs font-black text-black mb-0.5">{label}</div>
      <p className="text-[10px] text-slate-400 font-mono">Vector x ∈ ℝ^(28×28)</p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
    </div>
  );
});
CandidateNode.displayName = "CandidateNode";

// Attack Pipeline - Model Under Attack Node
export const TargetModelNode = memo(({ data }: NodeProps) => {
  const isProtected = !!data?.isProtected;
  return (
    <div
      className={`px-6 py-4 rounded-3xl min-w-[220px] text-center transition-all ${
        isProtected ? "bg-[#D4FF00]/15" : "bg-white shadow-xs"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
      <div className="inline-block px-2.5 py-0.5 rounded-full bg-black text-white text-[9px] font-mono font-bold uppercase tracking-wider mb-1.5">
        {isProtected ? "DP-SGD Defense" : "Black-Box Target"}
      </div>
      <h4 className="text-xs font-black text-black">
        {isProtected ? "Protected Global Model" : "Baseline FL Model (FedAvg)"}
      </h4>
      <p className="text-[10px] text-slate-500 font-mono mt-1">
        Forward Pass: x ↦ f_θ(x) ∈ [0, 1]^10
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
    </div>
  );
});
TargetModelNode.displayName = "TargetModelNode";

// Attack Pipeline - Decision Gate Node
export const DecisionGateNode = memo(({ data }: NodeProps) => {
  const threshold = (data?.threshold as number) || -0.5;
  return (
    <div className="px-5 py-4 rounded-3xl bg-white shadow-xs min-w-[200px] text-center">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
      <div className="text-[10px] font-black uppercase tracking-wider text-black mb-1">
        Yeom Decision Rule
      </div>
      <div className="text-xs font-mono font-black text-black bg-[#F7F8FA] px-3 py-1.5 rounded-xl mb-1">
        S(x) = -ℒ_CE ≥ τ
      </div>
      <div className="text-[10px] font-mono text-slate-500">
        Cutoff τ = {threshold.toFixed(3)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="member"
        style={{ top: "35%" }}
        className="w-2.5 h-2.5 !bg-[#D4FF00] !border-2 !border-black"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="nonmember"
        style={{ top: "65%" }}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
    </div>
  );
});
DecisionGateNode.displayName = "DecisionGateNode";


