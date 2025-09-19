import React, { useState } from 'react';
import { X } from 'lucide-react';
import CustomerOverview from './components/CustomerOverview';
import Analytics from './components/Analytics';
import ChatInterface from './components/ChatInterface';
import ArtifactsPanel from './components/ArtifactsPanel';
import { WorkflowConfig } from './config/WorkflowConfig';

interface DirectWorkflowViewProps {
  config: WorkflowConfig;
  configName?: string;
  onNextCustomer?: () => void;
  groupProgress?: string;
  onClose?: () => void;
}

const DirectWorkflowView: React.FC<DirectWorkflowViewProps> = ({
  config,
  configName = 'default',
  onNextCustomer,
  groupProgress,
  onClose
}) => {
  // Layout states
  const [dividerPosition, setDividerPosition] = useState(50);
  const [chatWidth, setChatWidth] = useState(50);

  // Horizontal divider resize
  const startHorizontalDividerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startPosition = dividerPosition;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const containerHeight = window.innerHeight;
      const deltaPercent = (deltaY / containerHeight) * 100;
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
  const startVerticalDividerResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = chatWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = window.innerWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
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

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white">
      {/* HEADER */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-6 flex justify-between items-center" style={{ flexShrink: 0 }}>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Task Mode</h2>
          {groupProgress && (
            <p className="text-sm text-gray-600">Demo Progress: {groupProgress}</p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <h2 className="text-lg font-semibold text-gray-800">{config.customer.name}</h2>
            {(onNextCustomer || config.customer.nextCustomer) && (
              <button
                onClick={onNextCustomer || (() => {})}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                {onNextCustomer ? 'Next Customer' : `Next Customer - ${config.customer.nextCustomer}`}
              </button>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Close (ESC)"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* DATA AREA - Top portion */}
      <div
        className="bg-gray-50 p-4 overflow-hidden border-b border-gray-200"
        style={{ height: `${dividerPosition}%` }}
      >
        <div className="h-full flex space-x-4">
          {/* Left Side - Customer Overview */}
          <CustomerOverview config={config.customerOverview} />

          {/* Right Side - Analytics */}
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

      {/* CHAT AND ARTIFACTS AREA - Bottom 50% */}
      <div
        className="flex bg-white overflow-hidden"
        style={{ height: `${100 - dividerPosition}%` }}
      >
        {/* CHAT CONTAINER */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: `${chatWidth}%`,
            borderRight: '1px solid #e5e7eb'
          }}
        >
          <ChatInterface
            config={config.chat}
            isSplitMode={true}
            onToggleSplitMode={() => {}} // No-op since we're always in split mode
            startingWith="ai"
            className="flex-1"
          />
        </div>

        {/* VERTICAL DIVIDER */}
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

        {/* ARTIFACTS CONTAINER */}
        <div style={{ width: `${100 - chatWidth}%` }}>
          <ArtifactsPanel
            config={config.artifacts}
            workflowConfigName={configName}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DirectWorkflowView;