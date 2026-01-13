import React from "react";
import ProcessingIndicator from "../components/ProcessingIndicator";
import ImplementationNotice from "../components/ImplementationNotice";

interface RecommendationItemProps {
  label: string;
  value: string;
  positive?: boolean;
  negative?: boolean;
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({ label, value, positive, negative }) => {
  let valueColor = "text-gray-900";
  if (positive) valueColor = "text-green-600 font-semibold";
  if (negative) valueColor = "text-red-600 font-semibold";

  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`text-sm ${valueColor}`}>{value}</span>
    </div>
  );
};

const NegotiationWorkflow = () => {
  return (
    <div className="p-2">
      <ProcessingIndicator
        title="AI Analysis in Progress"
        message="Analyzing historical data, usage patterns, and customer sentiment..."
        progress={66}
      />
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h5 className="text-md font-semibold text-gray-700 mb-3">Key Recommendations:</h5>
        <div className="space-y-1">
          <RecommendationItem label="Optimal Price Increase" value="7-9%" />
          <RecommendationItem label="Confidence Score" value="92%" positive />
          <RecommendationItem label="Expected NRR Impact" value="+4.3%" positive />
          <RecommendationItem label="Key Talking Points" value="Value delivered, new features" />
          <RecommendationItem label="Potential Objections" value="Budget constraints" />
        </div>
      </div>

      <ImplementationNotice />
    </div>
  );
};

export default NegotiationWorkflow; 