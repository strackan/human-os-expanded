import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import '@/styles/progress-indicators.css';

interface ProcessingIndicatorProps {
  title: string;
  message: string;
  progress?: number;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ title, message, progress }) => {
  const progressValueStr = progress !== undefined ? progress.toString() : undefined;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
      <ArrowPathIcon className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
      <h4 className="text-lg font-semibold text-blue-700 mb-2">{title}</h4>
      <p className="text-sm text-blue-600 mb-3">{message}</p>
      {progress !== undefined && progressValueStr !== undefined && (
        <div className="progress-bar-track bg-blue-200">
          <div
            className="progress-bar-fill bg-blue-600 progress-bar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progressValueStr}
            aria-valuemin="0"
            aria-valuemax="100"
            role="progressbar"
            aria-label={`${title} progress`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ProcessingIndicator; 