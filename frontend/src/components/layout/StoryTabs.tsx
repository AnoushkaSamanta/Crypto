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
      color: "from-blue-600 to-indigo-600",
      activeText: "text-blue-400",
      borderColor: "border-blue-500",
    },
    {
      id: "attack" as TabId,
      step: "Stage 2",
      label: "ATTACK",
      description: "Membership Inference (MIA)",
      icon: Target,
      color: "from-purple-600 to-rose-600",
      activeText: "text-rose-400",
      borderColor: "border-rose-500",
    },
    {
      id: "defend" as TabId,
      step: "Stage 3",
      label: "DEFEND",
      description: "Differential Privacy (DP-SGD)",
      icon: ShieldCheck,
      color: "from-emerald-600 to-teal-600",
      activeText: "text-emerald-400",
      borderColor: "border-emerald-500",
    },
    {
      id: "compare" as TabId,
      step: "Stage 4",
      label: "COMPARE",
      description: "Trade-offs & Verification",
      icon: Scales,
      color: "from-amber-600 to-orange-600",
      activeText: "text-amber-400",
      borderColor: "border-amber-500",
    },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 text-left ${
                isActive
                  ? "bg-slate-800/95 border border-slate-700 shadow-lg"
                  : "hover:bg-slate-800/40 text-slate-400 border border-transparent"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  isActive
                    ? `bg-gradient-to-br ${tab.color} text-white border-transparent shadow-md`
                    : "bg-slate-950/70 text-slate-500 border-slate-800"
                }`}
              >
                <Icon size={20} weight={isActive ? "bold" : "regular"} />
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {tab.step}
                </div>
                <div
                  className={`text-sm font-bold tracking-tight ${
                    isActive ? "text-slate-100" : "text-slate-300"
                  }`}
                >
                  {tab.label}
                </div>
                <div className="text-[11px] text-slate-400 hidden lg:block truncate max-w-[150px]">
                  {tab.description}
                </div>
              </div>

              {isActive && (
                <div
                  className={`absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-gradient-to-r ${tab.color}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
