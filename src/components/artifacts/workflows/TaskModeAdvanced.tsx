import React, { useState, useRef } from 'react';
import CustomerOverview from './components/CustomerOverview';
import Analytics from './components/Analytics';
import ChatInterface from './components/ChatInterface';
import ArtifactsPanel from './components/ArtifactsPanel';
import { WorkflowConfig, defaultWorkflowConfig } from './config/WorkflowConfig';

const TaskModeModal = ({
  isOpen,
  onClose,
  artifact_visible = false,
  conversationSeed = null,
  starting_with = "ai",
  workflowConfig = defaultWorkflowConfig,
  workflowConfigName = "default"
}) => {
  // Use configuration with overrides
  const config: WorkflowConfig = {
    ...workflowConfig,
    chat: {
      ...workflowConfig.chat,
      conversationSeed: conversationSeed || workflowConfig.chat.conversationSeed
    },
    layout: {
      ...workflowConfig.layout,
      splitModeDefault: artifact_visible
    }
  };

  // Modal dimensions and position
  const [modalDimensions, setModalDimensions] = useState(config.layout.modalDimensions);

  // Layout states
  const [dividerPosition, setDividerPosition] = useState(config.layout.dividerPosition);
  const [isSplitMode, setIsSplitMode] = useState(config.layout.splitModeDefault);
  const [chatWidth, setChatWidth] = useState(config.layout.chatWidth);

  const modalRef = useRef<HTMLDivElement>(null);

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
        newDimensions.width = Math.max(30, Math.min(95, startDimensions.width + deltaWidthPercent));
      }
      if (direction.includes('left')) {
        const newWidth = Math.max(30, Math.min(95, startDimensions.width - deltaWidthPercent));
        const widthChange = newWidth - startDimensions.width;
        newDimensions.width = newWidth;
        newDimensions.left = Math.max(0, Math.min(65, startDimensions.left - widthChange));
      }
      if (direction.includes('bottom')) {
        newDimensions.height = Math.max(30, Math.min(95, startDimensions.height + deltaHeightPercent));
      }
      if (direction.includes('top')) {
        const newHeight = Math.max(30, Math.min(95, startDimensions.height - deltaHeightPercent));
        const heightChange = newHeight - startDimensions.height;
        newDimensions.height = newHeight;
        newDimensions.top = Math.max(0, Math.min(65, startDimensions.top - heightChange));
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
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-6 flex justify-between items-center" style={{ flexShrink: 0 }}>
        <h2 className="text-lg font-semibold text-gray-800">Task Mode</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800">{config.customer.name}</h2>
            <button className="text-xs text-blue-500 hover:text-blue-600 transition-colors">
              Next Customer - {config.customer.nextCustomer}
            </button>
          </div>
          <div className="flex items-center space-x-2">
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
          <CustomerOverview config={config.customerOverview} />

          {/* Right Side - Analytics Quadrants */}
          <Analytics config={config.analytics} />
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
          <ChatInterface
            config={config.chat}
            isSplitMode={isSplitMode}
            onToggleSplitMode={toggleSplitMode}
            startingWith={starting_with}
            className="flex-1"
          />
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
          <div style={{ width: `${100 - chatWidth}%` }}>
            <ArtifactsPanel
              config={config.artifacts}
              workflowConfigName={workflowConfigName}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Minimal demo wrapper to show the component
const Demo = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);

  const exampleConversationSeed = [
    {
      sender: 'ai',
      text: 'Hi, Justin! It appears AcmeCorp\'s usage has increased significantly over the past 4 weeks. Reaching out proactively to engaged customers can increase renewal rates and likelihood of multi-year extensions. Because their renewal is over 120 days away, I recommend an Early Outreach strategy. Shall we proceed, snooze for now, or skip?',
      type: 'buttons',
      buttons: [
        { 
          label: 'Skip', 
          value: 'skip',
          'label-background': '#ef4444',
          'label-text': '#ffffff'
        },
        { 
          label: 'Snooze', 
          value: 'snooze',
          'label-background': '#f59e0b',
          'label-text': '#ffffff'
        },
        { 
          label: 'Proceed', 
          value: 'proceed',
          'label-background': '#10b981',
          'label-text': '#ffffff'
        }
      ]
    },
    {
      sender: 'user',
      text: 'Proceed'
    },
    {
      sender: 'ai',
      text: 'Great. Let\'s get started. Last year, this customer paid $485,000 for 100,000 tokens. This year their usage is projected to be 240,000 tokens, which would generate renewal license fees at $1,164,000. I recommend sending an initial email bringing this to the customer\'s attention. Shall I draft one for you?',
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
      text: 'Great, I\'ve drafted an email to Sarah Chen to the right. You can send it here or review in your drafts folder. I recommend pursuing a multi-year extension. Let\'s talk later to prepare our strategy. Shall I set a task in three days?',
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
      text: 'Talk to you then!'
    }
  ];

  return (
    <>
      <TaskModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artifact_visible={true}
        conversationSeed={exampleConversationSeed}
        starting_with="ai"
        workflowConfig={defaultWorkflowConfig}
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

export { TaskModeModal };
export default Demo;