import React from 'react';
import { FileText, Calendar, DollarSign, AlertTriangle, Eye, ChevronRight, Shield, TrendingUp, Users } from 'lucide-react';

interface ContractArtifactProps {
  data?: {
    contractId?: string;
    customerName?: string;
    contractValue?: number;
    renewalDate?: string;
    signerBaseAmount?: number;
    pricingCalculation?: {
      basePrice?: number;
      volumeDiscount?: number;
      additionalServices?: number;
      totalPrice?: number;
    };
    businessTerms?: {
      unsigned?: string[];
      nonStandardRenewal?: string[];
      nonStandardPricing?: string[];
      pricingCaps?: string[];
      otherTerms?: string[];
    };
    riskLevel?: 'low' | 'medium' | 'high';
    lastUpdated?: string;
  };
  isLoading?: boolean;
  error?: string;
}

// Loading skeleton components
const SkeletonBox = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

const ContractArtifact: React.FC<ContractArtifactProps> = ({ data = {}, isLoading = false, error }) => {
  const {
    contractId = 'CNT-2024-001',
    customerName = 'Enterprise Customer',
    contractValue = 180000,
    renewalDate = 'March 31, 2025',
    signerBaseAmount = 150000,
    pricingCalculation = {
      basePrice: 150000,
      volumeDiscount: -15000,
      additionalServices: 45000,
      totalPrice: 180000
    },
    businessTerms = {
      unsigned: ['Liability cap amendment pending signature', 'Data processing addendum awaiting legal review'],
      nonStandardRenewal: ['90-day notice period (standard: 30 days)', 'Auto-renewal clause with 15% escalation'],
      nonStandardPricing: ['Custom pricing tier for enterprise features', 'Usage-based pricing for API calls'],
      pricingCaps: ['Maximum 15% annual increase', 'Volume discount caps at 25%'],
      otherTerms: ['Unlimited user seats', 'Priority support included']
    },
    riskLevel = 'medium',
    lastUpdated = 'December 15, 2024'
  } = data;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 shadow-sm overflow-hidden">
        <div className="bg-red-50 px-6 py-4 border-b border-red-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Contract</h3>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonBox className="w-10 h-10" />
              <div>
                <SkeletonBox className="h-5 w-48 mb-2" />
                <SkeletonBox className="h-3 w-32" />
              </div>
            </div>
            <SkeletonBox className="h-8 w-20" />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="px-6 py-4 grid grid-cols-3 gap-4 bg-gray-50 border-b border-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <SkeletonBox className="w-5 h-5 mt-0.5" />
              <div>
                <SkeletonBox className="h-3 w-20 mb-2" />
                <SkeletonBox className="h-6 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Skeleton */}
        <div className="px-6 py-4 border-b border-gray-200">
          <SkeletonBox className="h-5 w-32 mb-3" />
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between">
                <SkeletonBox className="h-3 w-20" />
                <SkeletonBox className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Terms Skeleton */}
        <div className="px-6 py-4">
          <SkeletonBox className="h-5 w-40 mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-l-4 border-gray-300 bg-gray-50 rounded-r-lg p-3">
                <SkeletonBox className="h-4 w-32 mb-2" />
                <SkeletonBox className="h-3 w-full mb-1" />
                <SkeletonBox className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 md:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{customerName} Contract</h3>
              <p className="text-sm text-gray-500">{contractId} • Last updated: {lastUpdated}</p>
            </div>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors self-start sm:self-auto">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="px-4 md:px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Contract Value</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(contractValue)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Next Renewal</p>
            <p className="text-xl font-bold text-gray-900">{renewalDate}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500">Signer Base</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(signerBaseAmount)}</p>
          </div>
        </div>
      </div>

      {/* Pricing Calculation */}
      <div className="px-4 md:px-6 py-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          Pricing Calculation
        </h4>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Base Price</span>
            <span className="font-medium text-gray-900">{formatCurrency(pricingCalculation.basePrice || 0)}</span>
          </div>
          {pricingCalculation.volumeDiscount && pricingCalculation.volumeDiscount !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Volume Discount</span>
              <span className="font-medium text-green-600">
                {formatCurrency(pricingCalculation.volumeDiscount)}
              </span>
            </div>
          )}
          {pricingCalculation.additionalServices && pricingCalculation.additionalServices !== 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Additional Services</span>
              <span className="font-medium text-gray-900">
                +{formatCurrency(pricingCalculation.additionalServices)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
            <span className="font-medium text-gray-900">Total Contract Value</span>
            <span className="font-bold text-gray-900">{formatCurrency(pricingCalculation.totalPrice || contractValue)}</span>
          </div>
        </div>
      </div>

      {/* Business Terms */}
      <div className="px-4 md:px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-400" />
            Business Impacting Terms
          </h4>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskBadgeColor(riskLevel)}`}>
            {riskLevel.toUpperCase()} RISK
          </span>
        </div>

        <div className="space-y-3">
          {businessTerms.unsigned && businessTerms.unsigned.length > 0 && (
            <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 mb-1">Unsigned Terms</p>
                  <ul className="text-sm text-red-700 space-y-1">
                    {businessTerms.unsigned.map((term, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {businessTerms.nonStandardRenewal && businessTerms.nonStandardRenewal.length > 0 && (
            <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-1">Non-Standard Renewal</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {businessTerms.nonStandardRenewal.map((term, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {businessTerms.nonStandardPricing && businessTerms.nonStandardPricing.length > 0 && (
            <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <DollarSign className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-1">Non-Standard Pricing</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {businessTerms.nonStandardPricing.map((term, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {businessTerms.pricingCaps && businessTerms.pricingCaps.length > 0 && (
            <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">Pricing Caps</p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {businessTerms.pricingCaps.map((term, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {businessTerms.otherTerms && businessTerms.otherTerms.length > 0 && (
            <div className="border-l-4 border-gray-400 bg-gray-50 rounded-r-lg p-3">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Other Terms</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {businessTerms.otherTerms.map((term, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractArtifact;