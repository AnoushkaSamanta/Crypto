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
import { LockSimple, HardDrives, Info } from "@phosphor-icons/react";

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
      position: { x: startX + i * spacing, y: 160 },
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
        position: { x: -115, y: 0 },
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
        stroke: selectedClientId === i + 1 ? "#059669" : "#2563EB",
        strokeWidth: selectedClientId === i + 1 ? 2.5 : 1.8,
        strokeDasharray: "5 5",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedClientId === i + 1 ? "#059669" : "#2563EB",
        width: 14,
        height: 14,
      },
    }));
  }, [selectedClientId]);

  return (
    <div className="relative w-full clay-card overflow-hidden">
      {/* Top Header Controls / Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200/80 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Federated Network Topology
          </h4>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-semibold">
            <HardDrives size={13} weight="bold" />
            5 Distributed Nodes
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-semibold">
            <LockSimple size={13} weight="bold" />
            Zero Raw Sharing
          </span>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="h-[340px] w-full">
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
          className="bg-[#F8FAFC]"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#CBD5E1" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      {/* Client Shard Inspector Bottom Strip */}
      {selectedClientId && (
        <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-800">
              Selected: Client #{selectedClientId}
            </span>
            <span className="text-slate-600">
              Partition: <strong className="text-slate-800">600 Fashion-MNIST records</strong> (disjoint uniform split)
            </span>
            <span className="text-slate-600">
              Local Epochs: <strong className="text-slate-800">2 per round</strong> • Batch Size: <strong className="text-slate-800">64</strong>
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-blue-700 font-medium italic">
            <Info size={14} weight="bold" />
            Click any client node to inspect its local partition
          </div>
        </div>
      )}
    </div>
  );
};
