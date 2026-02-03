'use client';

/**
 * PlanningArtifactRenderer
 *
 * Handles rendering of planning and summary artifacts.
 * Shared logic: Plan generation, accomplishments, next steps.
 *
 * Artifacts handled:
 * - PlanSummaryArtifact
 * - PlanningChecklistArtifact
 */

import React from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import PlanSummaryArtifact from '@/components/artifacts/PlanSummaryArtifact';
import PlanningChecklistArtifact from '@/components/artifacts/PlanningChecklistArtifact';

interface PlanningArtifactRendererProps {
  slide: WorkflowSlide;
  section: any;
  customerName: string;
  customer: any;
  sequenceInfo?: {
    currentIndex: number;
    totalCount: number;
  };
  onNext?: () => void;
  onComplete: () => void;
}

export default function PlanningArtifactRenderer(props: PlanningArtifactRendererProps) {
  const { section, customerName, customer, onNext } = props;
  const type = section.type;
  const componentType = section.data?.componentType;

  // Handle PlanSummaryArtifact (both custom and standard types)
  if (componentType === 'PlanSummaryArtifact' || type === 'plan-summary') {
    // Generate tasks initiated during workflow
    const tasksInitiated = section.data?.tasksInitiated || [
      { id: '1', title: 'Account assessment completed', completed: true, timestamp: 'Just now', assignee: 'You' },
      { id: '2', title: 'Strategic recommendation generated', completed: true, timestamp: 'Just now', assignee: 'AI' },
      { id: '3', title: 'Plan documentation created', completed: true, timestamp: 'Just now', assignee: 'AI' }
    ];

    // Generate workflow-specific accomplishments
    const accomplishments = section.data?.accomplishments || [
      'Completed comprehensive account assessment',
      'Analyzed customer data and relationship status',
      'Identified key risks and opportunities',
      'Generated strategic recommendations'
    ];

    const nextSteps = [];

    // AI-driven tasks (I'll Handle)
    nextSteps.push({
      id: '1',
      title: 'Send strategic plan summary email',
      description: 'Automated email to account owner with plan overview',
      dueDate: 'Tomorrow',
      type: 'ai' as const
    });

    nextSteps.push({
      id: '2',
      title: 'Update CRM with strategic plan',
      description: 'All plan data synced to Salesforce automatically',
      dueDate: 'Today',
      type: 'ai' as const
    });

    nextSteps.push({
      id: '3',
      title: 'Set follow-up reminder',
      description: "I'll send you a reminder to check on progress",
      dueDate: 'In 7 days',
      type: 'ai' as const
    });

    // User tasks (You'll Need To)
    if (customer) {
      const daysToRenewal = Math.ceil((new Date(customer.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToRenewal < 90 && daysToRenewal > 0) {
        nextSteps.push({
          id: '4',
          title: 'Schedule renewal discussion',
          description: `Renewal approaching in ${daysToRenewal} days - schedule call with stakeholders`,
          dueDate: `Within ${daysToRenewal} days`,
          type: 'user' as const
        });
      }
    }

    nextSteps.push({
      id: '5',
      title: 'Review strategic plan with team',
      description: 'Share findings and align on execution approach',
      dueDate: 'This week',
      type: 'user' as const
    });

    // Allow config override
    const finalNextSteps = section.data?.nextSteps || nextSteps;

    // Calculate follow-up date (7 days from now)
    const followUpDate = section.data?.followUpDate ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

    return (
      <PlanSummaryArtifact
        customerName={customerName}
        tasksInitiated={tasksInitiated}
        accomplishments={accomplishments}
        nextSteps={finalNextSteps}
        followUpDate={followUpDate}
        salesforceUpdated={section.data?.salesforceUpdated !== false}
        trackingEnabled={section.data?.trackingEnabled !== false}
        // Navigation now handled by chat button
        // onNextCustomer={onComplete}
        // nextButtonLabel={
        //   sequenceInfo && sequenceInfo.currentIndex < sequenceInfo.totalCount - 1
        //     ? 'Next Workflow'
        //     : 'Complete'
        // }
      />
    );
  }

  // Handle PlanningChecklistArtifact
  if (componentType === 'PlanningChecklistArtifact' || type === 'planning-checklist') {
    return (
      <PlanningChecklistArtifact
        title={section.data?.props?.title || section.title?.replace(/\{\{customerName\}\}/g, customerName) || "Let's review what we need to accomplish:"}
        items={section.data?.props?.items || section.data?.items || []}
        showActions={section.data?.props?.showActions ?? section.data?.showActions ?? true}
        onContinue={onNext}
      />
    );
  }

  return null;
}
