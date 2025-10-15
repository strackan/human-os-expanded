'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, ChevronDown, ChevronUp, Mic, Paperclip, Edit3 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import PlanningChecklistArtifact from '@/components/artifacts/PlanningChecklistArtifact';
import { AssessmentArtifact, accountAssessmentQuestions, growthAssessmentQuestions, executiveEngagementQuestions } from '@/components/artifacts/assessment';
import AccountOverviewArtifact from '@/components/artifacts/AccountOverviewArtifact';
import DiscoveryFormArtifact from '@/components/artifacts/DiscoveryFormArtifact';
import RecommendationSlide from '@/components/artifacts/RecommendationSlide';
import PlanSummaryArtifact from '@/components/artifacts/PlanSummaryArtifact';
import StrategicAccountPlanArtifact from '@/components/artifacts/StrategicAccountPlanArtifact';
import ExpansionOverviewArtifact from '@/components/artifacts/ExpansionOverviewArtifact';
import ExpansionProposalArtifact from '@/components/artifacts/ExpansionProposalArtifact';
import StakeholderProfileArtifact from '@/components/artifacts/StakeholderProfileArtifact';
import TalkingPointsArtifact from '@/components/artifacts/TalkingPointsArtifact';
import EmailArtifact from '@/components/artifacts/EmailArtifact';
import { CustomerMetrics } from './CustomerMetrics';
import WorkflowSequencePanel from './WorkflowSequencePanel';
import { getWorkflowSequence } from '@/config/workflowSequences';

interface TaskModeFullscreenProps {
  workflowId: string;
  workflowTitle: string;
  customerId: string;
  customerName: string;
  onClose: () => void;
  sequenceInfo?: {
    sequenceId: string;
    currentIndex: number;
    totalCount: number;
    onNextWorkflow: () => void;
    onJumpToWorkflow?: (index: number) => void;
  };
}

