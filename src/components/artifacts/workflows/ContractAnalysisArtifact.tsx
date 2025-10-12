/**
 * Contract Analysis Artifact Component
 *
 * Displays comprehensive renewal status analysis
 * Maps to database artifact_type: 'contract_analysis'
 *
 * Features:
 * - Days until renewal countdown
 * - ARR tracking (current, renewal, expansion)
 * - Signature status (DocuSign workflow)
 * - Payment status tracking
 * - Salesforce sync status
 * - Negotiation status
 * - Display-only (not editable)
 */

'use client';

import React from 'react';

interface SignatureStatus {
  docusignSent: boolean;
  customerSigned: boolean;
  vendorCountersigned: boolean;
  status: string;
}

interface PaymentStatus {
  invoiceSent: boolean;
  paymentReceived: boolean;
  amount: number;
  status: string;
}

interface SalesforceStatus {
  opportunityStage: string;
  forecastCategory: string;
  closeDate: string;
  lastSynced: string;
}

interface NegotiationStatus {
  pricing: string;
  terms: string;
  approvals: string;
}

interface ContractAnalysisContent {
  daysUntilRenewal: number;
  currentARR: number;
  renewalARR: number;
  signatures?: SignatureStatus;
  payment?: PaymentStatus;
  salesforce?: SalesforceStatus;
  negotiation?: NegotiationStatus;
}

interface ContractAnalysisArtifactProps {
  title: string;
  data?: ContractAnalysisContent;
  customerContext?: any;
  onClose?: () => void;
}

export function ContractAnalysisArtifact({
  title,
  data,
  customerContext,
  onClose
}: ContractAnalysisArtifactProps) {
  // Replace handlebars variables in title
  const processedTitle = title.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const keys = path.trim().split('.');
    let value: any = customerContext;
    for (const key of keys) {
      value = value?.[key];
    }
    return value !== undefined ? String(value) : match;
  });

  const content = data || {
    daysUntilRenewal: 0,
    currentARR: 0,
    renewalARR: 0
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

  // Calculate ARR change
  const arrChange = content.renewalARR - content.currentARR;
  const arrChangePercent = ((arrChange / content.currentARR) * 100).toFixed(1);
  const isExpansion = arrChange > 0;

  // Get overall status
  const getOverallStatus = () => {
    if (!content.signatures || !content.payment) return 'IN PROGRESS';

    if (content.signatures.vendorCountersigned && content.payment.paymentReceived) {
      return 'COMPLETE';
    } else if (content.signatures.customerSigned) {
      return 'PENDING PAYMENT';
    } else if (content.signatures.docusignSent) {
      return 'PENDING SIGNATURE';
    } else {
      return 'IN PROGRESS';
    }
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{processedTitle}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive renewal status analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
            overallStatus === 'COMPLETE'
              ? 'bg-green-100 text-green-800 border-green-200'
              : overallStatus.includes('PENDING')
              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
              : 'bg-blue-100 text-blue-800 border-blue-200'
          }`}>
            {overallStatus}
          </span>
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

      {/* Critical Metrics */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
        <div className="grid grid-cols-3 gap-4">
          {/* Days Until Renewal */}
          <div className="text-center">
            <p className="text-xs text-indigo-700 font-medium mb-1">Days Until Renewal</p>
            <p className={`text-3xl font-bold ${
              content.daysUntilRenewal <= 7
                ? 'text-red-700'
                : content.daysUntilRenewal <= 14
                ? 'text-orange-700'
                : 'text-indigo-900'
            }`}>
              {content.daysUntilRenewal}
            </p>
          </div>

          {/* Current ARR */}
          <div className="text-center">
            <p className="text-xs text-indigo-700 font-medium mb-1">Current ARR</p>
            <p className="text-2xl font-bold text-indigo-900">{formatCurrency(content.currentARR)}</p>
          </div>

          {/* Renewal ARR */}
          <div className="text-center">
            <p className="text-xs text-indigo-700 font-medium mb-1">Renewal ARR</p>
            <p className={`text-2xl font-bold ${isExpansion ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(content.renewalARR)}
            </p>
            <p className={`text-xs ${isExpansion ? 'text-green-600' : 'text-red-600'}`}>
              {isExpansion ? '+' : ''}{arrChangePercent}% ({isExpansion ? '+' : ''}{formatCurrency(arrChange)})
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="space-y-6">

          {/* Signature Status */}
          {content.signatures && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Signature Status
              </h3>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="space-y-3">
                  {/* DocuSign Sent */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">DocuSign Sent</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      content.signatures.docusignSent ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {content.signatures.docusignSent ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sent
                        </>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>

                  {/* Customer Signed */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Customer Signed</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      content.signatures.customerSigned ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {content.signatures.customerSigned ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Signed
                        </>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>

                  {/* Vendor Countersigned */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Vendor Countersigned</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      content.signatures.vendorCountersigned ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {content.signatures.vendorCountersigned ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Signed
                        </>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>

                  {/* Overall Status */}
                  <div className="pt-3 border-t border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Overall Status</p>
                    <p className="text-sm font-semibold text-blue-900">{content.signatures.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Status */}
          {content.payment && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Payment Status
              </h3>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="space-y-3">
                  {/* Invoice Sent */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Invoice Sent</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      content.payment.invoiceSent ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {content.payment.invoiceSent ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Sent
                        </>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>

                  {/* Payment Received */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Payment Received</span>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      content.payment.paymentReceived ? 'text-green-700' : 'text-gray-500'
                    }`}>
                      {content.payment.paymentReceived ? (
                        <>
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Received
                        </>
                      ) : (
                        'Pending'
                      )}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Amount</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(content.payment.amount)}
                    </span>
                  </div>

                  {/* Overall Status */}
                  <div className="pt-3 border-t border-green-200">
                    <p className="text-xs text-green-700 mb-1">Overall Status</p>
                    <p className="text-sm font-semibold text-green-900">{content.payment.status}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Salesforce Status */}
          {content.salesforce && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                Salesforce Status
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Opportunity Stage</span>
                    <span className="text-sm font-medium text-gray-900">{content.salesforce.opportunityStage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Forecast Category</span>
                    <span className="text-sm font-medium text-gray-900">{content.salesforce.forecastCategory}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Close Date</span>
                    <span className="text-sm font-medium text-gray-900">{content.salesforce.closeDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Last Synced</span>
                    <span className="text-xs text-gray-600">{content.salesforce.lastSynced}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Negotiation Status */}
          {content.negotiation && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Negotiation Status
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Pricing</span>
                    <span className="text-sm font-medium text-gray-900">{content.negotiation.pricing}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Terms</span>
                    <span className="text-sm font-medium text-gray-900">{content.negotiation.terms}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Approvals</span>
                    <span className="text-sm font-medium text-gray-900">{content.negotiation.approvals}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Contract analysis is read-only and auto-synced from systems.
        </div>
        <button
          onClick={() => alert('Refresh from Salesforce (mock)')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
