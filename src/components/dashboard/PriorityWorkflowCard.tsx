'use client';

import { Target } from 'lucide-react';

interface PriorityWorkflowCardProps {
  workflowTitle: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
  arr?: string;
  onLaunch: () => void;
  className?: string;
}

export default function PriorityWorkflowCard({
  workflowTitle,
  priority,
  dueDate,
  arr,
  onLaunch,
  className = ''
}: PriorityWorkflowCardProps) {
  const getPriorityColor = () => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-50 text-red-600';
      case 'High':
        return 'bg-orange-50 text-orange-600';
      case 'Medium':
        return 'bg-yellow-50 text-yellow-600';
      case 'Low':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div
      onClick={onLaunch}
      className={`bg-white rounded-3xl p-10 border border-gray-200 shadow-lg cursor-pointer hover:shadow-xl transition-all group relative ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-500" />
          <span className="text-sm text-gray-500 uppercase tracking-wide">If You Do One Thing Today (make it this)</span>
        </div>
        {/* Subtle Launch Icon - Passage/Door */}
        <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
          <img src="/passage_icon.png" alt="Launch" className="w-6 h-6 opacity-40 group-hover:opacity-70 transition-opacity" />
          <span className="text-xs font-medium">Launch Task Mode</span>
        </div>
      </div>

      {/* Main Content */}
      <h2 className="text-2xl text-gray-800 mb-4 group-hover:text-purple-600 transition-colors">
        {workflowTitle}
      </h2>

      {/* Metadata Badges */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className={`px-3 py-1 ${getPriorityColor()} rounded-full text-xs font-medium`}>
          {priority}
        </span>
        <span>Due: {dueDate}</span>
        {arr && (
          <>
            <span>•</span>
            <span>{arr} ARR</span>
          </>
        )}
      </div>
    </div>
  );
}
