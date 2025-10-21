import React, { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Shield, DollarSign, FileText } from 'lucide-react';
import { ContractTabProps } from '../types';
import { getRiskColor } from '../utils/config';
import { formatContractDate } from '../utils/formatters';
import { NoteCard } from '../components/NoteCard';
import { ReviewCheckbox } from '../components/ReviewCheckbox';

/**
 * ContractTab - Standalone component for displaying contract information
 *
 * Can be used independently or within the AccountOverview tab container.
 * Displays contract basics, auto-renewal status, and business impact notes.
 */
export function ContractTab({
  contractInfo,
  customerName,
  onReview,
  onContractQuestion
}: ContractTabProps) {
  const [contractReviewed, setContractReviewed] = useState(false);

  const handleReviewChange = (reviewed: boolean) => {
    setContractReviewed(reviewed);
    onReview?.(reviewed);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Basic Contract Info */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Contract Start</p>
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            {formatContractDate(contractInfo.startDate)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Contract End</p>
          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-600" />
            {formatContractDate(contractInfo.endDate)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Term Length</p>
          <p className="text-sm font-medium text-gray-900">{contractInfo.term}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Notice Period</p>
          <p className="text-sm font-medium text-gray-900">{contractInfo.noticePeriod}</p>
        </div>
      </div>

      {/* Auto-Renewal Status */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
          {contractInfo.autoRenew ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Auto-Renewal Enabled</p>
                <p className="text-xs text-gray-600 mt-1">
                  {contractInfo.autoRenewLanguage || 'Contract will automatically renew unless notice is given'}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Manual Renewal Required</p>
                <p className="text-xs text-gray-600 mt-1">Active negotiation needed before contract end date</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Business Impact Notes */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-600" />
            Business Impact Notes
          </h3>
          {contractInfo.riskLevel && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskColor(contractInfo.riskLevel)}`}>
              {contractInfo.riskLevel.toUpperCase()} RISK
            </span>
          )}
        </div>

        <div className="space-y-3">
          {/* Pricing Caps */}
          {contractInfo.pricingCaps && contractInfo.pricingCaps.length > 0 && (
            <NoteCard
              icon={DollarSign}
              title="Pricing Ceilings & Constraints"
              items={contractInfo.pricingCaps}
              borderColor="border-blue-400"
              bgColor="bg-blue-50"
              textColor="text-blue-700"
              iconColor="text-blue-600"
            />
          )}

          {/* Non-Standard Terms */}
          {contractInfo.nonStandardTerms && contractInfo.nonStandardTerms.length > 0 && (
            <NoteCard
              icon={AlertCircle}
              title="Non-Standard Terms"
              items={contractInfo.nonStandardTerms}
              borderColor="border-amber-400"
              bgColor="bg-amber-50"
              textColor="text-amber-700"
              iconColor="text-amber-600"
            />
          )}

          {/* Unsigned Amendments */}
          {contractInfo.unsignedAmendments && contractInfo.unsignedAmendments.length > 0 && (
            <NoteCard
              icon={AlertCircle}
              title="Unsigned Amendments"
              items={contractInfo.unsignedAmendments}
              borderColor="border-red-400"
              bgColor="bg-red-50"
              textColor="text-red-700"
              iconColor="text-red-600"
            />
          )}

          {/* Termination Clause */}
          {contractInfo.terminationClause && (
            <NoteCard
              icon={FileText}
              title="Termination Clause"
              description={contractInfo.terminationClause}
              borderColor="border-gray-400"
              bgColor="bg-gray-50"
              textColor="text-gray-700"
              iconColor="text-gray-600"
            />
          )}
        </div>

        {/* Amendment Recommendation */}
        {(contractInfo.riskLevel === 'high' || contractInfo.riskLevel === 'medium') && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">
              💡 Contract Amendment May Be Recommended
            </p>
            <p className="text-sm text-blue-700">
              Based on the identified risks and constraints, consider including contract amendments in your strategic plan.
            </p>
          </div>
        )}
      </div>

      {/* Review Checkbox */}
      <ReviewCheckbox
        label="I have reviewed the Contract"
        checked={contractReviewed}
        onChange={handleReviewChange}
      />
    </div>
  );
}
