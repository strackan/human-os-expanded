'use client';

import React, { useState } from 'react';
import { FileText, Users, DollarSign, ChevronRight, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface Contact {
  name: string;
  role: string;
  email?: string;
  engagement: 'high' | 'medium' | 'low';
}

interface ContractInfo {
  startDate: string;
  endDate: string;
  term: string;
  autoRenew: boolean;
  noticePeriod: string;
  terminationClause?: string;
}

interface PricingInfo {
  currentARR: string;
  lastYearARR?: string;
  seats: number;
  pricePerSeat?: string;
  addOns?: string[];
  discounts?: string;
}

interface AccountOverviewArtifactProps {
  customerName: string;
  contractInfo: ContractInfo;
  contacts: Contact[];
  pricingInfo: PricingInfo;
  onContinue?: () => void;
  onBack?: () => void;
}

export default function AccountOverviewArtifact({
  customerName,
  contractInfo,
  contacts,
  pricingInfo,
  onContinue,
  onBack
}: AccountOverviewArtifactProps) {
  const [activeTab, setActiveTab] = useState<'contract' | 'contacts' | 'pricing'>('contract');

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <h2 className="text-lg font-semibold text-gray-900">Account Overview</h2>
        <p className="text-sm text-gray-600 mt-1">Review key details for {customerName}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('contract')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'contract'
              ? 'text-blue-700 border-b-2 border-blue-700 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Contract
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'contacts'
              ? 'text-blue-700 border-b-2 border-blue-700 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Contacts
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'pricing'
              ? 'text-blue-700 border-b-2 border-blue-700 bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Pricing
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'contract' && (
          <div className="max-w-3xl space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contract Start</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {new Date(contractInfo.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contract End</p>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  {new Date(contractInfo.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                {contractInfo.autoRenew ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Auto-Renewal Enabled</p>
                      <p className="text-xs text-gray-600 mt-1">Contract will automatically renew unless notice is given</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Manual Renewal Required</p>
                      <p className="text-xs text-gray-600 mt-1">Active negotiation needed before contract end date</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {contractInfo.terminationClause && (
              <div className="pt-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Termination Clause</p>
                <p className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  {contractInfo.terminationClause}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="max-w-3xl space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-900">{contact.name}</h4>
                    <p className="text-sm text-gray-600 mt-0.5">{contact.role}</p>
                    {contact.email && (
                      <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getEngagementColor(contact.engagement)}`}>
                    {contact.engagement.charAt(0).toUpperCase() + contact.engagement.slice(1)} Engagement
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-3xl space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Current ARR</p>
                <p className="text-2xl font-bold text-gray-900">{pricingInfo.currentARR}</p>
                {pricingInfo.lastYearARR && (
                  <p className="text-xs text-gray-500">Previous: {pricingInfo.lastYearARR}</p>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Seats</p>
                <p className="text-2xl font-bold text-gray-900">{pricingInfo.seats}</p>
                {pricingInfo.pricePerSeat && (
                  <p className="text-xs text-gray-500">{pricingInfo.pricePerSeat} per seat</p>
                )}
              </div>
            </div>

            {pricingInfo.addOns && pricingInfo.addOns.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Add-Ons & Features</p>
                <div className="flex flex-wrap gap-2">
                  {pricingInfo.addOns.map((addOn, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {addOn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {pricingInfo.discounts && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Active Discounts</p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-900 font-medium">{pricingInfo.discounts}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Back
          </button>
        )}

        <div className="flex-1"></div>

        {onContinue && (
          <button
            onClick={onContinue}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
