import React from 'react';

interface WorkflowSummaryContent {
  customerName: string;
  currentStage: string;
  progressPercentage: number;
  completedActions: string[];
  pendingActions: string[];
  nextSteps: string[];
  keyMetrics: {
    currentARR: string;
    projectedARR: string;
    growthRate: string;
    riskScore: string;
  };
  recommendations: string[];
}

interface WorkflowSummaryRendererProps {
  content: WorkflowSummaryContent;
}

/**
 * WorkflowSummaryRenderer Component
 *
 * Displays a comprehensive workflow summary including progress,
 * completed/pending actions, next steps, key metrics, and recommendations.
 */
export const WorkflowSummaryRenderer: React.FC<WorkflowSummaryRendererProps> = ({ content }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="font-semibold text-gray-800 text-lg">Workflow Summary</h3>
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-500">{content.customerName}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      </div>
    </div>

    {/* Progress Overview */}
    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-800">Current Stage</span>
        <span className="text-sm text-blue-600">{content.currentStage}</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${content.progressPercentage}%` }}
        ></div>
      </div>
      <div className="text-xs text-blue-600 mt-1">{content.progressPercentage}% Complete</div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Completed Actions */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Completed Actions
          </h4>
          <ul className="space-y-2">
            {content.completedActions.map((action: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                {action}
              </li>
            ))}
          </ul>
        </div>

        {/* Pending Actions */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
            Pending Actions
          </h4>
          <ul className="space-y-2">
            {content.pendingActions.map((action: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-orange-500 mr-2 mt-1">○</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Next Steps */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            Next Steps
          </h4>
          <ul className="space-y-2">
            {content.nextSteps.map((step: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2 mt-1">→</span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Key Metrics */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
            Key Metrics
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Current ARR</div>
              <div className="font-medium text-gray-800">{content.keyMetrics.currentARR}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Projected ARR</div>
              <div className="font-medium text-gray-800">{content.keyMetrics.projectedARR}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Growth Rate</div>
              <div className="font-medium text-green-600">{content.keyMetrics.growthRate}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded">
              <div className="text-gray-500">Risk Score</div>
              <div className="font-medium text-green-600">{content.keyMetrics.riskScore}</div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            Recommendations
          </h4>
          <ul className="space-y-2">
            {content.recommendations.map((rec: string, index: number) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-indigo-500 mr-2 mt-1">💡</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
);
