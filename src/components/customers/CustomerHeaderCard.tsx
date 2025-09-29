"use client";
import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from 'next/navigation';
import { URL_PATTERNS } from '../../lib/constants';

export interface CustomerStage {
  id: number;
  name: string;
  status: 'complete' | 'current' | 'upcoming';
}

export interface CustomerHeaderCardProps {
  customerName: string;
  riskLevel: string;
  riskColor: string;
  stages: CustomerStage[];
  nextCustomer?: string;
  nextCustomerOverride?: string;
}

const StageTimeline: React.FC<{ stages: CustomerStage[] }> = ({ stages }) => (
  <div className="flex items-center space-x-4 mt-4">
    {stages.map((stage, idx) => (
      <div key={stage.id} className="flex flex-col items-center">
        <div className="flex items-center">
          {stage.status === "complete" ? (
            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ) : stage.status === "current" ? (
            <div className="h-6 w-6 rounded-full border-2 border-blue-500 bg-blue-100" />
          ) : (
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
          )}
          {idx < stages.length - 1 && (
            <div
              className={`h-0.5 w-8 ${
                stage.status === "complete" ? "bg-green-500" : "bg-gray-300"
              }`}
            />
          )}
        </div>
        <span 
          className={`mt-2 text-sm ${
            stage.status === "complete"
              ? "text-green-600"
              : stage.status === "current"
              ? "text-blue-600 font-medium"
              : "text-gray-500"
          }`}
        >
          {stage.name}
        </span>
      </div>
    ))}
  </div>
);

const CustomerHeaderCard: React.FC<CustomerHeaderCardProps> = ({
  customerName,
  riskLevel,
  riskColor,
  stages,
  nextCustomer,
  nextCustomerOverride,
}) => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-4 min-h-[180px]">
      <div className="flex flex-col md:flex-row md:justify-between gap-4 flex-1">
        <div className="space-y-2 flex flex-col justify-center h-full">
          <h2 className="text-3xl font-extrabold text-blue-700 tracking-tight">
            {customerName}
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-gray-700 text-base items-center">
            <span className="font-medium text-gray-500">Risk Level:</span>
            <span className={`inline-block px-2 py-0.5 rounded-full bg-${riskColor}-100 text-${riskColor}-700 text-xs font-semibold ml-2`}>
              {riskLevel}
            </span>
          </div>
        </div>
        <StageTimeline stages={stages} />
      </div>
      {/* Navigation arrows at bottom left and right */}
      <div className="flex w-full justify-end items-end mt-4">
        {(nextCustomerOverride || nextCustomer) && (
          <button
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 focus:outline-none"
            tabIndex={0}
            aria-label={`Go to next customer: ${nextCustomerOverride || nextCustomer}`}
                         onClick={() => {
               const customerId = nextCustomerOverride || nextCustomer;
               if (customerId) {
                 router.push(URL_PATTERNS.VIEW_CUSTOMER(customerId));
               }
             }}
             onKeyDown={e => {
               if (e.key === 'Enter' || e.key === ' ') {
                 const customerId = nextCustomerOverride || nextCustomer;
                 if (customerId) {
                   router.push(URL_PATTERNS.VIEW_CUSTOMER(customerId));
                 }
               }
             }}
          >
            <span>Next: {nextCustomerOverride || nextCustomer}</span>
            <ChevronRightIcon className="w-7 h-7 text-gray-300" />
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomerHeaderCard; 