'use client';

/**
 * AssessmentArtifactRenderer
 *
 * Handles rendering of assessment and recommendation artifacts.
 * Shared logic: Reason generation from workflowState and customer context data.
 *
 * Artifacts handled:
 * - AssessmentArtifact
 * - RecommendationSlide
 * - StrategicRecommendationWithPlan
 */

import React from 'react';
import { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { AssessmentArtifact, accountAssessmentQuestions, growthAssessmentQuestions, executiveEngagementQuestions } from '@/components/artifacts/assessment';
import RecommendationSlide from '@/components/artifacts/RecommendationSlide';
import StrategicRecommendationWithPlan from '@/components/artifacts/StrategicRecommendationWithPlan';
import AssessmentSummaryArtifact from '@/components/artifacts/AssessmentSummaryArtifact';

interface AssessmentArtifactRendererProps {
  slide: WorkflowSlide;
  section: any;
  customerName: string;
  workflowState: Record<string, any>;
  customer: any;
  expansionData: any;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
  onUpdateState: (key: string, value: any) => void;
}

/**
 * Generate recommendation reasons from assessment answers and customer context
 */
function generateReasons(
  workflowState: Record<string, any>,
  customer: any,
  expansionData: any
): Array<{ icon: string; text: string; highlight: boolean }> {
  const assessmentAnswers = Object.keys(workflowState)
    .filter(key => key.includes('_answers'))
    .map(key => workflowState[key])
    .find(v => v);

  const reasons = [];

  // Add assessment-based reasons
  if (assessmentAnswers) {
    const oppScore = assessmentAnswers['opportunity-score']?.score;
    const riskScore = assessmentAnswers['risk-score']?.score;

    if (oppScore && oppScore >= 7) {
      reasons.push({
        icon: 'trending',
        text: `High growth opportunity detected (score: ${oppScore}/10)`,
        highlight: true
      });
    }

    if (riskScore && riskScore >= 7) {
      reasons.push({
        icon: 'alert',
        text: `Elevated risk level identified (score: ${riskScore}/10)`,
        highlight: true
      });
    }
  }

  // Add customer context reasons
  if (customer) {
    if (customer.healthScore < 60) {
      reasons.push({
        icon: 'alert',
        text: `Account health needs attention (${customer.healthScore}% health score)`,
        highlight: false
      });
    }

    if (customer.arr > 150000) {
      reasons.push({
        icon: 'target',
        text: `Strategic account value: $${Math.round(customer.arr / 1000)}K ARR`,
        highlight: false
      });
    }

    const daysToRenewal = Math.ceil((new Date(customer.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysToRenewal < 90 && daysToRenewal > 0) {
      reasons.push({
        icon: 'alert',
        text: `Renewal approaching in ${daysToRenewal} days`,
        highlight: false
      });
    }
  }

  // Add expansion data reasons
  if (expansionData) {
    if (expansionData.usage.utilizationPercent > 100) {
      reasons.push({
        icon: 'trending',
        text: `Over capacity at ${Math.round(expansionData.usage.utilizationPercent)}% utilization`,
        highlight: false
      });
    }

    if (expansionData.market.percentile < 40) {
      reasons.push({
        icon: 'check',
        text: `Strong pricing opportunity (below market average)`,
        highlight: false
      });
    }
  }

  // Default reasons if none generated
  if (reasons.length === 0) {
    reasons.push(
      { icon: 'check', text: 'Account assessment completed', highlight: false },
      { icon: 'target', text: 'Strategic planning recommended', highlight: false }
    );
  }

  return reasons;
}

export default function AssessmentArtifactRenderer({
  slide,
  section,
  customerName,
  workflowState,
  customer,
  expansionData,
  onNext,
  onBack,
  onClose,
  onUpdateState
}: AssessmentArtifactRendererProps) {
  const componentType = section.data?.componentType;
  const props = section.data?.props || {};

  switch (componentType) {
    case 'AssessmentArtifact':
      return (
        <AssessmentArtifact
          title={props.title || section.title}
          subtitle={props.subtitle || ''}
          customerName={customerName}
          questionBlocks={
            props.questionBlocks === 'accountAssessmentQuestions' ? accountAssessmentQuestions :
            props.questionBlocks === 'growthAssessmentQuestions' ? growthAssessmentQuestions :
            props.questionBlocks === 'executiveEngagementQuestions' ? executiveEngagementQuestions :
            []
          }
          onSubmit={(answers) => {
            onUpdateState(`${slide.id}_answers`, answers);
            onNext();
          }}
          onBack={onBack}
        />
      );

    case 'RecommendationSlide':
      const reasons = generateReasons(workflowState, customer, expansionData);
      return (
        <RecommendationSlide
          recommendationType={section.title}
          reasons={reasons}
          confidenceScore={workflowState.confidenceScore || 85}
          // Navigation now handled by chat buttons
          // onProceed={onNext}
          // onGoBack={onBack}
        />
      );

    case 'StrategicRecommendationWithPlan':
      const strategyType: 'expand' | 'invest' | 'protect' = workflowState.strategyType || 'expand';
      const recReasons = generateReasons(workflowState, customer, expansionData);
      const workflowSteps = section.data?.props?.workflowSteps || section.data?.workflowSteps || [];

      return (
        <StrategicRecommendationWithPlan
          customerName={customerName}
          strategyType={strategyType}
          renewalDate={customer?.renewalDate}
          currentARR={customer ? `$${Math.round(customer.arr / 1000)}K` : undefined}
          healthScore={customer?.healthScore}
          growthPotential={75}
          riskLevel={30}
          reasons={recReasons}
          workflowSteps={workflowSteps}
          // Navigation now handled by chat buttons
          // onModify={onBack}
          // onAgree={onNext}
          // onComeBack={onClose}
        />
      );

    case 'AssessmentSummaryArtifact':
      // Extract assessment data from workflowState
      console.log('[AssessmentSummaryArtifact] Full workflowState:', workflowState);

      const assessmentData = {
        opportunityScore: workflowState['assessment.opportunityScore'],
        opportunityReason: workflowState['assessment.opportunityReason'],
        riskScore: workflowState['assessment.riskScore'],
        riskReason: workflowState['assessment.riskReason'],
        yearOverview: workflowState['assessment.yearOverview']
      };

      console.log('[AssessmentSummaryArtifact] Extracted assessmentData:', assessmentData);

      return (
        <AssessmentSummaryArtifact
          customerName={customerName}
          assessmentData={assessmentData}
        />
      );

    default:
      return null;
  }
}
