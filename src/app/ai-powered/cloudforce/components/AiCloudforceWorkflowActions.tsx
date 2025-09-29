import React from "react";
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { WorkflowType } from "../page"; // Path will be relative to cloudforce/page.tsx

interface AiCloudforceWorkflowActionsProps {
  openWorkflow: (workflowName: WorkflowType) => void;
}

const workflowButtons = [
  {
    name: "Prepare for Negotiation",
    workflowName: "negotiation" as const,
    icon: ChatBubbleLeftRightIcon,
    bgColor: "bg-blue-500",
    hoverBgColor: "hover:bg-blue-600",
    ringColor: "focus:ring-blue-500",
  },
  {
    name: "Compose Email",
    workflowName: "email" as const,
    icon: EnvelopeIcon,
    bgColor: "bg-purple-500",
    hoverBgColor: "hover:bg-purple-600",
    ringColor: "focus:ring-purple-500",
  },
  {
    name: "Schedule Meeting",
    workflowName: "meeting" as const,
    icon: CalendarDaysIcon,
    bgColor: "bg-green-500",
    hoverBgColor: "hover:bg-green-600",
    ringColor: "focus:ring-green-500",
  },
  {
    name: "Review Contract",
    workflowName: "contract" as const,
    icon: DocumentTextIcon,
    bgColor: "bg-amber-500",
    hoverBgColor: "hover:bg-amber-600",
    ringColor: "focus:ring-amber-500",
  },
];

const AiCloudforceWorkflowActions: React.FC<AiCloudforceWorkflowActionsProps> = ({ openWorkflow }) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-1">AI Quick Actions</h3>
      <div className="space-y-3 flex-grow">
        {workflowButtons.map((button) => (
          <button
            key={button.workflowName}
            onClick={() => openWorkflow(button.workflowName)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                openWorkflow(button.workflowName);
              }
            }}
            className={`w-full flex items-center p-3 rounded-lg shadow-sm transition-all duration-150 ease-in-out transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 ${button.bgColor} ${button.hoverBgColor} text-white ${button.ringColor}`}
            aria-label={button.name}
            tabIndex={0}
          >
            <button.icon className="w-6 h-6 mr-3 flex-shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">{button.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AiCloudforceWorkflowActions; 