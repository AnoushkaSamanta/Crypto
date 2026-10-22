"use client";

import React from "react";
import {
  Cpu,
  Target,
  ShieldCheck,
  Scales,
} from "@phosphor-icons/react";

export type TabId = "train" | "attack" | "defend" | "compare";

interface StoryTabsProps {
  activeTab: TabId;
  onChangeTab: (tab: TabId) => void;
}

export const StoryTabs: React.FC<StoryTabsProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs = [
    {
      id: "train" as TabId,
      step: "Stage 1",
      label: "TRAIN",
      description: "Federated Learning (FedAvg)",
      icon: Cpu,
      activeColor: "text-blue-600",
      activeBg: "bg-blue-50/70 border-blue-200 text-blue-900",
      iconBg: "bg-blue-100 text-blue-700",
    },
    {
      id: "attack" as TabId,
      step: "Stage 2",
      label: "ATTACK",
      description: "Membership Inference (MIA)",
      icon: Target,
      activeColor: "text-rose-600",
      activeBg: "bg-rose-50/70 border-rose-200 text-rose-900",
      iconBg: "bg-rose-100 text-rose-700",
    },
    {
      id: "defend" as TabId,
      step: "Stage 3",
      label: "DEFEND",
      description: "Differential Privacy (DP-SGD)",
      icon: ShieldCheck,
      activeColor: "text-emerald-600",
      activeBg: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "compare" as TabId,
      step: "Stage 4",
      label: "COMPARE",
      description: "Trade-offs & Benchmark",
      icon: Scales,
      activeColor: "text-amber-600",
      activeBg: "bg-amber-50/70 border-amber-200 text-amber-900",
      iconBg: "bg-amber-100 text-amber-700",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-1.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? `${tab.activeBg} border shadow-xs`
                  : "hover:bg-slate-50 text-slate-600 border border-transparent"
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-all ${
                  isActive
                    ? tab.iconBg
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Icon size={19} weight={isActive ? "bold" : "regular"} />
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {tab.step}
                </div>
                <div
                  className={`text-xs font-bold tracking-tight ${
                    isActive ? "text-slate-900" : "text-slate-700"
                  }`}
                >
                  {tab.label}
                </div>
                <div className="text-[11px] text-slate-500 hidden lg:block truncate max-w-[140px]">
                  {tab.description}
                </div>
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
