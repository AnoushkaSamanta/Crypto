"use client";

import React, { useState, useEffect } from "react";
import { TrainingHistory, ExperimentConfig } from "@/types";
import { FedAvgFlow } from "../diagrams/FedAvgFlow";
import { ConvergenceChart } from "../charts/ConvergenceChart";
import {
  Play,
  Pause,
  ArrowCounterClockwise,
  ChartLineUp,
  Info,
} from "@phosphor-icons/react";

interface TrainTabProps {
  history: TrainingHistory;
  config: ExperimentConfig;
}

export const TrainTab: React.FC<TrainTabProps> = ({ history, config }) => {
  const totalRounds = history.round.length - 1;
  const [currentRound, setCurrentRound] = useState<number>(totalRounds);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Play/pause scrubber loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentRound((prev) => {
          if (prev >= totalRounds) {
            setIsPlaying(false);
            return totalRounds;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, totalRounds]);

  const rIdx = currentRound;
  const testAcc = (history.test_acc[rIdx] * 100).toFixed(2);
  const testLoss = history.test_loss[rIdx].toFixed(4);
  const trainLoss = history.train_loss[rIdx].toFixed(4);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Narrative Callout */}
      <div className="tab-narrative">
        &ldquo;Clients collaborate to train one model without sharing raw records.
        That reduces direct data sharing, but does not automatically guarantee membership privacy.&rdquo;
      </div>

      {/* Interactive Topology Diagram (React Flow) */}
      <FedAvgFlow currentRound={currentRound} />

      {/* Round Scrubber Control Bar */}
      <div className="clay-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <ChartLineUp size={18} weight="bold" className="text-blue-600" />
              Scrub Communication Rounds (FedAvg Progress)
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Drag or play through rounds to observe model convergence and overfitting dynamics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="clay-btn clay-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs shadow-xs cursor-pointer"
            >
              {isPlaying ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
              <span>{isPlaying ? "Pause" : "Auto-Play"}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentRound(1);
              }}
              className="clay-btn clay-btn-secondary p-2 rounded-xl text-xs transition-colors cursor-pointer"
              title="Reset to Round 1"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate-500">Round 1</span>
          <input
            type="range"
            min={1}
            max={totalRounds}
            value={currentRound}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentRound(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-xs font-mono text-slate-500">Round {totalRounds}</span>
        </div>

        {/* Real-time KPI Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Selected Communication
            </div>
            <div className="text-base font-black text-slate-800 font-mono mt-0.5">
              Round {currentRound} / {totalRounds}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Global Test Accuracy
            </div>
            <div className="text-base font-black text-blue-700 font-mono mt-0.5">
              {testAcc}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Global Test Loss
            </div>
            <div className="text-base font-black text-rose-700 font-mono mt-0.5">
              {testLoss}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Avg Client Train Loss
            </div>
            <div className="text-base font-black text-emerald-700 font-mono mt-0.5">
              {trainLoss}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Convergence Chart */}
      <ConvergenceChart history={history} maxRound={currentRound} />

      {/* Educational Insight Callout */}
      <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 shadow-xs">
        <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 shrink-0">
          <Info size={18} weight="bold" />
        </div>
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-blue-900 font-bold">Key Insight into Memorization:</strong> While clients never transmit raw image records to the server, the global model fits training members more tightly than unseen testing records. This resulting <strong>generalization loss gap</strong> is the exact vulnerability exploited in the next stage by the Membership Inference Attack.
        </div>
      </div>
    </div>
  );
};
