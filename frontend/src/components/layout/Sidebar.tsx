"use client";

import React from "react";
import { ExperimentConfig } from "@/types";
import { X } from "@phosphor-icons/react";

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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/20 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4">
            <div>
              <div className="inline-block px-3 py-0.5 rounded-full bg-[#D4FF00] text-black font-bold text-[10px] uppercase tracking-wider mb-1">
                Configuration
              </div>
              <h3 className="text-base font-bold text-black">
                Experiment Hyperparameters
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close Panel"
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          {/* Hyperparameter Sections */}
          <div className="space-y-6 mt-6 text-xs">
            {/* Federated Partitioning */}
            <div>
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                01  Federated Topology & Data
              </div>
              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Clients Count:</span>
                  <span className="text-black font-bold">{config.num_clients}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Samples / Client:</span>
                  <span className="text-slate-800">{config.client_samples}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Training Pool:</span>
                  <span className="text-black font-bold">
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
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                02  Differential Privacy (DP-SGD)
              </div>
              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Engine / Library:</span>
                  <span className="text-black font-bold">PyTorch Opacus 1.6</span>
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
                  <span className="text-black font-bold">{config.delta.toFixed(5)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Privacy Accountant:</span>
                  <span className="text-slate-800">Rényi DP (RDP)</span>
                </div>
              </div>
            </div>

            {/* Optimization & Training */}
            <div>
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                03  Training Dynamics & Architecture
              </div>
              <div className="space-y-2.5 rounded-2xl bg-slate-50 p-4 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Architecture:</span>
                  <span className="text-black font-sans font-medium">SmallCNN (GroupNorm 4g)</span>
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
        <div className="pt-4 text-[11px] text-slate-400 text-center font-mono">
          Evaluated across seeds {config.seeds.join(", ")} on Fashion-MNIST
        </div>
      </div>
    </div>
  );
};
