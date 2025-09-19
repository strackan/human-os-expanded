import React, { useState } from 'react';
import { TaskModeModal } from './TaskModeAdvanced';
import { WorkflowConfig } from './config/WorkflowConfig';

interface WorkflowWrapperProps {
  config: WorkflowConfig;
  conversationSeed?: Array<{
    sender?: 'ai' | 'user';
    text: string;
    type?: 'text' | 'buttons';
    buttons?: Array<{
      label: string;
      value: string;
      'label-background'?: string;
      'label-text'?: string;
    }>;
    timestamp?: string | Date;
  }>;
  startingWith?: 'ai' | 'user';
  artifactVisible?: boolean;
  autoOpen?: boolean;
  className?: string;
  configName?: string;
}

const WorkflowWrapper: React.FC<WorkflowWrapperProps> = ({
  config,
  conversationSeed,
  startingWith = 'ai',
  artifactVisible = false,
  autoOpen = true,
  className = '',
  configName = 'default'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(autoOpen);

  // Use conversation seed from props or fallback to config
  const effectiveConversationSeed = conversationSeed || config.chat.conversationSeed;

  return (
    <div className={className}>
      <TaskModeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        artifact_visible={artifactVisible}
        conversationSeed={effectiveConversationSeed}
        starting_with={startingWith}
        workflowConfig={config}
        workflowConfigName={configName}
      />
      {!isModalOpen && (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Reopen {config.customer.name} Task Mode
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowWrapper;