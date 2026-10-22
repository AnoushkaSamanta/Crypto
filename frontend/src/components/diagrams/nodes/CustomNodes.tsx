"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Database,
  Cpu,
  LockSimple,
  ShieldCheck,
  Target,
  Brain,
} from "@phosphor-icons/react";

// Server Node for FedAvg Workflow (White Claymorphism)
export const ServerNode = memo(({ data }: NodeProps) => {
  const round = (data?.round as number) || 30;
  return (
    <div className="relative px-5 py-3.5 rounded-2xl bg-white border border-blue-200/90 shadow-md min-w-[230px] text-center">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
        Aggregation Server
      </div>
      <div className="flex items-center justify-center gap-2 mt-1 mb-1.5">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
          <Database size={20} weight="duotone" />
        </div>
        <div className="text-left">
          <h4 className="text-xs font-bold text-slate-800">FedAvg Coordinator</h4>
          <p className="text-[10px] text-blue-600 font-mono font-medium">Round {round} / 30 Active</p>
        </div>
      </div>
      <div className="text-[10px] text-slate-600 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
        Aggregates: <code className="text-blue-700 font-mono font-bold">θ_(t+1) = Σ (n_k/N) w_k</code>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-blue-600 !border-2 !border-white shadow-xs"
      />
    </div>
  );
});
ServerNode.displayName = "ServerNode";

// Client Node for Federated Clients
export const ClientNode = memo(({ data }: NodeProps) => {
  const id = (data?.id as number) || 1;
  const isSelected = !!data?.isSelected;
  return (
    <div
      className={`relative px-4 py-3 rounded-xl bg-white border transition-all duration-200 min-w-[160px] ${
        isSelected
          ? "border-emerald-500 shadow-md shadow-emerald-500/10 scale-105"
          : "border-slate-200 shadow-xs hover:border-slate-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-emerald-600 !border-2 !border-white"
      />
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
          <Cpu size={16} weight="duotone" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800">Client #{id}</div>
          <div className="text-[10px] text-slate-500">600 local records</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-semibold text-emerald-700">
        <LockSimple size={11} weight="bold" />
        <span>Private Partition</span>
      </div>
    </div>
  );
});
ClientNode.displayName = "ClientNode";

// Attack Pipeline - Candidate Node
export const CandidateNode = memo(({ data }: NodeProps) => {
  const label = (data?.label as string) || "Candidate (x, y)";
  return (
    <div className="px-4 py-3 rounded-xl bg-white border border-purple-200 shadow-sm min-w-[170px] text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Target size={18} weight="bold" className="text-purple-600" />
        <span className="text-xs font-bold text-slate-800">{label}</span>
      </div>
      <p className="text-[10px] text-slate-500 font-medium">Black-Box Query Target</p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-purple-600 !border-2 !border-white"
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
      className={`px-5 py-3.5 rounded-2xl min-w-[200px] text-center border transition-all shadow-sm ${
        isProtected
          ? "bg-emerald-50/40 border-emerald-300"
          : "bg-rose-50/40 border-rose-300"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center justify-center gap-2 mb-1">
        {isProtected ? (
          <ShieldCheck size={20} weight="duotone" className="text-emerald-600" />
        ) : (
          <Brain size={20} weight="duotone" className="text-rose-600" />
        )}
        <h4 className="text-xs font-bold text-slate-800">
          {isProtected ? "DP-SGD Model (Opacus)" : "Baseline FL Model"}
        </h4>
      </div>
      <p className="text-[10px] text-slate-500 font-mono">
        {isProtected ? "Grad Clipping + Noise" : "Standard FedAvg Weights"}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
});
TargetModelNode.displayName = "TargetModelNode";

// Attack Pipeline - Decision Gate Node
export const DecisionGateNode = memo(({ data }: NodeProps) => {
  const threshold = (data?.threshold as number) || -0.5;
  return (
    <div className="px-4 py-3 rounded-xl bg-white border border-amber-200 shadow-sm min-w-[180px] text-center">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-amber-500 !border-2 !border-white"
      />
      <div className="text-xs font-bold text-amber-700 mb-0.5">Decision Gate</div>
      <div className="text-[10px] font-mono font-medium text-slate-700">
        Score ≥ τ ({threshold.toFixed(3)})
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="member"
        style={{ top: "35%" }}
        className="w-2.5 h-2.5 !bg-emerald-600 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="nonmember"
        style={{ top: "65%" }}
        className="w-2.5 h-2.5 !bg-rose-600 !border-2 !border-white"
      />
    </div>
  );
});
DecisionGateNode.displayName = "DecisionGateNode";
