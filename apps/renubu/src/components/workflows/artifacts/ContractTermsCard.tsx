'use client';

/**
 * ContractTermsCard Component
 *
 * Displays contract business terms from the contract_matrix view
 * Shows: pricing model, SLA, support tier, auto-renewal terms, liability, etc.
 */

import React from 'react';
import { ContractData } from '@/lib/data-providers/contractProvider';
import { AlertCircle, Shield, Clock, DollarSign, TrendingUp, Users } from 'lucide-react';

interface ContractTermsCardProps {
  contract: ContractData;
  className?: string;
  compact?: boolean;
}

export default function ContractTermsCard({ contract, className = '', compact = false }: ContractTermsCardProps) {
  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(amount);
  };

  // Helper to get renewal window status
  const getRenewalWindowStatus = () => {
    if (!contract.inRenewalWindow) return null;

    const daysLeft = contract.daysUntilRenewal || 0;
    const noticeDays = contract.autoRenewalNoticeDays || 60;

    return {
      status: daysLeft <= 30 ? 'urgent' : 'warning',
      message: daysLeft <= 30
        ? `URGENT: ${daysLeft} days until auto-renewal`
        : `${daysLeft} days until renewal window closes`
    };
  };

  const renewalStatus = getRenewalWindowStatus();

  if (compact) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Contract Terms</h3>
          {renewalStatus && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              renewalStatus.status === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {renewalStatus.message}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {contract.supportTier && (
            <div>
              <div className="text-gray-500">Support</div>
              <div className="font-medium capitalize">{contract.supportTier}</div>
            </div>
          )}
          {contract.slaUptimePercent && (
            <div>
              <div className="text-gray-500">SLA</div>
              <div className="font-medium">{contract.slaUptimePercent}% uptime</div>
            </div>
          )}
          {contract.autoRenewalNoticeDays && (
            <div>
              <div className="text-gray-500">Auto-Renewal</div>
              <div className="font-medium">{contract.autoRenewalNoticeDays} days notice</div>
            </div>
          )}
          {contract.liabilityCap && (
            <div>
              <div className="text-gray-500">Liability</div>
              <div className="font-medium capitalize">{contract.liabilityCap.replace(/_/g, ' ')}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Contract Business Terms</h3>
            <p className="text-sm text-gray-500 mt-1">
              {contract.term} • {contract.pricingModel && `${contract.pricingModel.replace(/_/g, ' ')} pricing`}
            </p>
          </div>
          {renewalStatus && (
            <div className={`px-4 py-2 rounded-lg ${
              renewalStatus.status === 'urgent' ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className={`w-4 h-4 ${
                  renewalStatus.status === 'urgent' ? 'text-red-600' : 'text-orange-600'
                }`} />
                <span className={`text-sm font-medium ${
                  renewalStatus.status === 'urgent' ? 'text-red-700' : 'text-orange-700'
                }`}>
                  {renewalStatus.message}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Pricing Terms */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-gray-900">Pricing</h4>
          </div>
          <div className="grid grid-cols-3 gap-4 ml-7">
            <div>
              <div className="text-sm text-gray-500">Model</div>
              <div className="font-medium capitalize">{contract.pricingModel?.replace(/_/g, ' ') || 'Standard'}</div>
            </div>
            {contract.discountPercent !== undefined && (
              <div>
                <div className="text-sm text-gray-500">Discount</div>
                <div className="font-medium">{contract.discountPercent}%</div>
              </div>
            )}
            {contract.paymentTerms && (
              <div>
                <div className="text-sm text-gray-500">Payment Terms</div>
                <div className="font-medium">{contract.paymentTerms.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Service Level Terms */}
        {(contract.supportTier || contract.slaUptimePercent || contract.responseTimeHours) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Service Level</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-7">
              {contract.supportTier && (
                <div>
                  <div className="text-sm text-gray-500">Support Tier</div>
                  <div className="font-medium capitalize">{contract.supportTier}</div>
                </div>
              )}
              {contract.slaUptimePercent && (
                <div>
                  <div className="text-sm text-gray-500">SLA Uptime</div>
                  <div className="font-medium">{contract.slaUptimePercent}%</div>
                </div>
              )}
              {contract.responseTimeHours && (
                <div>
                  <div className="text-sm text-gray-500">Response Time</div>
                  <div className="font-medium">{contract.responseTimeHours}h</div>
                </div>
              )}
              {contract.dedicatedCsm && (
                <div>
                  <div className="text-sm text-gray-500">Account Management</div>
                  <div className="font-medium">Dedicated CSM</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Renewal Terms */}
        {(contract.autoRenewalNoticeDays || contract.renewalPriceCapPercent) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Renewal</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-7">
              {contract.autoRenewalNoticeDays && (
                <div>
                  <div className="text-sm text-gray-500">Notice Period</div>
                  <div className="font-medium">{contract.autoRenewalNoticeDays} days</div>
                </div>
              )}
              {contract.renewalPriceCapPercent && (
                <div>
                  <div className="text-sm text-gray-500">Price Cap</div>
                  <div className="font-medium">Max {contract.renewalPriceCapPercent}% increase</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Auto-Renewal</div>
                <div className="font-medium">{contract.autoRenew ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>
        )}

        {/* Legal Terms */}
        {(contract.liabilityCap || contract.dataResidency) && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-red-600" />
              <h4 className="font-medium text-gray-900">Legal & Compliance</h4>
            </div>
            <div className="grid grid-cols-3 gap-4 ml-7">
              {contract.liabilityCap && (
                <div>
                  <div className="text-sm text-gray-500">Liability Cap</div>
                  <div className="font-medium capitalize">{contract.liabilityCap.replace(/_/g, ' ')}</div>
                </div>
              )}
              {contract.dataResidency && contract.dataResidency.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500">Data Residency</div>
                  <div className="font-medium uppercase">{contract.dataResidency.join(', ')}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Included Features */}
        {contract.includedFeatures && contract.includedFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-indigo-600" />
              <h4 className="font-medium text-gray-900">Included Features</h4>
            </div>
            <div className="ml-7 flex flex-wrap gap-2">
              {contract.includedFeatures.map((feature) => (
                <span
                  key={feature}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium"
                >
                  {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Usage Limits */}
        {contract.usageLimits && Object.keys(contract.usageLimits).length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-medium text-gray-900">Usage Limits</h4>
            </div>
            <div className="ml-7 grid grid-cols-3 gap-4">
              {contract.usageLimits.api_calls_per_month && (
                <div>
                  <div className="text-sm text-gray-500">API Calls</div>
                  <div className="font-medium">{contract.usageLimits.api_calls_per_month.toLocaleString()}/mo</div>
                </div>
              )}
              {contract.usageLimits.storage_gb && (
                <div>
                  <div className="text-sm text-gray-500">Storage</div>
                  <div className="font-medium">{contract.usageLimits.storage_gb} GB</div>
                </div>
              )}
              {contract.usageLimits.concurrent_users && (
                <div>
                  <div className="text-sm text-gray-500">Concurrent Users</div>
                  <div className="font-medium">{contract.usageLimits.concurrent_users}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market Position (if discount is provided) */}
        {contract.discountPercent !== undefined && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Market Position:</span> This customer is receiving a {contract.discountPercent}% discount
              {contract.discountPercent > 15 && (
                <span className="text-orange-600"> (below market pricing - expansion opportunity)</span>
              )}
              {contract.discountPercent <= 15 && contract.discountPercent > 0 && (
                <span className="text-green-600"> (competitive pricing)</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
