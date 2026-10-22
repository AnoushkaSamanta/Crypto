"use client";

import React from "react";
import { Candidate } from "@/types";
import { FashionCanvas } from "../attack/FashionCanvas";
import {
  ShieldCheck,
  WarningCircle,
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
    <div className="clay-card p-6 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck size={22} weight="duotone" className="text-emerald-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Side-by-Side Candidate Probing: Baseline vs DP-SGD
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Candidate: {candidate.label_name} (Pool #{candidate.id})
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              isMember
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            Actual: {isMember ? "MEMBER (Training Set)" : "NON-MEMBER (Unseen)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-5">
        {/* Left: Candidate Image */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
          <FashionCanvas image={candidate.image} size={110} />
          <div className="text-xs font-bold text-slate-800 mt-2">
            {candidate.label_name}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Class Index: {candidate.label}
          </div>
        </div>

        {/* Middle: Baseline Model (Unprotected) */}
        <div className="md:col-span-4 p-4 rounded-xl bg-rose-50/50 border border-rose-200 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <WarningCircle size={16} weight="bold" />
                Baseline (Unprotected)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                τ = {baselineThreshold.toFixed(3)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono my-3 bg-white/80 p-3 rounded-lg border border-rose-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Predicted:</span>
                <span className="text-slate-900 font-bold">{b.predicted_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Confidence:</span>
                <span className="text-blue-700 font-bold">{(b.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Loss:</span>
                <span className="text-slate-800">{b.loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Attack Score:</span>
                <span className="text-purple-700 font-bold">{b.score.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center text-xs font-bold ${
              b.guess === "Member"
                ? "bg-emerald-100/60 border-emerald-300 text-emerald-800"
                : "bg-rose-100/60 border-rose-300 text-rose-800"
            }`}
          >
            Attacker Guess: {b.guess}
            <div className="text-[10px] font-normal mt-0.5 opacity-90">
              {b.is_correct ? "✓ Correct guess" : "✗ Wrong guess"}
            </div>
          </div>
        </div>

        {/* Right: DP-SGD Model (Protected) */}
        <div className="md:col-span-5 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <ShieldCheck size={16} weight="bold" />
                DP-SGD Protected (Opacus)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                τ = {dpThreshold.toFixed(3)}
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono my-3 bg-white/80 p-3 rounded-lg border border-emerald-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Predicted:</span>
                <span className="text-slate-900 font-bold">{dp.predicted_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Confidence:</span>
                <span className="text-blue-700 font-bold">{(dp.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Loss:</span>
                <span className="text-slate-800">{dp.loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Attack Score:</span>
                <span className="text-purple-700 font-bold">{dp.score.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-center text-xs font-bold ${
              dp.guess === "Member"
                ? "bg-emerald-100/60 border-emerald-300 text-emerald-800"
                : "bg-rose-100/60 border-rose-300 text-rose-800"
            }`}
          >
            Attacker Guess: {dp.guess}
            <div className="text-[10px] font-normal mt-0.5 opacity-90">
              {dp.is_correct ? "✓ Correct guess" : "✗ Guess confounded by DP noise"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
