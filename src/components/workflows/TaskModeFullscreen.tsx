'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, ChevronDown, ChevronUp, Mic, Paperclip, Edit3 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import PlanningChecklistArtifact from '@/components/artifacts/PlanningChecklistArtifact';
import AccountAssessmentArtifact from '@/components/artifacts/AccountAssessmentArtifact';
import AccountOverviewArtifact from '@/components/artifacts/AccountOverviewArtifact';
import DiscoveryFormArtifact from '@/components/artifacts/DiscoveryFormArtifact';
import RecommendationSlide from '@/components/artifacts/RecommendationSlide';
import PlanSummaryArtifact from '@/components/artifacts/PlanSummaryArtifact';
import StrategicAccountPlanArtifact from '@/components/artifacts/StrategicAccountPlanArtifact';
import { CustomerMetrics } from './CustomerMetrics';

interface TaskModeFullscreenProps {
  workflowId: string;
  workflowTitle: string;
  customerId: string;
  customerName: string;
  onClose: () => void;
}

export default function TaskModeFullscreen({
  workflowId,
  workflowTitle,
  customerId,
  customerName,
  onClose
}: TaskModeFullscreenProps) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<'greeting' | 'assessment' | 'overview' | 'recommendation' | 'strategic-plan' | 'action-plan'>('greeting');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set(['greeting'])); // Track all visited/completed steps
  const [pendingAction, setPendingAction] = useState<'skip' | 'snooze' | null>(null); // Track temporary exit action
  const [assessmentAnswers, setAssessmentAnswers] = useState<{
    opportunityScore: number;
    opportunityReason: string;
    riskScore: number;
    riskReason: string;
    yearOverview: string;
  } | null>(null);
  const [strategyType, setStrategyType] = useState<'expand' | 'invest' | 'protect'>('expand');
  const [greetingText, setGreetingText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true); // Start with artifacts visible
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);

  // Cache the plan summary data once generated
  const [planSummaryCache, setPlanSummaryCache] = useState<{
    tasksInitiated: any[];
    accomplishments: string[];
    nextSteps: any[];
  } | null>(null);

  const fullGreeting = `Good morning! I noticed ${customerName}'s renewal was a few weeks ago which means it's time for our annual account review. No need to stress, though. I'll guide you through the whole process. Ready to get started?`;

  // Step configuration
  const steps = [
    { key: 'greeting', label: 'Start Planning' },
    { key: 'assessment', label: 'Initial Assessment' },
    { key: 'overview', label: 'Account Overview' },
    { key: 'recommendation', label: 'Recommendation' },
    { key: 'strategic-plan', label: 'Strategic Plan' },
    { key: 'action-plan', label: 'Next Actions' }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === currentStep);
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
    if (currentStep === 'greeting' && greetingText.length < fullGreeting.length) {
      const timeout = setTimeout(() => {
        setGreetingText(fullGreeting.slice(0, greetingText.length + 1));
      }, 5); // 5ms per character (4x faster than original)
      return () => clearTimeout(timeout);
    } else if (greetingText.length === fullGreeting.length && !showButtons) {
      // Show buttons after typing completes
      setTimeout(() => setShowButtons(true), 300);
    }
  }, [greetingText, currentStep, showButtons, fullGreeting]);

  const handleLetsDoIt = () => {
    setCompletedSteps(prev => new Set(prev).add('assessment'));
    setCurrentStep('assessment');
    setMetricsExpanded(false); // Start with metrics collapsed
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
    showToast({
      message: 'Strategic Plan accepted! Starting execution...',
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    // TODO: Mark workflow as complete in backend
    setTimeout(() => {
      handleClose();
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

  const handleSnooze = () => {
    // Set pending action but don't close - allow user to change their mind
    setPendingAction('snooze');

    // Show toast notification
    showToast({
      message: 'Marked to snooze. I\'ll remind you later when you exit.',
      type: 'info',
      icon: 'clock',
      duration: 3000
    });
  };

  const handleSkip = () => {
    // Set pending action but don't close - allow user to change their mind
    setPendingAction('skip');

    // Show toast notification
    showToast({
      message: 'Marked to skip. This will be saved when you exit.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });
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
                const isCompleted = completedSteps.has(step.key) && !isActive;
                const isUpcoming = !completedSteps.has(step.key) && !isActive;
                const isClickable = completedSteps.has(step.key);

                return (
                  <React.Fragment key={step.key}>
                    {/* Step Circle and Label */}
                    <button
                      onClick={() => isClickable && setCurrentStep(step.key as any)}
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
          {/* Left Panel - Chat/Context */}
          <div
            className="flex flex-col bg-white"
            style={{ width: showArtifacts ? `${100 - artifactsPanelWidth}%` : '100%' }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {currentStep === 'greeting' ? (
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
              ) : currentStep === 'assessment' ? (
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
              ) : currentStep === 'overview' ? (
                // Step 3: Overview - Chat Context
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
              ) : currentStep === 'recommendation' ? (
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
              ) : currentStep === 'strategic-plan' ? (
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
              ) : currentStep === 'action-plan' ? (
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
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder:text-gray-300"
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
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
              {currentStep === 'greeting' ? (
                // Step 1: Planning Checklist
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
              ) : currentStep === 'assessment' ? (
                // Step 2: Assessment Form
                <AccountAssessmentArtifact
                  customerName={customerName}
                  onSubmit={handleAssessmentSubmit}
                  onBack={() => setCurrentStep('greeting')}
                />
              ) : currentStep === 'overview' ? (
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
              ) : currentStep === 'recommendation' ? (
                // Step 4: Recommendation
                <RecommendationSlide
                  recommendationType={`Strategic Account Plan - ${strategyType.toUpperCase()} Strategy`}
                  reasons={getRecommendationReasons()}
                  confidenceScore={92}
                  onProceed={handleRecommendationProceed}
                  onGoBack={() => setCurrentStep('overview')}
                />
              ) : currentStep === 'strategic-plan' ? (
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
              ) : currentStep === 'action-plan' ? (
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
                />
              ) : null}
            </div>
          )}
        </div>

        {/* Metrics Drawer - Bottom (show on all workflow steps except greeting) */}
        {currentStep !== 'greeting' && (
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
    </div>
  );
}
