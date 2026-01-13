import React from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface ImplementationNoticeProps {
  message?: string;
}

const ImplementationNotice: React.FC<ImplementationNoticeProps> = ({ message }) => {
  return (
    <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-yellow-700">
      <div className="flex items-center">
        <InformationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
        <p className="text-sm">
          {message || "This is a prototype. Full workflow implementation coming soon..."}
        </p>
      </div>
    </div>
  );
};

export default ImplementationNotice; 