import React from 'react';
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { Clock, X } from 'lucide-react';

export interface Stage {
  id: string;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
  description?: string;
}

interface StageTimelineProps {
  stages: Stage[];
  onStageClick?: (stage: Stage) => void;
  showSkipSnooze?: boolean;
  onSkip?: () => void;
  onSnooze?: () => void;
}

const StageTimeline: React.FC<StageTimelineProps> = ({
  stages,
  onStageClick,
  showSkipSnooze = false,
  onSkip,
  onSnooze
}) => (
  <div className="flex items-center justify-between mt-4">
    <div className="flex items-center space-x-4 flex-1">
    {stages.map((stage, idx) => (
      <div 
        key={stage.id} 
        className="flex flex-col items-center"
        onClick={() => onStageClick?.(stage)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onStageClick?.(stage);
          }
        }}
      >
        <div className="flex items-center">
          {stage.status === "complete" ? (
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
          ) : stage.status === "current" ? (
            <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
          )}
          {idx < stages.length - 1 && (
            <div
              className={`h-0.5 w-8 ${
                stage.status === "complete" ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
        <span 
          className={`mt-2 text-sm ${
            stage.status === "complete"
              ? "text-green-600"
              : stage.status === "current"
              ? "text-blue-600 font-medium"
              : "text-gray-500"
          }`}
        >
          {stage.name}
        </span>
        {stage.description && (
          <span className="text-xs text-gray-500 mt-1 max-w-[120px] text-center">
            {stage.description}
          </span>
        )}
      </div>
    ))}
    </div>

    {/* Skip/Snooze Controls */}
    {showSkipSnooze && (
      <div className="flex items-center gap-2 ml-6">
        {onSnooze && (
          <button
            onClick={onSnooze}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            title="Snooze this workflow"
          >
            <Clock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        )}
        {onSkip && (
          <button
            onClick={onSkip}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            title="Skip this workflow"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
          </button>
        )}
      </div>
    )}
  </div>
);

export default StageTimeline; 