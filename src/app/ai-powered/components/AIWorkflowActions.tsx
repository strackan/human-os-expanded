import React from "react";
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { WorkflowType } from "../page"; // Adjust path as needed

interface AIWorkflowActionsProps {
  openWorkflow: (workflowName: WorkflowType) => void;
}

const workflowButtons = [
  {
    name: "Prepare for Negotiation",
    workflowName: "negotiation" as const,
    icon: ChatBubbleLeftRightIcon,
    color: "blue",
    bgColor: "bg-blue-500",
    hoverBgColor: "hover:bg-blue-600",
    textColor: "text-white",
    ringColor: "focus:ring-blue-500",
  },
  {
    name: "Compose Email",
    workflowName: "email" as const,
    icon: EnvelopeIcon,
    color: "purple",
    bgColor: "bg-purple-500",
    hoverBgColor: "hover:bg-purple-600",
    textColor: "text-white",
    ringColor: "focus:ring-purple-500",
  },
  {
    name: "Schedule Meeting",
    workflowName: "meeting" as const,
    icon: CalendarDaysIcon,
    color: "green",
    bgColor: "bg-green-500",
    hoverBgColor: "hover:bg-green-600",
    textColor: "text-white",
    ringColor: "focus:ring-green-500",
  },
  {
    name: "Review Contract",
    workflowName: "contract" as const,
    icon: DocumentTextIcon,
    color: "amber",
    bgColor: "bg-amber-500",
    hoverBgColor: "hover:bg-amber-600",
    textColor: "text-white",
    ringColor: "focus:ring-amber-500",
  },
];

const AIWorkflowActions: React.FC<AIWorkflowActionsProps> = ({ openWorkflow }) => {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">AI Workflows</h3>
      <div className="grid grid-cols-2 gap-4 flex-grow">
        {workflowButtons.map((button) => (
          <button
            key={button.workflowName}
            onClick={() => openWorkflow(button.workflowName)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                openWorkflow(button.workflowName);
              }
            }}
            className={`flex flex-col items-center justify-center p-4 rounded-lg shadow-md transition-all duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${button.bgColor} ${button.hoverBgColor} ${button.textColor} ${button.ringColor}`}
            aria-label={button.name}
            tabIndex={0}
          >
            <button.icon className="w-8 h-8 mb-2" aria-hidden="true" />
            <span className="text-sm font-medium text-center">{button.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AIWorkflowActions; 