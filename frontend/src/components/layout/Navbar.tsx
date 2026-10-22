"use client";

import React from "react";
import {
  ShieldCheck,
  Cpu,
  GitBranch,
  SlidersHorizontal,
  LockKey,
} from "@phosphor-icons/react";

interface NavbarProps {
  onToggleSidebar?: () => void;
  seedCount?: number;
  totalRounds?: number;
  epsilon?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  seedCount = 3,
  totalRounds = 30,
  epsilon = 6.72,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Project Identity */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={26} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                FL-MIA
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                DP Defense Benchmark
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Federated Learning Membership Inference Attack & Differential Privacy
            </p>
          </div>
        </div>

        {/* Right Badges & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <Cpu size={14} weight="duotone" className="text-blue-400" />
              <span>5 Clients</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <GitBranch size={14} weight="regular" className="text-emerald-400" />
              <span>{seedCount} Seeds ({totalRounds} Rds)</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-purple-300">
              <LockKey size={14} weight="bold" />
              <span>ε = {epsilon.toFixed(2)}</span>
            </div>
          </div>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
              title="Toggle Hyperparameters"
            >
              <SlidersHorizontal size={16} weight="bold" />
              <span className="hidden sm:inline">Hyperparameters</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
