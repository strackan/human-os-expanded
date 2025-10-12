import React, { useState, useRef, useEffect, useImperativeHandle } from 'react';
import { Send, Paperclip, Mic, Square, MoreHorizontal, Brush, Edit, Zap } from 'lucide-react';
import { ChatConfig, WorkflowConfig } from '../config/WorkflowConfig';
import { ConversationEngine, ConversationAction } from '../utils/conversationEngine';
import { VariableContext } from '../utils/variableSubstitution';
import { useAuth } from '@/components/auth/AuthProvider';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'buttons' | 'loading' | 'separator';
  buttons?: Array<{
    label: string;
    value: string;
    'label-background'?: string;
    'label-text'?: string;
  }>;
  'button-pos'?: string;
  stepName?: string; // For separator messages
}

interface ChatInterfaceProps {
  config: ChatConfig;
  isSplitMode: boolean;
  onToggleSplitMode: () => void;
  className?: string;
  startingWith?: 'ai' | 'user';
  onArtifactAction?: (action: ConversationAction) => void;
  onGotoSlide?: (slideNumber: number) => void;
  workingMessageRef?: React.RefObject<{
    showWorkingMessage: () => void;
    hideWorkingMessage: () => void;
  } | null>;
  sidePanelConfig?: any; // Add side panel config for progress navigation
  workflowConfig?: WorkflowConfig; // Add workflow config for variable context
  currentStepNumber?: number; // Single source of truth for current step
  slideKey?: string | number; // Unique key that changes when slide changes to trigger chat reset
}

