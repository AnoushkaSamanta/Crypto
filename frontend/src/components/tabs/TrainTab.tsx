"use client";

import React, { useState, useEffect } from "react";
import { TrainingHistory, ExperimentConfig } from "@/types";
import { FedAvgFlow } from "../diagrams/FedAvgFlow";
import { ConvergenceChart } from "../charts/ConvergenceChart";
import { Play, Pause, ArrowCounterClockwise } from "@phosphor-icons/react";

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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Narrative Callout */}
      <div className="tab-narrative">
        &ldquo;Clients collaborate to train one model without sharing raw records.
        That reduces direct data sharing, but does not automatically guarantee membership privacy.&rdquo;
      </div>

      {/* Interactive Topology Diagram (React Flow) */}
      <FedAvgFlow currentRound={currentRound} />

      {/* Round Scrubber Control Bar - Frameless */}
      <div className="space-y-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-black">
              Scrub Communication Rounds
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Observe model convergence and the expanding train-vs-test loss gap.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn-neon flex items-center gap-1.5 px-5 py-2 rounded-full text-xs cursor-pointer"
            >
              {isPlaying ? <Pause size={13} weight="bold" /> : <Play size={13} weight="bold" />}
              <span>{isPlaying ? "Pause" : "Auto-Play"}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentRound(1);
              }}
              className="btn-neutral p-2 rounded-full text-xs cursor-pointer"
              title="Reset to Round 1"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="flex items-center gap-4 py-1">
          <span className="text-xs font-mono text-slate-400">01</span>
          <input
            type="range"
            min={1}
            max={totalRounds}
            value={currentRound}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentRound(parseInt(e.target.value, 10));
            }}
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#D4FF00]"
          />
          <span className="text-xs font-mono text-slate-400">{totalRounds}</span>
        </div>

        {/* Real-time KPI Metric Strip - Frameless Tonal Wells */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#F7F8FA]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Selected Round
            </div>
            <div className="text-lg font-black text-black font-mono mt-0.5">
              {currentRound} / {totalRounds}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FA]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Global Test Accuracy
            </div>
            <div className="text-lg font-black text-black font-mono mt-0.5">
              {testAcc}%
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FA]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Global Test Loss
            </div>
            <div className="text-lg font-black text-rose-600 font-mono mt-0.5">
              {testLoss}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F8FA]">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Avg Client Train Loss
            </div>
            <div className="text-lg font-black text-black font-mono mt-0.5">
              {trainLoss}
            </div>
          </div>
        </div>
      </div>

      {/* Dual Convergence Chart */}
      <ConvergenceChart history={history} maxRound={currentRound} />

      {/* Educational Insight Callout */}
      <div className="p-5 rounded-2xl bg-[#F7F8FA] border-l-4 border-[#D4FF00]">
        <div className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-black font-bold">Key Insight:</strong> While clients never transmit raw records, the global model fits training members more tightly than unseen testing records. This resulting <strong>generalization loss gap</strong> is the exact vulnerability exploited by the Membership Inference Attack.
        </div>
      </div>
    </div>
  );
};
