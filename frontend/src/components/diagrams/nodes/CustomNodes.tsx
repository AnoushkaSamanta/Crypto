"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

// Server Node for FedAvg Workflow - Borderless Minimalist
export const ServerNode = memo(({ data }: NodeProps) => {
  const round = (data?.round as number) || 30;
  return (
    <div className="relative px-6 py-4 rounded-3xl bg-white shadow-sm min-w-[240px] text-center">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#D4FF00] text-[10px] font-black uppercase tracking-wider text-black shadow-xs">
        Server Coordinator
      </div>
      <div className="mt-1 mb-2">
        <h4 className="text-xs font-bold text-black">FedAvg Global Model</h4>
        <p className="text-[10px] text-slate-500 font-mono font-medium mt-0.5">Round {round} / 30 Active</p>
      </div>
      <div className="text-[10px] text-slate-600 px-3 py-1 rounded-full bg-slate-50 font-mono">
        <code>θ_(t+1) = Σ (n_k/N) w_k</code>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white shadow-xs"
      />
    </div>
  );
});
ServerNode.displayName = "ServerNode";

// Client Node for Federated Clients - Borderless Minimalist
export const ClientNode = memo(({ data }: NodeProps) => {
  const id = (data?.id as number) || 1;
  const isSelected = !!data?.isSelected;
  return (
    <div
      className={`relative px-4 py-3 rounded-2xl bg-white transition-all duration-200 min-w-[160px] text-center ${
        isSelected
          ? "shadow-md ring-2 ring-[#D4FF00] scale-105"
          : "shadow-xs hover:shadow-sm"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
      <div className="mb-1.5">
        <div className="text-xs font-bold text-black">Client #{id}</div>
        <div className="text-[10px] text-slate-400">600 local records</div>
      </div>
      <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-700">
        Private Partition
      </div>
    </div>
  );
});
ClientNode.displayName = "ClientNode";

// Attack Pipeline - Candidate Node
export const CandidateNode = memo(({ data }: NodeProps) => {
  const label = (data?.label as string) || "Candidate (x, y)";
  return (
    <div className="px-5 py-3.5 rounded-2xl bg-white shadow-sm min-w-[170px] text-center">
      <div className="text-xs font-bold text-black mb-0.5">{label}</div>
      <p className="text-[10px] text-slate-400 font-medium">Black-Box Query Target</p>
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
      className={`px-5 py-3.5 rounded-2xl min-w-[200px] text-center transition-all shadow-sm ${
        isProtected ? "bg-[#D4FF00]/15" : "bg-slate-100/70"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
      <h4 className="text-xs font-bold text-black">
        {isProtected ? "DP-SGD Model (Opacus)" : "Baseline FL Model"}
      </h4>
      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
        {isProtected ? "Grad Clipping + Noise" : "Standard FedAvg Weights"}
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
    <div className="px-5 py-3.5 rounded-2xl bg-white shadow-sm min-w-[180px] text-center">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-black !border-2 !border-white"
      />
      <div className="text-xs font-bold text-black mb-0.5">Decision Gate</div>
      <div className="text-[10px] font-mono font-bold text-slate-600">
        Score ≥ τ ({threshold.toFixed(3)})
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

