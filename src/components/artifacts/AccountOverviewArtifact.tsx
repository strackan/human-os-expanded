'use client';

import React, { useState } from 'react';
import { FileText, Users, DollarSign, ChevronRight, Calendar, AlertCircle, CheckCircle, Shield, Edit2, Briefcase, Building, Code, TrendingUp, BarChart3, Activity, Clock, X } from 'lucide-react';
import ContactEditModal from './ContactEditModal';

interface Contact {
  name: string;
  role: string;
  email?: string;
  type: 'executive' | 'champion' | 'business';
  confirmed?: boolean;
}

interface ContractInfo {
  startDate: string;
  endDate: string;
  term: string;
  autoRenew: boolean;
  autoRenewLanguage?: string;
  noticePeriod: string;
  terminationClause?: string;
  pricingCaps?: string[];
  nonStandardTerms?: string[];
  unsignedAmendments?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
}

interface PricingInfo {
  currentARR: string;
  lastYearARR?: string;
  seats: number;
  pricePerSeat?: string;
  addOns?: string[];
  discounts?: string;
  marketPercentile?: number;
  usageScore?: number;
  adoptionRate?: number;
  satisfactionScore?: number;
  pricingOpportunity?: 'high' | 'medium' | 'low' | 'none';
}

interface AccountOverviewArtifactProps {
  customerName: string;
  contractInfo: ContractInfo;
  contacts: Contact[];
  pricingInfo: PricingInfo;
  onContinue?: () => void;
  onBack?: () => void;
  onContactConfirm?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactUpdate?: (oldContact: Contact, newContact: Contact, context: { davidRole: string; newContactRole: string }) => void;
  onContractQuestion?: (question: string, answer: string) => void;
  showSkipSnooze?: boolean;
  onSkip?: () => void;
  onSnooze?: () => void;
}

