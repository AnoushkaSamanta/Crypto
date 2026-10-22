"use client";

import React from "react";
import { ExperimentConfig } from "@/types";
import {
  X,
  SlidersHorizontal,
  Database,
  Cpu,
  LockKey,
  ShieldCheck,
  Target,
} from "@phosphor-icons/react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  config: ExperimentConfig;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-slate-800 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={20} weight="bold" className="text-blue-400" />
              <h3 className="text-base font-bold text-slate-100">
                Experiment Hyperparameters
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Hyperparameter Sections */}
          <div className="space-y-6 mt-6 text-xs">
            {/* Federated Partitioning */}
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-3">
                <Cpu size={16} weight="duotone" className="text-blue-400" />
                Federated Topology & Data
              </div>
              <div className="space-y-2 rounded-xl bg-slate-900/70 p-3.5 border border-slate-800 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Clients Count:</span>
                  <span className="text-slate-100 font-bold">{config.num_clients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Samples / Client:</span>
                  <span className="text-slate-100">{config.client_samples}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Training Pool:</span>
                  <span className="text-emerald-400 font-bold">
                    {config.num_clients * config.client_samples} members
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Non-members Pool:</span>
                  <span className="text-slate-100">{config.nonmembers_pool_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Global Test Set:</span>
                  <span className="text-slate-100">{config.global_test_size}</span>
                </div>
              </div>
            </div>

            {/* Differential Privacy Setup */}
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-3">
                <ShieldCheck size={16} weight="duotone" className="text-emerald-400" />
                Differential Privacy (DP-SGD)
              </div>
              <div className="space-y-2 rounded-xl bg-slate-900/70 p-3.5 border border-slate-800 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Engine / Library:</span>
                  <span className="text-emerald-400 font-bold">PyTorch Opacus 1.6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Grad Norm (C):</span>
                  <span className="text-slate-100">{config.max_grad_norm.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Noise Multiplier (σ):</span>
                  <span className="text-slate-100">{config.noise_multiplier.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Delta (δ):</span>
                  <span className="text-purple-300 font-bold">{config.delta.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Privacy Accountant:</span>
                  <span className="text-slate-100">Rényi DP (RDP)</span>
                </div>
              </div>
            </div>

            {/* Optimization & Training */}
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-3">
                <Database size={16} weight="duotone" className="text-purple-400" />
                Training Dynamics & Architecture
              </div>
              <div className="space-y-2 rounded-xl bg-slate-900/70 p-3.5 border border-slate-800 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Architecture:</span>
                  <span className="text-slate-100 font-sans">SmallCNN (GroupNorm 4g)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Communication Rounds:</span>
                  <span className="text-slate-100">{config.rounds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Local Epochs:</span>
                  <span className="text-slate-100">{config.local_epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Size:</span>
                  <span className="text-slate-100">{config.batch_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Learning Rate (lr):</span>
                  <span className="text-slate-100">{config.lr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Evaluated across seeds {config.seeds.join(", ")} on Fashion-MNIST
        </div>
      </div>
    </div>
  );
};
