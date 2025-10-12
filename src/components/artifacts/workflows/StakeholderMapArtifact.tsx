/**
 * Stakeholder Map Artifact Component
 *
 * Priority 2 artifact for demo
 * Visual stakeholder relationship map using React Flow
 *
 * Features:
 * - Interactive drag-and-drop nodes
 * - Color-coded by sentiment (green/yellow/red)
 * - Size by influence level
 * - Static mock data for demo
 */

'use client';

import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

interface StakeholderData {
  name: string;
  role: string;
  influence: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative';
  notes?: string;
}

interface StakeholderMapArtifactProps {
  title: string;
  data?: {
    stakeholders: StakeholderData[];
  };
  customerContext?: any;
  onClose?: () => void;
}

// Custom node component for stakeholders
const StakeholderNode = ({ data }: { data: StakeholderData }) => {
  const influenceSize = {
    high: 'w-32 h-32',
    medium: 'w-24 h-24',
    low: 'w-20 h-20'
  }[data.influence];

  const sentimentColor = {
    positive: 'bg-green-100 border-green-400 text-green-900',
    neutral: 'bg-yellow-100 border-yellow-400 text-yellow-900',
    negative: 'bg-red-100 border-red-400 text-red-900'
  }[data.sentiment];

  return (
    <div className={`${influenceSize} ${sentimentColor} border-2 rounded-lg p-3 shadow-lg flex flex-col items-center justify-center text-center`}>
      <div className="font-semibold text-sm">{data.name}</div>
      <div className="text-xs mt-1">{data.role}</div>
      <div className="text-xs mt-1 font-medium capitalize">{data.influence} influence</div>
    </div>
  );
};

const nodeTypes = {
  stakeholder: StakeholderNode
};

export function StakeholderMapArtifact({
  title,
  data,
  customerContext,
  onClose
}: StakeholderMapArtifactProps) {
  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  // Mock stakeholder data for demo
  const mockStakeholders: StakeholderData[] = data?.stakeholders || [
    { name: 'John Doe', role: 'CTO', influence: 'high', sentiment: 'positive', notes: 'Champion of our solution' },
    { name: 'Jane Smith', role: 'VP Operations', influence: 'high', sentiment: 'neutral', notes: 'Needs more engagement' },
    { name: 'Bob Johnson', role: 'IT Manager', influence: 'medium', sentiment: 'positive', notes: 'Day-to-day user' },
    { name: 'Alice Williams', role: 'CFO', influence: 'high', sentiment: 'neutral', notes: 'Budget decision maker' },
    { name: 'Charlie Brown', role: 'Team Lead', influence: 'low', sentiment: 'positive', notes: 'Power user' }
  ];

  // Convert stakeholders to React Flow nodes
  const initialNodes: Node[] = mockStakeholders.map((stakeholder, index) => ({
    id: `stakeholder-${index}`,
    type: 'stakeholder',
    position: {
      x: 150 + (index % 3) * 250,
      y: 100 + Math.floor(index / 3) * 200
    },
    data: stakeholder
  }));

  // Create some relationship edges
  const initialEdges: Edge[] = [
    { id: 'e0-1', source: 'stakeholder-0', target: 'stakeholder-1', animated: true },
    { id: 'e0-2', source: 'stakeholder-0', target: 'stakeholder-2' },
    { id: 'e1-3', source: 'stakeholder-1', target: 'stakeholder-3', animated: true },
    { id: 'e2-4', source: 'stakeholder-2', target: 'stakeholder-4' }
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Visual stakeholder relationship map
          </p>
        </div>
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Sentiment:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-400 rounded-full"></span>
            Positive
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
            Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-400 rounded-full"></span>
            Negative
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-700">Influence:</span>
          <span>Large = High</span>
          <span>Medium = Medium</span>
          <span>Small = Low</span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Drag nodes to rearrange. Static mock data for demo.
        </div>
        <button
          onClick={() => alert('Export as PNG (mock)')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Export as PNG
        </button>
      </div>
    </div>
  );
}