const ChatInterface = React.forwardRef<{
  getMessages: () => Message[];
  getCurrentInput: () => string;
  restoreState: (messages: Message[], inputValue: string) => void;
  showWorkingMessage: () => void;
  hideWorkingMessage: () => void;
  resetChat: () => void;
  navigateToBranch: (branchId: string) => void;
  addSeparator: (stepTitle: string) => void;
}, ChatInterfaceProps>(({
  config,
  isSplitMode,
  onToggleSplitMode,
  className = '',
  startingWith = 'ai',
  onArtifactAction,
  onGotoSlide,
  workingMessageRef,
  workflowConfig,
  sidePanelConfig,
  currentStepNumber,
  slideKey
}, ref) => {
  const { user } = useAuth();
  // Generate initial messages from config (no auto-save - state preserved by keeping component mounted)
  const generateInitialMessages = (): Message[] => {
    if (config.mode === 'dynamic' && config.dynamicFlow) {
      return [];
    }

    if (!config.conversationSeed || !Array.isArray(config.conversationSeed)) return [];

    return config.conversationSeed.map((seedMessage, index) => {
      let sender = seedMessage.sender;
      if (!sender) {
        const isEven = index % 2 === 0;
        const isAiFirst = startingWith === 'ai';
        sender = isAiFirst ? (isEven ? 'ai' : 'user') : (isEven ? 'user' : 'ai');
      }

      return {
        id: `seed-${index}`,
        text: seedMessage.text,
        sender: sender,
        type: seedMessage.type || 'text',
        buttons: seedMessage.buttons || undefined,
        timestamp: seedMessage.timestamp ? new Date(seedMessage.timestamp) : new Date(Date.now() - (config.conversationSeed!.length - index) * 60000)
      };
    });
  };

  // Initialize state early so it's available for useImperativeHandle
  const [messages, setMessages] = useState<Message[]>(generateInitialMessages());
  const [inputValue, setInputValue] = useState('');

  const [isRecording, setIsRecording] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [conversationEngine, setConversationEngine] = useState<ConversationEngine | null>(null);
  const [isWorkingOnIt, setIsWorkingOnIt] = useState(false);
  const [typingMessages, setTypingMessages] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevStepNumberRef = useRef<number | undefined>(undefined);
  const initialMessageShownRef = useRef(false); // Track if initialMessage already shown for current slide

  // Working message control functions
  const showWorkingMessage = () => {
    setIsWorkingOnIt(true);
  };

  const hideWorkingMessage = () => {
    setIsWorkingOnIt(false);
  };

  // Expose functions to parent components
  const resetChat = () => {
    console.log('ChatInterface: Resetting chat to initial state');
    // Reset conversation engine
    if (conversationEngine) {
      conversationEngine.reset();
    }
    
    // Clear messages and reset to initial state
    setMessages([]);
    setInputValue('');
    
    // Reinitialize with initial message based on config type
    if (config.mode === 'dynamic' && config.dynamicFlow && conversationEngine) {
      // Dynamic flow - get initial message from engine
      const initialMessage = conversationEngine.getInitialMessage();
      if (initialMessage) {
        setTimeout(() => {
          setMessages([{
            id: Date.now(),
            text: initialMessage.text,
            sender: 'ai',
            timestamp: new Date(),
            type: initialMessage.buttons ? 'buttons' : 'text',
            buttons: initialMessage.buttons
          }]);
        }, 100);
      }
    } else if (config.conversationSeed && config.conversationSeed.length > 0) {
      // Static conversation seed - regenerate initial messages
      const initialMessages = generateInitialMessages();
      setTimeout(() => {
        setMessages(initialMessages);
      }, 100);
    }
  };

  useImperativeHandle(ref, () => ({
    getMessages: () => messages,
    getCurrentInput: () => inputValue,
    restoreState: (newMessages: Message[], newInputValue: string) => {
      setMessages(newMessages);
      setInputValue(newInputValue);
    },
    showWorkingMessage,
    hideWorkingMessage,
    resetChat,
    navigateToBranch: (branchId: string) => {
      console.log('ChatInterface: Navigating to branch:', branchId);
      console.log('ChatInterface: conversationEngine available?', !!conversationEngine);
      if (conversationEngine) {
        console.log('ChatInterface: Processing branch with conversationEngine');
        const response = conversationEngine.processBranch(branchId);
        console.log('ChatInterface: Branch response:', response);
        if (response) {
          console.log('ChatInterface: Calling showResponse with:', { text: response.text, hasButtons: !!response.buttons, actions: response.actions });
          showResponse(response, onArtifactAction);
        } else {
          console.error('ChatInterface: No response from processBranch for branchId:', branchId);
        }
      } else {
        console.error('ChatInterface: conversationEngine not available for navigateToBranch');
      }
    },
    addSeparator: (stepTitle: string) => {
      console.log('ChatInterface: Adding separator for step:', stepTitle);
      setMessages(prev => [...prev, {
        id: `separator-${Date.now()}`,
        text: '',
        sender: 'ai',
        timestamp: new Date(),
        type: 'separator',
        stepName: stepTitle
      }]);
    }
  }), [messages, inputValue, conversationEngine, config, onArtifactAction]);

  // Also expose working message functions to workingMessageRef for backward compatibility
  useImperativeHandle(workingMessageRef, () => ({
    showWorkingMessage,
    hideWorkingMessage,
    resetChat
  }), [resetChat]);

  useEffect(() => {
    console.log('ChatInterface: useEffect TRIGGERED');

    // Reset initialMessage tracking when slide changes
    initialMessageShownRef.current = false;

    console.log('ChatInterface: Initializing with config:', {
      mode: config.mode,
      hasDynamicFlow: !!config.dynamicFlow,
      hasUser: !!user,
      customerName: workflowConfig?.customer?.name,
      slideKey: slideKey,
      initialMessageShown: initialMessageShownRef.current,
      configKeys: Object.keys(config),
      dynamicFlowKeys: config.dynamicFlow ? Object.keys(config.dynamicFlow) : 'NO DYNAMIC FLOW'
    });

    if (config.mode === 'dynamic' && config.dynamicFlow) {
      // Guard: Wait for user auth to complete before initializing
      // This prevents variable substitution errors when user is null
      if (!user) {
        console.log('ChatInterface: Waiting for user authentication to complete...');
        return; // useEffect will re-run when user is loaded
      }

      // Create variable context from user and workflow config
      const variableContext: VariableContext = {
        user: user,
        customer: workflowConfig ? {
          name: workflowConfig.customer.name,
          primaryContact: workflowConfig.customerOverview?.metrics?.primaryContact,
          arr: workflowConfig.customerOverview?.metrics?.arr,
          renewalDate: workflowConfig.customerOverview?.metrics?.renewalDate,
          ...workflowConfig.customerOverview
        } : undefined
      };

      console.log('ChatInterface: Creating ConversationEngine with variableContext:', variableContext);
      const engine = new ConversationEngine(config.dynamicFlow, (action) => {
        console.log('ChatInterface: Action callback triggered:', action);
        if (onArtifactAction) {
          onArtifactAction(action);
        }
      }, variableContext);
      setConversationEngine(engine);

      // Show initial message ONLY if not already shown for this slide
      const initialMessage = engine.getInitialMessage();
      console.log('ChatInterface: getInitialMessage result:', {
        hasInitialMessage: !!initialMessage,
        initialMessageText: initialMessage?.text,
        startsWith: config.dynamicFlow.startsWith,
        hasFlowInitialMessage: !!config.dynamicFlow.initialMessage
      });

      if (initialMessage && !initialMessageShownRef.current) {
        console.log('ChatInterface: Showing initialMessage for first time (Step 0)');
        initialMessageShownRef.current = true;
        // Add initial message only if messages array is empty (prevents duplication on remount)
        setTimeout(() => {
          setMessages(prev => {
            // Only add if messages array is still empty
            if (prev.length === 0) {
              return [{
                id: Date.now(),
                text: initialMessage.text,
                sender: 'ai',
                timestamp: new Date(),
                type: initialMessage.buttons ? 'buttons' : 'text',
                buttons: initialMessage.buttons
              }];
            }
            return prev;
          });
        }, 500);
      } else if (!initialMessage && !initialMessageShownRef.current && sidePanelConfig?.steps?.[0]) {
        // No initialMessage (Step 0) - auto-advance to Step 1's branch
        console.log('ChatInterface: No initialMessage, auto-advancing to Step 1:', sidePanelConfig.steps[0].workflowBranch);
        initialMessageShownRef.current = true;

        setTimeout(() => {
          const step1Branch = sidePanelConfig.steps[0].workflowBranch;
          const response = engine.processBranch(step1Branch);

          if (response) {
            setMessages([{
              id: Date.now(),
              text: response.text,
              sender: 'ai',
              timestamp: new Date(),
              type: response.buttons ? 'buttons' : 'text',
              buttons: response.buttons
            }]);
          }
        }, 500);
      }
    }
  }, [config.mode, config.dynamicFlow, user, workflowConfig, sidePanelConfig, slideKey]); // slideKey triggers engine recreation on slide change

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Don't scroll on initial mount (only 1-2 messages = initial greeting)
    // This prevents the opening greeting from being scrolled off-screen
    if (messages.length > 2) {
      scrollToBottom();
    }
  }, [messages, isSplitMode]); // Add isSplitMode to trigger scroll on layout changes

  // Note: Separator handling moved to TaskModeAdvanced.handleStepComplete()
  // which calls addSeparator() explicitly for better control over timing

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      }]);

      const userInput = inputValue;
      setInputValue('');

      if (config.mode === 'dynamic' && conversationEngine) {
        setTimeout(() => {
          const response = conversationEngine.processUserInput(userInput);
          
          // Typing animation will be triggered automatically by the TypingAnimation component
          
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: response.text,
            sender: 'ai',
            timestamp: new Date(),
            type: response.buttons ? 'buttons' : 'text',
            buttons: response.buttons
          }]);
          
          // Process any actions from the response
          if (response.actions && onArtifactAction) {
            console.log('ChatInterface: Processing actions from text input response:', response.actions);
            response.actions.forEach((action: ConversationAction) => {
              console.log('ChatInterface: Calling onArtifactAction with:', action);
              onArtifactAction(action);
            });
          } else {
            console.log('ChatInterface: No actions to process from text input or no onArtifactAction callback');
          }
        }, 500);
      } else {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: config.aiGreeting,
            sender: 'ai',
            timestamp: new Date()
          }]);
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper function to handle response with optional predelay
  const handleResponseWithDelay = (response: any, onArtifactAction?: (action: any) => void) => {
    if (response.predelay && response.predelay > 0) {
      // Wait for predelay, then show the response
      setTimeout(() => {
        showResponse(response, onArtifactAction);
      }, response.predelay * 1000); // Convert seconds to milliseconds
    } else {
      // No predelay, show response immediately
      showResponse(response, onArtifactAction);
    }
  };

  const handleButtonClick = (buttonValue: string, buttonLabel: string, buttonAction?: string, completeStepId?: string) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: buttonLabel,
      sender: 'user',
      timestamp: new Date()
    }]);

    // Handle special actions from opening message buttons (legacy)
    if (buttonAction && !completeStepId) {
      if (buttonAction === 'nextStep' && onArtifactAction) {
        // Trigger the nextStep action to complete current step and move to next
        setTimeout(() => {
          onArtifactAction({ type: 'nextStep' });
        }, 500);
        return;
      } else if (buttonAction === 'completeStep' && onArtifactAction) {
        // Complete the current step using step number
        const currentStep = sidePanelConfig?.steps?.[currentStepNumber ? currentStepNumber - 1 : 0];
        if (currentStep) {
          setTimeout(() => {
            onArtifactAction({
              type: 'completeStep',
              payload: { stepId: currentStep.id }
            });
          }, 500);
        }
        return;
      }
    }

    if (config.mode === 'dynamic' && conversationEngine) {
      setTimeout(() => {
        // FIRST: Complete step if button has completeStep attribute (adds separator)
        if (completeStepId && onArtifactAction) {
          console.log('ChatInterface: Completing step BEFORE branch navigation:', completeStepId);
          onArtifactAction({
            type: 'completeStep',
            payload: { stepId: completeStepId }
          });

          // Wait for separator to be added before processing branch
          setTimeout(() => {
            const response = conversationEngine.processUserInput(buttonValue);
            handleResponseWithDelay(response, onArtifactAction);
          }, 200); // Short delay to ensure separator is added first
        } else {
          // No step completion needed, process branch immediately
          const response = conversationEngine.processUserInput(buttonValue);
          handleResponseWithDelay(response, onArtifactAction);
        }
      }, 500);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: buttonLabel,
          sender: 'user',
          timestamp: new Date()
        }]);

        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          text: config.aiGreeting,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }, 500);
    }
  };

  const showResponse = (response: any, onArtifactAction?: (action: any) => void) => {
    // Process enterStep actions FIRST, before showing any messages
    if (response.actions && onArtifactAction) {
      const enterStepActions = response.actions.filter((action: ConversationAction) => action.type === 'enterStep');
      enterStepActions.forEach((action: ConversationAction) => {
        console.log('ChatInterface: Processing enterStep BEFORE message:', action);
        onArtifactAction(action);
      });
    }

    // If there's a delay, show loading animation first
    if (response.delay && response.delay > 0) {
          // Show loading message immediately (after enterStep has added separator)
          const loadingMessageId = Date.now() + 1;
          setMessages(prev => [...prev, {
            id: loadingMessageId,
            text: response.text,
            sender: 'ai',
            timestamp: new Date(),
            type: 'loading'
          }]);

          // After delay, replace with final message and process remaining actions
          setTimeout(() => {
            setMessages(prev => prev.map(msg =>
              msg.id === loadingMessageId
                ? {
                    ...msg,
                    text: response.text,
                    type: response.buttons ? 'buttons' : 'text',
                    buttons: response.buttons
                  }
                : msg
            ));

            // Process remaining actions (excluding enterStep which was already processed)
            if (response.actions && onArtifactAction) {
              console.log('ChatInterface: Processing remaining actions after delay:', response.actions);
              response.actions.forEach((action: ConversationAction) => {
                if (action.type !== 'enterStep') { // Skip enterStep, already processed
                  console.log('ChatInterface: Calling onArtifactAction with:', action);
                  onArtifactAction(action);

                  // Handle nextChat action - automatically trigger next branch
                  if (action.type === 'nextChat' && response.nextBranch) {
                    setTimeout(() => {
                      console.log('ChatInterface: Auto-triggering next branch:', response.nextBranch);
                      const nextResponse = conversationEngine?.processUserInput('auto-followup');
                      if (nextResponse) {
                        if (nextResponse.predelay && nextResponse.predelay > 0) {
                          setTimeout(() => {
                            showResponse(nextResponse, onArtifactAction);
                          }, nextResponse.predelay * 1000); // Convert seconds to milliseconds
                        } else {
                          showResponse(nextResponse, onArtifactAction);
                        }
                      }
                    }, 100); // Small delay to ensure other actions complete first
                  }
                }
              });
            }
          }, response.delay * 1000); // Convert seconds to milliseconds
        } else {
          // No delay, show message immediately (after enterStep has added separator)
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: response.text,
            sender: 'ai',
            timestamp: new Date(),
            type: response.buttons ? 'buttons' : 'text',
            buttons: response.buttons
          }]);

          // Process remaining actions (excluding enterStep which was already processed)
          if (response.actions && onArtifactAction) {
            console.log('ChatInterface: Processing remaining actions immediately:', response.actions);
            response.actions.forEach((action: ConversationAction) => {
              if (action.type !== 'enterStep') { // Skip enterStep, already processed
                console.log('ChatInterface: Calling onArtifactAction with:', action);
                onArtifactAction(action);

                // Handle nextChat action - automatically trigger next branch
                if (action.type === 'nextChat' && response.nextBranch) {
                  setTimeout(() => {
                    console.log('ChatInterface: Auto-triggering next branch:', response.nextBranch);
                    const nextResponse = conversationEngine?.processUserInput('auto-followup');
                    if (nextResponse) {
                      if (nextResponse.predelay && nextResponse.predelay > 0) {
                        setTimeout(() => {
                          showResponse(nextResponse, onArtifactAction);
                        }, nextResponse.predelay * 1000); // Convert seconds to milliseconds
                      } else {
                        showResponse(nextResponse, onArtifactAction);
                      }
                    }
                  }, 100); // Small delay to ensure other actions complete first
                }
              }
            });
          }
        }
  };

  const handleYesClick = () => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: '✅ Yes',
      sender: 'user',
      timestamp: new Date()
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Great! I'll proceed with that.",
        sender: 'ai',
        timestamp: new Date()
      }]);
    }, 500);
  };

  const handleNoClick = () => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: '❌ No',
      sender: 'user',
      timestamp: new Date()
    }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: "Understood. Let me know what you'd prefer instead.",
        sender: 'ai',
        timestamp: new Date()
      }]);
    }, 500);
  };

  const toggleButtonMode = () => setShowButtons(!showButtons);

  // Typing animation component
  const TypingAnimation = ({ text, messageId, speed = 20 }: { text: string; messageId: number; speed?: number }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        // Remove this message from typing set when done
        setTypingMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(messageId);
          return newSet;
        });
      }
    }, [currentIndex, text, speed, messageId]);

    useEffect(() => {
      setDisplayedText('');
      setCurrentIndex(0);
      // Add this message to typing set when starting
      setTypingMessages(prev => new Set(prev).add(messageId));
    }, [text, messageId]);

    return <span>{displayedText}</span>;
  };

  // Simple twirling asterisk loading animation
  const LoadingAnimation = () => (
    <div className="flex items-center space-x-2">
      <span>Working On It</span>
      <span className="animate-spin text-lg">*</span>
    </div>
  );

  return (
    <div className={`h-full relative ${className}`}>
      <div
        className="p-4 pb-48 space-y-4 overflow-y-auto absolute"
        style={{
          minHeight: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: '140px' // Make room for 140px footer
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <p>Start a conversation to get help with your task</p>
              {isSplitMode && <p className="text-sm mt-2 text-blue-600">Split mode active!</p>}
              {showButtons && <p className="text-sm mt-2 text-purple-600">Button mode active!</p>}
            </div>
          </div>
        ) : (
          <>
            {/* Show loading state when working on artifact */}
            {isWorkingOnIt && (
              <div className="flex justify-center">
                <div className="w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                  <LoadingAnimation />
                </div>
              </div>
            )}
            
            {messages.map((message) => {
              // Handle separator message type - adds visual break between steps (Claude-style)
              if (message.type === 'separator' && message.stepName) {
                return (
                  <div key={message.id} className="my-12">
                    <div className="relative py-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-6 py-2 text-sm font-semibold text-gray-700 uppercase tracking-wider rounded-full border-2 border-gray-300 shadow-sm">
                          {message.stepName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Regular message rendering
              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-center'}`}
                >
                <div
                  className={`${message.sender === 'user' ? 'max-w-[80%]' : 'w-[80%]'} rounded-lg px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="whitespace-pre-wrap">
                    {message.sender === 'ai' && typingMessages.has(message.id as number) ? (
                      <TypingAnimation text={message.text} messageId={message.id as number} speed={15} />
                    ) : message.type === 'loading' ? (
                      <div className="flex items-center space-x-2">
                        <span>{message.text}</span>
                        <span className="animate-spin text-lg">*</span>
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: message.text }} />
                    )}
                  </div>

                  {message.type === 'buttons' && message.buttons && (
                    <div className={`mt-3 flex justify-center ${message['button-pos'] === 'column' ? 'flex-col space-y-2' : 'flex-row gap-2 flex-wrap'}`}>
                      {message.buttons.map((button, index) => {
                        console.log('Rendering button:', button.label, 'value:', button.value);
                        return (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Button clicked:', button.label, 'value:', button.value, 'completeStep:', (button as any).completeStep);
                            handleButtonClick(button.value, button.label, (button as any).action, (button as any).completeStep);
                          }}
                          data-action={button.value}
                          data-label={button.label}
                          className={`text-center px-4 py-2 rounded-lg transition-all duration-200 border-2 font-medium cursor-pointer shadow-md hover:shadow-lg hover:scale-105 active:scale-95 ${
                            message['button-pos'] === 'column' ? 'block w-full text-left' : 'flex-1 min-w-0 max-w-xs'
                          }`}
                          style={{
                            backgroundColor: button['label-background'] || '#f3f4f6',
                            color: button['label-text'] || '#374151',
                            borderColor: button['label-background'] ?
                              `rgba(0, 0, 0, 0.2)` : // Darker border for colored buttons
                              '#d1d5db', // Gray border for default buttons
                            pointerEvents: 'auto'
                          }}
                          onMouseEnter={(e) => {
                            // Darken background on hover
                            const bg = button['label-background'] || '#f3f4f6';
                            e.currentTarget.style.filter = 'brightness(0.9)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.filter = 'brightness(1)';
                          }}
                        >
                          {button.label}
                        </button>
                      )})}
                    </div>
                  )}

                  <div
                    className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4 bg-white"
        style={{ height: '140px', minHeight: '140px', maxHeight: '140px' }}
      >
        <div className="flex items-end space-x-2">
          {config.features.attachments && (
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <Paperclip size={18} />
            </button>
          )}

          <div className="flex-1">
            {showButtons ? (
              <div className="flex justify-between space-x-4">
                <button
                  onClick={handleYesClick}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  ✅ Yes
                </button>
                <button
                  onClick={handleNoClick}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  ❌ No
                </button>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={config.placeholder}
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px] max-h-[120px]"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 bottom-2 p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>

          {config.features.voiceRecording && (
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2 rounded-md transition-colors ${
                isRecording
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isRecording ? <Square size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {config.features.designMode && (
              <button
                onClick={toggleButtonMode}
                className={`flex items-center space-x-2 text-sm px-3 py-2 rounded transition-colors ${
                  showButtons
                    ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Brush size={16} />
                <span>{showButtons ? 'Exit Buttons' : 'Design'}</span>
              </button>
            )}
            {config.features.editMode && (
              <button
                onClick={() => alert('Edit functionality coming soon!')}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              >
                <Edit size={16} />
                <span>Edit</span>
              </button>
            )}
            {config.features.artifactsToggle && (
              <button
                onClick={onToggleSplitMode}
                className={`flex items-center space-x-2 text-sm px-2 py-1 rounded transition-colors ${
                  isSplitMode
                    ? 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Zap size={16} />
                <span>{isSplitMode ? 'Exit Split' : 'Artifacts'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {showButtons ? 'Button Mode' : inputValue.length > 0 ? `${inputValue.length} chars` : 'Ready'}
            </span>
            <button className="p-1 text-gray-500 hover:text-gray-700 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;