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
}

interface ChatInterfaceHDProps {
  config: ChatConfig;
  isSplitMode: boolean;
  onToggleSplitMode: () => void;
  className?: string;
  startingWith?: 'ai' | 'user';
  onArtifactAction?: (action: ConversationAction) => void;
  onGotoSlide?: (slideNumber: number) => void;
  onStepClick?: (stepId: string) => void;
  workingMessageRef?: React.RefObject<{
    showWorkingMessage: () => void;
    hideWorkingMessage: () => void;
  } | null>;
  workflowConfigName?: string;
  sidePanelConfig?: any;
  workflowConfig?: WorkflowConfig;
  visibleArtifacts?: Set<string>;
  setVisibleArtifacts?: (artifacts: Set<string>) => void;
  currentSlideIndex?: number;
  setCurrentSlideIndex?: (index: number) => void;
  showFinalSlide?: boolean;
  setShowFinalSlide?: (show: boolean) => void;
}

const ChatInterfaceHD = React.forwardRef<{
  getMessages: () => Message[];
  getCurrentInput: () => string;
  restoreState: (messages: Message[], inputValue: string) => void;
  showWorkingMessage: () => void;
  hideWorkingMessage: () => void;
  resetChat: () => void;
  advanceToNextStep: (stepTitle: string) => void;
}, ChatInterfaceHDProps>(({
  config,
  isSplitMode,
  onToggleSplitMode,
  className = '',
  startingWith = 'ai',
  onArtifactAction,
  onGotoSlide,
  workingMessageRef,
  workflowConfig,
  visibleArtifacts,
  setVisibleArtifacts,
  currentSlideIndex,
  setCurrentSlideIndex,
  showFinalSlide,
  setShowFinalSlide
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

  const [messages, setMessages] = useState<Message[]>(generateInitialMessages());
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [conversationEngine, setConversationEngine] = useState<ConversationEngine | null>(null);
  const [isWorkingOnIt, setIsWorkingOnIt] = useState(false);
  const [typingMessages, setTypingMessages] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Working message control functions
  const showWorkingMessage = () => {
    setIsWorkingOnIt(true);
  };

  const hideWorkingMessage = () => {
    setIsWorkingOnIt(false);
  };

  // Method for step transitions within a workflow (with separator scroll)
  const advanceToNextStep = (stepTitle: string) => {
    console.log('ChatInterfaceHD: Advancing to next step with separator scroll:', stepTitle);

    // Add visual separator with white space for scroll effect
    setMessages(prev => [...prev, {
      id: `step-separator-${Date.now()}`,
      text: `──────── ${stepTitle} ────────`,
      sender: 'ai',
      timestamp: new Date(),
      type: 'separator'
    }]);

    // Get initial message for new step (if using dynamic flow)
    setTimeout(() => {
      if (config.mode === 'dynamic' && config.dynamicFlow?.initialMessage) {
        const initialMessage = config.dynamicFlow.initialMessage;
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: initialMessage.text,
          sender: 'ai',
          timestamp: new Date(),
          type: initialMessage.buttons ? 'buttons' : 'text',
          buttons: initialMessage.buttons
        }]);

        // Scroll container to bottom, pushing old content up through white space
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            requestAnimationFrame(() => {
              console.log('ChatInterfaceHD: Scrolling for step transition. scrollHeight:', container.scrollHeight);
              container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
              });
            });
          }
        }, 150);
      }
    }, 100);
  };

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getMessages: () => messages,
    getCurrentInput: () => inputValue,
    restoreState: (newMessages: Message[], newInputValue: string) => {
      setMessages(newMessages);
      setInputValue(newInputValue);
    },
    showWorkingMessage,
    hideWorkingMessage,
    resetChat: () => {
      setMessages(generateInitialMessages());
      setInputValue('');
    },
    advanceToNextStep
  }));

  // Initialize conversation engine - skip for now to avoid config structure issues
  useEffect(() => {
    // Temporarily disable ConversationEngine to avoid config structure issues
    // const engine = new ConversationEngine(config, workflowConfig);
    // setConversationEngine(engine);
  }, [config, workflowConfig]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle dynamic flow initialization
  useEffect(() => {
    if (config.mode === 'dynamic' && config.dynamicFlow && messages.length === 0) {
      const initialMessage = config.dynamicFlow.initialMessage;
      if (initialMessage) {
        const message: Message = {
          id: 'initial',
          text: initialMessage.text,
          sender: 'ai',
          timestamp: new Date(),
          type: 'buttons',
          buttons: initialMessage.buttons
        };
        setMessages([message]);
      }
    }
  }, [config, messages.length]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simple response for demo purposes
    const aiMessage: Message = {
      id: Date.now() + 1,
      text: "I understand you said: \"" + text.trim() + "\". This is a demo response for the HD version.",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleButtonClick = async (buttonValue: string) => {
    // Simple button handling for demo purposes
    const userMessage: Message = {
      id: Date.now(),
      text: buttonValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    // Show artifact if it's a planning button
    if (buttonValue === 'planning' && setVisibleArtifacts) {
      setVisibleArtifacts(new Set(['planning-checklist-renewal']));
    }

    const aiMessage: Message = {
      id: Date.now() + 1,
      text: "You clicked: \"" + buttonValue + "\". This is a demo response for the HD version.",
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    };
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header - Compact */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Chat</h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleSplitMode}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={isSplitMode ? 'Hide Artifacts' : 'Show Artifacts'}
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages - Compact */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-2 space-y-2" style={{ scrollBehavior: 'smooth' }}>
        {messages.map((message) => {
          // Special rendering for separator
          if (message.type === 'separator') {
            console.log('🔴 ChatInterfaceHD: RENDERING SEPARATOR MESSAGE:', message);
            return (
              <div
                key={message.id}
                data-separator="true"
                style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }} // Debug: red tint
              >
                <div className="flex justify-center">
                  <div className="text-center py-8">
                    <div className="text-sm font-semibold text-gray-500 tracking-wider">
                      {message.text}
                    </div>
                  </div>
                </div>
                {/* White space div with actual height for scrolling */}
                <div
                  data-whitespace="true"
                  style={{
                    height: 'calc(100vh - 140px)',
                    width: '100%',
                    backgroundColor: 'rgba(0, 255, 0, 0.1)' // Debug: green tint
                  }}
                />
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div dangerouslySetInnerHTML={{ __html: message.text }} />

                {message.buttons && (
                  <div className="mt-2 space-y-1">
                    {message.buttons.map((button, index) => (
                      <button
                        key={index}
                        onClick={() => handleButtonClick(button.value)}
                        className="block w-full text-left p-1 text-xs bg-white text-gray-700 hover:bg-gray-50 rounded border"
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isWorkingOnIt && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 p-2 rounded-lg text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                <span className="text-xs text-gray-500">Working on it...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Compact */}
      <div className="p-2 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={config.placeholder || 'Type your message...'}
              className="w-full p-2 border border-gray-300 rounded-md resize-none text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
            />
          </div>
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim()}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

ChatInterfaceHD.displayName = 'ChatInterfaceHD';

export default ChatInterfaceHD;
