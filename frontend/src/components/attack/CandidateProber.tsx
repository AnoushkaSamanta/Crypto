"use client";

import React, { useState } from "react";
import { Candidate } from "@/types";
import { FashionCanvas } from "./FashionCanvas";

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
    <div className="space-y-6 w-full">
      {/* Controls Bar & Scoreboard - Frameless */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePickRandom}
            className="btn-neon px-5 py-2.5 rounded-full text-xs font-bold cursor-pointer"
          >
            Pick Random Candidate
          </button>

          <button
            onClick={handleReveal}
            disabled={revealed}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all ${
              revealed
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-black text-white hover:bg-slate-800 cursor-pointer shadow-xs"
            }`}
          >
            {revealed ? "Ground Truth Revealed" : "Reveal Ground Truth"}
          </button>

          {/* Filter dropdown */}
          <select
            value={filterClass}
            onChange={(e) =>
              setFilterClass(e.target.value === "all" ? "all" : parseInt(e.target.value, 10))
            }
            className="bg-slate-100 text-slate-800 rounded-full px-4 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            <option value="all">Class: All 10 Categories</option>
            {classNames.map((name, idx) => (
              <option key={idx} value={idx}>
                {idx}: {name}
              </option>
            ))}
          </select>
        </div>

        {/* Live Scoreboard - Frameless Pill */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-[#F7F8FA]">
          <div className="text-xs">
            <span className="text-slate-500 font-medium">Attacker Tally: </span>
            <strong className="text-black font-mono">
              {tally.correct} / {tally.total}
            </strong>{" "}
            <span className="px-2 py-0.5 rounded-full bg-[#D4FF00] text-black font-bold font-mono text-[11px] ml-1">
              {tallyAcc}%
            </span>
          </div>
          {tally.total > 0 && (
            <button
              onClick={() => setTally({ total: 0, correct: 0 })}
              title="Reset Tally"
              className="text-[11px] font-semibold text-slate-400 hover:text-black transition-colors ml-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Candidate Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Image & Ground Truth */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-[#F7F8FA]">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Fashion-MNIST Candidate
          </div>

          <FashionCanvas image={activeCandidate.image} size={140} />

          <div className="mt-3.5 text-center">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-[#D4FF00] text-black">
              {activeCandidate.label_name} (Class {activeCandidate.label})
            </span>
            <p className="text-[11px] text-slate-400 mt-1.5 font-mono">
              Candidate Pool ID #{activeCandidate.id}
            </p>
          </div>

          {/* Ground Truth Reveal Card */}
          <div className="w-full mt-4 pt-4 border-t border-slate-200/60 text-center">
            {revealed ? (
              <div
                className={`p-3.5 rounded-2xl text-xs ${
                  actualIsMember
                    ? "bg-emerald-100/70 text-emerald-950 font-semibold"
                    : "bg-rose-100/70 text-rose-950 font-semibold"
                }`}
              >
                <div className="font-bold mb-1">
                  Actual: {actualIsMember ? "TRUE MEMBER (Client Dataset)" : "NON-MEMBER (Unseen Record)"}
                </div>
                <div className="text-[11px]">
                  {baseline.is_correct ? (
                    <span className="text-emerald-800 font-bold">
                      Attacker inferred correctly
                    </span>
                  ) : (
                    <span className="text-rose-800 font-bold">
                      Attacker was incorrect
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-white text-[11px] text-slate-400 italic">
                Ground truth label is hidden. Click &quot;Reveal Ground Truth&quot; above.
              </div>
            )}
          </div>
        </div>

        {/* Right: Black-Box Attacker Details */}
        <div className="md:col-span-7 flex flex-col justify-between p-6 rounded-3xl bg-[#F7F8FA]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-black">
                Black-Box Attacker Scoring
              </h4>
              <span className="text-[11px] font-mono text-slate-500 font-semibold">
                Cutoff: Score ≥ τ ({threshold.toFixed(3)})
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-white">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Model Top-1 Output
                </div>
                <div className="text-base font-black text-black mt-0.5">
                  {baseline.predicted_label}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold">
                  {(baseline.confidence * 100).toFixed(1)}% Confidence
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white">
                <div className="text-[10px] text-slate-400 uppercase font-sans font-semibold">
                  Cross-Entropy Loss (L)
                </div>
                <div className="text-base font-black text-black mt-0.5">
                  {baseline.loss.toFixed(4)}
                </div>
                <div className="text-[11px] font-semibold text-slate-600">
                  Score = {baseline.score.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">Model Confidence:</span>
                <span className="font-mono font-bold text-black">
                  {(baseline.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-[#D4FF00] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, baseline.confidence * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Attacker Final Guess Card */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between ${
              isMemberGuess
                ? "bg-emerald-100/70 text-emerald-950"
                : "bg-rose-100/70 text-rose-950"
            }`}
          >
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                Attacker Prediction
              </div>
              <div className="text-base font-black tracking-wide">
                {isMemberGuess ? "MEMBER (Training Set)" : "NON-MEMBER (Unseen)"}
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <div className="text-slate-500">Score vs Cutoff</div>
              <div className="font-bold">
                {baseline.score.toFixed(3)} {baseline.score >= threshold ? "≥" : "<"} {threshold.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
