"use client";

import React, { useState } from "react";
import { Candidate } from "@/types";
import { FashionCanvas } from "./FashionCanvas";
import {
  DiceFive,
  Eye,
  CheckCircle,
  XCircle,
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
    <div className="clay-card p-6 w-full">
      {/* Controls Bar & Scoreboard */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePickRandom}
            className="clay-btn clay-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer shadow-xs"
          >
            <DiceFive size={18} weight="bold" />
            Pick Random Candidate
          </button>

          <button
            onClick={handleReveal}
            disabled={revealed}
            className={`clay-btn flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
              revealed
                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm shadow-emerald-500/20"
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
            className="bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs cursor-pointer"
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
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200/90 shadow-xs">
          <Target size={20} weight="bold" className="text-purple-600" />
          <div className="text-xs">
            <span className="text-slate-500">Attacker Running Tally: </span>
            <strong className="text-slate-800 font-mono">
              {tally.correct} / {tally.total}
            </strong>{" "}
            <span className="text-emerald-600 font-bold font-mono">
              ({tallyAcc}%)
            </span>
          </div>
          {tally.total > 0 && (
            <button
              onClick={() => setTally({ total: 0, correct: 0 })}
              title="Reset Tally"
              className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors"
            >
              <ArrowsClockwise size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Candidate Card Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-6">
        {/* Left: Image & Ground Truth */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90">
          <div className="text-xs font-bold text-slate-600 mb-2.5">
            Fashion-MNIST Candidate Image
          </div>

          <FashionCanvas image={activeCandidate.image} size={140} />

          <div className="mt-3.5 text-center">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white text-blue-700 border border-blue-200 shadow-xs">
              {activeCandidate.label_name} (Class {activeCandidate.label})
            </span>
            <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
              Candidate Pool ID #{activeCandidate.id}
            </p>
          </div>

          {/* Ground Truth Reveal Card */}
          <div className="w-full mt-4 pt-4 border-t border-slate-200 text-center">
            {revealed ? (
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  actualIsMember
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
                }`}
              >
                <div className="font-bold flex items-center justify-center gap-1.5 mb-1">
                  {actualIsMember ? (
                    <LockSimple size={16} weight="bold" />
                  ) : (
                    <Eye size={16} weight="bold" />
                  )}
                  Actual: {actualIsMember ? "TRUE MEMBER (Client Training Set)" : "NON-MEMBER (Unseen Record)"}
                </div>
                <div className="text-[11px]">
                  {baseline.is_correct ? (
                    <span className="text-emerald-700 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle size={14} weight="bold" />
                      Attacker inferred correctly!
                    </span>
                  ) : (
                    <span className="text-rose-700 font-semibold flex items-center justify-center gap-1">
                      <XCircle size={14} weight="bold" />
                      Attacker guess was wrong!
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-500 italic shadow-xs">
                🔒 Ground truth label is hidden from the attacker. Click &quot;Reveal Ground Truth&quot; above to verify.
              </div>
            )}
          </div>
        </div>

        {/* Right: Black-Box Attacker Inference Details */}
        <div className="md:col-span-7 flex flex-col justify-between p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Target size={18} weight="bold" className="text-rose-600" />
                Black-Box Observation & Scoring
              </h4>
              <span className="text-[11px] font-mono font-medium text-slate-500">
                Rule: Score ≥ τ ({threshold.toFixed(3)})
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Model Top-1 Output
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {baseline.predicted_label}
                </div>
                <div className="text-[11px] text-blue-600 font-semibold">
                  {(baseline.confidence * 100).toFixed(1)}% Confidence
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Cross-Entropy Loss (L)
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">
                  {baseline.loss.toFixed(4)}
                </div>
                <div className="text-[11px] text-purple-600 font-semibold">
                  Score S = {baseline.score.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">Target Model Confidence:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {(baseline.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, baseline.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Attacker Final Guess Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${
              isMemberGuess
                ? "bg-emerald-50 border-emerald-200"
                : "bg-rose-50 border-rose-200"
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Attacker Prediction Decision
              </div>
              <div
                className={`text-base font-black tracking-wide ${
                  isMemberGuess ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {isMemberGuess ? "MEMBER (Training Set)" : "NON-MEMBER (Unseen)"}
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-slate-500">Score vs Cutoff</div>
              <div
                className={`font-bold ${
                  baseline.score >= threshold ? "text-emerald-700" : "text-rose-700"
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
