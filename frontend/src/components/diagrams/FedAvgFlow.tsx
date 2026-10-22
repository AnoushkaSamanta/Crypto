"use client";

import React, { useMemo, useState } from "react";
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
import { LockSimple, HardDrives, ShieldCheck, Info } from "@phosphor-icons/react";

const nodeTypes = {
  serverNode: ServerNode,
  clientNode: ClientNode,
};

interface FedAvgFlowProps {
  currentRound?: number;
}

export const FedAvgFlow: React.FC<FedAvgFlowProps> = ({ currentRound = 30 }) => {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(1);

  // Define layout coordinates for server and 5 clients
  const nodes: Node[] = useMemo(() => {
    const clientCount = 5;
    const spacing = 190;
    const startX = -(spacing * (clientCount - 1)) / 2;

    const clientNodes: Node[] = Array.from({ length: clientCount }, (_, i) => ({
      id: `client-${i + 1}`,
      type: "clientNode",
      position: { x: startX + i * spacing, y: 170 },
      data: {
        id: i + 1,
        isSelected: selectedClientId === i + 1,
        samples: 600,
      },
    }));

    return [
      {
        id: "server-coordinator",
        type: "serverNode",
        position: { x: -120, y: 0 },
        data: { round: currentRound },
      },
      ...clientNodes,
    ];
  }, [currentRound, selectedClientId]);

  // Edges with animated bidirectional flow styling
  const edges: Edge[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `edge-server-client-${i + 1}`,
      source: "server-coordinator",
      target: `client-${i + 1}`,
      animated: true,
      style: {
        stroke: selectedClientId === i + 1 ? "#10b981" : "#3b82f6",
        strokeWidth: selectedClientId === i + 1 ? 2.5 : 1.8,
        strokeDasharray: "5 5",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedClientId === i + 1 ? "#10b981" : "#3b82f6",
        width: 14,
        height: 14,
      },
    }));
  }, [selectedClientId]);

  return (
    <div className="relative w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 overflow-hidden shadow-2xl">
      {/* Top Header Controls / Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800/60 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interactive Federated Network Topology
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[11px]">
            <HardDrives size={13} weight="bold" />
            5 Distributed Nodes
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-[11px]">
            <LockSimple size={13} weight="bold" />
            Zero Raw Sharing
          </span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="h-[360px] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.5}
          maxZoom={1.5}
          onNodeClick={(_, node) => {
            if (node.id.startsWith("client-")) {
              const cid = parseInt(node.id.replace("client-", ""), 10);
              setSelectedClientId(cid);
            }
          }}
          className="bg-slate-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#334155" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      {/* Client Shard Inspector Bottom Strip */}
      {selectedClientId && (
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-200">
              Selected: Client #{selectedClientId}
            </span>
            <span className="text-slate-400">
              Partition: <strong className="text-slate-200">600 Fashion-MNIST records</strong> (disjoint uniform split)
            </span>
            <span className="text-slate-400">
              Local Epochs: <strong className="text-slate-200">2 per round</strong> | Batch Size: <strong className="text-slate-200">64</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-300/80 italic">
            <Info size={14} weight="bold" />
            Click any client node in the diagram to inspect its local partition
          </div>
        </div>
      )}
    </div>
  );
};
