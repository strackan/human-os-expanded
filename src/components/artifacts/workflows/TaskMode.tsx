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
    width: 80,
    height: 80,
    top: 10,
    left: 10
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
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800">Acme Corp Inc.</h2>
            <button className="text-xs text-blue-500 hover:text-blue-600 transition-colors">Next Customer - Intrasoft</button>
          </div>
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
      </div>

      {/* DATA AREA */}
      <div 
        className="bg-gray-50 p-4 overflow-hidden border-b border-gray-200"
        style={{ height: `${dividerPosition}%` }}
      >
        <div className="h-full flex space-x-4">
          {/* Left Side - Customer Overview */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <div className="h-full">
              {/* 2x4 Grid Layout */}
              <div className="grid grid-cols-2 grid-rows-4 gap-3 h-full">
                {/* Row 1 */}
                {/* ARR (moved from second position) */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">ARR</span>
                    <span className="text-xs text-green-600">↗ +12.5%</span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 text-center">$485,000</div>
                </div>
                
                {/* License Unit Price */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">License Unit Price</span>
                  <div className="text-sm font-bold text-gray-900 text-center">$6.76 <span className="text-xs text-gray-500">(88% value)</span></div>
                  <div className="text-xs text-orange-600 text-center mt-1">Pays less than 88% of customers</div>
                </div>

                {/* Row 2 */}
                {/* Renewal Date */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">Renewal Date</span>
                  <div className="text-sm font-semibold text-orange-600 text-center">Jan 18, 2026</div>
                  <div className="text-xs text-gray-500 text-center">125 days</div>
                </div>

                {/* Primary Contact */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">Primary Contact</span>
                  <div className="text-center">
                    <div className="font-medium text-gray-900 text-sm">Sarah Chen</div>
                    <div className="text-xs text-gray-600">VP Operations</div>
                  </div>
                </div>

                {/* Row 3 */}
                {/* Risk Score */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">Risk Score</span>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-sm font-semibold text-green-500">3.2/10</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">2 open critical tickets</div>
                </div>

                {/* Growth Score */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">Growth Score</span>
                  <div className="flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    <span className="text-sm font-semibold text-green-500">7.8/10</span>
                  </div>
                  <div className="text-xs text-gray-500 text-center">Expansion potential</div>
                </div>

                {/* Row 4 */}
                {/* YoY Growth */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">YoY Growth</span>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm font-semibold text-green-500">+18.2%</span>
                    <div className="flex items-end space-x-px">
                      {[3, 4, 3, 5, 6, 7, 8].map((height, i) => (
                        <div 
                          key={i} 
                          className="w-0.5 bg-green-500 rounded-t"
                          style={{ height: `${height + 2}px` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">Annual</div>
                </div>

                {/* Last Month */}
                <div className="bg-gray-50 rounded-lg p-3 flex flex-col justify-between">
                  <span className="text-xs text-gray-600">Last Month</span>
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-sm font-semibold text-red-500">-15.3%</span>
                    <div className="flex items-end space-x-px">
                      {[8, 7, 6, 5, 4, 3, 2].map((height, i) => (
                        <div 
                          key={i} 
                          className="w-0.5 bg-red-500 rounded-t"
                          style={{ height: `${height + 2}px` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-center">Declining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Analytics Quadrants */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-y-auto">
            <div className="h-full grid grid-cols-2 gap-3">
              {/* Top Left - Usage Spark Chart */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-semibold text-gray-800 mb-2">Usage Trend</div>
                <div className="relative h-20 flex items-end space-x-1 mb-2">
                  {/* Reference line for current license cost */}
                  <div className="absolute top-8 left-0 right-0 h-px bg-red-500 opacity-70 z-10"></div>
                  <div className="absolute top-7 left-1 text-xs text-red-500 bg-gray-50 px-1">License Cost</div>
                  {/* Mock spark chart showing uplift */}
                  {[2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 9, 11, 13, 15, 14, 16, 18, 20, 22, 21, 23, 25].map((height, i) => (
                    <div 
                      key={i} 
                      className={`w-1 ${i >= 15 ? 'bg-green-500' : 'bg-blue-500'} rounded-t`}
                      style={{ height: `${height * 3}px` }}
                    ></div>
                  ))}
                </div>
                <div className="text-xs text-green-500 font-medium">↗ +45% recent uplift</div>
              </div>

              {/* Top Right - Single Clean Container */}
              <div className="row-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="h-full flex flex-col justify-between space-y-4">
                  {/* Row 1: Renewal Stage + Confidence (Two Columns) */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Renewal Stage</div>
                      <div className="font-medium text-blue-900">Planning</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Confidence</span>
                        <div className="flex items-center ml-3">
                          <span className="text-sm font-bold text-orange-600">85%</span>
                          <svg className="w-3 h-3 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-red-400 via-yellow-400 via-orange-400 to-green-400 rounded-full"
                          style={{ width: '100%' }}
                        ></div>
                        <div 
                          className="absolute top-0 h-full w-0.5 bg-gray-800"
                          style={{ left: '85%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 2: Recommended Action (Full Width) */}
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Recommended Action</div>
                    <div className="font-medium text-green-900">Early Renewal Outreach</div>
                  </div>
                  
                  {/* Row 3: Key Reasons */}
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800 mb-3">Key Reasons</div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start">
                          <span className="text-xs text-gray-400 mr-2">-</span>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-700">Adoption</span>
                            <div className="text-xs text-gray-600">45% recent usage increase</div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs text-gray-400 mr-2">-</span>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-700">Company Growth</span>
                            <div className="text-xs text-gray-600">Employees ↗ 12% (LinkedIn)</div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-start">
                          <span className="text-xs text-gray-400 mr-2">-</span>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-700">News</span>
                            <div className="text-xs text-gray-600">Strong recent earnings report</div>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs text-gray-400 mr-2">-</span>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-gray-700">Sentiment</span>
                            <div className="text-xs text-gray-600">Strong executive engagement in Q3</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Row 4: See More (Full Width) */}
                  <div className="text-right">
                    <button className="text-xs text-blue-500 hover:text-blue-600 transition-colors">See more</button>
                  </div>
                </div>
              </div>

              {/* Bottom Left - User Licenses Spark Chart */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-sm font-semibold text-gray-800 mb-2">User Licenses</div>
                <div className="relative h-20 flex items-end space-x-1 mb-2">
                  {/* Reference line for current license cost */}
                  <div className="absolute top-10 left-0 right-0 h-px bg-red-500 opacity-70 z-10"></div>
                  <div className="absolute top-9 left-1 text-xs text-red-500 bg-gray-50 px-1">License Cost</div>
                  {/* Mock spark chart showing cliff jump */}
                  {[8, 9, 8, 9, 10, 9, 8, 9, 10, 9, 8, 9, 10, 11, 12, 20, 21, 22, 21, 20, 22, 21, 23, 22, 24, 23, 25, 24, 26, 25, 27, 26, 28, 27, 29, 28, 30, 29, 31, 30].map((height, i) => (
                    <div 
                      key={i} 
                      className={`w-1 ${i >= 15 ? 'bg-purple-500' : 'bg-gray-400'} rounded-t`}
                      style={{ height: `${height * 2.5}px` }}
                    ></div>
                  ))}
                </div>
                <div className="text-xs text-purple-500 font-medium">↗ +120% spike</div>
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