"use client";

import React from "react";
import { List } from "@phosphor-icons/react";
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
    train: "01  Federated Training (FedAvg)",
    attack: "02  Membership Inference Attack (MIA)",
    defend: "03  Differential Privacy Defense (DP-SGD)",
    compare: "04  Privacy vs Utility Benchmark",
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Stage Title */}
        <div className="flex items-center gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-full text-slate-600 hover:text-black hover:bg-slate-200/60 transition-colors"
              title="Open Navigation"
            >
              <List size={20} weight="bold" />
            </button>
          )}

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-black text-sm tracking-tight">
              {stageLabels[activeTab]}
            </span>
          </div>
        </div>

        {/* Right Status Badges & Action Buttons (Clean & Minimal) */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              5 Clients
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-medium">
              {seedCount} Seeds • {totalRounds} Rds
            </div>
            <div className="px-3 py-1 rounded-full bg-[#D4FF00] text-black font-bold">
              ε ≈ {epsilon.toFixed(2)}
            </div>
          </div>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="btn-neutral px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer"
              title="View Experiment Hyperparameters"
            >
              Hyperparameters
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
