'use client';

import React from 'react';

/**
 * Contract data structure
 */
export interface ContractData {
  customer: string;
  arr: string;
  renewalDate: string;
  terms: string[];
}

/**
 * ContractArtifact Props
 */
interface ContractArtifactProps {
  data: ContractData;
}

/**
 * ContractArtifact Component
 *
 * Displays contract details in a clean, readable format:
 * - Customer name
 * - ARR (Annual Recurring Revenue)
 * - Renewal date
 * - Contract terms (bulleted list)
 *
 * Checkpoint 1.3: Basic artifact rendering
 * Simple layout with labels and values
 */
export function ContractArtifact({ data }: ContractArtifactProps) {
  return (
    <div className="space-y-6">
      {/* Customer Info */}
      <div>
        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Customer
        </label>
        <p className="mt-1 text-lg font-medium text-gray-900">{data.customer}</p>
      </div>

      {/* ARR */}
      <div>
        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Annual Recurring Revenue
        </label>
        <p className="mt-1 text-2xl font-bold text-green-600">{data.arr}</p>
      </div>

      {/* Renewal Date */}
      <div>
        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Renewal Date
        </label>
        <p className="mt-1 text-lg font-medium text-gray-900">{data.renewalDate}</p>
      </div>

      {/* Contract Terms */}
      <div>
        <label className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2 block">
          Contract Terms
        </label>
        <ul className="space-y-2">
          {data.terms.map((term, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span className="text-gray-700">{term}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
