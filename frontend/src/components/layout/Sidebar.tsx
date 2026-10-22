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
  Info,
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <SlidersHorizontal size={18} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Experiment Hyperparameters
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Hyperparameter Sections */}
          <div className="space-y-6 mt-6 text-xs">
            {/* Federated Partitioning */}
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">
                <Cpu size={16} weight="duotone" className="text-blue-600" />
                Federated Topology & Data
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Clients Count:</span>
                  <span className="text-slate-900 font-bold">{config.num_clients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Samples / Client:</span>
                  <span className="text-slate-800">{config.client_samples}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Training Pool:</span>
                  <span className="text-emerald-700 font-bold">
                    {config.num_clients * config.client_samples} members
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Non-members Pool:</span>
                  <span className="text-slate-800">{config.nonmembers_pool_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Global Test Set:</span>
                  <span className="text-slate-800">{config.global_test_size}</span>
                </div>
              </div>
            </div>

            {/* Differential Privacy Setup */}
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">
                <ShieldCheck size={16} weight="duotone" className="text-emerald-600" />
                Differential Privacy (DP-SGD)
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Engine / Library:</span>
                  <span className="text-emerald-700 font-bold">PyTorch Opacus 1.6</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Max Grad Norm (C):</span>
                  <span className="text-slate-800">{config.max_grad_norm.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Noise Multiplier (σ):</span>
                  <span className="text-slate-800">{config.noise_multiplier.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Target Delta (δ):</span>
                  <span className="text-purple-700 font-bold">{config.delta.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Privacy Accountant:</span>
                  <span className="text-slate-800">Rényi DP (RDP)</span>
                </div>
              </div>
            </div>

            {/* Optimization & Training */}
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2.5">
                <Database size={16} weight="duotone" className="text-purple-600" />
                Training Dynamics & Architecture
              </div>
              <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Architecture:</span>
                  <span className="text-slate-900 font-sans font-medium">SmallCNN (GroupNorm 4g)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Communication Rounds:</span>
                  <span className="text-slate-800">{config.rounds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Local Epochs:</span>
                  <span className="text-slate-800">{config.local_epochs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Batch Size:</span>
                  <span className="text-slate-800">{config.batch_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Learning Rate (lr):</span>
                  <span className="text-slate-800">{config.lr}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          Evaluated across seeds {config.seeds.join(", ")} on Fashion-MNIST
        </div>
      </div>
    </div>
  );
};
