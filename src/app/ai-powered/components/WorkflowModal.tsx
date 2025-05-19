import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { WorkflowType } from "../page"; // Adjust path as needed
import NegotiationWorkflow from "../workflows/NegotiationWorkflow";
import EmailWorkflow from "../workflows/EmailWorkflow";
import MeetingWorkflow from "../workflows/MeetingWorkflow";
import ContractWorkflow from "../workflows/ContractWorkflow";

interface WorkflowModalProps {
  isOpen: boolean;
  workflowType: WorkflowType;
  onClose: () => void;
}

const getWorkflowTitle = (workflowType: WorkflowType): string => {
  switch (workflowType) {
    case "negotiation":
      return "Prepare for Negotiation";
    case "email":
      return "Compose Email";
    case "meeting":
      return "Schedule Meeting";
    case "contract":
      return "Review Contract";
    default:
      return "AI Workflow";
  }
};

const WorkflowModal: React.FC<WorkflowModalProps> = ({ isOpen, workflowType, onClose }) => {
  if (!isOpen || !workflowType) return null;

  const renderWorkflowContent = () => {
    switch (workflowType) {
      case "negotiation":
        return <NegotiationWorkflow />;
      case "email":
        return <EmailWorkflow />;
      case "meeting":
        return <MeetingWorkflow />;
      case "contract":
        return <ContractWorkflow />;
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      aria-labelledby="workflow-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out scale-100">
        <header className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200">
          <h2 id="workflow-modal-title" className="text-xl md:text-2xl font-semibold text-gray-800">
            {getWorkflowTitle(workflowType)}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close workflow modal"
            tabIndex={0}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-4 md:p-6 flex-grow overflow-y-auto">
          {renderWorkflowContent()}
        </main>

        <footer className="p-4 md:p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            tabIndex={0}
          >
            Cancel
          </button>
          <button
            // Placeholder for apply action
            onClick={() => {
              alert(`Applying results for ${getWorkflowTitle(workflowType)}... (Not implemented)`);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            tabIndex={0}
          >
            Apply Workflow Results
          </button>
        </footer>
      </div>
    </div>
  );
};

export default WorkflowModal; 