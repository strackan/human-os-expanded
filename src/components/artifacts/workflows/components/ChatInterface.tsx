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
  completedSteps?: Set<string>; // Track step completion for separator insertion
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
  completedSteps,
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
  const prevStepIdRef = useRef<string | undefined>(undefined);

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
      if (conversationEngine) {
        const response = conversationEngine.processBranch(branchId);
        if (response) {
          showResponse(response, onArtifactAction);
        }
      }
    }
  }), [messages, inputValue, conversationEngine, config, onArtifactAction]);

  // Also expose working message functions to workingMessageRef for backward compatibility
  useImperativeHandle(workingMessageRef, () => ({
    showWorkingMessage,
    hideWorkingMessage,
    resetChat
  }), [resetChat]);

  useEffect(() => {
    console.log('ChatInterface: Initializing with config:', {
      mode: config.mode,
      hasDynamicFlow: !!config.dynamicFlow,
      hasUser: !!user,
      customerName: workflowConfig?.customer?.name
    });

    if (config.mode === 'dynamic' && config.dynamicFlow) {
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

      // Show initial message if configured
      const initialMessage = engine.getInitialMessage();

      if (initialMessage) {
        // Clear existing messages and show new initial message
        setTimeout(() => {
          setMessages([{
            id: Date.now(),
            text: initialMessage.text,
            sender: 'ai',
            timestamp: new Date(),
            type: initialMessage.buttons ? 'buttons' : 'text',
            buttons: initialMessage.buttons
          }]);
        }, 500);
      } else {
        // No initial message, clear chat
        setMessages([]);
      }
    }
  }, [config.mode, config.dynamicFlow, user, workflowConfig, sidePanelConfig, slideKey]); // slideKey triggers reset on slide change

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollingForSeparatorRef = useRef(false); // Track if we're in separator scroll mode

  useEffect(() => {
    // Don't auto-scroll if we're in the middle of a separator scroll sequence
    if (!scrollingForSeparatorRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Detect step changes and insert separator with scroll clearing effect
  useEffect(() => {
    // Derive current active step ID (first uncompleted step)
    const currentStepId = sidePanelConfig?.steps?.find((s: any) =>
      !completedSteps?.has(s.id) && s.status !== 'completed'
    )?.id;

    // Only insert separator if:
    // 1. We have a current step
    // 2. We had a previous step (not initial load)
    // 3. Step has changed
    // 4. We have messages (not initial load)
    if (
      currentStepId &&
      prevStepIdRef.current &&
      prevStepIdRef.current !== currentStepId &&
      messages.length > 0
    ) {
      // Find the current step to get its title and opening message
      const currentStep = sidePanelConfig?.steps?.find((s: any) => s.id === currentStepId);
      if (currentStep) {
        console.log('ChatInterface: Inserting separator for step:', currentStep.title);

        // Set flag to prevent auto-scroll during separator sequence
        scrollingForSeparatorRef.current = true;

        // STEP 1: Add 800px spacer FIRST
        if (messagesEndRef.current) {
          messagesEndRef.current.style.height = '800px';
        }

        // STEP 2: Scroll to bottom to create the "clearing" effect
        setTimeout(() => {
          scrollToBottom();

          // STEP 3: After scroll completes, insert separator header
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: `separator-${Date.now()}`,
              text: '',
              sender: 'ai',
              timestamp: new Date(),
              type: 'separator',
              stepName: currentStep.title
            }]);

            // STEP 4: Remove the temporary height and re-enable auto-scroll
            setTimeout(() => {
              if (messagesEndRef.current) {
                messagesEndRef.current.style.height = '0px';
              }
              scrollingForSeparatorRef.current = false;
            }, 300);
          }, 600); // Wait for scroll animation to complete
        }, 50);
      }
    }

    // Update previous step ref
    prevStepIdRef.current = currentStepId;
  }, [completedSteps, sidePanelConfig, messages.length]);

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


  const handleButtonClick = (buttonValue: string, buttonLabel: string, buttonAction?: string) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: buttonLabel,
      sender: 'user',
      timestamp: new Date()
    }]);

    // Handle special actions from opening message buttons
    if (buttonAction) {
      if (buttonAction === 'nextStep' && onArtifactAction) {
        // Trigger the nextStep action to complete current step and move to next
        setTimeout(() => {
          onArtifactAction({ type: 'nextStep' });
        }, 500);
        return;
      } else if (buttonAction === 'completeStep' && onArtifactAction) {
        // Complete the current step
        const currentStepId = sidePanelConfig?.steps?.find((s: any) =>
          !completedSteps?.has(s.id) && s.status !== 'completed'
        )?.id;
        if (currentStepId) {
          setTimeout(() => {
            onArtifactAction({
              type: 'completeStep',
              payload: { stepId: currentStepId }
            });
          }, 500);
        }
        return;
      }
    }

    if (config.mode === 'dynamic' && conversationEngine) {
      setTimeout(() => {
        const response = conversationEngine.processUserInput(buttonValue);

        // Handle predelay - wait before showing the response
        if (response.predelay && response.predelay > 0) {
          // Wait for predelay, then show the response
          setTimeout(() => {
            showResponse(response, onArtifactAction);
          }, response.predelay);
        } else {
          // No predelay, show response immediately
          showResponse(response, onArtifactAction);
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
    // If there's a delay, show loading animation first
    if (response.delay && response.delay > 0) {
          // Show loading message immediately
          const loadingMessageId = Date.now() + 1;
          setMessages(prev => [...prev, {
            id: loadingMessageId,
            text: response.text,
            sender: 'ai',
            timestamp: new Date(),
            type: 'loading'
          }]);
          
          // After delay, replace with final message and process actions
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
            
            // Process any actions from the response AFTER the delay
            if (response.actions && onArtifactAction) {
              console.log('ChatInterface: Processing actions from response after delay:', response.actions);
              response.actions.forEach((action: ConversationAction) => {
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
                        }, nextResponse.predelay);
                      } else {
                        showResponse(nextResponse, onArtifactAction);
                      }
                    }
                  }, 100); // Small delay to ensure other actions complete first
                }
              });
            }
          }, response.delay);
        } else {
          // No delay, show message immediately
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: response.text,
            sender: 'ai',
            timestamp: new Date(),
            type: response.buttons ? 'buttons' : 'text',
            buttons: response.buttons
          }]);
          
          // Process any actions from the response immediately
          if (response.actions && onArtifactAction) {
            console.log('ChatInterface: Processing actions from response immediately:', response.actions);
            response.actions.forEach((action: ConversationAction) => {
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
                      }, nextResponse.predelay);
                    } else {
                      showResponse(nextResponse, onArtifactAction);
                    }
                  }
                }, 100); // Small delay to ensure other actions complete first
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
        className="p-4 space-y-4 overflow-y-auto absolute"
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
              // Handle separator message type
              if (message.type === 'separator' && message.stepName) {
                return (
                  <div key={message.id} className="my-8">
                    <div className="flex items-center justify-center">
                      <div className="w-full max-w-md">
                        <div className="text-center mb-2">
                          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            {message.stepName}
                          </h4>
                        </div>
                        <hr className="border-t-2 border-gray-300" />
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
                            console.log('Button clicked:', button.label, 'value:', button.value);
                            handleButtonClick(button.value, button.label, (button as any).action);
                          }}
                          data-action={button.value}
                          data-label={button.label}
                          className={`text-center px-4 py-2 rounded-lg transition-colors border font-medium cursor-pointer ${
                            message['button-pos'] === 'column' ? 'block w-full text-left' : 'flex-1 min-w-0 max-w-xs'
                          }`}
                          style={{
                            backgroundColor: button['label-background'] || '#f3f4f6',
                            color: button['label-text'] || '#374151',
                            borderColor: button['label-background'] || '#d1d5db',
                            pointerEvents: 'auto'
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