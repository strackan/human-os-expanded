import { useState, useEffect } from 'react';
import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';
import { getWorkflowConfig } from '@/config/workflows';
import { useWorkflowContext } from '@/lib/data-providers';

/**
 * useWorkflowData - Loads workflow configuration and context data
 *
 * Manages:
 * - Workflow config loading
 * - Customer data loading
 * - Expansion data loading
 * - Stakeholder data loading
 *
 * Extracted from useTaskModeState.ts (lines 40-67)
 */

interface UseWorkflowDataProps {
  workflowId: string;
  customerId: string;
}

export function useWorkflowData({ workflowId, customerId }: UseWorkflowDataProps) {
  const [config, setConfig] = useState<WorkflowConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load workflow context from database
  const {
    customer,
    expansionData,
    stakeholders,
    loading: contextLoading,
    error: contextError
  } = useWorkflowContext(workflowId, customerId);

  // Load workflow config on mount
  useEffect(() => {
    const loadedConfig = getWorkflowConfig(workflowId);

    if (!loadedConfig) {
      setConfigError(`No configuration found for workflow: ${workflowId}`);
      console.error('[useWorkflowData] Config not found:', workflowId);
    } else {
      setConfig(loadedConfig);
      console.log('[useWorkflowData] Loaded config for:', workflowId, loadedConfig);
    }
  }, [workflowId]);

  return {
    config,
    configError,
    customer,
    expansionData,
    stakeholders,
    contextLoading,
    contextError,
    slides: config?.slides || [],
  };
}
