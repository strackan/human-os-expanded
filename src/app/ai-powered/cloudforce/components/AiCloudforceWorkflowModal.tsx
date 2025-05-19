import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { WorkflowType } from "../page"; // Relative to cloudforce/page.tsx
import NegotiationWorkflow from "../workflows/NegotiationWorkflow";
import EmailWorkflow from "../workflows/EmailWorkflow";
import MeetingWorkflow from "../workflows/MeetingWorkflow";
import ContractWorkflow from "../workflows/ContractWorkflow";

interface AiCloudforceWorkflowModalProps {
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

const AiCloudforceWorkflowModal: React.FC<AiCloudforceWorkflowModalProps> = ({ isOpen, workflowType, onClose }) => {
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
      className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      aria-labelledby="workflow-modal-title"
      role="dialog"
      aria-modal="true"
      onClick={onClose} // Close modal on backdrop click
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <header className="flex items-center justify-between p-5 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h2 id="workflow-modal-title" className="text-xl font-semibold text-gray-800">
            {getWorkflowTitle(workflowType)}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
            aria-label="Close workflow modal"
            tabIndex={0}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="p-5 md:p-6 flex-grow overflow-y-auto bg-gray-50/50">
          {renderWorkflowContent()}
        </main>

        <footer className="p-5 border-t border-gray-200 flex justify-end space-x-3 bg-gray-100 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            tabIndex={0}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              alert(`Applying results for ${getWorkflowTitle(workflowType)}... (Not implemented)`);
              onClose();
            }}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            tabIndex={0}
          >
            Apply Workflow Results
          </button>
        </footer>
      </div>
    </div>
  );
};

export default AiCloudforceWorkflowModal; 