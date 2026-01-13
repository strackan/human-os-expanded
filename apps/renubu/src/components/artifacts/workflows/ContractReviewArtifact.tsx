/**
 * Contract Review Artifact Component
 *
 * Priority 2 artifact for demo
 * Display contract terms and key information
 *
 * Features:
 * - Structured display of contract terms
 * - Key dates and values highlighted
 * - No editing (contracts are never editable)
 * - Static mock data for demo
 */

'use client';

import React from 'react';

interface ContractTerms {
  contractId?: string;
  startDate: string;
  endDate: string;
  annualValue: number;
  paymentTerms: string;
  autoRenewal: boolean;
  noticePeriod: string;
  priceIncreaseCap?: string;
  nonStandardTerms?: string[];
}

interface ContractReviewArtifactProps {
  title: string;
  data?: ContractTerms;
  customerContext?: any;
  onClose?: () => void;
}

export function ContractReviewArtifact({
  title,
  data,
  customerContext,
  onClose
}: ContractReviewArtifactProps) {
  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  // Mock contract data for demo
  const contractTerms: ContractTerms = data || {
    contractId: 'CNT-2024-001234',
    startDate: '2024-01-15',
    endDate: '2025-01-14',
    annualValue: 125000,
    paymentTerms: 'Net 30 days, Annual billing',
    autoRenewal: true,
    noticePeriod: '90 days prior to contract end',
    priceIncreaseCap: '10% annual maximum',
    nonStandardTerms: [
      'Customer receives 24/7 premium support',
      'Data residency requirement: US East region only',
      'Custom SLA: 99.9% uptime guarantee with penalties'
    ]
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate days until end
  const daysUntilEnd = Math.ceil(
    (new Date(contractTerms.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-cyan-50 to-blue-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Current contract terms and conditions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {contractTerms.contractId && (
            <span className="text-xs text-gray-500 font-mono">
              {contractTerms.contractId}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-700 font-medium mb-1">Annual Contract Value</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(contractTerms.annualValue)}</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 font-medium mb-1">Contract End Date</p>
            <p className="text-lg font-semibold text-blue-900">{formatDate(contractTerms.endDate)}</p>
            <p className="text-xs text-blue-600">{daysUntilEnd} days remaining</p>
          </div>
          <div>
            <p className="text-xs text-blue-700 font-medium mb-1">Auto-Renewal</p>
            <p className="text-lg font-semibold text-blue-900">
              {contractTerms.autoRenewal ? (
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Enabled
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Disabled
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Contract Terms */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">

          {/* Key Dates */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Key Dates
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Contract Start</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(contractTerms.startDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Contract End</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(contractTerms.endDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Notice Period</span>
                <span className="text-sm font-medium text-gray-900">{contractTerms.noticePeriod}</span>
              </div>
            </div>
          </div>

          {/* Financial Terms */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Financial Terms
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Annual Value</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(contractTerms.annualValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Terms</span>
                <span className="text-sm font-medium text-gray-900">{contractTerms.paymentTerms}</span>
              </div>
              {contractTerms.priceIncreaseCap && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Price Increase Cap</span>
                  <span className="text-sm font-medium text-gray-900">{contractTerms.priceIncreaseCap}</span>
                </div>
              )}
            </div>
          </div>

          {/* Non-Standard Terms */}
          {contractTerms.nonStandardTerms && contractTerms.nonStandardTerms.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Non-Standard Terms
              </h3>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <ul className="space-y-2">
                  {contractTerms.nonStandardTerms.map((term, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-amber-600 mt-0.5">•</span>
                      <span className="text-sm text-amber-900">{term}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Contracts are read-only and cannot be edited.
        </div>
        <button
          onClick={() => alert('View Full Contract (mock)')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          View Full Contract
        </button>
      </div>
    </div>
  );
}
