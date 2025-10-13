'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import PlanningChecklistArtifact from '@/components/artifacts/PlanningChecklistArtifact';
import AccountAssessmentArtifact from '@/components/artifacts/AccountAssessmentArtifact';
import AccountOverviewArtifact from '@/components/artifacts/AccountOverviewArtifact';
import DiscoveryFormArtifact from '@/components/artifacts/DiscoveryFormArtifact';
import RecommendationSlide from '@/components/artifacts/RecommendationSlide';
import { ActionPlanArtifact } from '@/components/artifacts/workflows/ActionPlanArtifact';
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
  const [currentStep, setCurrentStep] = useState<'greeting' | 'assessment' | 'overview' | 'recommendation' | 'confirm' | 'action-plan'>('greeting');
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
  const [isSkipped, setIsSkipped] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true); // Start with artifacts visible
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50); // percentage
  const [isResizing, setIsResizing] = useState(false);

  const fullGreeting = `Good morning! I noticed ${customerName}'s renewal was a few weeks ago which means it's time for our annual account review. No need to stress, though. I'll guide you through the whole process. Ready to get started?`;

  // Step configuration
  const steps = [
    { key: 'greeting', label: 'Start Planning' },
    { key: 'assessment', label: 'Initial Assessment' },
    { key: 'overview', label: 'Account Overview' },
    { key: 'recommendation', label: 'Recommendation' },
    { key: 'confirm', label: 'Confirm Next Steps' },
    { key: 'action-plan', label: 'Strategic Plan' }
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
    setCurrentStep('overview');
  };

  const handleOverviewContinue = () => {
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
    setCurrentStep('confirm');
  };

  const handleConfirmProceed = () => {
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
      onClose();
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
      onClose();
    }, 1000);
  };

  const handleSnooze = async () => {
    // Show loading state on button
    setIsSnoozed(true);

    // TODO: Call backend API to snooze workflow
    // await fetch(`/api/workflows/executions/${workflowId}/actions/snooze`, { method: 'POST' });

    // Show toast notification
    showToast({
      message: 'Snoozed. I\'ll remind you about this in a little while.',
      type: 'info',
      icon: 'clock',
      duration: 3000
    });

    // Close after 1 second
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleSkip = () => {
    setIsSkipped(true);

    // Show toast notification
    showToast({
      message: 'Task skipped',
      type: 'info',
      icon: 'none',
      duration: 3000
    });

    // TODO: Call backend API to skip workflow
    // await fetch(`/api/workflows/executions/${workflowId}/actions/skip`, { method: 'POST' });

    // Close after 1 second
    setTimeout(() => {
      onClose();
    }, 1000);
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
                onClick={onClose}
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
                const isCompleted = index < currentStepIndex;
                const isUpcoming = index > currentStepIndex;

                return (
                  <React.Fragment key={step.key}>
                    {/* Step Circle and Label */}
                    <div className="flex flex-col items-center flex-1">
                      {/* Circle */}
                      <div
                        className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          font-semibold text-sm transition-all
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
                    </div>

                    {/* Connector Line (except after last step) */}
                    {index < steps.length - 1 && (
                      <div className="flex-1 px-4 pb-6">
                        <div
                          className={`
                            h-1 rounded transition-all
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

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {currentStep === 'greeting' ? (
            // Step 1: Start Planning (Split Screen)
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side - Greeting Message */}
              <div className="w-1/2 flex items-center justify-center p-12 border-r border-gray-200">
                <div className="max-w-lg w-full">
                  {/* AI Message Bubble */}
                  <div className="bg-gray-100 rounded-2xl p-6 mb-6">
                    <p className="text-gray-800 leading-relaxed">
                      {isSkipped ? (
                        <span className="line-through text-gray-500">
                          It's time to do the annual planning for {customerName}. Review the checklist to the right, and let me know if you're ready to get started.
                        </span>
                      ) : (
                        <>It's time to do the annual planning for {customerName}. Review the checklist to the right, and let me know if you're ready to get started.</>
                      )}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  {!isSkipped && !isSnoozed && (
                    <div className="flex gap-4 animate-fade-in">
                      <button
                        onClick={handleLetsDoIt}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                      >
                        Start Planning
                      </button>

                      <button
                        onClick={handleSnooze}
                        disabled={isSnoozed}
                        className="px-4 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Clock className="w-5 h-5" />
                        Snooze
                      </button>

                      <button
                        onClick={handleSkip}
                        className="px-4 py-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side - Planning Checklist */}
              <div className="w-1/2 bg-gray-50 flex flex-col overflow-hidden p-6">
                <PlanningChecklistArtifact
                  title={`Planning Checklist for ${customerName}`}
                  items={[
                    { id: '1', label: 'Review customer profile and contract details', completed: false },
                    { id: '2', label: 'Identify key stakeholders and decision makers', completed: false },
                    { id: '3', label: 'Assess account health and risk factors', completed: false },
                    { id: '4', label: 'Document growth and expansion opportunities', completed: false },
                    { id: '5', label: 'Gather insights from past year interactions', completed: false }
                  ]}
                  hideButtons={true}
                />
              </div>
            </div>
          ) : currentStep === 'assessment' ? (
            // Step 1: Initial Account Assessment
            <div className="flex-1 flex overflow-hidden p-6">
              <AccountAssessmentArtifact
                customerName={customerName}
                onSubmit={handleAssessmentSubmit}
                onBack={() => setCurrentStep('greeting')}
              />
            </div>
          ) : currentStep === 'overview' ? (
            // Step 2: Account Overview (Contract/Contact/Pricing)
            <div className="flex-1 flex overflow-hidden p-6">
              <AccountOverviewArtifact
                customerName={customerName}
                contractInfo={{
                  startDate: '2024-03-15',
                  endDate: '2025-03-15',
                  term: '12 months',
                  autoRenew: true,
                  noticePeriod: '30 days',
                  terminationClause: 'Either party may terminate with 30 days written notice'
                }}
                contacts={[
                  { name: 'Sarah Johnson', role: 'VP of Operations', email: 'sarah.j@company.com', engagement: 'high' },
                  { name: 'Mike Chen', role: 'IT Director', email: 'mike.c@company.com', engagement: 'medium' },
                  { name: 'Lisa Park', role: 'Procurement Manager', email: 'lisa.p@company.com', engagement: 'low' }
                ]}
                pricingInfo={{
                  currentARR: '$185,000',
                  lastYearARR: '$150,000',
                  seats: 50,
                  pricePerSeat: '$3,700',
                  addOns: ['Premium Support', 'Advanced Analytics', 'API Access'],
                  discounts: '20% multi-year discount applied'
                }}
                onContinue={handleOverviewContinue}
                onBack={() => setCurrentStep('assessment')}
              />
            </div>
          ) : currentStep === 'recommendation' ? (
            // Step 3: Recommendation
            <div className="flex-1 flex overflow-hidden p-6">
              <RecommendationSlide
                recommendationType={`Strategic Account Plan - ${strategyType.toUpperCase()} Strategy`}
                reasons={getRecommendationReasons()}
                confidenceScore={92}
                onProceed={handleRecommendationProceed}
                onGoBack={() => setCurrentStep('overview')}
              />
            </div>
          ) : currentStep === 'confirm' ? (
            // Step 4: Confirm Next Steps
            <div className="flex-1 flex overflow-hidden p-6">
              <PlanningChecklistArtifact
                title="Confirm Next Steps"
                items={[
                  { id: '1', label: 'Review strategic account plan timeline', completed: false },
                  { id: '2', label: 'Assign ownership for each milestone', completed: false },
                  { id: '3', label: 'Set calendar reminders for key dates', completed: false },
                  { id: '4', label: 'Prepare communication plan for stakeholders', completed: false },
                  { id: '5', label: 'Schedule first checkpoint meeting', completed: false }
                ]}
                onLetsDoIt={handleConfirmProceed}
                onNotYet={() => setCurrentStep('recommendation')}
                onGoBack={() => setCurrentStep('recommendation')}
              />
            </div>
          ) : currentStep === 'action-plan' ? (
            // Step 5: Strategic Account Plan
            <div className="flex-1 flex overflow-hidden p-6">
              <StrategicAccountPlanArtifact
                customerName={customerName}
                strategyType={strategyType}
                renewalDate="March 15, 2025"
                currentARR="$185K"
                healthScore={85}
                growthPotential={75}
                riskLevel={30}
                onModify={handleModifyPlan}
                onAgree={handleAgreeAndExecute}
                onComeBack={handleComeBackLater}
              />
            </div>
          ) : null}
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
