"use client";

import React from "react";
import { AttackMetrics, Candidate } from "@/types";
import { CandidateProber } from "../attack/CandidateProber";
import { AttackFlow } from "../diagrams/AttackFlow";
import { LossDistributionChart } from "../charts/LossDistributionChart";
import { RocCurveChart } from "../charts/RocCurveChart";

interface AttackTabProps {
  attackData: AttackMetrics;
  threshold: number;
  candidates: Candidate[];
  activeCandidate: Candidate;
  onSelectCandidate: (candidate: Candidate) => void;
}

export const AttackTab: React.FC<AttackTabProps> = ({
  attackData,
  threshold,
  candidates,
  activeCandidate,
  onSelectCandidate,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Narrative Callout */}
      <div className="tab-narrative !border-rose-500 !bg-rose-50/60 !text-slate-700">
        &ldquo;The attacker never sees the training set; it only uses how the model behaves on a candidate.&rdquo;
      </div>

      {/* Interactive Candidate Prober */}
      <CandidateProber
        candidates={candidates}
        activeCandidate={activeCandidate}
        onSelectCandidate={onSelectCandidate}
        threshold={threshold}
      />

      {/* React Flow Attack Pipeline Diagram */}
      <AttackFlow
        candidateLabel={`${activeCandidate.label_name} (#${activeCandidate.id})`}
        score={activeCandidate.baseline.score}
        threshold={threshold}
        guess={activeCandidate.baseline.guess}
      />

      {/* Statistical Distributions & ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LossDistributionChart
          memberLosses={attackData.member_losses}
          nonmemberLosses={attackData.nonmember_losses}
          threshold={threshold}
        />

        <RocCurveChart
          baselineRoc={attackData.roc_curve}
          baselineAuc={attackData.roc_auc}
          showOverlay={false}
        />
      </div>
    </div>
  );
};
