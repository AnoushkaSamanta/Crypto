"use client";

import React from "react";
import {
  List,
  SlidersHorizontal,
  Cpu,
  GitBranch,
  LockKey,
  ShieldCheck,
} from "@phosphor-icons/react";
import { TabId } from "./StoryTabs";

interface NavbarProps {
  onToggleSidebar?: () => void;
  onOpenMobileMenu?: () => void;
  activeTab: TabId;
  seedCount?: number;
  totalRounds?: number;
  epsilon?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenMobileMenu,
  activeTab,
  seedCount = 3,
  totalRounds = 30,
  epsilon = 6.72,
}) => {
  const stageLabels: Record<TabId, string> = {
    train: "Stage 1: Federated Training (FedAvg)",
    attack: "Stage 2: Membership Inference Attack (MIA)",
    defend: "Stage 3: Differential Privacy Defense (DP-SGD)",
    compare: "Stage 4: Privacy vs Utility Benchmark",
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <List size={20} weight="bold" />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 hidden sm:inline">
              Experiment
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="font-bold text-slate-800">
              {stageLabels[activeTab]}
            </span>
          </div>
        </div>

        {/* Right Badges & Action Buttons */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
              <Cpu size={14} weight="duotone" className="text-blue-600" />
              <span>5 Clients</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
              <GitBranch size={14} className="text-emerald-600" />
              <span>{seedCount} Seeds • {totalRounds} Rds</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
              <LockKey size={14} weight="bold" />
              <span>ε = {epsilon.toFixed(2)}</span>
            </div>
          </div>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="clay-btn clay-btn-secondary flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
              title="View Experiment Hyperparameters"
            >
              <SlidersHorizontal size={15} weight="bold" className="text-slate-500" />
              <span className="hidden sm:inline">Hyperparameters</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
