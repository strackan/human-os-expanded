/**
 * Account Review Conversation Slide (v0.1.12)
 *
 * Conversational account review with Strategic Account Plan creation.
 *
 * Two modes:
 * - Annual Deep Dive: No active plan exists → explicit approval per phase,
 *   create Strategic Account Plan with activities
 * - Quick Confirm: Active plan exists → auto-advance enabled,
 *   show changes since last review, confirm strategy still valid
 *
 * Key features:
 * - LLM assessment per category
 * - CSM can agree or add context (captured as Intel)
 * - Quadrant calculation and strategy selection
 * - Activity planning for the year
 * - Certification sign-off creates database record
 */

import type { UniversalSlideBuilder } from '../baseSlide';
import {
  type AccountStrategy,
  type StrategicQuadrant,
  type AccountReviewConversationState,
  STRATEGY_LABELS,
  QUADRANT_TO_STRATEGY,
} from '../../accountReview/conversationTypes';

export const accountReviewConversationSlide: UniversalSlideBuilder = (context): any => {
  // Extract state from context
  const state: Partial<AccountReviewConversationState> = context?.variables?.conversationState || {};
  const mode = state.conversationMode || 'deep-dive';
  const isQuickReview = mode === 'quick-review';
  const currentPhase = state.currentPhase || 'usage';
  const phaseIntel = state.phaseIntel || {};
  const accountPlan = state.accountPlan;
  const certification = state.certification || { status: 'pending' };

  // Calculate phase status
  const phases = ['usage', 'contract', 'contacts', 'expansion', 'risk'];
  const completedPhases = phases.filter(p => phaseIntel[p]?.agreement);
  const allPhasesComplete = completedPhases.length === phases.length;
  const isStrategyPhase = allPhasesComplete && certification.status === 'pending';
  const isCertified = certification.status === 'certified';

  return {
    id: 'account-review-conversation',
    version: '1.12',
    name: 'Account Review Conversation',
    category: 'inhersight',
    checklistTitle: isQuickReview
      ? 'Quick account check-in'
      : 'Annual Strategic Account Review',

    structure: {
      id: 'account-review-conversation',
      title: isQuickReview ? 'Account Check-in' : 'Strategic Account Review',
      description: isQuickReview
        ? 'Quick review of changes since last check-in'
        : 'Comprehensive account review with strategy lock-in',
      label: 'Account Review',
      stepMapping: 'account-review-conversation',
      showSideMenu: true,

      // Custom handlers
      handlers: {
        onEnter: 'accountReviewConversation:initialize',
        onPhaseAgree: 'accountReviewConversation:captureIntel',
        onStrategySelect: 'accountReviewConversation:setStrategy',
        onActivityUpdate: 'accountReviewConversation:updateActivities',
        onCertify: 'accountReviewConversation:certifyPlan',
        onAutoAdvance: 'accountReviewConversation:autoAdvance',
      },

      chat: {
        generateInitialMessage: true,
        llmPrompt: buildSystemPrompt(mode, currentPhase, accountPlan),

        initialMessage: {
          text: buildInitialMessage(mode, context?.variables?.customerName, accountPlan),
          buttons: isQuickReview
            ? [
                { label: 'Review Changes', value: 'start-review', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
                { label: 'Skip to Strategy', value: 'skip-to-strategy', 'label-background': 'bg-gray-200' },
              ]
            : [
                { label: 'Begin Deep Dive', value: 'start-review', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
              ],
          nextBranches: {
            'start-review': 'analyze-usage',
            'skip-to-strategy': 'strategy-selection',
          },
        },

        branches: {
          // Phase analysis branches
          'analyze-usage': {
            response: `Let me analyze {{customer.name}}'s usage and adoption patterns...`,
            llmPromptKey: 'account-review-usage',
            generateLLMResponse: true,
            afterResponse: isQuickReview ? 'auto-advance-prompt' : 'await-agreement',
          },
          'analyze-contract': {
            response: `Now reviewing the contract and commercial terms...`,
            llmPromptKey: 'account-review-contract',
            generateLLMResponse: true,
            afterResponse: isQuickReview ? 'auto-advance-prompt' : 'await-agreement',
          },
          'analyze-contacts': {
            response: `Examining key stakeholders and relationships...`,
            llmPromptKey: 'account-review-contacts',
            generateLLMResponse: true,
            afterResponse: isQuickReview ? 'auto-advance-prompt' : 'await-agreement',
          },
          'analyze-expansion': {
            response: `Analyzing expansion and growth opportunities...`,
            llmPromptKey: 'account-review-expansion',
            generateLLMResponse: true,
            afterResponse: isQuickReview ? 'auto-advance-prompt' : 'await-agreement',
          },
          'analyze-risk': {
            response: `Evaluating risk factors and mitigation opportunities...`,
            llmPromptKey: 'account-review-risk',
            generateLLMResponse: true,
            afterResponse: isQuickReview ? 'auto-advance-prompt' : 'await-agreement',
          },

          // Agreement responses
          'await-agreement': {
            response: `Does this assessment match what you're seeing? You can:
- **Agree** if this looks right
- **Add context** if you have additional insights to capture`,
            buttons: [
              { label: 'Looks Right', value: 'agree', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
              { label: 'I Have Context', value: 'add-context', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
            ],
          },

          // Quick review auto-advance
          'auto-advance-prompt': {
            response: `I'll continue in a moment unless you want to add something...`,
            autoAdvance: true,
            autoAdvanceSeconds: 8,
            buttons: [
              { label: 'Wait, let me add', value: 'add-context', 'label-background': 'bg-orange-500', 'label-text': 'text-white' },
              { label: 'Continue', value: 'continue', 'label-background': 'bg-gray-200' },
            ],
          },

          // Strategy selection (after all phases)
          'strategy-selection': {
            response: buildStrategySelectionMessage(
              state.calculatedQuadrant,
              state.currentRiskScore,
              state.currentOpportunityScore
            ),
            buttons: buildStrategyButtons(state.calculatedQuadrant),
          },

          // Activity planning
          'activity-planning': {
            response: `Now let's plan the key activities for this year. Based on your **${accountPlan?.strategy?.toUpperCase()}** strategy, I've suggested some activities.

Review the activities in the panel. You can:
- Adjust target dates or quarters
- Add custom activities
- Remove activities that don't apply

When you're satisfied, we'll certify the plan.`,
            buttons: [
              { label: 'Activities Look Good', value: 'ready-to-certify', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
              { label: 'Add Activity', value: 'add-activity', 'label-background': 'bg-blue-600', 'label-text': 'text-white' },
            ],
          },

          // Certification
          'ready-to-certify': {
            response: `You're about to certify the Strategic Account Plan for {{customer.name}}:

**Strategy:** ${STRATEGY_LABELS[accountPlan?.strategy as AccountStrategy]?.label || 'Not set'}
**Activities:** ${accountPlan?.activities?.length || 0} planned
**Period:** ${accountPlan?.planYear}

This will:
- Lock in the strategy for the year
- Schedule the planned activities
- Create the official Account Plan record

Ready to certify?`,
            buttons: [
              { label: 'Certify Plan', value: 'certify', 'label-background': 'bg-green-600', 'label-text': 'text-white' },
              { label: 'Make Changes', value: 'back-to-activities', 'label-background': 'bg-gray-200' },
            ],
          },

          // Certified confirmation
          'certified': {
            response: `Strategic Account Plan certified for {{customer.name}}!

The plan is now active and activities will drive your workflow queue throughout the year.

You can view and manage the plan from the customer page.`,
            actions: ['savePlan', 'nextSlide'],
          },
        },

        defaultMessage: 'Feel free to ask questions about any section or share additional context.',

        userTriggers: {
          'add note': 'CSM wants to add a note to this section.',
          'more detail': 'CSM wants more details on current analysis.',
          'skip': 'CSM wants to skip current section.',
          'change strategy': 'CSM wants to change the selected strategy.',
        },
      },

      artifacts: {
        sections: [
          // Main review panel
          {
            id: 'conversation-review-panel',
            type: 'component:interactive',
            title: 'Account Review',
            visible: true,
            data: {
              componentType: 'ConversationReviewArtifact',
              props: {
                customerName: '{{customer.name}}',
                mode,
                currentPhase: isStrategyPhase ? 'strategy' : currentPhase,
                phaseIntel,
                accountPlan,
                certification,
                scores: {
                  risk: state.currentRiskScore,
                  opportunity: state.currentOpportunityScore,
                  quadrant: state.calculatedQuadrant,
                },
                onPhaseAgree: 'captureIntel',
                onStrategyChange: 'setStrategy',
                onActivityUpdate: 'updateActivities',
                onCertify: 'certifyPlan',
              },
            },
          },
        ],
      },

      sidePanel: {
        enabled: true,
        title: {
          text: isQuickReview ? 'Check-in Progress' : 'Review Progress',
          subtitle: isQuickReview
            ? 'Confirming account status'
            : 'Complete all phases to set strategy',
          icon: isQuickReview ? 'refresh' : 'clipboard-check',
        },
        steps: [
          ...phases.map(phase => ({
            label: getPhaseLabel(phase),
            status: getPhaseStatus(phase, phaseIntel, currentPhase),
          })),
          ...(isStrategyPhase || isCertified
            ? [
                { label: 'Strategy Selection', status: accountPlan?.strategy ? 'approved' : 'current' },
                { label: 'Certification', status: certification.status === 'certified' ? 'approved' : 'pending' },
              ]
            : []),
        ],
        progressMeter: {
          currentStep: completedPhases.length + (isStrategyPhase ? 1 : 0) + (isCertified ? 1 : 0),
          totalSteps: phases.length + 2, // +2 for strategy and certification
          progressPercentage: Math.round(
            ((completedPhases.length + (isStrategyPhase ? 1 : 0) + (isCertified ? 1 : 0)) /
              (phases.length + 2)) *
              100
          ),
          showPercentage: true,
          showStepNumbers: true,
        },
        showProgressMeter: true,
        showSteps: true,
      },

      // Persist state for snooze/resume
      persistState: {
        keys: ['conversationState'],
      },

      onComplete: {
        nextSlide: isCertified ? 'review-complete' : undefined,
        updateProgress: true,
      },
    },
  };
};

// =============================================================================
// Helper Functions
// =============================================================================

function buildSystemPrompt(
  mode: string,
  currentPhase: string,
  accountPlan: any
): string {
  const modeContext = mode === 'quick-review'
    ? `This is a QUICK CHECK-IN. The customer has an active Strategic Account Plan. Focus on what's changed since the last review. Keep analysis brief and highlight deltas.`
    : `This is an ANNUAL DEEP DIVE. The customer needs a new Strategic Account Plan. Provide thorough analysis for each section. The CSM must agree to each section before proceeding.`;

  return `You are guiding a Customer Success Manager through an account review for {{customer.name}}.

${modeContext}

Current phase: ${currentPhase}
${accountPlan?.strategy ? `Current strategy: ${accountPlan.strategy}` : ''}

For each phase:
1. Analyze the customer data and INTEL
2. Provide 2-3 key observations
3. Highlight risks or opportunities
4. Ask the CSM if this matches their understanding

Be concise but insightful. The CSM has the full context - help them validate and add to it.`;
}

function buildInitialMessage(mode: string, customerName: string, accountPlan: any): string {
  if (mode === 'quick-review') {
    return `Time for a quick check-in on **${customerName || '{{customer.name}}'}**.

Your current strategy is **${STRATEGY_LABELS[accountPlan?.strategy as AccountStrategy]?.label || 'Unknown'}**.
Activity progress: ${accountPlan?.activities?.filter((a: any) => a.status === 'completed').length || 0}/${accountPlan?.activities?.length || 0} complete

I'll run through each area quickly. If everything still looks good, we can wrap up in a few minutes. Or dive deeper if something's changed.`;
  }

  return `Let's establish your Strategic Account Plan for **${customerName || '{{customer.name}}'}**.

We'll work through 5 areas together:
1. **Usage & Adoption** - How they're using the platform
2. **Contract** - Commercial terms and timeline
3. **Contacts** - Key stakeholders
4. **Expansion** - Growth opportunities
5. **Risk** - What to watch for

For each section, I'll share my analysis and you'll confirm or add context. Then we'll set your strategy and plan activities for the year.

Ready to begin?`;
}

function buildStrategySelectionMessage(
  quadrant: StrategicQuadrant | undefined,
  riskScore: number | undefined,
  oppScore: number | undefined
): string {
  const suggestedStrategy = quadrant ? QUADRANT_TO_STRATEGY[quadrant] : 'maintain';
  const strategyInfo = STRATEGY_LABELS[suggestedStrategy];

  return `Based on the review:
- **Risk Score:** ${riskScore ?? 'N/A'}/100
- **Opportunity Score:** ${oppScore ?? 'N/A'}/100
- **Calculated Quadrant:** ${quadrant?.toUpperCase() || 'Unknown'}

My recommendation: **${strategyInfo.label}**
${strategyInfo.description}

You can choose a different strategy if your judgment differs. If so, please share why - this helps calibrate future recommendations.`;
}

function buildStrategyButtons(quadrant: StrategicQuadrant | undefined): any[] {
  const strategies: AccountStrategy[] = ['invest', 'expand', 'save', 'monitor', 'maintain'];
  const suggested = quadrant ? QUADRANT_TO_STRATEGY[quadrant] : 'maintain';

  return strategies.map(s => ({
    label: `${STRATEGY_LABELS[s].label}${s === suggested ? ' (Recommended)' : ''}`,
    value: `strategy-${s}`,
    'label-background': s === suggested ? 'bg-green-600' : 'bg-gray-200',
    'label-text': s === suggested ? 'text-white' : 'text-gray-800',
  }));
}

function getPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    usage: 'Usage & Adoption',
    contract: 'Contract Terms',
    contacts: 'Key Contacts',
    expansion: 'Expansion',
    risk: 'Risk Assessment',
  };
  return labels[phase] || phase;
}

function getPhaseStatus(
  phase: string,
  phaseIntel: Record<string, any>,
  currentPhase: string
): 'pending' | 'current' | 'approved' {
  if (phaseIntel[phase]?.agreement) return 'approved';
  if (phase === currentPhase) return 'current';
  return 'pending';
}

export default accountReviewConversationSlide;
