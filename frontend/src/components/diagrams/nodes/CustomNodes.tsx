"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Database,
  Cpu,
  LockSimple,
  ShieldCheck,
  Target,
  ChartLineUp,
  Brain,
  Sliders,
  WarningCircle,
  FileCode,
} from "@phosphor-icons/react";

// Server Node for FedAvg Workflow
export const ServerNode = memo(({ data }: NodeProps) => {
  const round = (data?.round as number) || 30;
  return (
    <div className="relative px-5 py-4 rounded-2xl bg-gradient-to-b from-blue-950/80 to-slate-900/90 border-2 border-blue-500/50 shadow-2xl shadow-blue-500/10 min-w-[240px] text-center backdrop-blur-md">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
        Aggregation Server
      </div>
      <div className="flex items-center justify-center gap-2 mt-1 mb-2">
        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
          <Database size={24} weight="duotone" />
        </div>
        <div className="text-left">
          <h4 className="text-sm font-bold text-slate-100">FedAvg Coordinator</h4>
          <p className="text-[11px] text-blue-300/80 font-mono">Round {round} / 30 Active</p>
        </div>
      </div>
      <div className="text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-950/60 border border-slate-800">
        Aggregates: <code className="text-blue-300 font-mono">θ_(t+1) = Σ (n_k/N) w_k</code>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-400 !border-2 !border-slate-900 shadow-md"
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
      className={`relative px-4 py-3 rounded-xl bg-slate-900/85 border transition-all duration-200 min-w-[170px] backdrop-blur-sm ${
        isSelected
          ? "border-emerald-400 shadow-lg shadow-emerald-500/20 scale-105"
          : "border-slate-700/60 hover:border-slate-500"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-emerald-400 !border-2 !border-slate-900"
      />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <Cpu size={18} weight="duotone" />
        </div>
        <div>
          <div className="text-xs font-semibold text-slate-200">Client #{id}</div>
          <div className="text-[10px] text-slate-400">600 local records</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-medium text-emerald-300">
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
    <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-lg shadow-purple-500/10 min-w-[180px] text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <Target size={20} weight="bold" className="text-purple-400" />
        <span className="text-xs font-bold text-slate-200">{label}</span>
      </div>
      <p className="text-[10px] text-slate-400">Black-Box Query Target</p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-purple-400 !border-2 !border-slate-900"
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
      className={`px-5 py-4 rounded-2xl min-w-[210px] text-center border-2 transition-all shadow-xl ${
        isProtected
          ? "bg-emerald-950/60 border-emerald-500/60 shadow-emerald-500/10"
          : "bg-rose-950/60 border-rose-500/60 shadow-rose-500/10"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-slate-900"
      />
      <div className="flex items-center justify-center gap-2 mb-1">
        {isProtected ? (
          <ShieldCheck size={22} weight="duotone" className="text-emerald-400" />
        ) : (
          <Brain size={22} weight="duotone" className="text-rose-400" />
        )}
        <h4 className="text-xs font-bold text-slate-100">
          {isProtected ? "DP-SGD Model (Opacus)" : "Baseline FL Model"}
        </h4>
      </div>
      <p className="text-[10px] text-slate-300 font-mono">
        {isProtected ? "Grad Clipping + Noise" : "Standard FedAvg Weights"}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 !bg-slate-300 !border-2 !border-slate-900"
      />
    </div>
  );
});
TargetModelNode.displayName = "TargetModelNode";

// Attack Pipeline - Decision Gate Node
export const DecisionGateNode = memo(({ data }: NodeProps) => {
  const threshold = (data?.threshold as number) || -0.5;
  return (
    <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-amber-500/50 shadow-lg min-w-[190px] text-center">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 !bg-amber-400 !border-2 !border-slate-900"
      />
      <div className="text-xs font-bold text-amber-400 mb-1">Decision Gate</div>
      <div className="text-[11px] font-mono text-slate-200">
        Score ≥ τ ({threshold.toFixed(3)})
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="member"
        style={{ top: "35%" }}
        className="w-2.5 h-2.5 !bg-emerald-400 !border-2 !border-slate-900"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="nonmember"
        style={{ top: "65%" }}
        className="w-2.5 h-2.5 !bg-rose-400 !border-2 !border-slate-900"
      />
    </div>
  );
});
DecisionGateNode.displayName = "DecisionGateNode";
