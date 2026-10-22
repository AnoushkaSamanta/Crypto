"use client";

import React, { useState } from "react";
import summaryDataRaw from "@/data/summary.json";
import candidatesDataRaw from "@/data/candidates_enriched.json";
import { SummaryData, Candidate } from "@/types";
import { Navbar } from "@/components/layout/Navbar";
import { CollapsibleSidebar } from "@/components/layout/CollapsibleSidebar";
import { Sidebar as HyperparametersDrawer } from "@/components/layout/Sidebar";
import { StoryTabs, TabId } from "@/components/layout/StoryTabs";
import { TrainTab } from "@/components/tabs/TrainTab";
import { AttackTab } from "@/components/tabs/AttackTab";
import { DefendTab } from "@/components/tabs/DefendTab";
import { CompareTab } from "@/components/tabs/CompareTab";
import { Sparkle } from "@phosphor-icons/react";

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

  // Load sidebar collapsed state from localStorage
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
    <div className="min-h-screen flex bg-[#F8F9FC] text-[#1E232F]">
      {/* 1. Collapsible Left Navigation Sidebar */}
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
          isSidebarCollapsed ? "lg:pl-18" : "lg:pl-64"
        }`}
        id="main-content"
      >
        {/* Sticky Clean Header */}
        <Navbar
          onToggleSidebar={() => setIsHyperparamsOpen(true)}
          onOpenMobileMenu={() => setIsMobileNavOpen(true)}
          activeTab={activeTab}
          seedCount={summaryData.seeds.length}
          totalRounds={summaryData.config.rounds}
          epsilon={finalEps}
        />

        {/* Scrollable Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Hero Presentation Header - White Claymorphism */}
          <div className="clay-card-raised p-6 sm:p-7 relative bg-white border border-slate-200/90 shadow-sm">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 mb-2.5">
                <Sparkle size={14} weight="bold" />
                <span>Interactive Federated Privacy Benchmark</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Federated Learning Membership Inference Attack & DP Defense
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
                Demonstrating how decentralized models trained via <strong>Federated Averaging (FedAvg)</strong> leak individual training membership through memorization, and how <strong>Differential Privacy (DP-SGD via Opacus)</strong> provably protects user records at a modest utility cost.
              </p>
            </div>
          </div>

          {/* 4-Stage Story Tabs */}
          <StoryTabs activeTab={activeTab} onChangeTab={setActiveTab} />

          {/* Active Stage View */}
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

        {/* Clean Light Footer */}
        <footer className="w-full border-t border-slate-200/80 bg-white py-5 text-center text-xs text-slate-500 font-mono mt-12">
          <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              FL-MIA Benchmark • PyTorch Opacus Differential Privacy
            </div>
            <div className="flex items-center gap-3 text-slate-600 font-medium">
              <span>5 Clients</span>
              <span>•</span>
              <span>Fashion-MNIST</span>
              <span>•</span>
              <span>Rényi DP Accountant</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Hyperparameters Slide-Out Drawer */}
      <HyperparametersDrawer
        isOpen={isHyperparamsOpen}
        onClose={() => setIsHyperparamsOpen(false)}
        config={summaryData.config}
      />
    </div>
  );
}
