'use client';

/**
 * TaskModeFullscreen v3 - Config-Driven Architecture
 *
 * Phase 2D: Configuration Consolidation
 *
 * This is the new config-driven version that loads workflow definitions
 * from the workflow config registry and renders them generically.
 *
 * Key improvements over v2:
 * - Single source of truth (workflow configs)
 * - No hardcoded workflow logic
 * - Generic slide renderer
 * - Easier to add new workflows
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, ChevronDown, ChevronUp, Mic, Paperclip, Edit3 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { getWorkflowConfig } from '@/config/workflows';
import { WorkflowConfig, WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

// Workflow section components
import WorkflowHeader from '@/components/workflows/sections/WorkflowHeader';
import WorkflowStepProgress from '@/components/workflows/sections/WorkflowStepProgress';
import ChatRenderer, { ChatMessage } from '@/components/workflows/sections/ChatRenderer';

// Artifact renderer
import ArtifactRenderer from '@/components/workflows/renderers/ArtifactRenderer';

// Artifact components
import PlanningChecklistArtifact from '@/components/artifacts/PlanningChecklistArtifact';
import { AssessmentArtifact, accountAssessmentQuestions, growthAssessmentQuestions, executiveEngagementQuestions } from '@/components/artifacts/assessment';
import AccountOverviewArtifact from '@/components/artifacts/AccountOverviewArtifact';
import RecommendationSlide from '@/components/artifacts/RecommendationSlide';
import PlanSummaryArtifact from '@/components/artifacts/PlanSummaryArtifact';
import StrategicAccountPlanArtifact from '@/components/artifacts/StrategicAccountPlanArtifact';
import StrategicRecommendationWithPlan from '@/components/artifacts/StrategicRecommendationWithPlan';
import ExpansionOverviewArtifact from '@/components/artifacts/ExpansionOverviewArtifact';
import ExpansionProposalArtifact from '@/components/artifacts/ExpansionProposalArtifact';
import StakeholderProfileArtifact from '@/components/artifacts/StakeholderProfileArtifact';
import TalkingPointsArtifact from '@/components/artifacts/TalkingPointsArtifact';
import EmailArtifact from '@/components/artifacts/EmailArtifact';
import { CustomerMetrics } from './CustomerMetrics';
import WorkflowSequencePanel from './WorkflowSequencePanel';
import { getWorkflowSequence } from '@/config/workflowSequences';
import { useWorkflowContext } from '@/lib/data-providers';

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

  // Load workflow configuration
  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load workflow context from database
  const { customer, expansionData, stakeholders, loading: contextLoading, error: contextError } = useWorkflowContext(
    workflowId,
    customerId
  );

  // Core workflow state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set([0]));
  const [workflowState, setWorkflowState] = useState<Record<string, any>>({}); // Generic state storage

  // UI state
  const [greetingText, setGreetingText] = useState('');
  const [showButtons, setShowButtons] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const [showPlaysDropdown, setShowPlaysDropdown] = useState(false);
  const [showMetricsSlideup, setShowMetricsSlideup] = useState(false);
  const [stepActionMenu, setStepActionMenu] = useState<number | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{ type: 'skip' | 'snooze' | null, stepIndex: number | null }>({ type: null, stepIndex: null });
  const [completedWorkflows, setCompletedWorkflows] = useState<Set<number>>(new Set());

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [chatInputValue, setChatInputValue] = useState('');
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Load workflow config on mount
  useEffect(() => {
    const loadedConfig = getWorkflowConfig(workflowId);

    if (!loadedConfig) {
      setConfigError(`No configuration found for workflow: ${workflowId}`);
      console.error('[TaskMode] Config not found:', workflowId);
    } else {
      setConfig(loadedConfig);
      console.log('[TaskMode] Loaded config for:', workflowId, loadedConfig);
    }
  }, [workflowId]);

  // Get current slide from config
  const currentSlide = config?.slides?.[currentSlideIndex];
  const slides = config?.slides || [];
  const totalSteps = slides.length;

  // Typing animation for greeting on first slide
  const fullGreeting = currentSlide?.chat?.initialMessage?.text?.replace(/\{\{customerName\}\}/g, customerName) || '';

  useEffect(() => {
    if (currentSlideIndex === 0 && greetingText.length < fullGreeting.length) {
      const timeout = setTimeout(() => {
        setGreetingText(fullGreeting.slice(0, greetingText.length + 1));
      }, 5);
      return () => clearTimeout(timeout);
    } else if (greetingText.length === fullGreeting.length && !showButtons) {
      setTimeout(() => setShowButtons(true), 300);
    }
  }, [greetingText, currentSlideIndex, fullGreeting, showButtons]);

  // Navigation handlers
  const goToNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      const nextIndex = currentSlideIndex + 1;
      setCompletedSlides(prev => new Set(prev).add(nextIndex));
      setCurrentSlideIndex(nextIndex);
      setMetricsExpanded(false);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToSlide = (index: number) => {
    if (completedSlides.has(index)) {
      setCurrentSlideIndex(index);
    }
  };

  // Button handlers
  const handleButtonClick = (buttonValue: string) => {
    if (buttonValue === 'start') {
      goToNextSlide();
    } else if (buttonValue === 'snooze') {
      handleSnooze();
    } else if (buttonValue === 'skip') {
      handleSkip();
    }
  };

  const handleSnooze = () => {
    showToast({
      message: 'No problem, I\'ll remind you in a few days.',
      type: 'info',
      icon: 'clock',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose();
      }
    }, 1500);
  };

  const handleSkip = () => {
    showToast({
      message: 'Workflow skipped. Moving to next workflow.',
      type: 'info',
      icon: 'none',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose();
      }
    }, 1500);
  };

  const handleComplete = () => {
    const message = sequenceInfo
      ? 'Workflow complete! Loading next workflow...'
      : 'Workflow complete!';

    showToast({
      message,
      type: 'success',
      icon: 'check',
      duration: 3000
    });

    setTimeout(() => {
      if (sequenceInfo) {
        sequenceInfo.onNextWorkflow();
      } else {
        onClose();
      }
    }, 1500);
  };

  // State update helper for artifacts
  const handleUpdateState = (key: string, value: any) => {
    setWorkflowState({ ...workflowState, [key]: value });
  };

  // Chat message handlers
  const handleSendMessage = (message: string) => {
    // Add user message to history
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Config-driven text response routing
    // If current branch has nextBranchOnText, use it
    if (currentBranch && currentSlide?.chat?.branches) {
      const branch = currentSlide.chat.branches[currentBranch];

      if ('nextBranchOnText' in branch && branch.nextBranchOnText) {
        handleBranchNavigation(branch.nextBranchOnText, message);
        return;
      }
    }

    // Check for userTriggers pattern matching
    if (currentSlide?.chat?.userTriggers) {
      for (const [pattern, branchName] of Object.entries(currentSlide.chat.userTriggers)) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(message)) {
          handleBranchNavigation(branchName, message);
          return;
        }
      }
    }

    // If no trigger matched, show default message
    if (currentSlide?.chat?.defaultMessage) {
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        text: currentSlide.chat.defaultMessage,
        sender: 'ai',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiMessage]);
    }
  };

  const handleBranchNavigation = (branchName: string, value?: any) => {
    const branch = currentSlide?.chat?.branches[branchName];
    if (!branch) {
      console.warn('[ChatRenderer] Branch not found:', branchName);
      return;
    }

    // Store value if storeAs is specified (for text input from previous branch)
    // This handles the case when user sends text and nextBranchOnText routes here
    if (value !== undefined && 'storeAs' in branch && branch.storeAs) {
      console.log(`[handleBranchNavigation] Storing value "${value}" with key "${branch.storeAs}"`);
      setWorkflowState(prev => {
        const newState = { ...prev, [branch.storeAs!]: value };
        console.log('[handleBranchNavigation] New workflowState:', newState);
        return newState;
      });
    }

    // Add AI response message
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}-${branchName}`,
      text: branch.response,
      sender: 'ai',
      timestamp: new Date(),
      component: branch.component,
      buttons: branch.buttons
    };

    // Apply delay if specified
    if (branch.predelay) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, aiMessage]);
      }, branch.predelay * 1000);
    } else {
      setChatMessages(prev => [...prev, aiMessage]);
    }

    setCurrentBranch(branchName);

    // Execute branch actions
    if (branch.actions) {
      executeBranchActions(branch.actions, branch.artifactId, branch.stepId, branch.stepNumber);
    }

    // Auto-advance to next branch if specified
    if (branch.autoAdvance) {
      const nextBranch = typeof branch.autoAdvance === 'string' ? branch.autoAdvance : branch.nextBranch;
      if (nextBranch) {
        const delay = branch.delay || 1;
        setTimeout(() => {
          handleBranchNavigation(nextBranch);
        }, delay * 1000);
      }
    }
  };

  const handleComponentValueChange = (componentId: string, value: any) => {
    // Format the value for display
    let displayValue = value;
    if (Array.isArray(value)) {
      displayValue = value.join(', ');
    } else if (typeof value === 'object') {
      displayValue = JSON.stringify(value);
    } else {
      displayValue = String(value);
    }

    // Add user's submitted value as a message
    const userMessage: ChatMessage = {
      id: `user-component-${Date.now()}`,
      text: displayValue,
      sender: 'user',
      timestamp: new Date(),
      componentValue: value
    };
    setChatMessages(prev => [...prev, userMessage]);

    // If currentBranch is set, navigate to that branch (for initial message components)
    // Otherwise, look for nextBranch in the current branch
    if (currentBranch) {
      const branch = currentSlide?.chat?.branches[currentBranch];

      // Store value if storeAs is specified
      if (branch && 'storeAs' in branch && branch.storeAs) {
        console.log(`[handleComponentValueChange] Storing component value "${value}" with key "${branch.storeAs}"`);
        setWorkflowState(prev => {
          const newState = { ...prev, [branch.storeAs!]: value };
          console.log('[handleComponentValueChange] New workflowState:', newState);
          return newState;
        });
      }

      // Navigate to the current branch to show its response (for initial message components)
      // Or navigate to nextBranch if specified (for branch components)
      if (branch && 'nextBranch' in branch && branch.nextBranch) {
        console.log(`[handleComponentValueChange] Navigating to nextBranch: ${branch.nextBranch}`);
        handleBranchNavigation(branch.nextBranch, value);
      } else {
        // If no nextBranch, navigate to currentBranch to show its response
        console.log(`[handleComponentValueChange] Navigating to currentBranch: ${currentBranch}`);
        handleBranchNavigation(currentBranch, value);
      }
    }
  };

  const executeBranchActions = (
    actions: string[],
    artifactId?: string,
    stepId?: string,
    stepNumber?: number
  ) => {
    for (const action of actions) {
      switch (action) {
        case 'nextSlide':
        case 'goToNextSlide':
          goToNextSlide();
          break;

        case 'previousSlide':
        case 'goToPreviousSlide':
          goToPreviousSlide();
          break;

        case 'completeStep':
          if (stepId) {
            // Mark step as completed (if sidePanel is implemented)
            console.log('[Action] Complete step:', stepId);
          }
          break;

        case 'enterStep':
          if (stepNumber !== undefined) {
            setCurrentSlideIndex(stepNumber);
          }
          break;

        case 'launch-artifact':
        case 'showArtifact':
          if (artifactId) {
            setShowArtifacts(true);
            // TODO: Scroll to specific artifact if multiple exist
            console.log('[Action] Show artifact:', artifactId);
          }
          break;

        case 'removeArtifact':
          setShowArtifacts(false);
          break;

        case 'exitTaskMode':
          onClose();
          break;

        case 'nextCustomer':
          handleComplete();
          break;

        case 'resetChat':
          setChatMessages([]);
          setCurrentBranch(null);
          break;

        default:
          console.warn('[Action] Unknown action:', action);
      }
    }
  };

  // Initialize chat messages when slide changes
  useEffect(() => {
    if (!currentSlide) return;

    // Reset chat for new slide
    setChatMessages([]);
    setCurrentBranch(null);

    // Add initial message if present
    if (currentSlide.chat?.initialMessage) {
      const initialMessage: ChatMessage = {
        id: `ai-initial-${currentSlideIndex}`,
        text: currentSlide.chat.initialMessage.text,
        sender: 'ai',
        timestamp: new Date(),
        component: currentSlide.chat.initialMessage.component, // Support inline components in initial messages
        buttons: currentSlide.chat.initialMessage.buttons
      };

      // Apply typing animation delay for first slide only
      if (currentSlideIndex === 0) {
        setTimeout(() => {
          setChatMessages([initialMessage]);
        }, 500);
      } else {
        setChatMessages([initialMessage]);
      }

      // Set initial branch if component present (so component submission knows where to go)
      if (currentSlide.chat.initialMessage.component) {
        setCurrentBranch('initial');
      }
    }
  }, [currentSlideIndex, currentSlide]);

  // Auto-focus input when new messages expect text response
  useEffect(() => {
    if (chatMessages.length === 0) return;

    const lastMessage = chatMessages[chatMessages.length - 1];

    // Focus input if last message is from AI and doesn't have a component or buttons
    // (meaning it's expecting a text response)
    const needsTextInput = lastMessage.sender === 'ai' &&
                          !lastMessage.component &&
                          !lastMessage.buttons;

    if (needsTextInput && chatInputRef.current) {
      // Small delay to ensure message is rendered before focusing
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [chatMessages]);

  // Auto-hide/show artifacts based on current slide and branch
  useEffect(() => {
    if (!currentSlide) return;

    // Check if current slide has any artifacts that should be visible for the current branch
    const hasVisibleArtifacts = currentSlide.artifacts?.sections &&
                                currentSlide.artifacts.sections.length > 0 &&
                                currentSlide.artifacts.sections.some(section => {
                                  if (section.visible === false) return false;

                                  // Check if this artifact has a showWhenBranch condition
                                  const showWhenBranch = section.data?.showWhenBranch;
                                  if (showWhenBranch) {
                                    // Only show if current branch matches
                                    return currentBranch === showWhenBranch;
                                  }

                                  // No condition, show by default
                                  return true;
                                });

    // Update showArtifacts state to match
    setShowArtifacts(hasVisibleArtifacts);
  }, [currentSlideIndex, currentSlide, currentBranch]);

  // Generic artifact renderer
  const renderArtifact = (slide: WorkflowSlide) => {
    if (!slide.artifacts?.sections || slide.artifacts.sections.length === 0) {
      return null;
    }

    const section = slide.artifacts.sections[0]; // For now, render first section

    return (
      <ArtifactRenderer
        slide={slide}
        section={section}
        customerName={customerName}
        workflowState={workflowState}
        customer={customer}
        expansionData={expansionData}
        stakeholders={stakeholders || []}
        sequenceInfo={sequenceInfo}
        onNext={goToNextSlide}
        onBack={goToPreviousSlide}
        onClose={onClose}
        onComplete={handleComplete}
        onUpdateState={handleUpdateState}
      />
    );
  };

  // Legacy inline artifact rendering (DEPRECATED - moved to ArtifactRenderer)
  // This section is kept temporarily for reference and will be removed after verification
  const _legacyRenderArtifact_DEPRECATED = (slide: WorkflowSlide) => {
    if (!slide.artifacts?.sections || slide.artifacts.sections.length === 0) {
      return null;
    }

    const section = slide.artifacts.sections[0]; // For now, render first section

    // Handle custom artifacts with componentType
    if (section.type === 'custom' && section.data?.componentType) {
      const componentType = section.data.componentType;
      const props = section.data.props || {};

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
                setWorkflowState({ ...workflowState, [`${slide.id}_answers`]: answers });
                goToNextSlide();
              }}
              onBack={goToPreviousSlide}
            />
          );

        case 'RecommendationSlide':
          // Derive reasons from assessment answers and customer context
          const assessmentAnswers = Object.keys(workflowState)
            .filter(key => key.includes('_answers'))
            .map(key => workflowState[key])
            .find(v => v); // Get the first assessment answers

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

          return (
            <RecommendationSlide
              recommendationType={section.title}
              reasons={reasons}
              confidenceScore={workflowState.confidenceScore || 85}
              onProceed={goToNextSlide}
              onGoBack={goToPreviousSlide}
            />
          );

        case 'AccountOverviewArtifact':
          // Transform expansion data to contract info format
          const contractInfo = expansionData?.contract ? {
            startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
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
              onContinue={goToNextSlide}
              onBack={goToPreviousSlide}
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
              onModify={goToPreviousSlide}
              onAgree={goToNextSlide}
              onComeBack={onClose}
            />
          );

        case 'StrategicRecommendationWithPlan':
          // This combines the Recommendation + Strategic Plan into one tabbed view
          // Derive strategy type from assessment or default to 'expand'
          const strategyType: 'expand' | 'invest' | 'protect' =
            workflowState.strategyType || 'expand';

          // Get recommendation reasons (from RecommendationSlide logic above)
          const recAnswers = Object.keys(workflowState)
            .filter(key => key.includes('_answers'))
            .map(key => workflowState[key])
            .find(v => v);

          const recReasons = [];
          if (recAnswers) {
            const oppScore = recAnswers['opportunity-score']?.score;
            const riskScore = recAnswers['risk-score']?.score;

            if (oppScore && oppScore >= 7) {
              recReasons.push({
                icon: 'trending',
                text: `High growth opportunity detected (score: ${oppScore}/10)`,
                highlight: true
              });
            }
            if (riskScore && riskScore >= 7) {
              recReasons.push({
                icon: 'alert',
                text: `Elevated risk level identified (score: ${riskScore}/10)`,
                highlight: true
              });
            }
          }

          if (customer) {
            if (customer.healthScore < 60) {
              recReasons.push({
                icon: 'alert',
                text: `Account health needs attention (${customer.healthScore}% health score)`,
                highlight: false
              });
            }
            if (customer.arr > 150000) {
              recReasons.push({
                icon: 'target',
                text: `Strategic account value: $${Math.round(customer.arr / 1000)}K ARR`,
                highlight: false
              });
            }
          }

          if (expansionData) {
            if (expansionData.usage.utilizationPercent > 100) {
              recReasons.push({
                icon: 'trending',
                text: `Over capacity at ${Math.round(expansionData.usage.utilizationPercent)}% utilization`,
                highlight: false
              });
            }
            if (expansionData.market.percentile < 40) {
              recReasons.push({
                icon: 'check',
                text: `Strong pricing opportunity (below market average)`,
                highlight: false
              });
            }
          }

          // Get workflow steps from the config (nested under props in the config)
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
              onModify={goToPreviousSlide}
              onAgree={goToNextSlide}
              onComeBack={onClose}
            />
          );

        case 'ExpansionOverviewArtifact':
          return (
            <ExpansionOverviewArtifact
              customerName={customerName}
              contractInfo={expansionData?.contract}
              usageInfo={expansionData?.usage}
              marketInfo={expansionData?.market}
              onContinue={goToNextSlide}
              onBack={goToPreviousSlide}
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
                setWorkflowState({ ...workflowState, selectedScenario: scenarioId });
              }}
              onContinue={goToNextSlide}
              onBack={goToPreviousSlide}
            />
          );

        case 'StakeholderProfileArtifact':
          return (
            <StakeholderProfileArtifact
              customerName={customerName}
              stakeholders={stakeholders || []}
              onContinue={goToNextSlide}
              onBack={goToPreviousSlide}
            />
          );

        case 'TalkingPointsArtifact':
          return (
            <TalkingPointsArtifact
              customerName={customerName}
              initialPoints={[]} // TODO: Load from config
              onContinue={goToNextSlide}
              onBack={goToPreviousSlide}
            />
          );

        case 'PlanSummaryArtifact':
          // Generate tasks initiated during workflow
          const tasksInitiated = [
            { id: '1', title: 'Account assessment completed', completed: true, timestamp: 'Just now', assignee: 'You' },
            { id: '2', title: 'Strategic recommendation generated', completed: true, timestamp: 'Just now', assignee: 'AI' },
            { id: '3', title: 'Plan documentation created', completed: true, timestamp: 'Just now', assignee: 'AI' }
          ];

          // Generate workflow-specific accomplishments
          const accomplishments = [
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
            description: `Automated email to account owner with plan overview`,
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

          // Calculate follow-up date (7 days from now)
          const followUpDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

          return (
            <PlanSummaryArtifact
              customerName={customerName}
              tasksInitiated={tasksInitiated}
              accomplishments={accomplishments}
              nextSteps={nextSteps}
              followUpDate={followUpDate}
              salesforceUpdated={true}
              trackingEnabled={true}
              onNextCustomer={handleComplete}
              nextButtonLabel={
                sequenceInfo && sequenceInfo.currentIndex < sequenceInfo.totalCount - 1
                  ? 'Next Workflow'
                  : 'Complete'
              }
            />
          );

        default:
          return <div className="p-8 text-gray-500">Unknown component: {componentType}</div>;
      }
    }

    // Handle standard artifact types
    switch (section.type) {
      case 'planning-checklist':
        return (
          <PlanningChecklistArtifact
            title={section.title.replace(/\{\{customerName\}\}/g, customerName)}
            items={section.data?.items || []}
            showActions={section.data?.showActions !== false}
          />
        );

      case 'email':
        return (
          <EmailArtifact
            to={section.data?.to || ''}
            subject={section.data?.subject || ''}
            body={section.data?.body || ''}
            onCompose={goToNextSlide}
            onBack={goToPreviousSlide}
            sendButtonLabel={section.data?.sendButtonLabel}
          />
        );

      case 'plan-summary':
        // Use data from config or generate default
        const summaryTasksInitiated = section.data?.tasksInitiated || [
          { id: '1', title: 'Account assessment completed', completed: true, timestamp: 'Just now', assignee: 'You' },
          { id: '2', title: 'Strategic recommendation generated', completed: true, timestamp: 'Just now', assignee: 'AI' },
          { id: '3', title: 'Plan documentation created', completed: true, timestamp: 'Just now', assignee: 'AI' }
        ];

        const summaryAccomplishments = section.data?.accomplishments || [
          'Completed comprehensive account assessment',
          'Analyzed customer data and relationship status',
          'Identified key risks and opportunities',
          'Generated strategic recommendations'
        ];

        const summaryNextSteps = section.data?.nextSteps || [
          {
            id: '1',
            title: 'Send strategic plan summary email',
            description: 'Automated email to account owner with plan overview',
            dueDate: 'Tomorrow',
            type: 'ai' as const
          },
          {
            id: '2',
            title: 'Update CRM with strategic plan',
            description: 'All plan data synced to Salesforce automatically',
            dueDate: 'Today',
            type: 'ai' as const
          },
          {
            id: '3',
            title: 'Set follow-up reminder',
            description: "I'll send you a reminder to check on progress",
            dueDate: 'In 7 days',
            type: 'ai' as const
          },
          {
            id: '4',
            title: 'Review strategic plan with team',
            description: 'Share findings and align on execution approach',
            dueDate: 'This week',
            type: 'user' as const
          }
        ];

        const summaryFollowUpDate = section.data?.followUpDate ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });

        return (
          <PlanSummaryArtifact
            customerName={customerName}
            tasksInitiated={summaryTasksInitiated}
            accomplishments={summaryAccomplishments}
            nextSteps={summaryNextSteps}
            followUpDate={summaryFollowUpDate}
            salesforceUpdated={section.data?.salesforceUpdated !== false}
            trackingEnabled={section.data?.trackingEnabled !== false}
            onNextCustomer={handleComplete}
            nextButtonLabel={
              sequenceInfo && sequenceInfo.currentIndex < sequenceInfo.totalCount - 1
                ? 'Next Workflow'
                : 'Complete'
            }
          />
        );

      default:
        return (
          <div className="p-8">
            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
            <p className="text-gray-500">Artifact type "{section.type}" not yet implemented</p>
          </div>
        );
    }
  };

  // Render chat content using ChatRenderer
  const renderChatContent = () => {
    if (!currentSlide) return null;

    // Handle button clicks from initial message or branch buttons
    const handleChatButtonClick = (buttonValue: string) => {
      // First, check if we're in a branch that has nextBranches
      if (currentBranch && currentSlide.chat?.branches) {
        const branch = currentSlide.chat.branches[currentBranch];
        if (branch && 'nextBranches' in branch && branch.nextBranches && branch.nextBranches[buttonValue]) {
          handleBranchNavigation(branch.nextBranches[buttonValue]);
          return;
        }
      }

      // Then check if this button triggers a branch from initial message
      const initialMessage = currentSlide.chat?.initialMessage;
      if (initialMessage?.nextBranches && initialMessage.nextBranches[buttonValue]) {
        handleBranchNavigation(initialMessage.nextBranches[buttonValue]);
      } else {
        // Fallback to legacy button handler
        handleButtonClick(buttonValue);
      }
    };

    return (
      <ChatRenderer
        currentSlide={currentSlide}
        chatMessages={chatMessages}
        workflowState={workflowState}
        customerName={customerName}
        onSendMessage={handleSendMessage}
        onBranchNavigation={handleBranchNavigation}
        onComponentValueChange={handleComponentValueChange}
        onButtonClick={handleChatButtonClick}
      />
    );
  };

  // Resize handling
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newWidth = ((windowWidth - e.clientX) / windowWidth) * 100;
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

  // Loading state
  if (!config && !configError) {
    return (
      <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading workflow configuration...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (configError || !config) {
    return (
      <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h2>
          <p className="text-gray-700 mb-6">{configError || 'Unknown error loading workflow configuration'}</p>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#2D1271] flex items-center justify-center p-8">
      {/* Workstation Container - relative for dropdown positioning */}
      <div className="relative w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Plays Dropdown Panel - positioned relative to workstation */}
        {showPlaysDropdown && sequenceInfo && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
              onClick={() => setShowPlaysDropdown(false)}
            />
            {/* Dropdown */}
            <div
              id="plays-dropdown"
              className="absolute top-16 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white rounded-lg shadow-2xl z-50 animate-slide-down border border-gray-200"
              style={{ maxHeight: '60vh', overflow: 'auto' }}
            >
              <WorkflowSequencePanel
                workflows={getWorkflowSequence(sequenceInfo.sequenceId)?.workflows || []}
                currentIndex={sequenceInfo.currentIndex}
                onSelectWorkflow={(index) => {
                  setCompletedWorkflows(prev => new Set(prev).add(sequenceInfo.currentIndex));
                  sequenceInfo.onJumpToWorkflow?.(index);
                  setShowPlaysDropdown(false);
                }}
                completedWorkflows={completedWorkflows}
                isDropdown={true}
              />
            </div>
          </>
        )}

        {/* Header */}
        <WorkflowHeader
          workflowTitle={workflowTitle}
          customerName={customerName}
          currentSlideIndex={currentSlideIndex}
          showArtifacts={showArtifacts}
          sequenceInfo={sequenceInfo}
          onEscalate={() => showToast({
            message: 'Escalation workflow coming soon!',
            type: 'info',
            icon: 'none',
            duration: 2000
          })}
          onTogglePlays={() => setShowPlaysDropdown(!showPlaysDropdown)}
          onToggleMetrics={() => setShowMetricsSlideup(!showMetricsSlideup)}
          onToggleArtifacts={() => setShowArtifacts(!showArtifacts)}
          onClose={onClose}
        />

        {/* Step Progress */}
        <WorkflowStepProgress
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          completedSlides={completedSlides}
          stepActionMenu={stepActionMenu}
          onStepClick={goToSlide}
          onToggleStepActionMenu={setStepActionMenu}
          onSnoozeStep={(index) => {
            setConfirmationModal({ type: 'snooze', stepIndex: index });
            setStepActionMenu(null);
          }}
          onSkipStep={(index) => {
            setConfirmationModal({ type: 'skip', stepIndex: index });
            setStepActionMenu(null);
          }}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden" id="main-content-area">

          {/* Left Panel - Chat */}
          <div
            id="chat-panel"
            className="flex flex-col bg-white transition-all duration-500 ease-in-out"
            style={{ width: showArtifacts ? `${100 - artifactsPanelWidth}%` : '100%' }}
          >
            <div className="flex-1 overflow-y-auto">
              {contextLoading ? (
                <div className="flex items-center justify-center p-12 h-full">
                  <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600">Loading workflow data...</p>
                  </div>
                </div>
              ) : contextError ? (
                <div className="flex items-center justify-center p-12 h-full">
                  <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-red-600 text-2xl">⚠</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Workflow Data</h3>
                    <p className="text-gray-600">{contextError.message}</p>
                  </div>
                </div>
              ) : (
                renderChatContent()
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex gap-2 items-end max-w-4xl mx-auto">
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInputValue}
                  onChange={(e) => setChatInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && chatInputValue.trim()) {
                      handleSendMessage(chatInputValue.trim());
                      setChatInputValue('');
                    }
                  }}
                  placeholder={config.chat.placeholder}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={() => {
                    if (chatInputValue.trim()) {
                      handleSendMessage(chatInputValue.trim());
                      setChatInputValue('');
                    }
                  }}
                  disabled={!chatInputValue.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Resizable Divider */}
          {showArtifacts && (
            <div
              onMouseDown={handleResizeStart}
              className={`w-3 bg-gray-200 hover:bg-blue-400 cursor-col-resize relative group flex-shrink-0 ${isResizing ? 'bg-blue-500' : ''}`}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-16 bg-gray-300 group-hover:bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-0.5 h-12 bg-white/50 rounded-full"></div>
              </div>
            </div>
          )}

          {/* Right Panel - Artifacts */}
          {showArtifacts && (
            <div
              id="artifacts-panel"
              className="bg-gray-50 border-l border-gray-200 flex flex-col overflow-hidden transition-all duration-500 ease-in-out animate-slide-in-from-right"
              style={{ width: `${artifactsPanelWidth}%` }}
            >
              {currentSlide && renderArtifact(currentSlide)}
            </div>
          )}
        </div>

        {/* Metrics Slide-Up Overlay */}
        {showMetricsSlideup && currentSlideIndex > 0 && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-30 z-40 animate-fade-in"
              onClick={() => setShowMetricsSlideup(false)}
            />
            {/* Slide-Up Panel */}
            <div
              id="metrics-slideup"
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50 animate-slide-up"
              style={{ height: '60vh' }}
            >
              <CustomerMetrics
                customerId={customerId}
                isOpen={true}
                onToggle={() => setShowMetricsSlideup(false)}
              />
            </div>
          </>
        )}

        {/* Skip/Snooze Confirmation Modal */}
        {confirmationModal.type && confirmationModal.stepIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {confirmationModal.type === 'skip' ? 'Skip This Step?' : 'Snooze This Step?'}
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                {confirmationModal.type === 'skip'
                  ? `Are you sure you want to skip "${slides[confirmationModal.stepIndex]?.label}"? This step will be removed from your workflow.`
                  : `Are you sure you want to snooze "${slides[confirmationModal.stepIndex]?.label}"? It will reappear in your next workflow session.`}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmationModal({ type: null, stepIndex: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmationModal.type === 'skip') {
                      showToast({
                        message: `Step "${slides[confirmationModal.stepIndex!]?.label}" skipped`,
                        type: 'info',
                        icon: 'none',
                        duration: 2000
                      });
                      // Skip to next available step
                      if (confirmationModal.stepIndex === currentSlideIndex && currentSlideIndex < slides.length - 1) {
                        goToNextSlide();
                      }
                    } else {
                      showToast({
                        message: `Step "${slides[confirmationModal.stepIndex!]?.label}" snoozed`,
                        type: 'info',
                        icon: 'clock',
                        duration: 2000
                      });
                    }
                    setConfirmationModal({ type: null, stepIndex: null });
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                    confirmationModal.type === 'skip'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {confirmationModal.type === 'skip' ? 'Skip Step' : 'Snooze Step'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
