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
 * - PricingAnalysisArtifact
 */

import React from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import AccountOverviewArtifact from '@/components/artifacts/AccountOverviewArtifact';
import ExpansionOverviewArtifact from '@/components/artifacts/ExpansionOverviewArtifact';
import ExpansionProposalArtifact from '@/components/artifacts/ExpansionProposalArtifact';
import StrategicAccountPlanArtifact from '@/components/artifacts/StrategicAccountPlanArtifact';
import PricingAnalysisArtifact from '@/components/artifacts/PricingAnalysisArtifact';
import { AccountSummaryArtifact } from '@/components/artifacts/workflows';

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
        term: '1 year',
        autoRenew: expansionData.contract.autoRenew,
        autoRenewLanguage: 'Contract automatically renews for successive 1-year terms unless either party provides written notice 90 days prior to renewal date',
        noticePeriod: '90 days',
        terminationClause: 'Either party may terminate for convenience with 90 days written notice',
        pricingCaps: [
          'Annual price increases limited to 5% or CPI, whichever is lower',
          'Seat expansion pricing locked at current rate for remainder of term'
        ],
        nonStandardTerms: [
          'Custom data retention requirements (7 years)',
          'Dedicated support SLA with 2-hour response time'
        ],
        riskLevel: 'low' as const
      } : {
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: customer?.renewalDate || '',
        term: '1 year',
        autoRenew: false,
        autoRenewLanguage: undefined,
        noticePeriod: '90 days',
        terminationClause: 'Either party may terminate for convenience with 90 days written notice',
        pricingCaps: [
          'Annual price increases limited to 5% or CPI, whichever is lower',
          'Volume discount applies at 100+ seats'
        ],
        riskLevel: 'medium' as const
      };

      // Transform stakeholders to contacts format
      const contacts = (stakeholders && stakeholders.length > 0) ? stakeholders.map((s, idx) => ({
        name: s.name,
        role: s.role,
        email: s.email,
        type: (idx === 0 ? 'executive' : idx === 1 ? 'champion' : 'business') as 'executive' | 'champion' | 'business',
        confirmed: false
      })) : [
        {
          name: 'Mr. Big',
          role: 'CTO',
          email: 'cto@obsidianblack.com',
          type: 'executive' as const,
          confirmed: false
        },
        {
          name: 'Marcus Chen',
          role: 'VP of Engineering',
          email: 'marcus.chen@obsidianblack.com',
          type: 'executive' as const,
          confirmed: false
        },
        {
          name: 'Sarah Martinez',
          role: 'Director of Customer Success',
          email: 's.martinez@obsidianblack.com',
          type: 'champion' as const,
          confirmed: false
        },
        {
          name: 'David Park',
          role: 'Senior Product Manager',
          email: 'david.park@obsidianblack.com',
          type: 'business' as const,
          confirmed: false
        }
      ];

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
          showPricingTab={false}
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

    case 'PricingAnalysisArtifact':
      const props = section.data?.props || {};
      return (
        <PricingAnalysisArtifact
          data={{
            customerName: customerName,
            currentPrice: props.currentARR || (customer ? customer.arr : 185000),
            currentARR: props.currentARR || (customer ? customer.arr : 185000),
            pricePerUnit: props.currentPricePerSeat || 3700,
            unitType: props.unitType || 'seat',
            comparativeAnalysis: props.marketPercentile ? {
              averagePrice: props.proposedPricePerSeat || 3996,
              percentile: props.marketPercentile?.current || 35,
              similarCustomerCount: 50
            } : undefined,
            usageMetrics: {
              currentUsage: customer?.healthScore || 87,
              usageGrowth: 23,
              usageEfficiency: 92
            },
            recommendation: {
              priceIncrease: props.increasePercentage || 8,
              newAnnualPrice: props.proposedARR || 199800,
              reasons: props.justification || [
                'Strong product utilization',
                'Market-aligned pricing opportunity',
                'Healthy customer relationship',
                'Optimal timing window'
              ]
            }
          }}
        />
      );

    case 'AccountSummaryArtifact':
      const summaryProps = section.data?.props || {};
      return (
        <AccountSummaryArtifact
          customerName={summaryProps.customerName || customerName}
          industry={summaryProps.industry}
          tier={summaryProps.tier}
          status={summaryProps.status}
          metrics={summaryProps.metrics}
          renewalDate={summaryProps.renewalDate}
          daysToRenewal={summaryProps.daysToRenewal}
          contacts={summaryProps.contacts}
          priorities={summaryProps.priorities}
          risks={summaryProps.risks}
          opportunities={summaryProps.opportunities}
        />
      );

    default:
      return null;
  }
}