export default function AccountOverviewArtifact({
  customerName,
  contractInfo,
  contacts,
  pricingInfo,
  onContinue,
  onBack,
  onContactConfirm,
  onContactEdit,
  onContactUpdate,
  onContractQuestion,
  showSkipSnooze = false,
  onSkip,
  onSnooze
}: AccountOverviewArtifactProps) {
  const [activeTab, setActiveTab] = useState<'contract' | 'contacts' | 'pricing'>('contract');
  const [localContacts, setLocalContacts] = useState(contacts);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const getContactTypeConfig = (type: Contact['type']) => {
    switch (type) {
      case 'executive':
        return {
          icon: Briefcase,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-900',
          iconColor: 'text-purple-600',
          label: 'Executive Stakeholder'
        };
      case 'champion':
        return {
          icon: Building,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600',
          label: 'Champion'
        };
      case 'business':
        return {
          icon: Code,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-900',
          iconColor: 'text-green-600',
          label: 'Business User'
        };
    }
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
    }
  };

  const getOpportunityColor = (level: 'high' | 'medium' | 'low' | 'none') => {
    switch (level) {
      case 'high': return 'text-green-700 bg-green-50';
      case 'medium': return 'text-blue-700 bg-blue-50';
      case 'low': return 'text-gray-700 bg-gray-50';
      case 'none': return 'text-gray-500 bg-gray-50';
    }
  };

  const handleContactConfirm = (contact: Contact) => {
    const updatedContacts = localContacts.map(c =>
      c.email === contact.email ? { ...c, confirmed: true } : c
    );
    setLocalContacts(updatedContacts);
    onContactConfirm?.(contact);
  };

  const handleContactEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
    onContactEdit?.(contact);
  };

  const handleContactUpdate = (newContact: Contact, context: { davidRole: string; newContactRole: string }) => {
    if (editingContact) {
      // Update local contacts list
      const updatedContacts = localContacts.map(c =>
        c.email === editingContact.email ? { ...newContact, confirmed: false } : c
      );
      setLocalContacts(updatedContacts);

      // Notify parent component
      onContactUpdate?.(editingContact, newContact, context);

      // Close modal
      setIsEditModalOpen(false);
      setEditingContact(null);
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Account Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Review key details for {customerName}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('contract')}
          className={`flex items-center gap-2 px-8 py-4 text-sm font-medium ${
            activeTab === 'contract'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Contract
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 px-8 py-4 text-sm font-medium ${
            activeTab === 'contacts'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Contacts
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-8 py-4 text-sm font-medium ${
            activeTab === 'pricing'
              ? 'text-gray-900 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Pricing
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'contract' && (
          <div className="max-w-3xl space-y-6">
            {/* Basic Contract Info */}
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
                  <div className="border-l-4 border-blue-400 bg-blue-50 rounded-r-lg p-3">
                    <div className="flex items-start gap-2">
                      <DollarSign className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 mb-1">Pricing Ceilings & Constraints</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {contractInfo.pricingCaps.map((cap, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Non-Standard Terms */}
                {contractInfo.nonStandardTerms && contractInfo.nonStandardTerms.length > 0 && (
                  <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-900 mb-1">Non-Standard Terms</p>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {contractInfo.nonStandardTerms.map((term, index) => (
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

                {/* Unsigned Amendments */}
                {contractInfo.unsignedAmendments && contractInfo.unsignedAmendments.length > 0 && (
                  <div className="border-l-4 border-red-400 bg-red-50 rounded-r-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-900 mb-1">Unsigned Amendments</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          {contractInfo.unsignedAmendments.map((amendment, index) => (
                            <li key={index} className="flex items-start gap-1">
                              <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{amendment}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Termination Clause */}
                {contractInfo.terminationClause && (
                  <div className="border-l-4 border-gray-400 bg-gray-50 rounded-r-lg p-3">
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">Termination Clause</p>
                        <p className="text-sm text-gray-700">{contractInfo.terminationClause}</p>
                      </div>
                    </div>
                  </div>
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
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="max-w-3xl">
            <p className="text-sm text-gray-600 mb-4">
              Confirm your key stakeholders for this account. These contacts will be included in your strategic plan.
            </p>

            <div className="space-y-3">
              {localContacts.map((contact, index) => {
                const typeConfig = getContactTypeConfig(contact.type);
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={index}
                    className={`border-2 ${typeConfig.borderColor} ${typeConfig.bgColor} rounded-lg p-4 transition-colors`}
                  >
                    {/* Contact Type Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${typeConfig.bgColor} border ${typeConfig.borderColor}`}>
                        <TypeIcon className={`w-4 h-4 ${typeConfig.iconColor}`} />
                        <span className={`text-xs font-medium ${typeConfig.textColor}`}>{typeConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.confirmed ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Confirmed
                          </span>
                        ) : (
                          <button
                            onClick={() => handleContactConfirm(contact)}
                            className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 font-medium"
                          >
                            Confirm
                          </button>
                        )}
                        <button
                          onClick={() => handleContactEditClick(contact)}
                          className="p-1 hover:bg-white/50 rounded transition-colors"
                          title="Edit contact"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Contact Details */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{contact.name}</h4>
                      <p className="text-sm text-gray-600 mt-0.5">{contact.role}</p>
                      {contact.email && (
                        <p className="text-xs text-gray-500 mt-1">{contact.email}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirmation Call-to-Action */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">
                ✓ Confirm Your Stakeholder Strategy
              </p>
              <p className="text-sm text-blue-700">
                Make sure these are the right contacts for your plan. You can confirm or update each person above.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="max-w-3xl space-y-6">
            {/* Current Pricing Overview */}
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

            {/* Value Comparison */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-base font-medium text-gray-900 flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                Value vs. Market Position
              </h3>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {pricingInfo.marketPercentile !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Market Percentile</span>
                      <DollarSign className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className={`text-lg font-bold ${
                      pricingInfo.marketPercentile < 40 ? 'text-amber-600' :
                      pricingInfo.marketPercentile > 60 ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {pricingInfo.marketPercentile}th
                    </div>
                    <div className="text-xs text-gray-500">vs similar customers</div>
                  </div>
                )}

                {pricingInfo.usageScore !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Usage Score</span>
                      <Activity className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className={`text-lg font-bold ${
                      pricingInfo.usageScore >= 80 ? 'text-green-600' :
                      pricingInfo.usageScore >= 60 ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {pricingInfo.usageScore}%
                    </div>
                    <div className="text-xs text-gray-500">platform utilization</div>
                  </div>
                )}

                {pricingInfo.adoptionRate !== undefined && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Adoption Rate</span>
                      <TrendingUp className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className={`text-lg font-bold ${
                      pricingInfo.adoptionRate >= 75 ? 'text-green-600' :
                      pricingInfo.adoptionRate >= 50 ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {pricingInfo.adoptionRate}%
                    </div>
                    <div className="text-xs text-gray-500">feature adoption</div>
                  </div>
                )}
              </div>

              {/* Pricing Opportunity Indicator */}
              {pricingInfo.pricingOpportunity && pricingInfo.pricingOpportunity !== 'none' && (
                <div className={`p-4 rounded-lg border ${getOpportunityColor(pricingInfo.pricingOpportunity)}`}>
                  <div className="flex items-start gap-3">
                    <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      pricingInfo.pricingOpportunity === 'high' ? 'text-green-600' :
                      pricingInfo.pricingOpportunity === 'medium' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {pricingInfo.pricingOpportunity === 'high' ? 'Strong Pricing Opportunity' :
                         pricingInfo.pricingOpportunity === 'medium' ? 'Moderate Pricing Opportunity' :
                         'Limited Pricing Opportunity'}
                      </p>
                      <p className="text-sm opacity-90">
                        {pricingInfo.pricingOpportunity === 'high' &&
                          'High usage and adoption with below-market pricing suggests significant room for value-based increase.'}
                        {pricingInfo.pricingOpportunity === 'medium' &&
                          'Solid value metrics indicate potential for pricing optimization in your strategic plan.'}
                        {pricingInfo.pricingOpportunity === 'low' &&
                          'Current pricing appears aligned with value delivery. Monitor for future opportunities.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Add-Ons & Features */}
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

            {/* Active Discounts */}
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

      {/* Footer Actions - Only show if any callbacks are provided */}
      {(onBack || onContinue || showSkipSnooze) && (
        <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
              >
                Back
              </button>
            )}

            {/* Skip/Snooze Controls */}
            {showSkipSnooze && (
              <div className="flex items-center gap-2 ml-2">
                {onSnooze && (
                  <button
                    onClick={onSnooze}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    title="Snooze this workflow"
                  >
                    <Clock className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    title="Skip this workflow"
                  >
                    <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1"></div>

          {onContinue && (
            <button
              onClick={onContinue}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Contact Edit Modal */}
      {editingContact && (
        <ContactEditModal
          isOpen={isEditModalOpen}
          currentContact={editingContact}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingContact(null);
          }}
          onUpdate={handleContactUpdate}
        />
      )}
    </div>
  );
}
