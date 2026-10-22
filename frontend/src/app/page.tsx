"use client";

import React, { useState } from "react";
import summaryDataRaw from "@/data/summary.json";
import candidatesDataRaw from "@/data/candidates_enriched.json";
import { SummaryData, Candidate } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StoryTabs, TabId } from "@/components/layout/StoryTabs";
import { TrainTab } from "@/components/tabs/TrainTab";
import { AttackTab } from "@/components/tabs/AttackTab";
import { DefendTab } from "@/components/tabs/DefendTab";
import { CompareTab } from "@/components/tabs/CompareTab";
import {
  ShieldCheck,
  Cpu,
  LockSimple,
  Sparkle,
} from "@phosphor-icons/react";

const summaryData = summaryDataRaw as unknown as SummaryData;
const candidatesData = candidatesDataRaw as unknown as Candidate[];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("train");
  const [activeCandidate, setActiveCandidate] = useState<Candidate>(
    candidatesData[0]
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const finalEps =
    summaryData.seed0_details.dp_history.epsilon[
      summaryData.seed0_details.dp_history.epsilon.length - 1
    ];

  return (
    <div className="min-h-screen flex flex-col bg-[#080C15] text-slate-100">
      {/* Top Navigation */}
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(true)}
        seedCount={summaryData.seeds.length}
        totalRounds={summaryData.config.rounds}
        epsilon={finalEps}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Presentation Header */}
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/20 border border-slate-800 shadow-2xl backdrop-blur-md">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 mb-3">
              <Sparkle size={14} weight="bold" />
              <span>Interactive Federated Privacy Benchmark</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Federated Learning Membership Inference Attack & DP Defense
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
              Demonstrating how collaborative models trained via <strong>Federated Averaging (FedAvg)</strong> leak individual training membership through memorization, and how <strong>Differential Privacy (DP-SGD via Opacus)</strong> provably protects user records at a modest utility cost.
            </p>
          </div>
        </div>

        {/* 4-Stage Story Tabs */}
        <StoryTabs activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Active Stage View */}
        <div className="transition-all duration-300">
          {activeTab === "train" && (
            <TrainTab
              history={summaryData.seed0_details.baseline_history}
              config={summaryData.config}
            />
          )}

          {activeTab === "attack" && (
            <AttackTab
              attackData={summaryData.seed0_details.baseline_attack}
              threshold={summaryData.seed0_details.baseline_threshold}
              candidates={candidatesData}
              activeCandidate={activeCandidate}
              onSelectCandidate={setActiveCandidate}
            />
          )}

          {activeTab === "defend" && (
            <DefendTab
              dpHistory={summaryData.seed0_details.dp_history}
              config={summaryData.config}
              candidate={activeCandidate}
              baselineThreshold={summaryData.seed0_details.baseline_threshold}
              dpThreshold={summaryData.seed0_details.dp_threshold}
            />
          )}

          {activeTab === "compare" && (
            <CompareTab
              baselineAgg={summaryData.aggregate.baseline}
              dpAgg={summaryData.aggregate.dp}
              baselineRoc={summaryData.seed0_details.baseline_attack.roc_curve}
              dpRoc={summaryData.seed0_details.dp_attack.roc_curve}
              baselineAuc={summaryData.seed0_details.baseline_attack.roc_auc}
              dpAuc={summaryData.seed0_details.dp_attack.roc_auc}
              noiseSweep={summaryData.noise_sweep}
            />
          )}
        </div>
      </main>

      {/* Hyperparameters Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        config={summaryData.config}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            FL-MIA Benchmark • PyTorch Opacus Differential Privacy
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>5 Clients</span>
            <span>Fashion-MNIST</span>
            <span>Rényi DP Accountant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
