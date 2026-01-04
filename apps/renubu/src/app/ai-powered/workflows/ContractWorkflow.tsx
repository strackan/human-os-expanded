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
        message="Analyzing contract terms, identifying key clauses, risks, and opportunities..."
        progress={55}
      />

      <div className="bg-white p-4 rounded-lg shadow">
        <h5 className="text-md font-semibold text-gray-700 mb-4">Key Contract Insights:</h5>
        <div className="space-y-2">
          <ContractClause 
            icon={ShieldCheckIcon} 
            type="opportunity"
            clause="Auto-Renewal Clause"
            summary="Contract includes an auto-renewal clause. Opportunity to secure renewal with minimal effort if terms are favorable."
          />
          <ContractClause 
            icon={ExclamationTriangleIcon}
            type="risk"
            clause="Price Increase Cap"
            summary="A 5% cap on annual price increases is noted. May limit negotiation leverage for higher increases."
          />
          <ContractClause 
            icon={EyeIcon}
            type="standard"
            clause="Service Level Agreement (SLA)"
            summary="Standard SLA terms. Ensure current service delivery meets or exceeds these terms."
          />
          <ContractClause 
            icon={ExclamationTriangleIcon}
            type="risk"
            clause="Termination for Convenience"
            summary="Customer has a 60-day termination for convenience clause. Highlight ongoing value to mitigate this risk."
          />
        </div>
      </div>

      <ImplementationNotice />
    </div>
  );
};

export default ContractWorkflow; 