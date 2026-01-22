/**
 * Workflow Step Progress Component
 *
 * Horizontal step indicator showing workflow progress.
 * Each step has hover actions for snooze/skip.
 */

import { motion } from 'framer-motion';
import { useWorkflowNavigation, useWorkflowStepActions } from '@/lib/contexts';
import { useWorkflowMode } from '@/lib/contexts/WorkflowModeContext';
import { StepIndicator } from './StepIndicator';
import type { WorkflowStepProgressProps, StepActionType } from '@/lib/types/workflow';

export function WorkflowStepProgress({
  className,
  showActions = true,
}: WorkflowStepProgressProps) {
  const { workflowState } = useWorkflowMode();
  const { currentStepIndex, goToStep } = useWorkflowNavigation();
  const { openStepActionMenu, openModal } = useWorkflowStepActions();

  const steps = workflowState?.steps ?? [];

  const handleStepClick = (index: number) => {
    goToStep(index);
  };

  const handleActionClick = (stepId: string, action: StepActionType) => {
    openStepActionMenu(stepId, action);
    openModal(action);
  };

  if (steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-center gap-4 py-4 px-6 ${className ?? ''}`}
    >
      {steps.map((step, index) => (
        <StepIndicator
          key={step.id}
          step={step}
          index={index}
          isActive={index === currentStepIndex}
          showConnector={index > 0}
          onClick={() => handleStepClick(index)}
          onActionClick={showActions ? (action) => handleActionClick(step.id, action) : undefined}
        />
      ))}
    </motion.div>
  );
}

export default WorkflowStepProgress;
