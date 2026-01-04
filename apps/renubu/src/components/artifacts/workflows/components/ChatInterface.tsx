import React, { useRef, useEffect, useImperativeHandle, useCallback } from 'react';
import { Send, Paperclip, Mic, Square, MoreHorizontal, Brush, Edit, Zap } from 'lucide-react';
import { ChatConfig, WorkflowConfig } from '../config/WorkflowConfig';
import { ConversationAction } from '../utils/conversationEngine';
import { useAuth } from '@/components/auth/AuthProvider';
import { useChatUI } from './hooks/useChatUI';
import { useChatInput } from './hooks/useChatInput';
import { useChatMessages, Message } from './hooks/useChatMessages';
import { useChatEngine } from './hooks/useChatEngine';
import { TypingAnimation } from './TypingAnimation';
import { LoadingAnimation } from './LoadingAnimation';

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
  sidePanelConfig?: any;
  workflowConfig?: WorkflowConfig;
  currentStepNumber?: number;
  slideKey?: string | number;
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

  // Generate initial messages from config
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

  // Initialize hooks
  const ui = useChatUI();
  const messagesHook = useChatMessages({
    initialMessages: generateInitialMessages()
  });

  const engine = useChatEngine({
    config,
    user,
    workflowConfig,
    sidePanelConfig,
    slideKey,
    onArtifactAction,
    onAddMessage: messagesHook.addMessage
  });

  // Message handling for user input
  const handleUserMessage = useCallback((text: string) => {
    messagesHook.addUserMessage(text);

    // Process with conversation engine if in dynamic mode
    if (config.mode === 'dynamic' && engine.conversationEngine) {
      setTimeout(() => {
        const response = engine.conversationEngine!.processUserInput(text);

        // Add AI response
        messagesHook.addAIMessage(response.text, {
          buttons: response.buttons
        });

        // Process any actions from the response
        if (response.actions && onArtifactAction) {
          console.log('ChatInterface: Processing actions from text input response:', response.actions);
          response.actions.forEach((action: ConversationAction) => {
            console.log('ChatInterface: Calling onArtifactAction with:', action);
            onArtifactAction(action);
          });
        }
      }, 500);
    } else {
      // Static mode - just add greeting
      setTimeout(() => {
        messagesHook.addAIMessage(config.aiGreeting);
      }, 1000);
    }
  }, [config, engine.conversationEngine, messagesHook, onArtifactAction]);

  const input = useChatInput({
    onSendMessage: handleUserMessage
  });

  // Complex response handler with delays and actions
  const showResponse = useCallback((response: any, onArtifactAction?: (action: any) => void) => {
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
      const loadingMessageId = Date.now() + 1;
      messagesHook.addMessage({
        id: loadingMessageId,
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        type: 'loading'
      });

      // After delay, replace with final message and process remaining actions
      setTimeout(() => {
        // Update message from loading to final
        const updatedMessage: Message = {
          id: loadingMessageId,
          text: response.text,
          sender: 'ai',
          timestamp: new Date(),
          type: response.buttons ? 'buttons' : 'text',
          buttons: response.buttons
        };
        messagesHook.addMessage(updatedMessage);

        // Process remaining actions
        if (response.actions && onArtifactAction) {
          console.log('ChatInterface: Processing remaining actions after delay:', response.actions);
          response.actions.forEach((action: ConversationAction) => {
            if (action.type !== 'enterStep') {
              console.log('ChatInterface: Calling onArtifactAction with:', action);
              onArtifactAction(action);

              // Handle nextChat action
              if (action.type === 'nextChat' && response.nextBranch) {
                setTimeout(() => {
                  console.log('ChatInterface: Auto-triggering next branch:', response.nextBranch);
                  const nextResponse = engine.conversationEngine?.processUserInput('auto-followup');
                  if (nextResponse) {
                    if (nextResponse.predelay && nextResponse.predelay > 0) {
                      setTimeout(() => {
                        showResponse(nextResponse, onArtifactAction);
                      }, nextResponse.predelay * 1000);
                    } else {
                      showResponse(nextResponse, onArtifactAction);
                    }
                  }
                }, 100);
              }
            }
          });
        }
      }, response.delay * 1000);
    } else {
      // No delay, show message immediately
      messagesHook.addAIMessage(response.text, {
        buttons: response.buttons
      });

      // Process remaining actions
      if (response.actions && onArtifactAction) {
        console.log('ChatInterface: Processing remaining actions immediately:', response.actions);
        response.actions.forEach((action: ConversationAction) => {
          if (action.type !== 'enterStep') {
            console.log('ChatInterface: Calling onArtifactAction with:', action);
            onArtifactAction(action);

            // Handle nextChat action
            if (action.type === 'nextChat' && response.nextBranch) {
              setTimeout(() => {
                console.log('ChatInterface: Auto-triggering next branch:', response.nextBranch);
                const nextResponse = engine.conversationEngine?.processUserInput('auto-followup');
                if (nextResponse) {
                  if (nextResponse.predelay && nextResponse.predelay > 0) {
                    setTimeout(() => {
                      showResponse(nextResponse, onArtifactAction);
                    }, nextResponse.predelay * 1000);
                  } else {
                    showResponse(nextResponse, onArtifactAction);
                  }
                }
              }, 100);
            }
          }
        });
      }
    }
  }, [messagesHook, engine.conversationEngine]);

  // Handle button clicks
  const handleButtonClick = useCallback((buttonValue: string, buttonLabel: string, buttonAction?: string, completeStepId?: string) => {
    messagesHook.addUserMessage(buttonLabel);

    // Handle special actions from opening message buttons (legacy)
    if (buttonAction && !completeStepId) {
      if (buttonAction === 'nextStep' && onArtifactAction) {
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
      } else if (buttonAction === 'completeStep' && onArtifactAction) {
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

    if (config.mode === 'dynamic' && engine.conversationEngine) {
      setTimeout(() => {
        // FIRST: Complete step if button has completeStep attribute
        if (completeStepId && onArtifactAction) {
          console.log('ChatInterface: Completing step BEFORE branch navigation:', completeStepId);
          onArtifactAction({
            type: 'completeStep',
            payload: { stepId: completeStepId }
          });

          // Wait for separator to be added before processing branch
          setTimeout(() => {
            const response = engine.conversationEngine!.processUserInput(buttonValue);
            if (response.predelay && response.predelay > 0) {
              setTimeout(() => {
                showResponse(response, onArtifactAction);
              }, response.predelay * 1000);
            } else {
              showResponse(response, onArtifactAction);
            }
          }, 200);
        } else {
          const response = engine.conversationEngine!.processUserInput(buttonValue);
          if (response.predelay && response.predelay > 0) {
            setTimeout(() => {
              showResponse(response, onArtifactAction);
            }, response.predelay * 1000);
          } else {
            showResponse(response, onArtifactAction);
          }
        }
      }, 500);
    } else {
      setTimeout(() => {
        messagesHook.addAIMessage(config.aiGreeting);
      }, 500);
    }
  }, [config, engine.conversationEngine, onArtifactAction, sidePanelConfig, currentStepNumber, messagesHook, showResponse]);

  // Handle Yes/No clicks (legacy feature)
  const handleYesClick = useCallback(() => {
    messagesHook.addUserMessage('✅ Yes');
    setTimeout(() => {
      messagesHook.addAIMessage("Great! I'll proceed with that.");
    }, 500);
  }, [messagesHook]);

  const handleNoClick = useCallback(() => {
    messagesHook.addUserMessage('❌ No');
    setTimeout(() => {
      messagesHook.addAIMessage("Understood. Let me know what you'd prefer instead.");
    }, 500);
  }, [messagesHook]);

  // Reset chat to initial state
  const resetChat = useCallback(() => {
    console.log('ChatInterface: Resetting chat to initial state');
    engine.resetEngine();
    messagesHook.resetMessages();
    input.setInputValue('');

    // Reinitialize with initial message
    if (config.mode === 'dynamic' && config.dynamicFlow && engine.conversationEngine) {
      const initialMessage = engine.conversationEngine.getInitialMessage();
      if (initialMessage) {
        setTimeout(() => {
          messagesHook.addAIMessage(initialMessage.text, {
            buttons: initialMessage.buttons
          });
        }, 100);
      }
    } else if (config.conversationSeed && config.conversationSeed.length > 0) {
      const initialMessages = generateInitialMessages();
      setTimeout(() => {
        messagesHook.restoreState(initialMessages);
      }, 100);
    }
  }, [config, engine, messagesHook, input, generateInitialMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesHook.messages.length > 2) {
      ui.scrollToBottom();
    }
  }, [messagesHook.messages, isSplitMode, ui]);

  // Expose API via ref
  useImperativeHandle(ref, () => ({
    getMessages: () => messagesHook.messages,
    getCurrentInput: () => input.inputValue,
    restoreState: (newMessages: Message[], newInputValue: string) => {
      messagesHook.restoreState(newMessages);
      input.setInputValue(newInputValue);
    },
    showWorkingMessage: messagesHook.showWorkingMessage,
    hideWorkingMessage: messagesHook.hideWorkingMessage,
    resetChat,
    navigateToBranch: (branchId: string) => {
      engine.navigateToBranch(branchId, showResponse);
    },
    addSeparator: messagesHook.addSeparator
  }), [messagesHook, input, resetChat, engine, showResponse]);

  // Also expose working message functions to workingMessageRef for backward compatibility
  useImperativeHandle(workingMessageRef, () => ({
    showWorkingMessage: messagesHook.showWorkingMessage,
    hideWorkingMessage: messagesHook.hideWorkingMessage,
    resetChat
  }), [messagesHook, resetChat]);

  return (
    <div className={`h-full relative ${className}`}>
      <div
        className="p-4 pb-48 space-y-4 overflow-y-auto absolute"
        style={{
          minHeight: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: '140px'
        }}
      >
        {messagesHook.messages.length === 0 ? (
          <div className="text-center text-gray-500 flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <p>Start a conversation to get help with your task</p>
              {isSplitMode && <p className="text-sm mt-2 text-blue-600">Split mode active!</p>}
              {ui.showButtons && <p className="text-sm mt-2 text-purple-600">Button mode active!</p>}
            </div>
          </div>
        ) : (
          <>
            {messagesHook.isWorkingOnIt && (
              <div className="flex justify-center">
                <div className="w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
                  <LoadingAnimation />
                </div>
              </div>
            )}

            {messagesHook.messages.map((message) => {
              // Handle separator message type
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
                      {message.sender === 'ai' && ui.typingMessages.has(message.id as number) ? (
                        <TypingAnimation
                          text={message.text}
                          messageId={message.id as number}
                          speed={15}
                          onTypingComplete={ui.removeTypingMessage}
                          onTypingStart={ui.addTypingMessage}
                        />
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
                        {message.buttons.map((button, index) => (
                          <button
                            key={index}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
                                `rgba(0, 0, 0, 0.2)` :
                                '#d1d5db',
                              pointerEvents: 'auto'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.filter = 'brightness(0.9)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.filter = 'brightness(1)';
                            }}
                          >
                            {button.label}
                          </button>
                        ))}
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
            <div ref={ui.messagesEndRef} />
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
            {ui.showButtons ? (
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
                  ref={input.textareaRef}
                  value={input.inputValue}
                  onChange={(e) => input.setInputValue(e.target.value)}
                  onKeyPress={input.handleKeyPress}
                  placeholder={config.placeholder}
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px] max-h-[120px]"
                  rows={1}
                />
                <button
                  onClick={input.handleSend}
                  disabled={!input.inputValue.trim()}
                  className="absolute right-2 bottom-2 p-2 text-blue-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>

          {config.features.voiceRecording && (
            <button
              onClick={() => ui.setIsRecording(!ui.isRecording)}
              className={`p-2 rounded-md transition-colors ${
                ui.isRecording
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              {ui.isRecording ? <Square size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            {config.features.designMode && (
              <button
                onClick={ui.toggleButtonMode}
                className={`flex items-center space-x-2 text-sm px-3 py-2 rounded transition-colors ${
                  ui.showButtons
                    ? 'text-purple-700 bg-purple-100 hover:bg-purple-200'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                <Brush size={16} />
                <span>{ui.showButtons ? 'Exit Buttons' : 'Design'}</span>
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
              {ui.showButtons ? 'Button Mode' : input.inputValue.length > 0 ? `${input.inputValue.length} chars` : 'Ready'}
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
