'use client';

import { Target, CheckCircle } from 'lucide-react';
import { TERMINOLOGY } from '@/lib/constants';

interface PriorityWorkflowCardProps {
  workflowTitle: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  dueDate: string;
  arr?: string;
  onLaunch: () => void;
  className?: string;
  completed?: boolean;
}

export default function PriorityWorkflowCard({
  workflowTitle,
  priority,
  dueDate,
  arr,
  onLaunch,
  className = '',
  completed = false
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
      className={`bg-white rounded-3xl p-10 border ${
        completed ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
      } shadow-lg cursor-pointer hover:shadow-xl transition-all group relative ${className}`}
    >
      {/* Completion Badge */}
      {completed && (
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          <CheckCircle className="w-4 h-4" />
          <span>Completed</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className={`w-6 h-6 ${completed ? 'text-green-500' : 'text-purple-500'}`} />
          <span className="text-sm text-gray-500 tracking-wide">Today's One Thing</span>
        </div>
        {/* Subtle Launch Icon - Passage/Door */}
        {!completed && (
          <div className="flex items-center gap-2 text-gray-400 group-hover:text-purple-500 transition-colors">
            <img src="/passage_icon.png" alt="Launch" className="w-6 h-6 opacity-40 group-hover:opacity-70 transition-opacity" />
            <span className="text-xs font-medium">Launch {TERMINOLOGY.TASK_MODE}</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <h2 className={`text-2xl mb-4 transition-colors ${
        completed
          ? 'text-green-800'
          : 'text-gray-800 group-hover:text-purple-600'
      }`}>
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
