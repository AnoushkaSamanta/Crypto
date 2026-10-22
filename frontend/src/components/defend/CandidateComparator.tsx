"use client";

import React from "react";
import { Candidate } from "@/types";
import { FashionCanvas } from "../attack/FashionCanvas";
import {
  ShieldCheck,
  WarningCircle,
  CheckCircle,
  XCircle,
  Target,
  ArrowRight,
} from "@phosphor-icons/react";

interface CandidateComparatorProps {
  candidate: Candidate;
  baselineThreshold: number;
  dpThreshold: number;
}

export const CandidateComparator: React.FC<CandidateComparatorProps> = ({
  candidate,
  baselineThreshold,
  dpThreshold,
}) => {
  const b = candidate.baseline;
  const dp = candidate.dp;
  const isMember = candidate.is_member === 1;

  return (
    <div className="glass-panel p-6 rounded-2xl w-full border border-slate-700/60 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={22} weight="duotone" className="text-emerald-400" />
          <h4 className="text-sm font-bold text-slate-200">
            Side-by-Side Candidate Probing: Baseline vs DP-SGD
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Candidate: {candidate.label_name} (Pool #{candidate.id})
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isMember
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
            }`}
          >
            Actual: {isMember ? "MEMBER (Training Set)" : "NON-MEMBER (Unseen)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
        {/* Left: Candidate Image */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
          <FashionCanvas image={candidate.image} size={110} />
          <div className="text-xs font-bold text-slate-300 mt-2">
            {candidate.label_name}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Class Index: {candidate.label}
          </div>
        </div>

        {/* Middle: Baseline Model (Unprotected) */}
        <div className="md:col-span-4 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <WarningCircle size={16} weight="bold" />
                Baseline (Unprotected)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                τ = {baselineThreshold.toFixed(3)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono my-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Predicted:</span>
                <span className="text-slate-200">{b.predicted_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-blue-300">{(b.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loss:</span>
                <span className="text-slate-200">{b.loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attack Score:</span>
                <span className="text-purple-300 font-bold">{b.score.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center text-xs font-bold ${
              b.guess === "Member"
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/40 text-rose-300"
            }`}
          >
            Attacker Guess: {b.guess}
            <div className="text-[10px] font-normal mt-0.5 opacity-80">
              {b.is_correct ? "✓ Correct guess" : "✗ Wrong guess"}
            </div>
          </div>
        </div>

        {/* Right: DP-SGD Model (Protected) */}
        <div className="md:col-span-5 p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck size={16} weight="bold" />
                DP-SGD Protected (Opacus)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                τ = {dpThreshold.toFixed(3)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono my-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Predicted:</span>
                <span className="text-slate-200">{dp.predicted_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-blue-300">{(dp.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loss:</span>
                <span className="text-slate-200">{dp.loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attack Score:</span>
                <span className="text-purple-300 font-bold">{dp.score.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center text-xs font-bold ${
              dp.guess === "Member"
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/30 border-rose-500/40 text-rose-300"
            }`}
          >
            Attacker Guess: {dp.guess}
            <div className="text-[10px] font-normal mt-0.5 opacity-80">
              {dp.is_correct ? "✓ Correct guess" : "✗ Guess confounded by DP"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
