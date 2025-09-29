import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square, MoreHorizontal, Brush, Edit, Zap } from 'lucide-react';

const ChatTemplate = ({ 
  conversationSeed = null,
  starting_with = "ai",
  onClose = () => {}
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Layout states
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [chatWidth, setChatWidth] = useState(50);
  const [showButtons, setShowButtons] = useState(false);
  
  // Generate initial messages from conversation seed
  const generateInitialMessages = () => {
    if (!conversationSeed || !Array.isArray(conversationSeed)) return [];
    
    return conversationSeed.map((seedMessage, index) => {
      // If no explicit sender is provided, alternate based on starting_with
      let sender = seedMessage.sender;
      if (!sender) {
        const isEven = index % 2 === 0;
        const isAiFirst = starting_with === "ai";
        sender = isAiFirst ? (isEven ? "ai" : "user") : (isEven ? "user" : "ai");
      }
      
      return {
        id: `seed-${index}`,
        text: seedMessage.text,
        sender: sender,
        type: seedMessage.type || 'text',
        buttons: seedMessage.buttons || null,
        timestamp: seedMessage.timestamp ? new Date(seedMessage.timestamp) : new Date(Date.now() - (conversationSeed.length - index) * 60000)
      };
    });
  };

  const [messages, setMessages] = useState(generateInitialMessages());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Message handling
  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: inputValue,
        sender: 'user',
        timestamp: new Date()
      }]);
      setInputValue('');
      
      // Simulate AI response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "I understand you're working on this task. How can I help you proceed?",
          sender: 'ai',
          timestamp: new Date()
        }]);
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-resize textarea
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

  // Button click handlers
  const toggleButtonMode = () => {
    setShowButtons(!showButtons);
  };

  const handleButtonClick = (buttonValue, buttonLabel, messageId) => {
    // Add the user's button response to the conversation
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: buttonLabel,
      sender: 'user',
      timestamp: new Date()
    }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: `I understand you selected "${buttonLabel}". How can I help you further?`,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }, 500);
  };

  const handleYesClick = () => {
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: "✅ Yes",
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
      text: "❌ No",
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

  const toggleSplitMode = () => {
    setIsSplitMode(!isSplitMode);
    if (!isSplitMode) {
      setChatWidth(50);
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-800">Chat Template</h2>
        <div className="flex items-center space-x-2">
          {isSplitMode && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Split Mode</span>
          )}
          {showButtons && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Button Mode</span>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold ml-4"
          >
            ×
          </button>
        </div>
      </div>

      {/* CHAT AND ARTIFACTS AREA */}
      <div className="flex bg-white overflow-hidden flex-1">
        {/* CHAT CONTAINER */}
        <div 
          className="flex flex-col overflow-hidden"
          style={{ 
            width: isSplitMode ? `${chatWidth}%` : '100%',
            borderRight: isSplitMode ? '1px solid #e5e7eb' : 'none'
          }}
        >
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800 border'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.text}</p>
                      
                      {/* Custom Buttons for seeded conversation */}
                      {message.type === 'buttons' && message.buttons && (
                        <div className={`mt-3 ${message['button-pos'] === 'column' ? 'space-y-2' : 'flex gap-2 flex-wrap'}`}>
                          {message.buttons.map((button, index) => (
                            <button
                              key={index}
                              onClick={() => handleButtonClick(button.value, button.label, message.id)}
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

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4 bg-white flex-shrink-0">
            <div className="flex items-end space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <Paperclip size={18} />
              </button>

              {/* Input or Button Mode */}
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
                      placeholder="Ask a question or describe what you need help with..."
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
            </div>

            {/* Tool Icons Row */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center space-x-4">
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
                <button 
                  onClick={() => alert('Edit functionality coming soon!')}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={toggleSplitMode}
                  className={`flex items-center space-x-2 text-sm px-2 py-1 rounded transition-colors ${
                    isSplitMode 
                      ? 'text-blue-700 bg-blue-100 hover:bg-blue-200' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <Zap size={16} />
                  <span>{isSplitMode ? 'Exit Split' : 'Artifacts'}</span>
                </button>
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

        {/* ARTIFACTS CONTAINER - Only in split mode */}
        {isSplitMode && (
          <div 
            className="flex flex-col bg-gray-50 overflow-hidden"
            style={{ width: `${100 - chatWidth}%` }}
          >
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-800">Artifacts</h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto text-gray-700">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Quote Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-bold text-lg">B</span>
                        </div>
                        <span className="text-2xl font-bold">Bluesoft</span>
                      </div>
                      <p className="text-blue-100 text-sm">Enterprise Software Solutions</p>
                    </div>
                    <div className="text-right">
                      <h1 className="text-3xl font-bold mb-1">QUOTE</h1>
                      <p className="text-blue-100 text-sm">Q-2025-0847</p>
                      <p className="text-blue-100 text-xs mt-1">September 15, 2025</p>
                    </div>
                  </div>
                </div>

                {/* Company and Customer Details */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-8">
                    {/* From Section */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">From</h3>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">Bluesoft Technologies Inc.</p>
                        <p>1247 Innovation Drive, Suite 400</p>
                        <p>San Francisco, CA 94105</p>
                        <p>Email: braxton.williams@bluesoft.com</p>
                      </div>
                    </div>

                    {/* To Section */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">To</h3>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">Sarah Chen, VP Operations</p>
                        <p>Acme Corporation</p>
                        <p>8642 Enterprise Blvd</p>
                        <p>Austin, TX 78759</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div className="p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Quote Details</h3>
                  
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium text-gray-900">Annual Software License</p>
                              <p className="text-sm text-gray-500">Bluesoft Enterprise Platform - 12 month license</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">1</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">$58,000.00</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">$58,000.00</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium text-gray-900">License Pack - 50 users</p>
                              <p className="text-sm text-gray-500">Additional user licenses for concurrent access</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">1</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">$20,000.00</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">$20,000.00</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium text-gray-900">Premium Support</p>
                              <p className="text-sm text-gray-500">24/7 priority support with dedicated account manager</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-900">1</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-900">$12,000.00</td>
                          <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">$12,000.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="mt-6 flex justify-end">
                    <div className="w-80">
                      <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-900">$90,000.00</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax (8.25%):</span>
                            <span className="text-gray-900">$7,425.00</span>
                          </div>
                          <div className="border-t border-gray-300 pt-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span className="text-gray-900">Total:</span>
                              <span className="text-blue-600">$97,425.00</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="px-6 pb-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Terms & Conditions</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Quote valid for 30 days</p>
                      <p>• Payment of this invoice is bound by our License Agreement at bluesoft.com/license-agreement</p>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Please sign and return this quote to proceed:</p>
                      <div className="border-b border-gray-400 w-64 mb-2"></div>
                      <p className="text-xs text-gray-500">Customer Signature</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-4">Date:</p>
                      <div className="border-b border-gray-400 w-32 mb-2"></div>
                      <p className="text-xs text-gray-500">Date</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      Thank you for considering Bluesoft for your enterprise software needs. We look forward to partnering with Acme Corporation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo component with example conversation seed
const Demo = () => {
  const [showChat, setShowChat] = useState(true);

  // New conversation seed for quote creation workflow
  const exampleConversationSeed = [
    {
      sender: 'ai',
      text: 'Hi Braxton! I\'m seeing that you had a productive meeting with Sarah Chen, and the opportunity appears ready for a quote. Shall we create one now?',
      type: 'buttons',
      buttons: [
        { 
          label: 'No', 
          value: 'no',
          'label-background': '#ef4444',
          'label-text': '#ffffff'
        },
        { 
          label: 'Yes', 
          value: 'yes',
          'label-background': '#10b981',
          'label-text': '#ffffff'
        }
      ]
    },
    {
      sender: 'user',
      text: 'Yes'
    },
    {
      sender: 'ai',
      text: 'Great, I\'ve produced the latest details based on your company\'s quote template and opportunity record. Please look it over and let me know if you\'d like me to make any changes, or simply edit it yourself!'
    },
    {
      sender: 'user',
      text: 'This looks good. Can you send it to everyone who attended the last meeting?'
    },
    {
      sender: 'ai',
      text: 'On it. . . . . done.'
    },
    {
      sender: 'ai',
      text: 'That\'s all for now. Would you like me to inform Accounts Payable to send the invoice?'
    },
    {
      sender: 'user',
      text: 'Yes, please.'
    }
  ];

  return (
    <>
      {showChat ? (
        <ChatTemplate
          conversationSeed={exampleConversationSeed}
          starting_with="ai"
          onClose={() => setShowChat(false)}
        />
      ) : (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <button
            onClick={() => setShowChat(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Open Chat Template
          </button>
        </div>
      )}
    </>
  );
};

export default Demo;