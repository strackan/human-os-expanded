'use client';

/**
 * AccountArtifactRenderer
 *
 * Handles rendering of account and financial document artifacts.
 * Shared logic: Customer and expansion data transformation.
 *
 * Artifacts handled:
 * - AccountOverviewArtifact
 * - ExpansionOverviewArtifact
 * - ExpansionProposalArtifact
 * - StrategicAccountPlanArtifact
 */

import React from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import AccountOverviewArtifact from '@/components/artifacts/AccountOverviewArtifact';
import ExpansionOverviewArtifact from '@/components/artifacts/ExpansionOverviewArtifact';
import ExpansionProposalArtifact from '@/components/artifacts/ExpansionProposalArtifact';
import StrategicAccountPlanArtifact from '@/components/artifacts/StrategicAccountPlanArtifact';

interface AccountArtifactRendererProps {
  slide: WorkflowSlide;
  section: any;
  customerName: string;
  workflowState: Record<string, any>;
  customer: any;
  expansionData: any;
  stakeholders: any[];
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onUpdateState: (key: string, value: any) => void;
}

export default function AccountArtifactRenderer({
  slide,
  section,
  customerName,
  workflowState,
  customer,
  expansionData,
  stakeholders,
  onNext,
  onBack,
  onClose,
  onUpdateState
}: AccountArtifactRendererProps) {
  const componentType = section.data?.componentType;

  switch (componentType) {
    case 'AccountOverviewArtifact':
      // Transform expansion data to contract info format
      const contractInfo = expansionData?.contract ? {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: expansionData.contract.renewalDate,
        term: expansionData.contract.term,
        autoRenew: expansionData.contract.autoRenew,
        noticePeriod: '90 days',
        riskLevel: 'low' as const
      } : {
        startDate: new Date().toISOString(),
        endDate: customer?.renewalDate || '',
        term: '12 months',
        autoRenew: false,
        noticePeriod: '90 days',
        riskLevel: 'medium' as const
      };

      // Transform stakeholders to contacts format
      const contacts = (stakeholders || []).map((s, idx) => ({
        name: s.name,
        role: s.role,
        email: s.email,
        type: (idx === 0 ? 'executive' : idx === 1 ? 'champion' : 'business') as 'executive' | 'champion' | 'business',
        confirmed: false
      }));

      // Transform pricing info
      const pricingInfo = expansionData ? {
        currentARR: `$${Math.round(expansionData.contract.annualSpend / 1000)}K`,
        seats: expansionData.contract.licenseCount,
        pricePerSeat: `$${expansionData.contract.pricePerSeat.toFixed(2)}`,
        marketPercentile: expansionData.market.percentile,
        usageScore: Math.round(expansionData.usage.utilizationPercent),
        adoptionRate: Math.round(expansionData.usage.adoptionRate),
        pricingOpportunity: (expansionData.market.percentile < 40 ? 'high' : expansionData.market.percentile < 60 ? 'medium' : 'low') as 'high' | 'medium' | 'low'
      } : {
        currentARR: `$${Math.round((customer?.arr || 0) / 1000)}K`,
        seats: 50,
        pricePerSeat: '$3,700',
        marketPercentile: 50,
        usageScore: 75,
        adoptionRate: 80,
        pricingOpportunity: 'medium' as const
      };

      return (
        <AccountOverviewArtifact
          customerName={customerName}
          contractInfo={contractInfo}
          contacts={contacts}
          pricingInfo={pricingInfo}
          // Navigation now handled by chat buttons
          // onContinue={onNext}
          // onBack={onBack}
        />
      );

    case 'ExpansionOverviewArtifact':
      return (
        <ExpansionOverviewArtifact
          customerName={customerName}
          contractInfo={expansionData?.contract}
          usageInfo={expansionData?.usage}
          marketInfo={expansionData?.market}
          onContinue={onNext}
          onBack={onBack}
        />
      );

    case 'ExpansionProposalArtifact':
      return (
        <ExpansionProposalArtifact
          customerName={customerName}
          scenarios={expansionData?.scenarios || []}
          currentARR={expansionData?.contract?.annualSpend || 0}
          currentSeats={expansionData?.contract?.licenseCount || 0}
          currentPrice={expansionData?.contract?.pricePerSeat || 0}
          onScenarioSelect={(scenarioId) => {
            onUpdateState('selectedScenario', scenarioId);
          }}
          onContinue={onNext}
          onBack={onBack}
        />
      );

    case 'StrategicAccountPlanArtifact':
      return (
        <StrategicAccountPlanArtifact
          customerName={customerName}
          strategyType="expand"
          renewalDate={customer?.renewalDate || "Mar 15, 2025"}
          currentARR={customer ? `$${Math.round(customer.arr / 1000)}K` : "$185K"}
          healthScore={customer?.healthScore || 85}
          growthPotential={75}
          riskLevel={30}
          onModify={onBack}
          onAgree={onNext}
          onComeBack={onClose}
        />
      );

    default:
      return null;
  }
}
