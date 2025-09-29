import React from "react";
import ProcessingIndicator from "../components/ProcessingIndicator";
import ImplementationNotice from "../components/ImplementationNotice";
import { EyeIcon, ShieldCheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/solid";

interface ContractClauseProps {
  clause: string;
  summary: string;
  type: "standard" | "opportunity" | "risk";
  icon: React.ElementType;
}

const ContractClause: React.FC<ContractClauseProps> = ({ clause, summary, type, icon: Icon }) => {
  let typeColor = "text-gray-600";
  let borderColor = "border-gray-300";
  let bgColor = "bg-gray-50";

  if (type === "opportunity") {
    typeColor = "text-green-700";
    borderColor = "border-green-400";
    bgColor = "bg-green-50";
  } else if (type === "risk") {
    typeColor = "text-red-700";
    borderColor = "border-red-400";
    bgColor = "bg-red-50";
  }

  return (
    <div className={`p-3 border-l-4 ${borderColor} ${bgColor} rounded-r-md mb-3`}>
      <div className="flex items-center mb-1">
        <Icon className={`w-5 h-5 ${typeColor} mr-2 flex-shrink-0`} />
        <h6 className={`text-sm font-semibold ${typeColor}`}>{clause}</h6>
      </div>
      <p className="text-xs text-gray-500 pl-7">{summary}</p>
    </div>
  );
};

const ContractWorkflow = () => {
  return (
    <div className="p-2">
      <ProcessingIndicator
        title="AI Contract Reviewer Active"
        message="Analyzing CloudForce Systems' contract terms, identifying key clauses, risks, and opportunities..."
        progress={55}
      />

      <div className="bg-white p-4 rounded-lg shadow">
        <h5 className="text-md font-semibold text-gray-700 mb-4">Key Contract Insights for CloudForce Systems:</h5>
        <div className="space-y-2">
          <ContractClause 
            icon={ShieldCheckIcon} 
            type="opportunity"
            clause="MSA Reference for Upgrades"
            summary="Master Service Agreement allows for streamlined upgrades. Potential to upsell new AI modules."
          />
          <ContractClause 
            icon={ExclamationTriangleIcon}
            type="risk"
            clause="Data Processing Addendum (DPA)"
            summary="DPA needs review against latest CCPA/GDPR updates. Flagged for legal check."
          />
          <ContractClause 
            icon={EyeIcon}
            type="standard"
            clause="Payment Terms: Net 30"
            summary="Standard Net 30 payment terms. History shows consistent on-time payments."
          />
        </div>
      </div>

      <ImplementationNotice />
    </div>
  );
};

export default ContractWorkflow; 