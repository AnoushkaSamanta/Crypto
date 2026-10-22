"use client";

import React, { useState, useEffect } from "react";
import { TabId } from "./StoryTabs";
import { ExperimentConfig } from "@/types";
import {
  ShieldCheck,
  Cpu,
  Target,
  Scales,
  SlidersHorizontal,
  SidebarSimple,
  CaretLeft,
  CaretRight,
  Database,
  LockKey,
  X,
  Info,
} from "@phosphor-icons/react";

interface CollapsibleSidebarProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
  onOpenHyperparams: () => void;
  config: ExperimentConfig;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  activeTab,
  onChangeTab,
  onOpenHyperparams,
  config,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const toggleCollapse = onToggleCollapse;

  const navItems = [
    {
      id: "train" as TabId,
      label: "1. Train (FedAvg)",
      shortLabel: "Train",
      icon: Cpu,
      color: "text-blue-600",
      activeBg: "bg-blue-50 text-blue-700 font-semibold border-blue-200",
    },
    {
      id: "attack" as TabId,
      label: "2. Attack (MIA)",
      shortLabel: "Attack",
      icon: Target,
      color: "text-rose-600",
      activeBg: "bg-rose-50 text-rose-700 font-semibold border-rose-200",
    },
    {
      id: "defend" as TabId,
      label: "3. Defend (DP-SGD)",
      shortLabel: "Defend",
      icon: ShieldCheck,
      color: "text-emerald-600",
      activeBg: "bg-emerald-50 text-emerald-700 font-semibold border-emerald-200",
    },
    {
      id: "compare" as TabId,
      label: "4. Compare (Metrics)",
      shortLabel: "Compare",
      icon: Scales,
      color: "text-amber-600",
      activeBg: "bg-amber-50 text-amber-700 font-semibold border-amber-200",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-white border-r border-slate-200/90 shadow-sm transition-all duration-300 ease-in-out ${
          isMobileOpen
            ? "translate-x-0 w-68"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-18" : "lg:w-64"}`}
      >
        {/* Top: Logo & Toggle */}
        <div>
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                <ShieldCheck size={22} weight="duotone" />
              </div>

              {!isCollapsed && (
                <div className="truncate">
                  <span className="text-sm font-bold tracking-tight text-slate-800">
                    FL-MIA Demo
                  </span>
                  <div className="text-[10px] text-slate-400 font-medium leading-none">
                    DP Privacy Benchmark
                  </div>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <SidebarSimple size={18} weight="bold" />
            </button>
          </div>

          {/* Navigation Section */}
          <div className="px-3 py-4 space-y-6">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Workflow Stages
                </div>
              )}

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChangeTab(item.id);
                        onCloseMobile();
                      }}
                      className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                        isActive
                          ? `${item.activeBg} border shadow-xs`
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                      } ${isCollapsed ? "justify-center" : ""}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon
                        size={20}
                        weight={isActive ? "bold" : "regular"}
                        className={isActive ? item.color : "text-slate-400 group-hover:text-slate-600"}
                      />

                      {!isCollapsed && (
                        <span className="truncate font-medium">{item.label}</span>
                      )}

                      {/* Tooltip on collapsed desktop */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* System / Tools Section */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Settings & Data
                </div>
              )}

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onOpenHyperparams();
                    onCloseMobile();
                  }}
                  className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all ${
                    isCollapsed ? "justify-center" : ""
                  }`}
                  title={isCollapsed ? "Hyperparameters" : undefined}
                >
                  <SlidersHorizontal size={19} className="text-slate-400 group-hover:text-slate-600" />
                  {!isCollapsed && <span>Hyperparameters</span>}

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-lg z-50">
                      Hyperparameters
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card: Status Pill & Collapse Indicator */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Privacy Guarantee</span>
                <span className="font-mono text-emerald-600 font-bold">ε ≈ 6.72</span>
              </div>
              <p className="text-[11px] text-slate-400">
                5 Clients • Fashion-MNIST • RDP
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center cursor-pointer p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={toggleCollapse}
              title="Expand Sidebar"
            >
              <CaretRight size={18} weight="bold" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
