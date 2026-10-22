"use client";

import React, { useState, useEffect } from "react";
import { TrainingHistory, ExperimentConfig } from "@/types";
import { FedAvgFlow } from "../diagrams/FedAvgFlow";
import { ConvergenceChart } from "../charts/ConvergenceChart";
import {
  Play,
  Pause,
  ArrowCounterClockwise,
  Cpu,
  LockSimple,
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
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ChartLineUp size={18} weight="bold" className="text-blue-400" />
              Scrub Communication Rounds (FedAvg Progress)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Drag or play through rounds to observe model convergence and overfitting dynamics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={14} weight="bold" /> : <Play size={14} weight="bold" />}
              <span>{isPlaying ? "Pause" : "Auto-Play"}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentRound(1);
              }}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              title="Reset to Round 1"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-slate-400">Round 1</span>
          <input
            type="range"
            min={1}
            max={totalRounds}
            value={currentRound}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentRound(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-xs font-mono text-slate-400">Round {totalRounds}</span>
        </div>

        {/* Real-time KPI Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">
              Selected Communication
            </div>
            <div className="text-lg font-black text-slate-100 font-mono mt-0.5">
              Round {currentRound} / {totalRounds}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">
              Global Test Accuracy
            </div>
            <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
              {testAcc}%
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">
              Global Test Loss
            </div>
            <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
              {testLoss}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-500">
              Avg Client Train Loss
            </div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              {trainLoss}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Convergence Chart */}
      <ConvergenceChart history={history} maxRound={currentRound} />

      {/* Educational Insight Callout */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
          <Info size={20} weight="bold" />
        </div>
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-blue-300 font-bold">Key Insight into Memorization:</strong> While clients never transmit raw image records to the server, the global model fits training members more tightly than unseen testing records. This resulting <strong>generalization loss gap</strong> is the exact vulnerability exploited in the next stage by the Membership Inference Attack.
        </div>
      </div>
    </div>
  );
};
