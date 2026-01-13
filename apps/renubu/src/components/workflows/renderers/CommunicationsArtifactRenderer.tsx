'use client';

/**
 * CommunicationsArtifactRenderer
 *
 * Handles rendering of communication and stakeholder artifacts.
 * Shared logic: Stakeholder/contact data transformation and email generation.
 *
 * Artifacts handled:
 * - EmailArtifact
 * - StakeholderProfileArtifact
 * - TalkingPointsArtifact
 * - QuoteArtifact
 */

import React from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import EmailArtifact from '@/components/artifacts/EmailArtifact';
import StakeholderProfileArtifact from '@/components/artifacts/StakeholderProfileArtifact';
import TalkingPointsArtifact from '@/components/artifacts/TalkingPointsArtifact';
import QuoteArtifact from '@/components/artifacts/QuoteArtifact';

interface CommunicationsArtifactRendererProps {
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

/**
 * Transform stakeholders into profile format with engagement scores
 */
function transformStakeholderProfiles(
  stakeholders: any[],
  customer: any,
  expansionData: any
): any[] {
  return stakeholders.map((stakeholder, index) => {
    // Calculate engagement score based on role and customer health
    let engagementScore = 75; // Base score

    if (stakeholder.role.toLowerCase().includes('exec') || stakeholder.role.toLowerCase().includes('c-')) {
      engagementScore += 10; // Executive bonus
    }

    if (customer?.healthScore) {
      engagementScore = Math.round((engagementScore + customer.healthScore) / 2);
    }

    // Determine influence level based on role
    let influenceLevel: 'high' | 'medium' | 'low' = 'medium';
    if (index === 0 || stakeholder.role.toLowerCase().includes('exec')) {
      influenceLevel = 'high';
    } else if (index > 2) {
      influenceLevel = 'low';
    }

    return {
      ...stakeholder,
      engagementScore,
      influenceLevel,
      lastContact: stakeholder.lastContact || 'Last week',
      nextAction: stakeholder.nextAction || 'Schedule follow-up call',
      notes: stakeholder.notes || 'Key decision maker for renewal discussions'
    };
  });
}

/**
 * Generate email content based on workflow context
 */
function generateEmailContent(
  emailType: string,
  customerName: string,
  customer: any,
  expansionData: any,
  workflowState: Record<string, any>
): { subject: string; body: string; recipients: string[] } {
  // Default email structure
  const defaultEmail = {
    subject: `Follow-up: ${customerName} Account Review`,
    body: `Hi team,\n\nI wanted to share a quick update on our recent review of ${customerName}.\n\nKey highlights:\n- Account assessment completed\n- Strategic recommendations generated\n- Next steps identified\n\nPlease review and let me know if you have any questions.\n\nBest regards`,
    recipients: ['account-team@company.com']
  };

  // Check for email override in section data
  if (workflowState.emailContent) {
    return workflowState.emailContent;
  }

  // Generate context-specific emails
  if (emailType === 'renewal-reminder' && customer) {
    const daysToRenewal = Math.ceil((new Date(customer.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return {
      subject: `Action Required: ${customerName} Renewal - ${daysToRenewal} Days`,
      body: `Hi team,\n\n${customerName} renewal is approaching in ${daysToRenewal} days.\n\nCurrent Status:\n- ARR: $${Math.round(customer.arr / 1000)}K\n- Health Score: ${customer.healthScore}%\n- Renewal Date: ${new Date(customer.renewalDate).toLocaleDateString()}\n\nNext Steps:\n- Schedule renewal discussion\n- Review pricing and terms\n- Prepare renewal proposal\n\nLet's connect this week to align on our approach.\n\nBest regards`,
      recipients: ['account-owner@company.com', 'sales-manager@company.com']
    };
  }

  if (emailType === 'expansion-opportunity' && expansionData) {
    return {
      subject: `Expansion Opportunity: ${customerName}`,
      body: `Hi team,\n\nI've identified a significant expansion opportunity with ${customerName}.\n\nKey Indicators:\n- Current utilization: ${Math.round(expansionData.usage.utilizationPercent)}%\n- Market positioning: ${expansionData.market.percentile}th percentile\n- Growth potential: High\n\nProposed Next Steps:\n- Present expansion scenarios\n- Schedule executive review\n- Prepare business case\n\nPlease review the attached analysis and let me know your thoughts.\n\nBest regards`,
      recipients: ['account-owner@company.com', 'sales-director@company.com']
    };
  }

  return defaultEmail;
}

export default function CommunicationsArtifactRenderer({
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
}: CommunicationsArtifactRendererProps) {
  const componentType = section.data?.componentType;
  const sectionType = section.type;
  const props = section.data?.props || {};

  // Handle both componentType and section.type for email artifacts
  if (componentType === 'EmailArtifact' || sectionType === 'email' || sectionType === 'email-draft') {
    // For section.type === 'email', content is in section.content
    const emailContent = section.content || {};
    const emailType = props.emailType || 'default';
    // Note: slide, expansionData, onClose used in switch cases below but not in this early return
    const generatedContent = generateEmailContent(
      emailType,
      customerName,
      customer,
      expansionData,
      workflowState
    );
    // Ensure slide, onClose are referenced to avoid unused warnings (they're used in switch cases)
    void slide; void onClose;

    // Prefer section.content values if provided, fall back to generated/props
    const recipients = emailContent.to
      ? (typeof emailContent.to === 'string' ? [emailContent.to] : emailContent.to)
      : (props.to || generatedContent.recipients);

    return (
      <EmailArtifact
        to={recipients}
        subject={emailContent.subject || props.subject || generatedContent.subject}
        body={emailContent.body || props.body || generatedContent.body}
        customerId={customer?.id}
        enableAIGeneration={true}
        onCompose={() => {
          onUpdateState('emailSent', true);
          onNext();
        }}
        onBack={onBack}
      />
    );
  }

  switch (componentType) {
    case 'EmailArtifact':
      const emailType = props.emailType || 'default';
      const emailContent = generateEmailContent(
        emailType,
        customerName,
        customer,
        expansionData,
        workflowState
      );

      return (
        <EmailArtifact
          to={props.to || emailContent.recipients}
          subject={props.subject || emailContent.subject}
          body={props.body || emailContent.body}
          customerId={customer?.id}
          enableAIGeneration={true}
          onCompose={() => {
            onUpdateState('emailSent', true);
            onNext();
          }}
          onBack={onBack}
        />
      );

    case 'StakeholderProfileArtifact':
      const profiles = transformStakeholderProfiles(
        stakeholders || [],
        customer,
        expansionData
      );

      return (
        <StakeholderProfileArtifact
          customerName={customerName}
          stakeholders={profiles}
          onContinue={onNext}
          onBack={onBack}
        />
      );

    case 'TalkingPointsArtifact':
      // Generate talking points based on assessment and customer context
      const talkingPoints = props.talkingPoints || [
        {
          category: 'Account Health',
          points: [
            `Current health score: ${customer?.healthScore || 'N/A'}%`,
            customer?.healthScore && customer.healthScore < 70
              ? 'Priority: Address engagement gaps'
              : 'Status: Strong relationship momentum'
          ]
        },
        {
          category: 'Business Value',
          points: [
            `Annual recurring revenue: $${Math.round((customer?.arr || 0) / 1000)}K`,
            'Opportunity to demonstrate ROI through case studies'
          ]
        },
        {
          category: 'Next Steps',
          points: [
            'Schedule executive business review',
            'Share strategic recommendations',
            'Align on mutual success plan'
          ]
        }
      ];

      return (
        <TalkingPointsArtifact
          customerName={customerName}
          initialPoints={talkingPoints}
          onContinue={onNext}
          onBack={onBack}
        />
      );

    case 'QuoteArtifact':
      return (
        <QuoteArtifact
          data={{
            quoteNumber: props.quoteNumber || 'Q-2025-001',
            quoteDate: props.quoteDate || new Date().toLocaleDateString(),
            customerName: customerName,
            companyInfo: props.companyInfo || {
              name: 'Renubu',
              tagline: 'AI-Powered Customer Success Platform',
              email: 'quotes@renubu.com'
            },
            lineItems: props.lineItems || [],
            summary: props.summary || {},
            terms: props.terms || []
          }}
          readOnly={props.readOnly !== undefined ? props.readOnly : false}
        />
      );

    default:
      return null;
  }
}
