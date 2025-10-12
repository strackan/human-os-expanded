import React, { useState } from 'react';
import { Bot, User, Send, Settings, X } from 'lucide-react';

const ConfigurableChatInterface = () => {
  // Default configuration
  const defaultConfig = {
    starting_with: "user",
    messages: [
      "Hello! Can you help me understand our customer churn analysis?",
      "I'd be happy to help you with customer churn analysis. What specific aspects would you like to explore?",
      "I'm particularly interested in our Q4 data. What patterns are you seeing?",
      "Based on your Q4 data, I can see several interesting patterns. Your churn rate increased by 12% compared to Q3, primarily driven by mid-market customers. The main factors appear to be pricing sensitivity and competitive pressure.",
      "That's concerning. What would you recommend as our top priority action?",
      "I recommend focusing on three key areas: 1) Implement proactive outreach for at-risk mid-market accounts, 2) Review your pricing strategy against competitors, and 3) Enhance your value demonstration process. Would you like me to dive deeper into any of these recommendations?",
      "Yes, let's focus on the proactive outreach. How would you structure that?"
    ]
  };

  const [chatConfig, setChatConfig] = useState(defaultConfig);
  const [showConfig, setShowConfig] = useState(false);
  const [formData, setFormData] = useState({
    starting_with: chatConfig.starting_with,
    messages: chatConfig.messages.join('\n')
  });

  // Generate alternating user/AI messages based on starting point
  const generateMessages = () => {
    return chatConfig.messages.map((text, index) => {
      const isEven = index % 2 === 0;
      const isUserFirst = chatConfig.starting_with === "user";
      const isUser = isUserFirst ? isEven : !isEven;
      
      return {
        id: index,
        text: text,
        sender: isUser ? "user" : "ai",
        timestamp: new Date(Date.now() - (chatConfig.messages.length - index) * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
    });
  };

  const handleConfigSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newMessages = formData.messages.split('\n').filter((msg: string) => msg.trim() !== '');
    setChatConfig({
      starting_with: formData.starting_with,
      messages: newMessages
    });
    setShowConfig(false);
  };

  const handleConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const messages = generateMessages();

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
      {/* Configuration Panel */}
      {showConfig && (
        <div className="bg-blue-50 border-b border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-blue-900">Update Chat Configuration</h3>
            <button
              onClick={() => setShowConfig(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Who starts the conversation?
              </label>
              <select
                value={formData.starting_with}
                onChange={(e) => handleConfigChange('starting_with', e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">User</option>
                <option value="ai">AI Assistant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Messages (one per line, will alternate between user and AI)
              </label>
              <textarea
                value={formData.messages}
                onChange={(e) => handleConfigChange('messages', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="Enter each message on a separate line..."
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Chat
              </button>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-500">Customer Success Analysis</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Online
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="text-gray-500 hover:text-gray-700 p-1 rounded"
              title="Configure Chat"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-xs lg:max-w-md ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.sender === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gray-600'
              }`}>
                {message.sender === 'user' ? (
                  <User className="w-3 h-3 text-white" />
                ) : (
                  <Bot className="w-3 h-3 text-white" />
                )}
              </div>
              
              {/* Message Bubble */}
              <div className={`rounded-lg px-4 py-2 ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-1 ${
                  message.sender === 'user' 
                    ? 'text-blue-100' 
                    : 'text-gray-500'
                }`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled
            />
          </div>
          <button
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            disabled
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Demo mode - {messages.length} messages configured
        </p>
      </div>

      {/* Configuration Info */}
      <div className="bg-gray-100 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            <strong>Current Config:</strong> Starting with {chatConfig.starting_with} • {chatConfig.messages.length} messages
          </div>
          {!showConfig && (
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={showConfig}
                onChange={(e) => setShowConfig(e.target.checked)}
                className="rounded"
              />
              Update Chat Settings
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurableChatInterface;