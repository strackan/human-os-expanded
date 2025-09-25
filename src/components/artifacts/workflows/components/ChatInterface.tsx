import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square, MoreHorizontal, Brush, Edit, Zap } from 'lucide-react';
import { ChatConfig } from '../config/WorkflowConfig';
import { ConversationEngine, ConversationAction } from '../utils/conversationEngine';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'buttons';
  buttons?: Array<{
    label: string;
    value: string;
    'label-background'?: string;
    'label-text'?: string;
  }>;
  'button-pos'?: string;
}

interface ChatInterfaceProps {
  config: ChatConfig;
  isSplitMode: boolean;
  onToggleSplitMode: () => void;
  className?: string;
  startingWith?: 'ai' | 'user';
  onArtifactAction?: (action: ConversationAction) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  config,
  isSplitMode,
  onToggleSplitMode,
  className = '',
  startingWith = 'ai',
  onArtifactAction
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [conversationEngine, setConversationEngine] = useState<ConversationEngine | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  useEffect(() => {
    if (config.mode === 'dynamic' && config.dynamicFlow) {
      const engine = new ConversationEngine(config.dynamicFlow, (action) => {
        if (onArtifactAction) {
          onArtifactAction(action);
        }
      });
      setConversationEngine(engine);

      const initialMessage = engine.getInitialMessage();
      if (initialMessage && messages.length === 0) { // Only add initial message if no messages exist
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
      }
    }
  }, [config.mode, config.dynamicFlow]); // Remove onArtifactAction from dependencies

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            text: response.text,
            sender: 'ai',
            timestamp: new Date(),
            type: response.buttons ? 'buttons' : 'text',
            buttons: response.buttons
          }]);
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

  const handleButtonClick = (buttonValue: string, buttonLabel: string) => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: buttonLabel,
      sender: 'user',
      timestamp: new Date()
    }]);

    if (config.mode === 'dynamic' && conversationEngine) {
      setTimeout(() => {
        const response = conversationEngine.processUserInput(buttonValue);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: response.text,
          sender: 'ai',
          timestamp: new Date(),
          type: response.buttons ? 'buttons' : 'text',
          buttons: response.buttons
        }]);
      }, 500);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: `I understand you selected "${buttonLabel}". How can I help you further?`,
          sender: 'ai',
          timestamp: new Date()
        }]);
      }, 500);
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

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div
        className="flex-1 p-4 space-y-4 overflow-y-auto"
        style={{ minHeight: 0 }}
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
            {messages.map((message) => (
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
                  <p className="whitespace-pre-wrap">{message.text}</p>

                  {message.type === 'buttons' && message.buttons && (
                    <div className={`mt-3 ${message['button-pos'] === 'column' ? 'space-y-2' : 'flex gap-2 flex-wrap'}`}>
                      {message.buttons.map((button, index) => (
                        <button
                          key={index}
                          onClick={() => handleButtonClick(button.value, button.label)}
                          className={`text-center px-3 py-2 rounded transition-colors border ${
                            message['button-pos'] === 'column' ? 'block w-full text-left' : 'flex-1 min-w-0'
                          }`}
                          style={{
                            backgroundColor: button['label-background'] || '#f3f4f6',
                            color: button['label-text'] || '#374151',
                            borderColor: button['label-background'] || '#d1d5db'
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
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
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
                  className="w-full resize-none border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px] max-h-[150px]"
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
};

export default ChatInterface;