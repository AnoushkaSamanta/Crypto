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

  // Edges with animated flow styling
  const edges: Edge[] = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `edge-server-client-${i + 1}`,
      source: "server-coordinator",
      target: `client-${i + 1}`,
      animated: true,
      style: {
        stroke: selectedClientId === i + 1 ? "#000000" : "#94A3B8",
        strokeWidth: selectedClientId === i + 1 ? 2.5 : 1.5,
        strokeDasharray: "5 5",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedClientId === i + 1 ? "#000000" : "#94A3B8",
        width: 14,
        height: 14,
      },
    }));
  }, [selectedClientId]);

  return (
    <div className="space-y-3 w-full">
      {/* Top Header Controls / Status - Clean Minimalist */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Federated Network Topology
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-mono text-[11px] font-semibold">
            5 Distributed Nodes
          </span>
          <span className="px-3 py-1 rounded-full bg-[#D4FF00] text-black font-mono text-[11px] font-bold">
            Zero Raw Sharing
          </span>
        </div>
      </div>

      {/* Main Canvas - Frameless rounded-3xl container */}
      <div className="h-[340px] w-full rounded-3xl overflow-hidden bg-[#F7F8FA]">
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
          className="bg-[#F7F8FA]"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#E2E8F0" />
          <Controls showInteractive={false} className="!left-4 !bottom-4 !top-auto" />
        </ReactFlow>
      </div>

      {/* Client Shard Inspector Bottom Strip */}
      {selectedClientId && (
        <div className="px-5 py-3 rounded-2xl bg-[#F7F8FA] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-black">
              Client #{selectedClientId}
            </span>
            <span className="text-slate-600">
              Partition: <strong className="text-black">600 Fashion-MNIST records</strong>
            </span>
            <span className="text-slate-600">
              Local Epochs: <strong className="text-black">2 per round</strong>
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Click any client node to inspect
          </div>
        </div>
      )}
    </div>
  );
};
