/**
 * Account Review LLM Slide (v0.1.12)
 *
 * Purpose: LLM-driven account review with 5 phases:
 *   1. Usage - Brand performance with LLM analysis
 *   2. Contract - Contract terms with LLM insights
 *   3. Contacts - Stakeholder review with LLM recommendations
 *   4. Expansion - Opportunities with LLM analysis
 *   5. Risk - Risk assessment with LLM evaluation
 *
 * Key differences from accountReviewTabbedSlide:
 * - LLM generates analysis for each phase (not static data)
 * - Each phase must be approved before moving to next
 * - Context accumulates across phases
 * - After all 5 approved, triggers strategy synthesis
 *
 * Uses TabbedContainerArtifact with approval workflow enabled.
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const accountReviewLLMSlide: UniversalSlideBuilder = (context): any => {
  // Extract phase state from workflow context if resuming
  const phaseApprovals = context?.variables?.phaseApprovals || [];
  const currentPhase = context?.variables?.currentPhase || 'usage';
  const allPhasesApproved = context?.variables?.allPhasesApproved || false;

  return {
    id: 'account-review-llm',
    version: '1.12',
    name: 'Account Review (LLM)',
    category: 'inhersight',
    checklistTitle: 'Review and approve each phase of the account analysis',

    structure: {
      id: 'account-review-llm',
      title: 'Account Review',
      description: 'LLM-driven account review with phase-based approval workflow',
      label: 'Account Review',
      stepMapping: 'account-review-llm',
      showSideMenu: true,

      // Custom slide handlers for LLM workflow
      handlers: {
        onEnter: 'accountReview:initializePhases',
        onTabChange: 'accountReview:generatePhaseAnalysis',
        onApprove: 'accountReview:approvePhase',
        onAllApproved: 'accountReview:triggerSynthesis',
      },

      chat: {
        generateInitialMessage: true,
        llmPrompt: `You are helping a customer success manager review {{customer.name}}'s account.

This is an LLM-driven account review where each phase is analyzed and approved:
1. Usage & Adoption
2. Contract Terms
3. Key Contacts
4. Expansion Opportunities
5. Risk Assessment

Guide the CSM through each phase. When they switch tabs, analyze that aspect using the customer INTEL. After all phases are approved, you'll synthesize everything into an engagement strategy.

Start by introducing the review process and asking them to begin with the Usage tab.`,

        initialMessage: {
          text: context?.variables?.message ||
            `I'm ready to help you review {{customer.name}}'s account. We'll work through 5 phases together - Usage, Contract, Contacts, Expansion, and Risk.

For each phase, I'll analyze the customer data and share insights. You can ask questions, add notes, and approve when ready.

Let's start with **Usage & Adoption**. Click the Usage tab to begin.`,
          buttons: [
            {
              label: 'Start with Usage',
              value: 'start-usage',
              'label-background': 'bg-blue-600',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'start-usage': 'analyze-usage',
          },
        },

        branches: {
          // Phase analysis branches (triggered by tab selection)
          'analyze-usage': {
            response: `Let me analyze {{customer.name}}'s usage patterns...

[LLM will generate usage analysis based on INTEL context]

Review the data in the Usage tab. When you're satisfied, add any notes and click **Approve & Continue** to move to Contract review.`,
            llmPromptKey: 'account-review-usage',
            generateLLMResponse: true,
          },
          'analyze-contract': {
            response: `Now reviewing contract terms for {{customer.name}}...

[LLM will generate contract analysis with usage context]

The Contract tab shows the current terms. Review and approve when ready.`,
            llmPromptKey: 'account-review-contract',
            generateLLMResponse: true,
          },
          'analyze-contacts': {
            response: `Analyzing key stakeholders at {{customer.name}}...

[LLM will generate contact analysis with prior phase context]

Review the stakeholder landscape and approve when ready.`,
            llmPromptKey: 'account-review-contacts',
            generateLLMResponse: true,
          },
          'analyze-expansion': {
            response: `Identifying expansion opportunities for {{customer.name}}...

[LLM will generate expansion analysis with full context]

Review the opportunities and approve when ready.`,
            llmPromptKey: 'account-review-expansion',
            generateLLMResponse: true,
          },
          'analyze-risk': {
            response: `Assessing risk factors for {{customer.name}}...

[LLM will generate risk analysis incorporating all prior phases]

This is the final review phase. Approve to generate your engagement strategy.`,
            llmPromptKey: 'account-review-risk',
            generateLLMResponse: true,
          },

          // Approval confirmations
          'phase-approved': {
            response: `Phase approved! Moving to the next section...`,
            actions: ['advanceToNextPhase'],
          },

          // All phases approved - trigger synthesis
          'all-approved': {
            response: `All 5 phases reviewed and approved! Now generating your engagement strategy...

This will include:
- Strategy summary
- Meeting deck
- Renewal email draft
- Meeting agenda

Transitioning to strategy synthesis...`,
            actions: ['nextSlide'],
          },
        },

        defaultMessage: 'Feel free to ask questions about any section. When ready, approve each phase to continue.',

        userTriggers: {
          'next phase': 'The CSM wants to move to the next phase.',
          'skip': 'CSM wants to skip current analysis.',
          'more detail': 'CSM wants more details on current analysis.',
        },
      },

      artifacts: {
        sections: [
          {
            id: 'tabbed-account-review-llm',
            type: 'component:interactive',
            title: 'Account Review',
            visible: true,
            data: {
              componentType: 'TabbedContainerArtifact',
              props: {
                title: 'Account Review',
                customerName: '{{customer.name}}',
                showNavigation: false,
                // v0.1.12: Enable approval workflow
                showApprovalWorkflow: true,
                phaseApprovals: phaseApprovals,
                defaultTab: currentPhase,
                tabs: [
                  {
                    id: 'usage',
                    label: 'Usage',
                    icon: 'chart-bar',
                    artifact: 'BrandPerformanceArtifact',
                    status: getPhaseStatusFromApprovals(phaseApprovals, 'usage', currentPhase),
                    props: {
                      customerName: '{{customer.name}}',
                      title: 'Usage & Adoption',
                      reportingPeriod: context?.variables?.reportingPeriod || 'Last 90 Days',
                      healthScore: context?.variables?.healthScore,
                      metrics: context?.variables?.usageMetrics || {},
                      // LLM analysis will be injected
                      llmAnalysis: getPhaseAnalysis(phaseApprovals, 'usage'),
                      showApprovalFooter: true,
                    },
                  },
                  {
                    id: 'contract',
                    label: 'Contract',
                    icon: 'document-text',
                    artifact: 'ContractArtifact',
                    status: getPhaseStatusFromApprovals(phaseApprovals, 'contract', currentPhase),
                    props: {
                      customerName: '{{customer.name}}',
                      contractData: context?.variables?.contractData || {},
                      llmAnalysis: getPhaseAnalysis(phaseApprovals, 'contract'),
                      showApprovalFooter: true,
                    },
                  },
                  {
                    id: 'contacts',
                    label: 'Contacts',
                    icon: 'users',
                    artifact: 'ContactStrategyArtifact',
                    status: getPhaseStatusFromApprovals(phaseApprovals, 'contacts', currentPhase),
                    props: {
                      title: 'Key Contacts',
                      subtitle: 'Stakeholders for {{customer.name}}',
                      showActions: false,
                      contacts: context?.variables?.contacts || [],
                      llmAnalysis: getPhaseAnalysis(phaseApprovals, 'contacts'),
                      showApprovalFooter: true,
                    },
                  },
                  {
                    id: 'expansion',
                    label: 'Expansion',
                    icon: 'trending-up',
                    artifact: 'ExpansionOverviewArtifact',
                    status: getPhaseStatusFromApprovals(phaseApprovals, 'expansion', currentPhase),
                    props: {
                      customerName: '{{customer.name}}',
                      contractInfo: context?.variables?.contractInfo || {},
                      usageInfo: context?.variables?.usageInfo || {},
                      marketInfo: context?.variables?.marketInfo || {},
                      llmAnalysis: getPhaseAnalysis(phaseApprovals, 'expansion'),
                      showApprovalFooter: true,
                    },
                  },
                  {
                    id: 'risk',
                    label: 'Risk',
                    icon: 'exclamation-triangle',
                    artifact: 'PlanSummaryArtifact',
                    status: getPhaseStatusFromApprovals(phaseApprovals, 'risk', currentPhase),
                    props: {
                      title: 'Risk Assessment',
                      customerName: '{{customer.name}}',
                      sections: [
                        {
                          title: 'Risk Factors',
                          items: context?.variables?.riskFactors || [],
                        },
                      ],
                      llmAnalysis: getPhaseAnalysis(phaseApprovals, 'risk'),
                      showApprovalFooter: true,
                      isFinalPhase: true,
                    },
                  },
                ],
              },
            },
          },
        ],
      },

      sidePanel: {
        enabled: true,
        title: {
          text: 'Review Progress',
          subtitle: 'Approve each phase to continue',
          icon: 'checklist',
        },
        steps: [
          { label: 'Usage & Adoption', status: getPhaseStatusFromApprovals(phaseApprovals, 'usage', currentPhase) },
          { label: 'Contract Terms', status: getPhaseStatusFromApprovals(phaseApprovals, 'contract', currentPhase) },
          { label: 'Key Contacts', status: getPhaseStatusFromApprovals(phaseApprovals, 'contacts', currentPhase) },
          { label: 'Expansion', status: getPhaseStatusFromApprovals(phaseApprovals, 'expansion', currentPhase) },
          { label: 'Risk Assessment', status: getPhaseStatusFromApprovals(phaseApprovals, 'risk', currentPhase) },
        ],
        progressMeter: {
          currentStep: getApprovedCount(phaseApprovals),
          totalSteps: 5,
          progressPercentage: Math.round((getApprovedCount(phaseApprovals) / 5) * 100),
          showPercentage: true,
          showStepNumbers: true,
        },
        showProgressMeter: true,
        showSteps: true,
      },

      // State to persist for snooze/resume
      persistState: {
        keys: ['phaseApprovals', 'currentPhase', 'allPhasesApproved'],
      },

      onComplete: {
        nextSlide: allPhasesApproved ? 'strategy-synthesis' : undefined,
        updateProgress: true,
      },
    },
  };
};

// Helper functions for phase state management

function getPhaseStatusFromApprovals(
  approvals: any[],
  phaseId: string,
  currentPhase: string
): 'pending' | 'current' | 'approved' {
  const approval = approvals?.find((a: any) => a.phaseId === phaseId);
  if (approval?.status === 'approved') return 'approved';
  if (phaseId === currentPhase) return 'current';
  return 'pending';
}

function getPhaseAnalysis(approvals: any[], phaseId: string): string | undefined {
  const approval = approvals?.find((a: any) => a.phaseId === phaseId);
  return approval?.llmAnalysis;
}

function getApprovedCount(approvals: any[]): number {
  if (!approvals) return 0;
  return approvals.filter((a: any) => a.status === 'approved').length;
}

export default accountReviewLLMSlide;
