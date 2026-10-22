"use client";

import React from "react";
import { Candidate } from "@/types";
import { FashionCanvas } from "../attack/FashionCanvas";

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
    <div className="space-y-4 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Side-by-Side Candidate Probing: Baseline vs DP-SGD
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            Candidate: {candidate.label_name} (#{candidate.id})
          </span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isMember
                ? "bg-emerald-100 text-emerald-900"
                : "bg-rose-100 text-rose-900"
            }`}
          >
            Actual: {isMember ? "MEMBER" : "NON-MEMBER"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Candidate Image */}
        <div className="md:col-span-3 flex flex-col items-center justify-center p-5 rounded-3xl bg-[#F7F8FA] text-center">
          <FashionCanvas image={candidate.image} size={110} />
          <div className="text-xs font-bold text-slate-800 mt-2.5">
            {candidate.label_name}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
            Class Index: {candidate.label}
          </div>
        </div>

        {/* Middle: Baseline Model (Unprotected) */}
        <div className="md:col-span-4 p-6 rounded-3xl bg-rose-50/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-800">
                Baseline (Unprotected)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                τ = {baselineThreshold.toFixed(3)}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono my-3 bg-white p-4 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Predicted:</span>
                <span className="text-slate-900 font-bold">{b.predicted_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Confidence:</span>
                <span className="text-black font-bold">{(b.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Loss:</span>
                <span className="text-slate-800">{b.loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Score:</span>
                <span className="text-black font-bold">{b.score.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-full text-center text-xs font-bold ${
              b.guess === "Member"
                ? "bg-emerald-100 text-emerald-950"
                : "bg-rose-100 text-rose-950"
            }`}
          >
            Attacker Guess: {b.guess}
          </div>
        </div>

        {/* Right: DP-SGD Model (Protected) */}
        <div className="md:col-span-5 p-6 rounded-3xl bg-emerald-50/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-800">
                DP-SGD Protected (Opacus)
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                τ = {dpThreshold.toFixed(3)}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono my-3 bg-white p-4 rounded-2xl">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Predicted:</span>
                <span className="text-slate-900 font-bold">{dp.predicted_label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Confidence:</span>
                <span className="text-black font-bold">{(dp.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Loss:</span>
                <span className="text-slate-800">{dp.loss.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Score:</span>
                <span className="text-black font-bold">{dp.score.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-full text-center text-xs font-bold ${
              dp.guess === "Member"
                ? "bg-emerald-100 text-emerald-950"
                : "bg-rose-100 text-rose-950"
            }`}
          >
            Attacker Guess: {dp.guess} (Confounded)
          </div>
        </div>
      </div>
    </div>
  );
};
