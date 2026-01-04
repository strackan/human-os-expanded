import React from 'react';

interface LicenseAnalysisContent {
  currentLicense: {
    tokens: number;
    unitPrice: number;
    total: number;
  };
  anticipatedRenewal: {
    tokens: number;
    unitPrice: number;
    total: number;
  };
  earlyDiscount: {
    percentage: number;
    total: number;
  };
  multiYearDiscount: {
    percentage: number;
    total: number;
  };
}

interface LicenseAnalysisRendererProps {
  content: LicenseAnalysisContent;
}

/**
 * LicenseAnalysisRenderer Component
 *
 * Displays license analysis information including current license,
 * anticipated renewal costs, and available discounts.
 */
export const LicenseAnalysisRenderer: React.FC<LicenseAnalysisRendererProps> = ({ content }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-800 mb-6 text-lg">License Analysis</h3>
    <div className="space-y-4 text-sm">
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Current License:</span>
        <span className="font-medium">
          {content.currentLicense.tokens.toLocaleString()} tokens @ ${content.currentLicense.unitPrice} - <strong>${content.currentLicense.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Anticipated Renewal Cost:</span>
        <span className="font-medium">
          {content.anticipatedRenewal.tokens.toLocaleString()} tokens @ ${content.anticipatedRenewal.unitPrice} = <strong>${content.anticipatedRenewal.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-gray-600">Early Renewal Discount:</span>
        <span className="font-medium text-orange-600">
          {content.earlyDiscount.percentage}% - <strong>${content.earlyDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-gray-600">Multi-year Discount:</span>
        <span className="font-medium text-green-600">
          {content.multiYearDiscount.percentage}% - <strong>${content.multiYearDiscount.total.toLocaleString()}</strong>
        </span>
      </div>
    </div>
  </div>
);
