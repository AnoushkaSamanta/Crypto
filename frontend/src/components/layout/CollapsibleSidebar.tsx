"use client";

import React from "react";
import { TabId } from "./StoryTabs";
import { ExperimentConfig } from "@/types";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";

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
  const navItems = [
    {
      id: "train" as TabId,
      step: "01",
      label: "Train (FedAvg)",
      shortLabel: "01",
    },
    {
      id: "attack" as TabId,
      step: "02",
      label: "Attack (MIA)",
      shortLabel: "02",
    },
    {
      id: "defend" as TabId,
      step: "03",
      label: "Defend (DP-SGD)",
      shortLabel: "03",
    },
    {
      id: "compare" as TabId,
      step: "04",
      label: "Compare (Metrics)",
      shortLabel: "04",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col justify-between bg-white transition-all duration-300 ease-in-out ${
          isMobileOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Top: Logo & Toggle */}
        <div>
          <div className="h-16 flex items-center justify-between px-5">
            <div className="flex items-center gap-2 overflow-hidden">
              {!isCollapsed ? (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-black">
                      FL•MIA
                    </span>
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00]" />
                  </div>
                  <div className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                    Privacy Benchmark
                  </div>
                </div>
              ) : (
                <div className="w-full flex items-center justify-center">
                  <span className="text-sm font-black text-black">FL</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] ml-0.5" />
                </div>
              )}
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-full text-slate-400 hover:text-black hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <CaretRight size={16} weight="bold" /> : <CaretLeft size={16} weight="bold" />}
            </button>
          </div>

          {/* Navigation Items (Without Icons) */}
          <div className="px-3 py-4 space-y-6">
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Workflow Stages
                </div>
              )}

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onChangeTab(item.id);
                        onCloseMobile();
                      }}
                      className={`group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#D4FF00] text-black font-bold shadow-xs"
                          : "text-slate-600 hover:bg-slate-100 hover:text-black font-medium"
                      } ${isCollapsed ? "justify-center px-0" : ""}`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <span
                        className={`text-[11px] font-mono tracking-tight ${
                          isActive ? "text-black font-black" : "text-slate-500 font-bold"
                        }`}
                      >
                        {item.step}
                      </span>

                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}

                      {/* Tooltip on collapsed desktop */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Settings & Parameters */}
            <div>
              {!isCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Settings
                </div>
              )}

              <div className="space-y-1">
                <button
                  onClick={() => {
                    onOpenHyperparams();
                    onCloseMobile();
                  }}
                  className={`group relative w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-slate-600 hover:bg-slate-100 hover:text-black font-medium transition-all cursor-pointer ${
                    isCollapsed ? "justify-center px-0" : ""
                  }`}
                  title={isCollapsed ? "Hyperparameters" : undefined}
                >
                  <span className="text-[11px] font-mono text-slate-500 font-bold">CF</span>
                  {!isCollapsed && <span>Hyperparameters</span>}

                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-md z-50">
                      Hyperparameters
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card: Minimal Status */}
        <div className="p-3">
          {!isCollapsed ? (
            <div className="p-3.5 rounded-2xl bg-slate-50">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-0.5">
                <span>Privacy Bound</span>
                <span className="px-2 py-0.5 rounded-full bg-[#D4FF00] text-black font-mono font-bold text-[10px]">
                  ε ≈ 6.72
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                5 Clients • 600 records each
              </p>
            </div>
          ) : (
            <div
              className="flex justify-center cursor-pointer p-2 rounded-full text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
              onClick={onToggleCollapse}
              title="Expand Sidebar"
            >
              <CaretRight size={16} weight="bold" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
