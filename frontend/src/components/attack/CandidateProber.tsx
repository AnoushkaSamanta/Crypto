"use client";

import React, { useState } from "react";
import { Candidate } from "@/types";
import { FashionCanvas } from "./FashionCanvas";
import {
  DiceFive,
  Eye,
  CheckCircle,
  XCircle,
  ShieldCheck,
  Target,
  LockSimple,
  ArrowsClockwise,
} from "@phosphor-icons/react";

interface CandidateProberProps {
  candidates: Candidate[];
  activeCandidate: Candidate | null;
  onSelectCandidate: (candidate: Candidate) => void;
  threshold: number;
}

export const CandidateProber: React.FC<CandidateProberProps> = ({
  candidates,
  activeCandidate,
  onSelectCandidate,
  threshold,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState({ total: 0, correct: 0 });
  const [filterClass, setFilterClass] = useState<number | "all">("all");

  const classNames = [
    "T-shirt/top",
    "Trouser",
    "Pullover",
    "Dress",
    "Coat",
    "Sandal",
    "Shirt",
    "Sneaker",
    "Bag",
    "Ankle boot",
  ];

  const handlePickRandom = () => {
    let pool = candidates;
    if (filterClass !== "all") {
      pool = candidates.filter((c) => c.label === filterClass);
    }
    if (pool.length === 0) return;

    const randomIndex = Math.floor(Math.random() * pool.length);
    onSelectCandidate(pool[randomIndex]);
    setRevealed(false);
  };

  const handleReveal = () => {
    if (!activeCandidate || revealed) return;

    setRevealed(true);
    const isCorrect = activeCandidate.baseline.is_correct;
    setTally((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }));
  };

  const tallyAcc =
    tally.total > 0 ? ((tally.correct / tally.total) * 100).toFixed(1) : "0.0";

  if (!activeCandidate) return null;

  const baseline = activeCandidate.baseline;
  const isMemberGuess = baseline.guess === "Member";
  const actualIsMember = activeCandidate.is_member === 1;

  return (
    <div className="glass-panel p-6 rounded-2xl w-full border border-slate-700/60 shadow-2xl">
      {/* Controls Bar & Scoreboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePickRandom}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all transform active:scale-95"
          >
            <DiceFive size={18} weight="bold" />
            Pick Random Candidate
          </button>

          <button
            onClick={handleReveal}
            disabled={revealed}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
              revealed
                ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 active:scale-95"
            }`}
          >
            <Eye size={18} weight="bold" />
            {revealed ? "Ground Truth Revealed" : "Reveal Ground Truth"}
          </button>

          {/* Filter dropdown */}
          <select
            value={filterClass}
            onChange={(e) =>
              setFilterClass(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
            }
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">Filter Class: All 10 Classes</option>
            {classNames.map((name, idx) => (
              <option key={idx} value={idx}>
                Class {idx}: {name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Scoreboard */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80">
          <Target size={20} weight="bold" className="text-purple-400" />
          <div className="text-xs">
            <span className="text-slate-400">Attacker Running Tally: </span>
            <strong className="text-slate-100 font-mono">
              {tally.correct} / {tally.total}
            </strong>{" "}
            <span className="text-emerald-400 font-bold font-mono">
              ({tallyAcc}%)
            </span>
          </div>
          {tally.total > 0 && (
            <button
              onClick={() => setTally({ total: 0, correct: 0 })}
              title="Reset Tally"
              className="p-1 rounded text-slate-400 hover:text-slate-200"
            >
              <ArrowsClockwise size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Candidate Card Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
        {/* Left: Image & Ground Truth */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div className="text-xs font-semibold text-slate-400 mb-2">
            Fashion-MNIST Candidate Image
          </div>

          <FashionCanvas image={activeCandidate.image} size={150} />

          <div className="mt-3 text-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-blue-300 border border-blue-500/20">
              {activeCandidate.label_name} (Class {activeCandidate.label})
            </span>
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Evaluation Pool ID #{activeCandidate.id}
            </p>
          </div>

          {/* Ground Truth Reveal Card */}
          <div className="w-full mt-4 pt-4 border-t border-slate-800 text-center">
            {revealed ? (
              <div
                className={`p-3 rounded-xl border text-xs ${
                  actualIsMember
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/50 text-rose-300"
                }`}
              >
                <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
                  {actualIsMember ? (
                    <LockSimple size={16} weight="bold" />
                  ) : (
                    <Eye size={16} weight="bold" />
                  )}
                  Actual: {actualIsMember ? "TRUE MEMBER (Client Dataset)" : "NON-MEMBER (Unseen Data)"}
                </div>
                <div className="text-[11px] opacity-90">
                  {baseline.is_correct ? (
                    <span className="text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle size={14} weight="bold" />
                      Attacker was correct!
                    </span>
                  ) : (
                    <span className="text-rose-400 font-semibold flex items-center justify-center gap-1">
                      <XCircle size={14} weight="bold" />
                      Attacker guess was wrong!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 italic">
                🔒 Ground truth label is hidden from the attacker. Click &quot;Reveal Ground Truth&quot; above to inspect.
              </div>
            )}
          </div>
        </div>

        {/* Right: Black-Box Attacker Inference Details */}
        <div className="md:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Target size={18} weight="bold" className="text-rose-400" />
                Black-Box Attacker Observation & Scoring
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                Rule: Score ≥ τ ({threshold.toFixed(3)})
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-sans">
                  Model Top-1 Output
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {baseline.predicted_label}
                </div>
                <div className="text-[11px] text-blue-400">
                  {(baseline.confidence * 100).toFixed(1)}% Confidence
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-sans">
                  Cross-Entropy Loss (L)
                </div>
                <div className="text-sm font-bold text-slate-100 mt-0.5">
                  {baseline.loss.toFixed(4)}
                </div>
                <div className="text-[11px] text-purple-400">
                  Score S = {baseline.score.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Target Model Confidence:</span>
                <span className="font-mono text-slate-200">
                  {(baseline.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, baseline.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Attacker Final Guess Pill */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isMemberGuess
                ? "bg-emerald-950/30 border-emerald-500/40"
                : "bg-rose-950/30 border-rose-500/40"
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Attacker Prediction Decision
              </div>
              <div
                className={`text-lg font-black tracking-wide ${
                  isMemberGuess ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isMemberGuess ? "MEMBER (Training Set)" : "NON-MEMBER (Unseen)"}
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-slate-400">Score vs Threshold</div>
              <div
                className={`font-bold ${
                  baseline.score >= threshold ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {baseline.score.toFixed(3)} {baseline.score >= threshold ? "≥" : "<"} {threshold.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
