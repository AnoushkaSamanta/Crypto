"use client";

import React, { useState } from "react";
import summaryDataRaw from "@/data/summary.json";
import candidatesDataRaw from "@/data/candidates_enriched.json";
import { SummaryData, Candidate } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { CollapsibleSidebar } from "@/components/layout/CollapsibleSidebar";
import { Sidebar as HyperparametersDrawer } from "@/components/layout/Sidebar";
import { TabId } from "@/components/layout/StoryTabs";
import { TrainTab } from "@/components/tabs/TrainTab";
import { AttackTab } from "@/components/tabs/AttackTab";
import { DefendTab } from "@/components/tabs/DefendTab";
import { CompareTab } from "@/components/tabs/CompareTab";

const summaryData = summaryDataRaw as unknown as SummaryData;
const candidatesData = candidatesDataRaw as unknown as Candidate[];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("train");
  const [activeCandidate, setActiveCandidate] = useState<Candidate>(
    candidatesData[0]
  );
  const [isHyperparamsOpen, setIsHyperparamsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("fl_mia_sidebar_collapsed");
      if (saved !== null) {
        setIsSidebarCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleSidebarCollapse = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    try {
      localStorage.setItem("fl_mia_sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  const finalEps =
    summaryData.seed0_details.dp_history.epsilon[
      summaryData.seed0_details.dp_history.epsilon.length - 1
    ];

  return (
    <div className="min-h-screen flex bg-white text-[#11141A]">
      {/* 1. Left Navigation Sidebar */}
      <CollapsibleSidebar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenHyperparams={() => setIsHyperparamsOpen(true)}
        config={summaryData.config}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      {/* 2. Main Viewport Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
        id="main-content"
      >
        {/* Sticky Header */}
        <Navbar
          onToggleSidebar={() => setIsHyperparamsOpen(true)}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          activeTab={activeTab}
          seedCount={summaryData.seeds.length}
          totalRounds={summaryData.config.rounds}
          epsilon={finalEps}
        />

        {/* Frameless Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8">
          {/* Hero Header - Frameless & Open */}
          <section className="py-2 sm:py-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4FF00] text-black mb-3">
                <span>Federated Privacy Benchmark</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black leading-tight">
                Federated Learning Membership Inference & DP Defense
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Demonstrating how models trained via <strong>Federated Averaging (FedAvg)</strong> leak individual training records through memorization, and how <strong>Differential Privacy (DP-SGD via Opacus)</strong> provably mitigates membership risk.
              </p>
            </div>
          </section>

          {/* Active Stage View directly (StoryTabs removed as requested) */}
          <div className="transition-all duration-200">
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

        {/* Clean Borderless Footer */}
        <footer className="w-full py-6 text-xs text-slate-400 font-mono mt-8">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              FL-MIA Benchmark • PyTorch Opacus Differential Privacy
            </div>
            <div className="flex items-center gap-3 text-slate-500 font-medium">
              <span>5 Clients</span>
              <span>•</span>
              <span>Fashion-MNIST</span>
              <span>•</span>
              <span>Rényi DP</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Hyperparameters Drawer */}
      <HyperparametersDrawer
        isOpen={isHyperparamsOpen}
        onClose={() => setIsHyperparamsOpen(false)}
        config={summaryData.config}
      />
    </div>
  );
}