export default function TaskModeFullscreen({
  workflowId,
  workflowTitle,
  customerId,
  customerName,
  onClose,
  sequenceInfo
}: TaskModeFullscreenProps) {
  const { showToast } = useToast();

  // Detect workflow type based on workflowId
  const isExpansionWorkflow = workflowId.includes('expansion') || workflowId.includes('opportunity');
  const isExecutiveEngagementWorkflow = workflowId.includes('executive') || workflowId.includes('engagement');

  // Chat workflow state
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; sender: 'user' | 'ai'; timestamp: Date }>>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState<any>(null); // Will hold the workflow config if using dynamic chat

  // Strategic Planning Workflow State
  const [currentStep, setCurrentStep] = useState<'greeting' | 'assessment' | 'overview' | 'recommendation' | 'strategic-plan' | 'action-plan'>('greeting');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set(['greeting'])); // Track all visited/completed steps
  const [pendingAction, setPendingAction] = useState<'skip' | 'snooze' | null>(null); // Track temporary exit action
  const [showConfirmDialog, setShowConfirmDialog] = useState<'skip' | 'snooze' | null>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<{
    opportunityScore: number;
    opportunityReason: string;
    riskScore: number;
    riskReason: string;
    yearOverview: string;
  } | null>(null);
  const [strategyType, setStrategyType] = useState<'expand' | 'invest' | 'protect'>('expand');

  // Expansion Workflow State
  const [expansionStep, setExpansionStep] = useState<'greeting' | 'growth-assessment' | 'expansion-overview' | 'expansion-recommendation' | 'expansion-proposal' | 'compose-email' | 'expansion-actions'>('greeting');
  const [expansionCompletedSteps, setExpansionCompletedSteps] = useState<Set<string>>(new Set(['greeting']));
  const [growthAssessment, setGrowthAssessment] = useState<{
    usageTrajectory: number;
    usageReason: string;
    priceSensitivity: 'low' | 'medium' | 'high';
    sensitivityReason: string;
    competitiveRisk: 'low' | 'medium' | 'high';
    competitiveReason: string;
  } | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [emailComposed, setEmailComposed] = useState(false);

  // Executive Engagement Workflow State
  const [engagementStep, setEngagementStep] = useState<'greeting' | 'strategy' | 'stakeholders' | 'draft-email' | 'talking-points' | 'send-schedule' | 'engagement-actions'>('greeting');
  const [engagementCompletedSteps, setEngagementCompletedSteps] = useState<Set<string>>(new Set(['greeting']));
  const [engagementStrategy, setEngagementStrategy] = useState<{
    primaryObjective: 'rebuild-trust' | 'acknowledge-issue' | 'set-expectations';
    tone: number;
    urgency: 'immediate' | 'this-week' | 'flexible';
    keyMessage: string;
  } | null>(null);
  const [draftEmailReady, setDraftEmailReady] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Common UI State
  const [greetingText, setGreetingText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true); // Start with artifacts visible
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);

  // Workflow Sequence Panel State
  const [showSequencePanel, setShowSequencePanel] = useState(false);
  const [completedWorkflows, setCompletedWorkflows] = useState<Set<number>>(new Set());

  // Cache the plan summary data once generated
  const [planSummaryCache, setPlanSummaryCache] = useState<{
    tasksInitiated: any[];
    accomplishments: string[];
    nextSteps: any[];
  } | null>(null);

  // Demo data for TechFlow Industries (expansion workflow)
  const techFlowData = {
    contract: {
      licenseCount: 100,
      pricePerSeat: 6.50,
      annualSpend: 78000,
      renewalDate: '2025-09-15',
      renewalDays: 185,
      term: '12 months',
      autoRenew: true
    },
    usage: {
      activeUsers: 140,
      licenseCapacity: 100,
      utilizationPercent: 140,
      yoyGrowth: 47,
      lastMonthGrowth: 12,
      peakUsage: 152,
      adoptionRate: 94
    },
    market: {
      currentPrice: 6.50,
      marketAverage: 10.20,
      percentile: 18,
      priceGap: 3.70,
      similarCustomerRange: '$8.50 - $12.00',
      opportunityValue: '$290K over 3 years'
    },
    scenarios: [
      {
        id: 'conservative' as const,
        name: 'Capacity Catch-Up',
        seatsChange: { from: 100, to: 150, percent: 50 },
        priceChange: { from: 6.50, to: 7.50, percent: 15 },
        arrChange: { from: 78000, to: 135000, percent: 73 },
        term: '12 months',
        positioning: 'Increase capacity to meet current demand with modest price adjustment to market norms',
        riskLevel: 'low' as const,
        justification: [
          'Addresses immediate capacity shortage (currently 40% over licensed)',
          'Price increase stays below market average ($7.50 vs $10.20)',
          'Minimal risk given strong relationship and product adoption',
          'Positions for future growth without overcommitting'
        ]
      },
      {
        id: 'balanced' as const,
        name: 'Growth & Value Alignment',
        recommended: true,
        seatsChange: { from: 100, to: 175, percent: 75 },
        priceChange: { from: 6.50, to: 9.00, percent: 38 },
        arrChange: { from: 78000, to: 189000, percent: 142 },
        term: '24 months',
        positioning: 'Multi-year partnership that scales with growth trajectory while bringing pricing closer to market value',
        riskLevel: 'medium' as const,
        justification: [
          'Accommodates 47% YoY growth plus 25% headroom',
          'Price adjustment to 88% of market average is defensible',
          'Multi-year lock-in provides predictability for both parties',
          'Optimal balance of revenue capture and relationship preservation',
          'Best value for customer given expansion trajectory'
        ]
      },
      {
        id: 'aggressive' as const,
        name: 'Market Rate Optimization',
        seatsChange: { from: 100, to: 200, percent: 100 },
        priceChange: { from: 6.50, to: 10.50, percent: 62 },
        arrChange: { from: 78000, to: 252000, percent: 223 },
        term: '36 months',
        positioning: 'Full market rate with maximum capacity for aggressive expansion',
        riskLevel: 'high' as const,
        justification: [
          'Brings pricing above market average to capture full value',
          'Provides maximum capacity for aggressive hiring plans',
          '3-year commitment ensures stability through growth phase',
          'Highest revenue potential if executed with executive alignment'
        ]
      }
    ]
  };

  // Demo data for Obsidian Black (executive engagement workflow)
  const obsidianBlackStakeholders = [
    {
      name: 'Marcus Castellan',
      role: 'Chief Operating Officer',
      email: 'marcus.castellan@obsidianblack.com',
      relationshipStrength: 'weak' as const,
      communicationStyle: 'Direct, results-focused, low patience for excuses. Prefers data-driven discussions and concrete action plans.',
      keyConcerns: [
        'Recent service disruptions have impacted critical operations',
        'Team credibility is at risk after missed commitments',
        'Needs proof that things will actually improve',
        'Timeline pressure - cannot afford more delays'
      ],
      leveragePoints: [
        'Strong historical relationship before recent issues',
        'Platform is deeply embedded in their operations',
        'Previous quarters showed excellent collaboration',
        'Switching costs would be significant'
      ],
      recentInteractions: 'Sent escalation email titled "Year Two is your proving ground" expressing frustration with service reliability and demanding accountability call.',
      notes: ''
    },
    {
      name: 'Elena Voss',
      role: 'VP Technical Operations',
      email: 'elena.voss@obsidianblack.com',
      relationshipStrength: 'moderate' as const,
      communicationStyle: 'Collaborative, detail-oriented, appreciates transparency. Open to problem-solving but needs to see commitment.',
      keyConcerns: [
        'Her team bore the brunt of recent service issues',
        'Needs operational stability to meet departmental goals',
        'Worried about ongoing support responsiveness',
        'Budget scrutiny after paying premium pricing'
      ],
      leveragePoints: [
        'Still advocates for the platform within the organization',
        'Understands technical complexity and acknowledges past wins',
        'Open to co-creating solutions',
        'Values the relationship and wants it to work'
      ],
      recentInteractions: 'Has been responsive but cautious in recent check-ins. Mentioned team frustrations but expressed willingness to work through issues if we show real commitment.',
      notes: ''
    }
  ];

  // Greeting messages
  const fullGreeting = isExecutiveEngagementWorkflow
    ? `Marcus from ${customerName} sent an escalation email expressing serious concerns about recent service issues. This requires immediate attention and a thoughtful response. I'll help you prepare for this critical engagement. Ready to get started?`
    : isExpansionWorkflow
    ? `I noticed ${customerName} is growing rapidly and significantly exceeding their current capacity. This is a perfect opportunity to proactively reach out about expanding their partnership before renewal. Ready to explore this opportunity?`
    : `Good morning! I noticed ${customerName}'s renewal was a few weeks ago which means it's time for our annual account review. No need to stress, though. I'll guide you through the whole process. Ready to get started?`;

  // Step configuration
  const steps = isExecutiveEngagementWorkflow
    ? [
        { key: 'greeting', label: 'Situation' },
        { key: 'strategy', label: 'Strategy' },
        { key: 'stakeholders', label: 'Stakeholders' },
        { key: 'draft-email', label: 'Draft Email' },
        { key: 'talking-points', label: 'Talking Points' },
        { key: 'send-schedule', label: 'Send & Schedule' },
        { key: 'engagement-actions', label: 'Next Actions' }
      ]
    : isExpansionWorkflow
    ? [
        { key: 'greeting', label: 'Opportunity Check' },
        { key: 'growth-assessment', label: 'Growth Context' },
        { key: 'expansion-overview', label: 'Current State' },
        { key: 'expansion-recommendation', label: 'Recommendation' },
        { key: 'expansion-proposal', label: 'Scenarios' },
        { key: 'compose-email', label: 'Compose Email' },
        { key: 'expansion-actions', label: 'Next Steps' }
      ]
    : [
        { key: 'greeting', label: 'Start Planning' },
        { key: 'assessment', label: 'Initial Assessment' },
        { key: 'overview', label: 'Account Overview' },
        { key: 'recommendation', label: 'Recommendation' },
        { key: 'strategic-plan', label: 'Strategic Plan' },
        { key: 'action-plan', label: 'Next Actions' }
      ];

  const activeStep = isExecutiveEngagementWorkflow ? engagementStep : isExpansionWorkflow ? expansionStep : currentStep;
  const currentStepIndex = steps.findIndex(s => s.key === activeStep);
  const currentStepNumber = currentStepIndex + 1;
  const totalSteps = steps.length;

  // Determine strategy type from assessment answers
  const determineStrategy = (answers: {
    opportunityScore: number;
    opportunityReason: string;
    riskScore: number;
    riskReason: string;
    yearOverview: string;
  }): 'expand' | 'invest' | 'protect' => {
    const { opportunityScore, riskScore } = answers;

    // PROTECT: High risk (>= 7) takes priority
    if (riskScore >= 7) {
      return 'protect';
    }

    // EXPAND: High opportunity (>= 7) with low-medium risk (< 7)
    if (opportunityScore >= 7 && riskScore < 7) {
      return 'expand';
    }

    // INVEST: Medium opportunity/risk - strategic partnership focus
    return 'invest';
  };

  // Typing animation for greeting
  useEffect(() => {
    const isGreeting = isExecutiveEngagementWorkflow ? engagementStep === 'greeting' : isExpansionWorkflow ? expansionStep === 'greeting' : currentStep === 'greeting';
    if (isGreeting && greetingText.length < fullGreeting.length) {
      const timeout = setTimeout(() => {
        setGreetingText(fullGreeting.slice(0, greetingText.length + 1));
      }, 5); // 5ms per character (4x faster than original)
      return () => clearTimeout(timeout);
    } else if (greetingText.length === fullGreeting.length && !showButtons) {
      // Show buttons after typing completes
      setTimeout(() => setShowButtons(true), 300);
    }
  }, [greetingText, currentStep, expansionStep, engagementStep, showButtons, fullGreeting, isExpansionWorkflow, isExecutiveEngagementWorkflow]);

  // Strategic Planning Handlers
  const handleLetsDoIt = () => {
    if (isExecutiveEngagementWorkflow) {
      setEngagementCompletedSteps(prev => new Set(prev).add('strategy'));
      setEngagementStep('strategy');
    } else if (isExpansionWorkflow) {
      setExpansionCompletedSteps(prev => new Set(prev).add('growth-assessment'));
      setExpansionStep('growth-assessment');
    } else {
      setCompletedSteps(prev => new Set(prev).add('assessment'));
      setCurrentStep('assessment');
    }
    setMetricsExpanded(false); // Start with metrics collapsed
  };

  // Expansion Workflow Handlers
  const handleGrowthAssessmentSubmit = (answers: {
    usageTrajectory: number;
    usageReason: string;
    priceSensitivity: 'low' | 'medium' | 'high';
    sensitivityReason: string;
    competitiveRisk: 'low' | 'medium' | 'high';
    competitiveReason: string;
  }) => {
    setGrowthAssessment(answers);
    setExpansionCompletedSteps(prev => new Set(prev).add('expansion-overview'));
    setExpansionStep('expansion-overview');
  };

  const handleExpansionOverviewContinue = () => {
    setExpansionCompletedSteps(prev => new Set(prev).add('expansion-recommendation'));
    setExpansionStep('expansion-recommendation');
  };

  const handleExpansionRecommendationProceed = () => {
    setExpansionCompletedSteps(prev => new Set(prev).add('expansion-proposal'));
    setExpansionStep('expansion-proposal');
  };

  const handleExpansionProposalContinue = () => {
    setExpansionCompletedSteps(prev => new Set(prev).add('compose-email'));
    setExpansionStep('compose-email');
  };

  const handleEmailCompose = () => {
    setEmailComposed(true);
    showToast({
      message: 'Email drafted and ready to send!',
      type: 'success',
      icon: 'check',
      duration: 2000
    });
  };

  const handleEmailSend = () => {
    setExpansionCompletedSteps(prev => new Set(prev).add('expansion-actions'));
    setExpansionStep('expansion-actions');
    showToast({
      message: 'Email sent successfully!',
      type: 'success',
      icon: 'check',
      duration: 3000
    });
  };

  // Executive Engagement Workflow Handlers
  const handleEngagementStrategySubmit = (strategy: {
    primaryObjective: 'rebuild-trust' | 'acknowledge-issue' | 'set-expectations';
    tone: number;
    urgency: 'immediate' | 'this-week' | 'flexible';
    keyMessage: string;
  }) => {
    setEngagementStrategy(strategy);
    setEngagementCompletedSteps(prev => new Set(prev).add('stakeholders'));
    setEngagementStep('stakeholders');
  };

  const handleStakeholdersContinue = () => {
    setEngagementCompletedSteps(prev => new Set(prev).add('draft-email'));
    setEngagementStep('draft-email');
  };

  const handleDraftEmailReady = () => {
    setDraftEmailReady(true);
    setEngagementCompletedSteps(prev => new Set(prev).add('talking-points'));
    setEngagementStep('talking-points');
  };

  const handleTalkingPointsContinue = () => {
    setEngagementCompletedSteps(prev => new Set(prev).add('send-schedule'));
    setEngagementStep('send-schedule');
  };

  const handleEngagementEmailSend = () => {
    setEmailSent(true);
    showToast({
      message: 'Email sent and meeting scheduled!',
      type: 'success',
      icon: 'check',
      duration: 3000
    });
  };

  const handleEngagementSendAndSchedule = () => {
    setEngagementCompletedSteps(prev => new Set(prev).add('engagement-actions'));
    setEngagementStep('engagement-actions');
    handleEngagementEmailSend();
  };

  const handleAssessmentSubmit = (answers: {
    opportunityScore: number;
    opportunityReason: string;
    riskScore: number;
    riskReason: string;
    yearOverview: string;
  }) => {
    setAssessmentAnswers(answers);
    const determinedStrategy = determineStrategy(answers);
    setStrategyType(determinedStrategy);
    setCompletedSteps(prev => new Set(prev).add('overview'));
    setCurrentStep('overview');
  };

  const handleOverviewContinue = () => {
    setCompletedSteps(prev => new Set(prev).add('recommendation'));
    setCurrentStep('recommendation');
  };

  // Generate recommendation reasons based on strategy and assessment answers
  const getRecommendationReasons = () => {
    const reasons = [];

    if (!assessmentAnswers) return reasons;

    const { opportunityScore, riskScore } = assessmentAnswers;

    if (strategyType === 'protect') {
      reasons.push({ icon: 'alert' as const, text: `High risk score detected (${riskScore}/10) - immediate action required`, highlight: true });
      reasons.push({ icon: 'alert' as const, text: 'Account retention is top priority', highlight: false });
      reasons.push({ icon: 'check' as const, text: 'Executive engagement needed to rebuild trust', highlight: false });
      reasons.push({ icon: 'target' as const, text: 'Rapid intervention can prevent churn and stabilize relationship', highlight: false });
    } else if (strategyType === 'expand') {
      reasons.push({ icon: 'trending' as const, text: `High opportunity score (${opportunityScore}/10) - strong expansion potential`, highlight: true });
      reasons.push({ icon: 'check' as const, text: 'Low risk profile creates ideal conditions for growth', highlight: false });
      reasons.push({ icon: 'target' as const, text: 'Account is primed for upsell and cross-sell opportunities', highlight: false });
      reasons.push({ icon: 'trending' as const, text: 'ROI-focused approach will maximize expansion potential', highlight: false });
    } else {
      // invest
      reasons.push({ icon: 'target' as const, text: 'Balanced opportunity and risk profile indicates strategic partnership potential', highlight: true });
      reasons.push({ icon: 'check' as const, text: 'Account is stable - ideal for deepening long-term relationship', highlight: false });
      reasons.push({ icon: 'trending' as const, text: 'Co-innovation opportunities can drive mutual growth', highlight: false });
      reasons.push({ icon: 'target' as const, text: 'Multi-year partnership framework recommended', highlight: false });
    }

    return reasons;
  };

  const handleRecommendationProceed = () => {
    setCompletedSteps(prev => new Set(prev).add('strategic-plan'));
    setCurrentStep('strategic-plan');
  };

  const handleStrategicPlanProceed = () => {
    setCompletedSteps(prev => new Set(prev).add('action-plan'));

    // Generate and cache the plan summary data on first visit
    if (!planSummaryCache) {
      const summaryData = {
        tasksInitiated: [
          { id: '1', title: 'Strategic plan created and reviewed', completed: true, timestamp: 'Just now', assignee: 'You' },
          { id: '2', title: 'Account data gathered and validated', completed: true, timestamp: 'Today', assignee: 'You' },
          { id: '3', title: 'Stakeholders confirmed', completed: true, timestamp: 'Today', assignee: 'You' },
          { id: '4', title: 'CRM updated with plan details', completed: true, timestamp: 'Just now', assignee: 'System' }
        ],
        accomplishments: [
          `Identified ${strategyType.toUpperCase()} strategy based on account assessment`,
          'Confirmed executive sponsor Marcus Castellan and champion Elena Rodriguez',
          'Reviewed contract terms and identified medium risk factors',
          'Established pricing opportunity with 87% usage and 35th percentile market position',
          'Created comprehensive strategic account plan with clear milestones'
        ],
        nextSteps: [
          {
            id: '1',
            title: 'Send strategic plan summary email to Marcus',
            description: 'Automated email with plan overview and key milestones',
            dueDate: 'Tomorrow',
            type: 'ai' as const
          },
          {
            id: '2',
            title: 'Update CRM with strategic plan details',
            description: 'All plan data synced to Salesforce automatically',
            dueDate: 'Today',
            type: 'ai' as const
          },
          {
            id: '3',
            title: 'Check back in 3 days',
            description: "I'll send you a reminder to follow up on progress",
            dueDate: 'Mar 20',
            type: 'ai' as const
          },
          {
            id: '4',
            title: 'Schedule stakeholder meeting with Marcus',
            description: '30-min call to present strategic plan',
            dueDate: 'Mar 20, 2025',
            type: 'user' as const
          },
          {
            id: '5',
            title: 'Review account plan before call',
            description: 'Refresh on key points and priorities',
            dueDate: 'Before meeting',
            type: 'user' as const
          }
        ]
      };
      setPlanSummaryCache(summaryData);
    }

    setCurrentStep('action-plan');
  };

  const handleModifyPlan = () => {
    setCurrentStep('recommendation');
  };

  const handleAgreeAndExecute = () => {
    const message = sequenceInfo
      ? 'Workflow complete! Loading next workflow...'
      : 'Strategic Plan accepted! Starting execution...';

    showToast({
      message,
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    // TODO: Mark workflow as complete in backend
    setTimeout(() => {
      if (sequenceInfo) {
        // In sequence mode: move to next workflow
        sequenceInfo.onNextWorkflow();
      } else {
        // Not in sequence mode: close modal
        handleClose();
      }
    }, 1500);
  };

  const handleComeBackLater = () => {
    showToast({
      message: 'Plan saved. You can return to this anytime.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });

    // TODO: Save progress in backend
    setTimeout(() => {
      handleClose();
    }, 1000);
  };

  // Pattern matching function to detect user intent
  const matchUserInput = (input: string, userTriggers: Record<string, string>): string | null => {
    const lowercaseInput = input.toLowerCase();

    for (const [pattern, branchId] of Object.entries(userTriggers)) {
      try {
        // Create regex from pattern (case-insensitive)
        const regex = new RegExp(pattern, 'i');
        if (regex.test(lowercaseInput)) {
          return branchId;
        }
      } catch (error) {
        console.error('Invalid regex pattern:', pattern, error);
      }
    }

    return null; // No match found
  };

  // Handle chat message submission
  const handleChatMessage = (message: string) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = {
      text: message,
      sender: 'user' as const,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // If we have a workflow config with pattern matching, use it
    if (workflowConfig?.chat?.dynamicFlow?.userTriggers) {
      const branchId = matchUserInput(message, workflowConfig.chat.dynamicFlow.userTriggers);

      if (branchId) {
        // Found a matching pattern, navigate to that branch
        const branch = workflowConfig.chat.dynamicFlow.branches[branchId];

        if (branch) {
          setCurrentBranch(branchId);

          // Add bot response
          const botMessage = {
            text: branch.response,
            sender: 'ai' as const,
            timestamp: new Date()
          };

          setTimeout(() => {
            setChatMessages(prev => [...prev, botMessage]);

            // Handle any actions (like showing artifacts)
            if (branch.actions) {
              branch.actions.forEach((action: string) => {
                if (action === 'showArtifact' && branch.artifactId) {
                  // TODO: Trigger artifact visibility
                  console.log('[Chat] Show artifact:', branch.artifactId);
                }
              });
            }
          }, branch.delay ? branch.delay * 1000 : 500);
        }
      } else {
        // No pattern match, show default message
        const defaultMessage = workflowConfig.chat.dynamicFlow.defaultMessage ||
          "I'm here to help with this account. Could you rephrase your question?";

        const botMessage = {
          text: defaultMessage,
          sender: 'ai' as const,
          timestamp: new Date()
        };

        setTimeout(() => {
          setChatMessages(prev => [...prev, botMessage]);
        }, 500);
      }
    } else {
      // No workflow config, show placeholder
      showToast({
        message: 'Chat functionality coming soon - pattern matching will detect "contract", "pricing", "contacts" keywords',
        type: 'info',
        icon: 'none',
        duration: 3000
      });
    }
  };

  const handleSnooze = () => {
    setShowConfirmDialog('snooze');
  };

  const handleSkip = () => {
    setShowConfirmDialog('skip');
  };

  const handleConfirmSnooze = () => {
    showToast({
      message: 'No problem, I\'ll remind you in a few days.',
      type: 'info',
      icon: 'clock',
      duration: 3000
    });

    setShowConfirmDialog(null);

    // TODO: Call backend API to snooze workflow
    // await fetch(`/api/workflows/executions/${workflowId}/actions/snooze`, { method: 'POST' });

    // Auto-advance to next workflow after a brief delay
    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        handleClose();
      }
    }, 1500);
  };

  const handleConfirmSkip = () => {
    showToast({
      message: 'Workflow skipped. Moving to next workflow.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });

    setShowConfirmDialog(null);

    // TODO: Call backend API to skip workflow
    // await fetch(`/api/workflows/executions/${workflowId}/actions/skip`, { method: 'POST' });

    // Auto-advance to next workflow after a brief delay
    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        handleClose();
      }
    }, 1500);
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(null);
  };

  const handleSelectWorkflow = (index: number) => {
    // Mark current workflow as completed before jumping
    if (sequenceInfo) {
      setCompletedWorkflows(prev => {
        const newSet = new Set(prev);
        newSet.add(sequenceInfo.currentIndex);
        return newSet;
      });

      // Call parent handler to jump to selected workflow
      if (sequenceInfo.onJumpToWorkflow) {
        sequenceInfo.onJumpToWorkflow(index);
      }
    }
  };

  const handleClose = async () => {
    // If there's a pending action, persist it to backend before closing
    if (pendingAction === 'snooze') {
      // TODO: Call backend API to snooze workflow
      // await fetch(`/api/workflows/executions/${workflowId}/actions/snooze`, { method: 'POST' });
      showToast({
        message: 'Workflow snoozed.',
        type: 'info',
        icon: 'clock',
        duration: 2000
      });
    } else if (pendingAction === 'skip') {
      // TODO: Call backend API to skip workflow
      // await fetch(`/api/workflows/executions/${workflowId}/actions/skip`, { method: 'POST' });
      showToast({
        message: 'Workflow skipped.',
        type: 'info',
        icon: 'none',
        duration: 2000
      });
    }

    // Close the modal
    onClose();
  };

  // Resize handling for artifacts panel
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;

      // Constrain between 30% and 70%
      const constrainedWidth = Math.min(Math.max(newWidth, 30), 70);
      setArtifactsPanelWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center p-8">
      {/* Workstation Container */}
      <div className="relative w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{workflowTitle}</h2>
              <p className="text-sm text-gray-600">{customerName}</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle Sequence Panel Button - Only show in sequence mode */}
              {sequenceInfo && (
                <button
                  onClick={() => setShowSequencePanel(!showSequencePanel)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <span>📋 Sequence</span>
                  {sequenceInfo && (
                    <span className="text-xs text-gray-500">
                      ({sequenceInfo.currentIndex + 1}/{sequenceInfo.totalCount})
                    </span>
                  )}
                </button>
              )}

              {/* Toggle Artifacts Button */}
              <button
                onClick={() => setShowArtifacts(!showArtifacts)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <span>📄 Artifacts</span>
              </button>

              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close task mode"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Step Progress */}
          <div className="w-full px-6 py-6 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = index === currentStepIndex;
                const activeCompletedSteps = isExecutiveEngagementWorkflow ? engagementCompletedSteps : isExpansionWorkflow ? expansionCompletedSteps : completedSteps;
                const isCompleted = activeCompletedSteps.has(step.key) && !isActive;
                const isUpcoming = !activeCompletedSteps.has(step.key) && !isActive;
                const isClickable = activeCompletedSteps.has(step.key);

                return (
                  <React.Fragment key={step.key}>
                    {/* Step Circle and Label */}
                    <button
                      onClick={() => {
                        if (isClickable) {
                          if (isExecutiveEngagementWorkflow) {
                            setEngagementStep(step.key as any);
                          } else if (isExpansionWorkflow) {
                            setExpansionStep(step.key as any);
                          } else {
                            setCurrentStep(step.key as any);
                          }
                        }
                      }}
                      disabled={!isClickable}
                      className={`flex flex-col items-center flex-1 ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                    >
                      {/* Circle */}
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          font-semibold text-sm
                          ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-200' : ''}
                          ${isCompleted ? 'bg-green-600 text-white' : ''}
                          ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                        `}
                      >
                        {isCompleted ? '✓' : index + 1}
                      </div>

                      {/* Label */}
                      <div
                        className={`
                          mt-2 text-sm font-medium text-center
                          ${isActive ? 'text-blue-600' : ''}
                          ${isCompleted ? 'text-green-600' : ''}
                          ${isUpcoming ? 'text-gray-500' : ''}
                        `}
                      >
                        {step.label}
                      </div>
                    </button>

                    {/* Connector Line (except after last step) */}
                    {index < steps.length - 1 && (
                      <div className="flex-1 px-4 pb-6">
                        <div
                          className={`
                            h-1 rounded
                            ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}
                          `}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area - Split Screen Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Workflow Sequence Panel - Left Sidebar (only in sequence mode) */}
          {showSequencePanel && sequenceInfo && (
            <WorkflowSequencePanel
              workflows={getWorkflowSequence(sequenceInfo.sequenceId)?.workflows || []}
              currentIndex={sequenceInfo.currentIndex}
              onSelectWorkflow={handleSelectWorkflow}
              completedWorkflows={completedWorkflows}
            />
          )}

          {/* Left Panel - Chat/Context */}
          <div
            className="flex flex-col bg-white"
            style={{ width: showArtifacts ? `${100 - artifactsPanelWidth}%` : '100%' }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {activeStep === 'greeting' ? (
                // Step 1: Start Planning - Greeting Message
                <div className="flex items-center justify-center p-12 h-full">
                  <div className="max-w-lg w-full">
                    {/* AI Message Bubble */}
                    <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                      <p className="text-gray-800 leading-relaxed">
                        It's time to do the annual planning for {customerName}. Review the checklist to the right, and let me know if you're ready to get started.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 animate-fade-in">
                      <button
                        onClick={handleLetsDoIt}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                      >
                        Start Planning
                      </button>

                      <button
                        onClick={handleSnooze}
                        disabled={pendingAction === 'snooze'}
                        className="px-4 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clock className="w-5 h-5" />
                        {pendingAction === 'snooze' ? 'Snoozed' : 'Snooze'}
                      </button>

                      <button
                        onClick={handleSkip}
                        disabled={pendingAction === 'skip'}
                        className="px-4 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pendingAction === 'skip' ? 'Skipped' : 'Skip'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'strategy' ? (
                // Executive Engagement Step 2: Strategy - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Great! Let's define your engagement strategy. This will guide how you approach this critical conversation with Marcus.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Answer the four questions on the right to shape your response strategy - primary objective, tone, urgency, and key message.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'stakeholders' ? (
                // Executive Engagement Step 3: Stakeholders - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Perfect! Let's review the key stakeholders at {customerName}. Understanding their perspectives will help you navigate this engagement effectively.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review Marcus and Elena's profiles on the right - their concerns, leverage points, and recent interactions. You can add notes as needed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'draft-email' ? (
                // Executive Engagement Step 4: Draft Email - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Excellent! Now let's draft your response email to Marcus. This is your chance to take accountability and propose a path forward.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        I've drafted an email on the right based on your strategy. Review and edit as needed, then proceed to prepare talking points.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'talking-points' ? (
                // Executive Engagement Step 5: Talking Points - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Great! Now let's prepare structured talking points for your call with Marcus. This will help you stay focused and deliver your message effectively.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review the talking points on the right - organized into opening, middle, and close sections. You can edit them if needed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'send-schedule' ? (
                // Executive Engagement Step 6: Send & Schedule - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Perfect! You're ready to send the email and schedule the accountability call with Marcus.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review the final email on the right. When you send it, I'll automatically schedule the meeting and set up AI monitoring for prep and follow-up.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'engagement-actions' ? (
                // Executive Engagement Step 7: Next Actions - Chat Context
                <div className="flex items-center justify-center p-12 h-full">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">✓</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          Executive Engagement Ready!
                        </p>
                      </div>
                      <p className="text-gray-800 leading-relaxed">
                        Your executive engagement plan for {customerName} is complete. Review the summary on the right to see what's been accomplished and your next steps.
                      </p>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                      <p className="text-sm font-semibold text-blue-900 mb-2">What's Next?</p>
                      <ul className="text-sm text-blue-800 space-y-2 mb-4">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Email sent and meeting scheduled automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>AI monitoring set up for meeting prep and insights</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Pre-meeting brief will be sent 24 hours before call</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'growth-assessment' ? (
                // Expansion Step 2: Growth Assessment - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Perfect! Before we dive into the numbers, I need to understand the growth context for {customerName}.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Answer the three questions on the right. Your insights about their growth trajectory, price sensitivity, and competitive dynamics will shape our approach.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'expansion-overview' ? (
                // Expansion Step 3: Overview - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Excellent! I've analyzed {customerName}'s current state. The numbers tell a compelling story.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review the three tabs on the right - their contract details, usage growth, and market positioning. Notice they're 40% over capacity and significantly underpriced.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'expansion-recommendation' ? (
                // Expansion Step 4: Recommendation - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Based on their rapid growth and underpriced position, I recommend a <span className="font-semibold text-purple-700">PROACTIVE EXPANSION</span> approach.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        This is the perfect time to reach out - they need more capacity, we have pricing leverage, and it's better to act now than wait for renewal pressure.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'expansion-proposal' ? (
                // Expansion Step 5: Proposal - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        I've prepared three expansion scenarios for {customerName} - conservative, balanced, and aggressive.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review each scenario on the right, including financial impact and ROI justification. The balanced scenario is recommended, but choose what fits your relationship best.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'compose-email' ? (
                // Expansion Step 6: Email Composition - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Great choice! Now let's craft the initial outreach email to schedule a conversation about their expansion.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        I've drafted an email on the right. You can edit it inline if needed, then send it when you're ready.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'expansion-actions' ? (
                // Expansion Step 7: Next Actions - Chat Context
                <div className="flex items-center justify-center p-12 h-full">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">✓</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          Expansion Plan Complete!
                        </p>
                      </div>
                      <p className="text-gray-800 leading-relaxed">
                        Your expansion outreach for {customerName} is ready. Review the summary on the right to see what we've accomplished and your next steps.
                      </p>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                      <p className="text-sm font-semibold text-blue-900 mb-2">What's Next?</p>
                      <ul className="text-sm text-blue-800 space-y-2 mb-4">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Email has been sent to schedule expansion discussion</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>CRM updated with expansion opportunity and selected scenario</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Follow-up reminders set for meeting preparation</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'assessment' ? (
                // Step 2: Assessment - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Great! Let's start with a quick assessment. I need to understand the current state of this account to create the best strategic plan.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Please share your insights using the form to the right. Your perspective on opportunity, risk, and the past year will help shape our approach.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'overview' ? (
                // Step 3: Overview - Chat Context
                <div className="flex flex-col h-full">
                  {/* Initial greeting messages */}
                  {chatMessages.length === 0 ? (
                    <div className="flex items-start justify-center p-12">
                      <div className="max-w-lg w-full space-y-6">
                        <div className="bg-gray-100 rounded-2xl p-6">
                          <p className="text-gray-800 leading-relaxed">
                            Perfect! I've gathered the account details for {customerName}. Let's review the key information together.
                          </p>
                        </div>
                        <div className="bg-gray-100 rounded-2xl p-6">
                          <p className="text-gray-800 leading-relaxed">
                            Take a look at the contract terms, contact engagement levels, and pricing structure on the right. This will help us build the right strategy.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Chat message history */
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {/* Initial greeting */}
                      <div className="max-w-lg mx-auto">
                        <div className="bg-gray-100 rounded-2xl p-6 mb-4">
                          <p className="text-gray-800 leading-relaxed">
                            Perfect! I've gathered the account details for {customerName}. Let's review the key information together. Feel free to ask me any questions about the contract, contacts, or pricing.
                          </p>
                        </div>
                      </div>

                      {/* Chat messages */}
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={`max-w-lg mx-auto ${msg.sender === 'user' ? 'flex justify-end' : ''}`}>
                          <div className={`rounded-2xl p-4 ${
                            msg.sender === 'user'
                              ? 'bg-blue-600 text-white ml-auto max-w-sm'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <p className="leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : activeStep === 'recommendation' ? (
                // Step 4: Recommendation - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Based on your assessment, I recommend a <span className="font-semibold text-purple-700">{strategyType.toUpperCase()}</span> strategy for {customerName}.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review the detailed recommendation on the right, including key reasons and our confidence level. If this looks good, we can proceed to build the strategic plan.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'strategic-plan' ? (
                // Step 5: Strategic Plan - Chat Context
                <div className="flex items-start justify-center p-12">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Excellent! I've generated a comprehensive strategic account plan for {customerName}.
                      </p>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-6">
                      <p className="text-gray-800 leading-relaxed">
                        Review the full plan on the right, including timeline, key activities, and success metrics. You can modify it if needed or continue to define next actions.
                      </p>
                    </div>
                  </div>
                </div>
              ) : activeStep === 'action-plan' ? (
                // Step 6: Summary & Next Steps - Chat Context
                <div className="flex items-center justify-center p-12 h-full">
                  <div className="max-w-lg w-full space-y-6">
                    <div className="bg-gradient-to-r from-green-100 to-blue-100 border-2 border-green-200 rounded-2xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xl">✓</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          Planning Complete!
                        </p>
                      </div>
                      <p className="text-gray-800 leading-relaxed">
                        Your strategic plan for {customerName} is ready. Review the summary on the right to see what we've accomplished and your next steps.
                      </p>
                    </div>

                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                      <p className="text-sm font-semibold text-blue-900 mb-2">What's Next?</p>
                      <ul className="text-sm text-blue-800 space-y-2 mb-4">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Your CRM has been updated automatically</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>Automated reminders are set for April 15</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>3 high-priority tasks need your attention this week</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Global Chat Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2 items-end max-w-4xl mx-auto">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Ask me anything about this account..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const message = input.value.trim();
                        if (message) {
                          handleChatMessage(message);
                          input.value = '';
                        }
                      }
                    }}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-500"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling?.querySelector('input') as HTMLInputElement;
                    if (input) {
                      const message = input.value.trim();
                      if (message) {
                        handleChatMessage(message);
                        input.value = '';
                      }
                    }
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Resizable Divider with Pill Handle */}
          {showArtifacts && (
            <div
              onMouseDown={handleResizeStart}
              className={`
                w-3 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group
                flex-shrink-0
                ${isResizing ? 'bg-blue-500' : ''}
              `}
            >
              {/* Pill/Notch Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-16 bg-gray-300 group-hover:bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-0.5 h-12 bg-white/50 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Right Panel - Artifacts */}
          {showArtifacts && (
            <div
              className="bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden"
              style={{ width: `${artifactsPanelWidth}%` }}
            >
              {activeStep === 'greeting' && isExecutiveEngagementWorkflow ? (
                // Executive Engagement Step 1: Situation Checklist
                <PlanningChecklistArtifact
                  title={`Executive Engagement - ${customerName}`}
                  items={[
                    { id: '1', label: 'Marcus sent escalation email about service issues', completed: true },
                    { id: '2', label: 'Relationship strength currently weak', completed: true },
                    { id: '3', label: 'Critical engagement required to rebuild trust', completed: true },
                    { id: '4', label: 'Marcus expects accountability and concrete actions', completed: true },
                    { id: '5', label: 'Timeline pressure - immediate response needed', completed: true }
                  ]}
                  showActions={false}
                />
              ) : activeStep === 'greeting' && !isExpansionWorkflow ? (
                // Step 1: Planning Checklist (Strategic Planning)
                <PlanningChecklistArtifact
                  title={`Planning Checklist for ${customerName}`}
                  items={[
                    { id: '1', label: 'Review customer profile and contract details', completed: false },
                    { id: '2', label: 'Identify key stakeholders and decision makers', completed: false },
                    { id: '3', label: 'Assess account health and risk factors', completed: false },
                    { id: '4', label: 'Document growth and expansion opportunities', completed: false },
                    { id: '5', label: 'Gather insights from past year interactions', completed: false }
                  ]}
                  showActions={false}
                />
              ) : activeStep === 'greeting' && isExpansionWorkflow ? (
                // Expansion Step 1: Opportunity Checklist
                <PlanningChecklistArtifact
                  title={`Expansion Opportunity for ${customerName}`}
                  items={[
                    { id: '1', label: 'Customer is 40% over licensed capacity', completed: true },
                    { id: '2', label: 'Strong product adoption (94% adoption rate)', completed: true },
                    { id: '3', label: 'Rapid growth trajectory (47% YoY)', completed: true },
                    { id: '4', label: 'Significantly underpriced (18th percentile)', completed: true },
                    { id: '5', label: 'Renewal 6+ months away - perfect timing', completed: true }
                  ]}
                  showActions={false}
                />
              ) : activeStep === 'growth-assessment' ? (
                // Expansion Step 2: Growth Assessment Form
                <AssessmentArtifact
                  title="Growth Assessment"
                  subtitle="Help us understand the growth context"
                  customerName={customerName}
                  questionBlocks={growthAssessmentQuestions}
                  onSubmit={(answers) => {
                    // Transform answers to match expected format
                    handleGrowthAssessmentSubmit({
                      usageTrajectory: answers['usage-trajectory']?.score || 7,
                      usageReason: answers['usage-trajectory']?.reason || '',
                      priceSensitivity: (answers['price-sensitivity']?.value || 'medium') as 'low' | 'medium' | 'high',
                      sensitivityReason: answers['price-sensitivity']?.reason || '',
                      competitiveRisk: (answers['competitive-risk']?.value || 'low') as 'low' | 'medium' | 'high',
                      competitiveReason: answers['competitive-risk']?.reason || ''
                    });
                  }}
                  onBack={() => setExpansionStep('greeting')}
                />
              ) : activeStep === 'expansion-overview' ? (
                // Expansion Step 3: Expansion Overview
                <ExpansionOverviewArtifact
                  customerName={customerName}
                  contractInfo={techFlowData.contract}
                  usageInfo={techFlowData.usage}
                  marketInfo={techFlowData.market}
                  onContinue={handleExpansionOverviewContinue}
                  onBack={() => setExpansionStep('growth-assessment')}
                />
              ) : activeStep === 'expansion-recommendation' ? (
                // Expansion Step 4: Recommendation
                <RecommendationSlide
                  recommendationType="Proactive Expansion Opportunity"
                  reasons={[
                    { icon: 'alert' as const, text: 'Customer is 40% over licensed capacity - immediate need', highlight: true },
                    { icon: 'trending' as const, text: '47% YoY growth indicates continued expansion', highlight: false },
                    { icon: 'target' as const, text: 'Currently at 18th percentile - significant pricing opportunity', highlight: false },
                    { icon: 'check' as const, text: 'Strong relationship and 94% adoption reduces risk', highlight: false },
                    { icon: 'trending' as const, text: 'Proactive timing strengthens negotiation position', highlight: false }
                  ]}
                  confidenceScore={95}
                  onProceed={handleExpansionRecommendationProceed}
                  onGoBack={() => setExpansionStep('expansion-overview')}
                />
              ) : activeStep === 'expansion-proposal' ? (
                // Expansion Step 5: Expansion Proposal Scenarios
                <ExpansionProposalArtifact
                  customerName={customerName}
                  scenarios={techFlowData.scenarios}
                  currentARR={techFlowData.contract.annualSpend}
                  currentSeats={techFlowData.contract.licenseCount}
                  currentPrice={techFlowData.contract.pricePerSeat}
                  onScenarioSelect={(scenarioId) => setSelectedScenario(scenarioId as any)}
                  onContinue={handleExpansionProposalContinue}
                  onBack={() => setExpansionStep('expansion-recommendation')}
                />
              ) : activeStep === 'compose-email' ? (
                // Expansion Step 6: Email Composition
                <div className="h-full flex flex-col bg-white">
                  {/* Header */}
                  <div className="px-8 py-4 border-b border-gray-100">
                    <h2 className="text-base font-medium text-gray-900">Compose Outreach Email</h2>
                    <p className="text-sm text-gray-500">Draft email to schedule expansion discussion</p>
                  </div>

                  {/* Email Content */}
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="space-y-4 max-w-2xl">
                      {/* To/Subject */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">To</label>
                        <input
                          type="text"
                          defaultValue="sarah.chen@techflow.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Subject</label>
                        <input
                          type="text"
                          defaultValue="Quick Chat - Capacity Planning for Q3"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
                        />
                      </div>

                      {/* Email Body */}
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Message</label>
                        <textarea
                          rows={12}
                          defaultValue={`Hi Sarah,

I hope you're doing well! I wanted to reach out proactively as I've been reviewing TechFlow's growth trajectory with our platform.

I noticed your team's usage has been climbing significantly (up 47% year-over-year), which is fantastic to see. However, I also see you're currently exceeding your licensed capacity. Rather than wait until renewal, I thought it might be helpful to have a quick conversation about your expansion plans and how we can ensure your team has the capacity they need.

Would you have 20 minutes this week or next to discuss? I've put together a few scenarios that might make sense given your growth, and I'd love to walk through them with you.

Looking forward to connecting!

Best regards`}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono leading-relaxed resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-4 border-t border-gray-100 flex justify-between items-center">
                    <button
                      onClick={() => setExpansionStep('expansion-proposal')}
                      className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleEmailSend}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Send Email
                    </button>
                  </div>
                </div>
              ) : activeStep === 'expansion-actions' ? (
                // Expansion Step 7: Summary & Next Steps
                <PlanSummaryArtifact
                  customerName={customerName}
                  tasksInitiated={[
                    { id: '1', title: 'Expansion opportunity identified and analyzed', completed: true, timestamp: 'Just now', assignee: 'You' },
                    { id: '2', title: 'Financial scenarios modeled and reviewed', completed: true, timestamp: 'Today', assignee: 'You' },
                    { id: '3', title: 'Outreach email sent to customer', completed: true, timestamp: 'Just now', assignee: 'System' },
                    { id: '4', title: 'CRM updated with expansion opportunity', completed: true, timestamp: 'Just now', assignee: 'System' }
                  ]}
                  accomplishments={[
                    `Selected ${selectedScenario.toUpperCase()} expansion scenario`,
                    'Identified 40% capacity overage and 47% YoY growth',
                    'Positioned proactive outreach 6 months before renewal',
                    'Drafted and sent expansion discussion email',
                    'Documented pricing opportunity (18th percentile positioning)'
                  ]}
                  nextSteps={[
                    {
                      id: '1',
                      title: 'Monitor email response',
                      description: 'Track open rates and reply from customer contact',
                      dueDate: 'Next 48 hours',
                      type: 'ai' as const
                    },
                    {
                      id: '2',
                      title: 'Set up meeting reminder',
                      description: 'Alert 1 day before scheduled expansion discussion',
                      dueDate: 'When meeting scheduled',
                      type: 'ai' as const
                    },
                    {
                      id: '3',
                      title: 'Prepare expansion presentation',
                      description: 'Create deck with selected scenario and ROI breakdown',
                      dueDate: 'Before meeting',
                      type: 'user' as const
                    },
                    {
                      id: '4',
                      title: 'Coordinate with sales leadership',
                      description: 'Brief manager on expansion opportunity and approach',
                      dueDate: 'This week',
                      type: 'user' as const
                    }
                  ]}
                  followUpDate="Meeting TBD"
                  salesforceUpdated={true}
                  trackingEnabled={true}
                  onNextCustomer={handleAgreeAndExecute}
                  nextButtonLabel={
                    sequenceInfo && sequenceInfo.currentIndex < sequenceInfo.totalCount - 1
                      ? 'Next Workflow'
                      : 'Complete'
                  }
                />
              ) : activeStep === 'strategy' ? (
                // Executive Engagement Step 2: Strategy
                <AssessmentArtifact
                  title="Executive Engagement Strategy"
                  subtitle="Define your approach for this critical engagement"
                  customerName={customerName}
                  questionBlocks={executiveEngagementQuestions}
                  onSubmit={(answers) => {
                    // Transform answers to match expected format
                    handleEngagementStrategySubmit({
                      primaryObjective: (answers['primary-objective'] || 'rebuild-trust') as 'rebuild-trust' | 'acknowledge-issue' | 'set-expectations',
                      tone: answers['tone']?.score || 4,
                      urgency: (answers['urgency'] || 'this-week') as 'immediate' | 'this-week' | 'flexible',
                      keyMessage: answers['key-message'] || ''
                    });
                  }}
                  onBack={() => setEngagementStep('greeting')}
                />
              ) : activeStep === 'stakeholders' ? (
                // Executive Engagement Step 3: Stakeholders
                <StakeholderProfileArtifact
                  customerName={customerName}
                  stakeholders={obsidianBlackStakeholders}
                  onContinue={handleStakeholdersContinue}
                  onBack={() => setEngagementStep('strategy')}
                />
              ) : activeStep === 'draft-email' ? (
                // Executive Engagement Step 4: Draft Email
                <EmailArtifact
                  to="marcus.castellan@obsidianblack.com"
                  subject="Re: Year Two is your proving ground"
                  body={`Hi Marcus,

Thank you for your direct email. I take full accountability for the recent service disruptions and their impact on Obsidian Black's operations.

I want to schedule a 30-minute call this week to discuss:
1. The specific issues you've experienced and their root causes
2. Concrete actions we're taking to prevent recurrence
3. How we can rebuild trust and demonstrate consistent reliability

I've prepared a detailed action plan and would value your input to ensure we address your most pressing concerns.

Would Thursday at 2pm or Friday at 10am work for you?

I'm committed to earning back your confidence.

Best regards`}
                  onCompose={handleDraftEmailReady}
                  onBack={() => setEngagementStep('stakeholders')}
                />
              ) : activeStep === 'talking-points' ? (
                // Executive Engagement Step 5: Talking Points
                <TalkingPointsArtifact
                  customerName={customerName}
                  initialPoints={[
                    { id: '1', text: 'Take full accountability for service disruptions without making excuses', section: 'opening' },
                    { id: '2', text: 'Acknowledge the impact on their operations and team credibility', section: 'opening' },
                    { id: '3', text: 'Express commitment to transparency and honest communication', section: 'opening' },
                    { id: '4', text: 'Present root cause analysis of recent issues', section: 'middle' },
                    { id: '5', text: 'Outline specific technical improvements already underway', section: 'middle' },
                    { id: '6', text: 'Propose 30-day check-in cadence with measurable success metrics', section: 'middle' },
                    { id: '7', text: 'Commit to weekly status updates until stability is proven', section: 'close' },
                    { id: '8', text: 'Ask for specific concerns we haven\'t addressed', section: 'close' },
                    { id: '9', text: 'Thank Marcus for the opportunity to make this right', section: 'close' }
                  ]}
                  onContinue={handleTalkingPointsContinue}
                  onBack={() => setEngagementStep('draft-email')}
                />
              ) : activeStep === 'send-schedule' ? (
                // Executive Engagement Step 6: Send & Schedule
                <EmailArtifact
                  to="marcus.castellan@obsidianblack.com"
                  subject="Re: Year Two is your proving ground"
                  body={`Hi Marcus,

Thank you for your direct email. I take full accountability for the recent service disruptions and their impact on Obsidian Black's operations.

I want to schedule a 30-minute call this week to discuss:
1. The specific issues you've experienced and their root causes
2. Concrete actions we're taking to prevent recurrence
3. How we can rebuild trust and demonstrate consistent reliability

I've prepared a detailed action plan and would value your input to ensure we address your most pressing concerns.

Would Thursday at 2pm or Friday at 10am work for you?

I'm committed to earning back your confidence.

Best regards`}
                  onCompose={handleEngagementSendAndSchedule}
                  onBack={() => setEngagementStep('talking-points')}
                  sendButtonLabel="Send & Schedule Meeting"
                />
              ) : activeStep === 'engagement-actions' ? (
                // Executive Engagement Step 7: Next Actions
                <PlanSummaryArtifact
                  customerName={customerName}
                  tasksInitiated={[
                    { id: '1', title: 'Engagement strategy defined and documented', completed: true, timestamp: 'Just now', assignee: 'You' },
                    { id: '2', title: 'Stakeholder profiles reviewed', completed: true, timestamp: 'Today', assignee: 'You' },
                    { id: '3', title: 'Response email sent to Marcus', completed: true, timestamp: 'Just now', assignee: 'System' },
                    { id: '4', title: 'CRM updated with engagement plan', completed: true, timestamp: 'Just now', assignee: 'System' }
                  ]}
                  accomplishments={[
                    'Chose REBUILD TRUST as primary objective',
                    'Drafted accountability-focused response to Marcus escalation',
                    'Prepared structured talking points for accountability call',
                    'Scheduled 30-min call with Marcus for this week',
                    'Set up AI monitoring for meeting prep and follow-up'
                  ]}
                  nextSteps={[
                    {
                      id: '1',
                      title: 'Schedule 30-min accountability call with Marcus',
                      description: 'AI will send calendar invite and track confirmation',
                      dueDate: 'This week',
                      type: 'ai' as const
                    },
                    {
                      id: '2',
                      title: 'Monitor scheduled meeting for insights',
                      description: 'AI analyzes calendar and surfaces prep materials 24hr before',
                      dueDate: 'Day before meeting',
                      type: 'ai' as const
                    },
                    {
                      id: '3',
                      title: 'Send pre-meeting brief with talking points',
                      description: 'AI sends reminder with key discussion points 24 hours prior',
                      dueDate: '24hr before meeting',
                      type: 'ai' as const
                    },
                    {
                      id: '4',
                      title: 'Prepare root cause analysis document',
                      description: 'Compile technical details of recent service issues',
                      dueDate: 'Before meeting',
                      type: 'user' as const
                    },
                    {
                      id: '5',
                      title: 'Review talking points and practice delivery',
                      description: 'Rehearse key messages focusing on accountability',
                      dueDate: 'Day before meeting',
                      type: 'user' as const
                    }
                  ]}
                  followUpDate="Meeting TBD"
                  salesforceUpdated={true}
                  trackingEnabled={true}
                  onNextCustomer={handleAgreeAndExecute}
                  nextButtonLabel={
                    sequenceInfo && sequenceInfo.currentIndex < sequenceInfo.totalCount - 1
                      ? 'Next Workflow'
                      : 'Complete'
                  }
                />
              ) : activeStep === 'assessment' ? (
                // Step 2: Assessment Form
                <AssessmentArtifact
                  title="Initial Account Assessment"
                  subtitle="Share your insights to help create the best strategic plan"
                  customerName={customerName}
                  questionBlocks={accountAssessmentQuestions}
                  onSubmit={(answers) => {
                    // Transform answers to match expected format
                    handleAssessmentSubmit({
                      opportunityScore: answers['opportunity-score']?.score || 5,
                      opportunityReason: answers['opportunity-score']?.reason || '',
                      riskScore: answers['risk-score']?.score || 5,
                      riskReason: answers['risk-score']?.reason || '',
                      yearOverview: answers['year-overview'] || ''
                    });
                  }}
                  onBack={() => setCurrentStep('greeting')}
                />
              ) : activeStep === 'overview' ? (
                // Step 3: Account Overview
                <AccountOverviewArtifact
                  customerName={customerName}
                  contractInfo={{
                    startDate: '2024-03-15',
                    endDate: '2025-03-15',
                    term: '12 months',
                    autoRenew: true,
                    autoRenewLanguage: 'Contract auto-renews for successive 12-month periods unless either party provides written notice 30 days prior to renewal date',
                    noticePeriod: '30 days',
                    terminationClause: 'Either party may terminate with 30 days written notice',
                    pricingCaps: ['Maximum 10% annual increase', 'Volume discount caps at 20%'],
                    nonStandardTerms: ['90-day payment terms (standard: 30 days)', 'Custom success metrics tied to renewal'],
                    unsignedAmendments: ['Data processing addendum awaiting legal review'],
                    riskLevel: 'medium'
                  }}
                  contacts={[
                    { name: 'Marcus Castellan', role: 'Chief Operating Officer', email: 'marcus.castellan@apexconsolidated.ops', type: 'executive', confirmed: false },
                    { name: 'Elena Rodriguez', role: 'VP of Operations', email: 'elena.rodriguez@apexconsolidated.ops', type: 'champion', confirmed: false },
                    { name: 'David Park', role: 'Technical Operations Manager', email: 'david.park@apexconsolidated.ops', type: 'business', confirmed: false }
                  ]}
                  pricingInfo={{
                    currentARR: '$185,000',
                    lastYearARR: '$150,000',
                    seats: 50,
                    pricePerSeat: '$3,700',
                    addOns: ['Premium Support', 'Advanced Analytics', 'API Access'],
                    discounts: '20% multi-year discount applied',
                    marketPercentile: 35,
                    usageScore: 87,
                    adoptionRate: 82,
                    pricingOpportunity: 'high'
                  }}
                  onContinue={handleOverviewContinue}
                  onBack={() => setCurrentStep('assessment')}
                />
              ) : activeStep === 'recommendation' ? (
                // Step 4: Recommendation
                <RecommendationSlide
                  recommendationType={`Strategic Account Plan - ${strategyType.toUpperCase()} Strategy`}
                  reasons={getRecommendationReasons()}
                  confidenceScore={92}
                  onProceed={handleRecommendationProceed}
                  onGoBack={() => setCurrentStep('overview')}
                />
              ) : activeStep === 'strategic-plan' ? (
                // Step 5: Strategic Plan
                <StrategicAccountPlanArtifact
                  customerName={customerName}
                  strategyType={strategyType}
                  renewalDate="March 15, 2025"
                  currentARR="$185K"
                  healthScore={85}
                  growthPotential={75}
                  riskLevel={30}
                  onModify={handleModifyPlan}
                  onAgree={handleStrategicPlanProceed}
                  onComeBack={handleComeBackLater}
                />
              ) : activeStep === 'action-plan' ? (
                // Step 6: Next Actions Summary (Cached)
                <PlanSummaryArtifact
                  customerName={customerName}
                  tasksInitiated={planSummaryCache?.tasksInitiated || [
                    { id: '1', title: 'Strategic plan created and reviewed', completed: true, timestamp: 'Just now', assignee: 'You' },
                    { id: '2', title: 'Account data gathered and validated', completed: true, timestamp: 'Today', assignee: 'You' },
                    { id: '3', title: 'Stakeholders confirmed', completed: true, timestamp: 'Today', assignee: 'You' },
                    { id: '4', title: 'CRM updated with plan details', completed: true, timestamp: 'Just now', assignee: 'System' }
                  ]}
                  accomplishments={planSummaryCache?.accomplishments || [
                    `Identified ${strategyType.toUpperCase()} strategy based on account assessment`,
                    'Confirmed executive sponsor Marcus Castellan and champion Elena Rodriguez',
                    'Reviewed contract terms and identified medium risk factors',
                    'Established pricing opportunity with 87% usage and 35th percentile market position',
                    'Created comprehensive strategic account plan with clear milestones'
                  ]}
                  nextSteps={planSummaryCache?.nextSteps || [
                    {
                      id: '1',
                      title: 'Send strategic plan summary email to Marcus',
                      description: 'Automated email with plan overview and key milestones',
                      dueDate: 'Tomorrow',
                      type: 'ai' as const
                    },
                    {
                      id: '2',
                      title: 'Update CRM with strategic plan details',
                      description: 'All plan data synced to Salesforce automatically',
                      dueDate: 'Today',
                      type: 'ai' as const
                    },
                    {
                      id: '3',
                      title: 'Check back in 3 days',
                      description: "I'll send you a reminder to follow up on progress",
                      dueDate: 'Mar 20',
                      type: 'ai' as const
                    },
                    {
                      id: '4',
                      title: 'Schedule stakeholder meeting with Marcus',
                      description: '30-min call to present strategic plan',
                      dueDate: 'Mar 20, 2025',
                      type: 'user' as const
                    },
                    {
                      id: '5',
                      title: 'Review account plan before call',
                      description: 'Refresh on key points and priorities',
                      dueDate: 'Before meeting',
                      type: 'user' as const
                    }
                  ]}
                  followUpDate="April 15, 2025"
                  salesforceUpdated={true}
                  trackingEnabled={true}
                  onNextCustomer={handleAgreeAndExecute}
                  nextButtonLabel={
                    sequenceInfo && sequenceInfo.currentIndex < sequenceInfo.totalCount - 1
                      ? 'Next Workflow'
                      : 'Complete'
                  }
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Metrics Drawer - Bottom (show on all workflow steps except greeting) */}
        {activeStep !== 'greeting' && (
          <div className="flex-shrink-0 border-t border-gray-200 bg-white">
            {/* Drawer Toggle Bar */}
            <button
              onClick={() => setMetricsExpanded(!metricsExpanded)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Customer Metrics</span>
              {metricsExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            {/* Metrics Content */}
            {metricsExpanded && (
              <div className="border-t border-gray-200 p-4 animate-slide-down max-h-[300px] overflow-y-auto">
                <CustomerMetrics
                  customerId={customerId}
                  isOpen={true}
                  onToggle={() => setMetricsExpanded(false)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {showConfirmDialog === 'snooze' ? 'Snooze This Workflow?' : 'Skip This Workflow?'}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {showConfirmDialog === 'snooze'
                  ? "I'll remind you about this workflow in a few days. You'll be moved to the next workflow in the sequence."
                  : "This workflow will be marked as skipped. You'll be moved to the next workflow in the sequence."}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelConfirm}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmDialog === 'snooze' ? handleConfirmSnooze : handleConfirmSkip}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${
                  showConfirmDialog === 'snooze'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {showConfirmDialog === 'snooze' ? 'Snooze' : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
