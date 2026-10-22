"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import { ServerNode, ClientNode } from "./nodes/CustomNodes";

const nodeTypes = {
  serverNode: ServerNode,
  clientNode: ClientNode,
};

type FlPhase = "broadcast" | "train" | "upload";

interface FedAvgFlowProps {
  currentRound?: number;
}

export const FedAvgFlow: React.FC<FedAvgFlowProps> = ({ currentRound = 30 }) => {
  const [selectedClientId, setSelectedClientId] = useState<number>(1);
  const [phase, setPhase] = useState<FlPhase>("broadcast");
  const [isAutoCycling, setIsAutoCycling] = useState<boolean>(false);

  // Auto-cycle through the 3 phases of a Federated Round
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoCycling) {
      timer = setInterval(() => {
        setPhase((prev) => {
          if (prev === "broadcast") return "train";
          if (prev === "train") return "upload";
          return "broadcast";
        });
      }, 2200);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoCycling]);

  // Layout coordinates for coordinator server and 5 clients with ample breathing room
  const nodes: Node[] = useMemo(() => {
    const clientCount = 5;
    const spacing = 220;
    const startX = -(spacing * (clientCount - 1)) / 2; // -440

    const clientNodes: Node[] = Array.from({ length: clientCount }, (_, i) => ({
      id: `client-${i + 1}`,
      type: "clientNode",
      position: { x: startX + i * spacing, y: 280 },
      data: {
        id: i + 1,
        isSelected: selectedClientId === i + 1,
        isTraining: phase === "train",
        phase,
        samples: 600,
      },
    }));

    return [
      {
        id: "server-coordinator",
        type: "serverNode",
        position: { x: -150, y: 25 },
        data: {
          round: currentRound,
          phase,
        },
      },
      ...clientNodes,
    ];
  }, [currentRound, selectedClientId, phase]);

  // Clean, uncluttered edges with single-channel highlighted labeling to avoid collision
  const edges: Edge[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const isSelected = selectedClientId === i + 1;
      const isBroadcast = phase === "broadcast";
      const isUpload = phase === "upload";

      const sourceId = isUpload ? `client-${i + 1}` : "server-coordinator";
      const targetId = isUpload ? "server-coordinator" : `client-${i + 1}`;
      const sourceHandle = isUpload ? "client-source" : "server-source";
      const targetHandle = isUpload ? "server-target" : "client-target";

      // Only label the selected client's edge to prevent visual clutter and overlapping text
      let edgeLabel: string | undefined = undefined;
      if (isSelected) {
        if (isBroadcast) edgeLabel = `Downlink: θ_t ➔ Client #${i + 1}`;
        else if (isUpload) edgeLabel = `Uplink: Δw_${i + 1} ➔ Server`;
        else edgeLabel = `Local SGD (Offline)`;
      }

      const edgeColor = isSelected
        ? "#000000"
        : isBroadcast
        ? "#64748B"
        : isUpload
        ? "#475569"
        : "#CBD5E1";

      return {
        id: `edge-${i + 1}`,
        source: sourceId,
        target: targetId,
        sourceHandle,
        targetHandle,
        animated: phase !== "train",
        label: edgeLabel,
        labelStyle: {
          fill: "#000000",
          fontSize: 10,
          fontFamily: "monospace",
          fontWeight: 800,
        },
        labelBgStyle: {
          fill: isSelected ? "#D4FF00" : "#FFFFFF",
          fillOpacity: 1,
        },
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 9999,
        style: {
          stroke: edgeColor,
          strokeWidth: isSelected ? 2.5 : 1.5,
          strokeDasharray: phase === "train" ? "4 4" : undefined,
          opacity: phase === "train" ? (isSelected ? 0.7 : 0.3) : isSelected ? 1 : 0.55,
        },
        markerEnd:
          phase === "train"
            ? undefined
            : {
                type: MarkerType.ArrowClosed,
                color: edgeColor,
                width: isSelected ? 14 : 10,
                height: isSelected ? 14 : 10,
              },
      };
    });
  }, [selectedClientId, phase]);

  const phaseDescriptions = {
    broadcast: {
      step: "Step 1 of 3",
      title: "Global Weight Broadcast (Server ➔ Clients)",
      detail:
        "The coordinator server serializes current global model weights θ_t and broadcasts them over encrypted transport (TLS 1.3 / gRPC) to all active worker shards. Raw data records stay strictly isolated on client hardware.",
      metrics: [
        { label: "Data Egress", val: "0 Records" },
        { label: "Payload", val: "Model Weights (θ_t)" },
        { label: "Transport", val: "Downlink gRPC" },
      ],
    },
    train: {
      step: "Step 2 of 3",
      title: "Decentralized Local SGD on Isolated Shards",
      detail:
        "Each client independently executes Mini-Batch SGD for E = 2 epochs (batch size B = 32) exclusively on their private local dataset D_k. Local weights w_k adapt to each client's specific distribution.",
      metrics: [
        { label: "Compute", val: "E = 2 Epochs" },
        { label: "Batch Size", val: "B = 32" },
        { label: "Network Activity", val: "None (Offline)" },
      ],
    },
    upload: {
      step: "Step 3 of 3",
      title: "Parameter Delta Upload & FedAvg Aggregation",
      detail:
        "Clients transmit parameter updates w_k back to coordinator. The server computes the sample-weighted average θ_(t+1) = ∑ (n_k / N) · w_k to produce the updated global model for the next round.",
      metrics: [
        { label: "Aggregation", val: "FedAvg Mean" },
        { label: "Total Samples", val: "N = 3,000" },
        { label: "Transport", val: "Uplink gRPC" },
      ],
    },
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Header Controls / Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-black">
              Federated Network Topology
            </h4>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
            <span className="text-xs font-mono font-bold text-slate-500">
              FedAvg Protocol (McMahan et al.)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Decentralized SGD over isolated client shards: parameters circulate without raw record exposure.
          </p>
        </div>

        {/* Phase Switcher Tabs & Auto Cycle Button */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full bg-[#F7F8FA] p-1 text-xs border border-slate-200/60">
            <button
              onClick={() => {
                setIsAutoCycling(false);
                setPhase("broadcast");
              }}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                phase === "broadcast"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              1. Broadcast θ_t
            </button>
            <button
              onClick={() => {
                setIsAutoCycling(false);
                setPhase("train");
              }}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                phase === "train"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              2. Local SGD
            </button>
            <button
              onClick={() => {
                setIsAutoCycling(false);
                setPhase("upload");
              }}
              className={`px-3.5 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                phase === "upload"
                  ? "bg-black text-white shadow-xs"
                  : "text-slate-600 hover:text-black"
              }`}
            >
              3. Aggregate w_k
            </button>
          </div>

          <button
            onClick={() => setIsAutoCycling(!isAutoCycling)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isAutoCycling
                ? "bg-[#D4FF00] text-black shadow-xs ring-2 ring-black font-black"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {isAutoCycling ? "Stop Simulation" : "Auto-Cycle Protocol"}
          </button>
        </div>
      </div>

      {/* Main Flow Canvas - Spacious Frameless Container */}
      <div className="h-[460px] w-full rounded-3xl overflow-hidden bg-[#F7F8FA] border border-slate-200/60 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.16, maxZoom: 1.05 }}
          minZoom={0.4}
          maxZoom={1.6}
          onNodeClick={(_, node) => {
            if (node.id.startsWith("client-")) {
              const cid = parseInt(node.id.replace("client-", ""), 10);
              setSelectedClientId(cid);
            }
          }}
          className="bg-[#F7F8FA]"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#CBD5E1" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>

        {/* Dynamic Topology Canvas Overlay Badge */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/80 text-[10px] font-mono text-slate-600 shadow-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
            <span>Click any client node to inspect channel</span>
          </div>
        </div>
      </div>

      {/* Interactive Client Shard Quick-Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#F7F8FA] border border-slate-200/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">
            Active Channel:
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Client #{selectedClientId} selected
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((cid) => (
            <button
              key={cid}
              onClick={() => setSelectedClientId(cid)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                selectedClientId === cid
                  ? "bg-black text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-black border border-slate-200/80"
              }`}
            >
              Client #{cid}
            </button>
          ))}
        </div>
      </div>

      {/* Spacious Educational Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active Protocol Phase Deep Dive */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#F7F8FA] border border-slate-200/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[9px] font-mono font-bold uppercase tracking-wider">
                {phaseDescriptions[phase].step}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                Protocol Stage
              </span>
            </div>
            <h5 className="text-sm font-black text-black tracking-tight">
              {phaseDescriptions[phase].title}
            </h5>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              {phaseDescriptions[phase].detail}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/70">
            {phaseDescriptions[phase].metrics.map((m, idx) => (
              <div key={idx} className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-center">
                <div className="text-[9px] uppercase font-bold text-slate-400">{m.label}</div>
                <div className="text-[11px] font-mono font-black text-black mt-0.5 truncate">{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Client Partition & MIA Privacy Vulnerability */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-[#F7F8FA] border border-slate-200/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#D4FF00] text-black text-[9px] font-mono font-black uppercase tracking-wider">
                Target Shard: Client #{selectedClientId}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                Private Shard D_{selectedClientId}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono my-3">
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-center">
                <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">Records</div>
                <div className="text-xs font-black text-black mt-0.5">600 items</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-center">
                <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">Epochs</div>
                <div className="text-xs font-black text-black mt-0.5">E = 2</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200/60 text-center">
                <div className="text-[9px] text-slate-400 uppercase font-sans font-semibold">Classes</div>
                <div className="text-xs font-black text-black mt-0.5">10 balanced</div>
              </div>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3.5 rounded-2xl border border-slate-200/60">
              <strong className="text-black font-black">Cryptographic Vulnerability (MIA): </strong>
              Even though raw training images never leave Client #{selectedClientId}, the local parameters <code>w_{selectedClientId}</code> fit its specific 600 records. FedAvg preserves these loss footprints in the global model, enabling an attacker to distinguish member records using loss-thresholding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



