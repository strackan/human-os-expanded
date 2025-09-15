import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square, MoreHorizontal, Brush, Edit, Zap } from 'lucide-react';

const TaskModeModal = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // Modal dimensions and position
  const [modalDimensions, setModalDimensions] = useState({
    width: 70,
    height: 70,
    top: 15,
    left: 15
  });
  
  // Layout states
  const [dividerPosition, setDividerPosition] = useState(50);
  const [isSplitMode, setIsSplitMode] = useState(false);
  const [chatWidth, setChatWidth] = useState(50);
  const [showButtons, setShowButtons] = useState(false); // For Yes/No button mode
  
  const modalRef = useRef(null);

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

  // External modal resize functionality
  const startModalResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startDimensions = { ...modalDimensions };

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newDimensions = { ...startDimensions };
      const deltaWidthPercent = (deltaX / window.innerWidth) * 100;
      const deltaHeightPercent = (deltaY / window.innerHeight) * 100;
      
      if (direction.includes('right')) {
        newDimensions.width = Math.max(30, Math.min(90, startDimensions.width + deltaWidthPercent));
      }
      if (direction.includes('left')) {
        const newWidth = Math.max(30, Math.min(90, startDimensions.width - deltaWidthPercent));
        const widthChange = newWidth - startDimensions.width;
        newDimensions.width = newWidth;
        newDimensions.left = Math.max(0, Math.min(70, startDimensions.left - widthChange));
      }
      if (direction.includes('bottom')) {
        newDimensions.height = Math.max(30, Math.min(90, startDimensions.height + deltaHeightPercent));
      }
      if (direction.includes('top')) {
        const newHeight = Math.max(30, Math.min(90, startDimensions.height - deltaHeightPercent));
        const heightChange = newHeight - startDimensions.height;
        newDimensions.height = newHeight;
        newDimensions.top = Math.max(0, Math.min(70, startDimensions.top - heightChange));
      }
      
      setModalDimensions(newDimensions);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    let cursor = 'nwse-resize';
    if (direction === 'top' || direction === 'bottom') cursor = 'ns-resize';
    if (direction === 'left' || direction === 'right') cursor = 'ew-resize';
    if (direction === 'top-left' || direction === 'bottom-right') cursor = 'nwse-resize';
    if (direction === 'top-right' || direction === 'bottom-left') cursor = 'nesw-resize';

    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Horizontal divider resize
  const startHorizontalDividerResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startY = e.clientY;
    const modalRect = modalRef.current.getBoundingClientRect();
    const startPosition = dividerPosition;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const modalHeight = modalRect.height - 60;
      const deltaPercent = (deltaY / modalHeight) * 100;
      const newPosition = Math.max(25, Math.min(75, startPosition + deltaPercent));
      setDividerPosition(newPosition);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Vertical divider resize
  const startVerticalDividerResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const modalRect = modalRef.current.getBoundingClientRect();
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercent = (deltaX / modalRect.width) * 100;
      const newWidth = Math.max(25, Math.min(75, startWidth + deltaPercent));
      setChatWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={modalRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 flex flex-col overflow-hidden z-50"
      style={{
        top: `${modalDimensions.top}vh`,
        left: `${modalDimensions.left}vw`,
        width: `${modalDimensions.width}vw`,
        height: `${modalDimensions.height}vh`,
        minWidth: '400px',
        minHeight: '300px'
      }}
    >
      {/* EXTERNAL RESIZE HANDLES */}
      
      {/* Corner Handles */}
      <div
        className="absolute -top-1 -left-1 w-5 h-5 cursor-nw-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'top-left')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-br"></div>
      </div>
      <div
        className="absolute -top-1 -right-1 w-5 h-5 cursor-ne-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'top-right')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-bl ml-2"></div>
      </div>
      <div
        className="absolute -bottom-1 -left-1 w-5 h-5 cursor-sw-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'bottom-left')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-tr"></div>
      </div>
      <div
        className="absolute -bottom-1 -right-1 w-5 h-5 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity z-50"
        onMouseDown={(e) => startModalResize(e, 'bottom-right')}
      >
        <div className="w-3 h-3 bg-blue-500 rounded-tl ml-2"></div>
      </div>
      
      {/* Edge Handles */}
      <div
        className="absolute -top-2 h-4 cursor-ns-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ left: '20px', right: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'top')}
      >
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600"></div>
      </div>
      <div
        className="absolute -bottom-2 h-4 cursor-ns-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ left: '20px', right: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'bottom')}
      >
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600"></div>
      </div>
      <div
        className="absolute -left-2 w-4 cursor-ew-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ top: '20px', bottom: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'left')}
      >
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-blue-600"></div>
      </div>
      <div
        className="absolute -right-2 w-4 cursor-ew-resize opacity-0 hover:opacity-50 bg-blue-500 transition-opacity z-40"
        style={{ top: '20px', bottom: '20px' }}
        onMouseDown={(e) => startModalResize(e, 'right')}
      >
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 w-0.5 h-6 bg-blue-600"></div>
      </div>

      {/* HEADER */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center" style={{ height: '60px', flexShrink: 0 }}>
        <h2 className="text-lg font-semibold text-gray-800">Task Mode</h2>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {modalDimensions.width.toFixed(0)}vw × {modalDimensions.height.toFixed(0)}vh
          </span>
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

      {/* DATA AREA */}
      <div 
        className="bg-gray-50 p-4 overflow-hidden border-b border-gray-200"
        style={{ height: `${dividerPosition}%` }}
      >
        <div className="h-full flex space-x-4">
          {/* Left Side - Customer Stats */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Acme Corp Inc.</h3>
                <div className="flex space-x-2">
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Enterprise</span>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">High-Value</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Annual Recurring Revenue</span>
                  <span className="text-xs text-green-600 flex items-center">↗ +12.5%</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">$485,000</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-600">Last Price Increase</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-lg font-semibold text-gray-900">+8%</span>
                  <span className="text-xs text-gray-500">Jan 2024</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-600">Risk Level</span>
                <div className="flex items-center mt-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-lg font-semibold text-yellow-700">Medium</span>
                  <span className="text-xs text-gray-500 ml-auto">Usage declining</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-600">Strategic Tier</span>
                <div className="text-lg font-semibold text-purple-700 mt-1">Tier 1 - Strategic</div>
                <span className="text-xs text-gray-500">Key account, expansion target</span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-sm text-gray-600">Primary Contact</span>
                <div className="mt-1">
                  <div className="font-medium text-gray-900">Sarah Chen</div>
                  <div className="text-sm text-gray-600">VP Operations</div>
                  <div className="text-xs text-gray-500">Last contact: 3 days ago</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Stage & Recommendations */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Current Stage</h3>
                <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-400">
                  <div className="font-medium text-blue-900">Renewal Planning</div>
                  <div className="text-sm text-blue-700 mt-1">Contract expires in 3 months</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Recommended Action</h3>
                <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-400">
                  <div className="font-medium text-green-900">Schedule QBR</div>
                  <div className="text-sm text-green-700 mt-1">Present usage analytics & discuss expansion opportunities</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Recent Updates</h3>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Usage dropped 15% last month</div>
                        <div className="text-xs text-gray-600 mt-1">Need to investigate cause and provide support</div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">2 days ago</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">New stakeholder added: CTO</div>
                        <div className="text-xs text-gray-600 mt-1">Technical decision maker now engaged</div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">1 week ago</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Support ticket resolved</div>
                        <div className="text-xs text-gray-600 mt-1">Integration issue fixed, satisfaction score: 9/10</div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">2 weeks ago</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Attended product webinar</div>
                        <div className="text-xs text-gray-600 mt-1">Showed interest in new automation features</div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">3 weeks ago</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">Expansion discussion initiated</div>
                        <div className="text-xs text-gray-600 mt-1">Interested in additional licenses for Q2</div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">1 month ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HORIZONTAL DIVIDER */}
      <div 
        className="bg-gray-200 border-y border-gray-300 cursor-ns-resize flex items-center justify-center hover:bg-gray-300 transition-colors"
        style={{ height: '6px', flexShrink: 0 }}
        onMouseDown={startHorizontalDividerResize}
      >
        <div className="flex flex-col space-y-px">
          <div className="w-8 h-px bg-gray-500"></div>
          <div className="w-8 h-px bg-gray-500"></div>
        </div>
      </div>

      {/* CHAT AND ARTIFACTS AREA */}
      <div 
        className="flex bg-white overflow-hidden"
        style={{ height: `${100 - dividerPosition}%` }}
      >
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
          <div className="border-t border-gray-200 p-4 bg-white" style={{ flexShrink: 0 }}>
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

        {/* VERTICAL DIVIDER - Only in split mode */}
        {isSplitMode && (
          <div 
            className="w-2 bg-gray-200 cursor-ew-resize hover:bg-gray-300 transition-colors flex items-center justify-center"
            onMouseDown={startVerticalDividerResize}
          >
            <div className="flex flex-col space-y-1">
              <div className="w-px h-3 bg-gray-500"></div>
              <div className="w-px h-3 bg-gray-500"></div>
              <div className="w-px h-3 bg-gray-500"></div>
            </div>
          </div>
        )}

        {/* ARTIFACTS CONTAINER - Only in split mode */}
        {isSplitMode && (
          <div 
            className="flex flex-col bg-gray-50 overflow-hidden"
            style={{ width: `${100 - chatWidth}%` }}
          >
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-semibold text-gray-800">Artifacts</h3>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-3">🎨</div>
                <p className="font-medium">Artifact Workspace</p>
                <p className="text-sm mt-1">Invoices, quotes, emails & dashboards will appear here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal demo wrapper to show the component
const Demo = () => {
  const [isModalOpen, setIsModalOpen] = useState(true); // Start open for demo

  return (
    <>
      <TaskModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {!isModalOpen && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Reopen Task Mode
          </button>
        </div>
      )}
    </>
  );
};

export default Demo;