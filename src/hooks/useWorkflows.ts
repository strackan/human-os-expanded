import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';

export interface WorkflowStep {
  id: string;
  action_type: string;
  title: string;
  description: string;
  parameters?: Record<string, any>;
  estimated_duration?: number;
  dependencies?: string[];
  required?: boolean;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  trigger_type: 'manual' | 'event' | 'schedule' | 'condition';
  conditions: Record<string, any>;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface WorkflowInstance {
  id: string;
  template_id: string;
  event_id?: string;
  renewal_id?: string;
  customer_id?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_step?: string;
  progress: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  template?: WorkflowTemplate;
}

export interface WorkflowExecution {
  id: string;
  instance_id: string;
  step_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  started_at?: string;
  completed_at?: string;
  result?: any;
  error?: string;
  created_at: string;
}

export interface WorkflowFilters {
  status?: string;
  trigger_type?: string;
  renewal_id?: string;
  customer_id?: string;
  created_by?: string;
}

export interface UseWorkflowsOptions {
  filters?: WorkflowFilters;
  sortBy?: 'created_at' | 'updated_at' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeTemplates?: boolean;
  includeExecutions?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseWorkflowsReturn {
  templates: WorkflowTemplate[];
  instances: WorkflowInstance[];
  executions: WorkflowExecution[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTemplate: (template: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<WorkflowTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  createInstance: (instance: Omit<WorkflowInstance, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateInstance: (id: string, updates: Partial<WorkflowInstance>) => Promise<void>;
  cancelInstance: (id: string) => Promise<void>;
  executeStep: (instanceId: string, stepId: string, parameters?: Record<string, any>) => Promise<void>;
  getTemplateById: (id: string) => WorkflowTemplate | undefined;
  getInstanceById: (id: string) => WorkflowInstance | undefined;
  stats: {
    totalTemplates: number;
    totalInstances: number;
    activeInstances: number;
    completedInstances: number;
    failedInstances: number;
    averageExecutionTime: number;
  };
}

export const useWorkflows = (options: UseWorkflowsOptions = {}): UseWorkflowsReturn => {
  const {
    filters = {},
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit,
    includeTemplates = true,
    includeExecutions = false,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [instances, setInstances] = useState<WorkflowInstance[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchWorkflows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // Fetch templates
      if (includeTemplates) {
        let templateQuery = supabase
          .from('workflow_templates')
          .select('*');

        if (filters.trigger_type) {
          templateQuery = templateQuery.eq('trigger_type', filters.trigger_type);
        }
        if (filters.status) {
          templateQuery = templateQuery.eq('status', filters.status);
        }

        templateQuery = templateQuery.order(sortBy, { ascending: sortOrder === 'asc' });
        if (limit) {
          templateQuery = templateQuery.limit(limit);
        }

        promises.push(templateQuery);
      }

      // Fetch instances
      let instanceQuery = supabase
        .from('workflows')
        .select(`
          *,
          template:workflow_templates(*)
        `);

      if (filters.status) {
        instanceQuery = instanceQuery.eq('status', filters.status);
      }
      if (filters.renewal_id) {
        instanceQuery = instanceQuery.eq('renewal_id', filters.renewal_id);
      }
      if (filters.customer_id) {
        instanceQuery = instanceQuery.eq('customer_id', filters.customer_id);
      }

      instanceQuery = instanceQuery.order(sortBy, { ascending: sortOrder === 'asc' });
      if (limit) {
        instanceQuery = instanceQuery.limit(limit);
      }

      promises.push(instanceQuery);

      // Fetch executions if needed
      if (includeExecutions) {
        let executionQuery = supabase
          .from('workflow_executions')
          .select('*')
          .order('created_at', { ascending: false });

        if (limit) {
          executionQuery = executionQuery.limit(limit);
        }

        promises.push(executionQuery);
      }

      const results = await Promise.all(promises);
      let templateIndex = 0;
      let instanceIndex = 1;

      if (includeTemplates) {
        const { data: templateData, error: templateError } = results[templateIndex];
        if (templateError) throw templateError;
        setTemplates(templateData || []);
        templateIndex++;
      }

      const { data: instanceData, error: instanceError } = results[instanceIndex];
      if (instanceError) throw instanceError;
      setInstances(instanceData || []);

      if (includeExecutions) {
        const { data: executionData, error: executionError } = results[2];
        if (executionError) throw executionError;
        setExecutions(executionData || []);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, limit, includeTemplates, includeExecutions, supabase]);

  const createTemplate = useCallback(async (template: Omit<WorkflowTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('workflow_templates')
        .insert([template])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setTemplates(prev => [...prev, data]);
      return data.id;
    } catch (err) {
      console.error('Error creating workflow template:', err);
      throw err;
    }
  }, [supabase]);

  const updateTemplate = useCallback(async (id: string, updates: Partial<WorkflowTemplate>) => {
    try {
      const { error: updateError } = await supabase
        .from('workflow_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setTemplates(prev => 
        prev.map(template => 
          template.id === id 
            ? { ...template, ...updates, updated_at: new Date().toISOString() }
            : template
        )
      );
    } catch (err) {
      console.error('Error updating workflow template:', err);
      throw err;
    }
  }, [supabase]);

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('workflow_templates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setTemplates(prev => prev.filter(template => template.id !== id));
    } catch (err) {
      console.error('Error deleting workflow template:', err);
      throw err;
    }
  }, [supabase]);

  const createInstance = useCallback(async (instance: Omit<WorkflowInstance, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('workflows')
        .insert([instance])
        .select(`
          *,
          template:workflow_templates(*)
        `)
        .single();

      if (createError) {
        throw createError;
      }

      setInstances(prev => [...prev, data]);
      return data.id;
    } catch (err) {
      console.error('Error creating workflow instance:', err);
      throw err;
    }
  }, [supabase]);

  const updateInstance = useCallback(async (id: string, updates: Partial<WorkflowInstance>) => {
    try {
      const { error: updateError } = await supabase
        .from('workflows')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setInstances(prev => 
        prev.map(instance => 
          instance.id === id 
            ? { ...instance, ...updates, updated_at: new Date().toISOString() }
            : instance
        )
      );
    } catch (err) {
      console.error('Error updating workflow instance:', err);
      throw err;
    }
  }, [supabase]);

  const cancelInstance = useCallback(async (id: string) => {
    await updateInstance(id, { 
      status: 'cancelled',
      completed_at: new Date().toISOString()
    });
  }, [updateInstance]);

  const executeStep = useCallback(async (instanceId: string, stepId: string, parameters?: Record<string, any>) => {
    try {
      // Create execution record
      const { data: execution, error: executionError } = await supabase
        .from('workflow_executions')
        .insert([{
          instance_id: instanceId,
          step_id: stepId,
          status: 'running',
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (executionError) {
        throw executionError;
      }

      setExecutions(prev => [...prev, execution]);

      // Simulate step execution (replace with actual workflow engine logic)
      setTimeout(async () => {
        try {
          // Update execution as completed
          const { error: updateError } = await supabase
            .from('workflow_executions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              result: { success: true, parameters }
            })
            .eq('id', execution.id);

          if (updateError) {
            throw updateError;
          }

          // Update execution in local state
          setExecutions(prev => 
            prev.map(exec => 
              exec.id === execution.id 
                ? { ...exec, status: 'completed', completed_at: new Date().toISOString() }
                : exec
            )
          );

          // Update instance progress
          const instance = instances.find(inst => inst.id === instanceId);
          if (instance) {
            const template = instance.template;
            if (template) {
              const currentStepIndex = template.steps.findIndex(step => step.id === stepId);
              const progress = ((currentStepIndex + 1) / template.steps.length) * 100;
              
              await updateInstance(instanceId, {
                current_step: stepId,
                progress,
                status: progress >= 100 ? 'completed' : 'running'
              });
            }
          }
        } catch (err) {
          console.error('Error completing workflow step:', err);
          
          // Mark execution as failed
          await supabase
            .from('workflow_executions')
            .update({
              status: 'failed',
              completed_at: new Date().toISOString(),
              error: err instanceof Error ? err.message : 'Unknown error'
            })
            .eq('id', execution.id);
        }
      }, 1000);

    } catch (err) {
      console.error('Error executing workflow step:', err);
      throw err;
    }
  }, [supabase, instances, updateInstance]);

  const getTemplateById = useCallback((id: string) => {
    return templates.find(template => template.id === id);
  }, [templates]);

  const getInstanceById = useCallback((id: string) => {
    return instances.find(instance => instance.id === id);
  }, [instances]);

  // Computed stats
  const stats = useMemo(() => {
    const activeInstances = instances.filter(inst => inst.status === 'running').length;
    const completedInstances = instances.filter(inst => inst.status === 'completed').length;
    const failedInstances = instances.filter(inst => inst.status === 'failed').length;
    
    let totalExecutionTime = 0;
    let completedExecutions = 0;

    executions.forEach(exec => {
      if (exec.status === 'completed' && exec.started_at && exec.completed_at) {
        const startTime = new Date(exec.started_at).getTime();
        const endTime = new Date(exec.completed_at).getTime();
        totalExecutionTime += endTime - startTime;
        completedExecutions++;
      }
    });

    return {
      totalTemplates: templates.length,
      totalInstances: instances.length,
      activeInstances,
      completedInstances,
      failedInstances,
      averageExecutionTime: completedExecutions > 0 ? totalExecutionTime / completedExecutions : 0
    };
  }, [templates, instances, executions]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchWorkflows();

    if (autoRefresh) {
      const interval = setInterval(fetchWorkflows, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchWorkflows, autoRefresh, refreshInterval]);

  // Real-time subscriptions
  useEffect(() => {
    const templateChannel = supabase
      .channel('workflow-templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflow_templates'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTemplates(prev => [...prev, payload.new as WorkflowTemplate]);
          } else if (payload.eventType === 'UPDATE') {
            setTemplates(prev => 
              prev.map(template => 
                template.id === payload.new.id 
                  ? payload.new as WorkflowTemplate 
                  : template
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTemplates(prev => 
              prev.filter(template => template.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const instanceChannel = supabase
      .channel('workflow-instances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workflows'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setInstances(prev => [...prev, payload.new as WorkflowInstance]);
          } else if (payload.eventType === 'UPDATE') {
            setInstances(prev => 
              prev.map(instance => 
                instance.id === payload.new.id 
                  ? payload.new as WorkflowInstance 
                  : instance
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setInstances(prev => 
              prev.filter(instance => instance.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(templateChannel);
      supabase.removeChannel(instanceChannel);
    };
  }, [supabase]);

  return {
    templates,
    instances,
    executions,
    loading,
    error,
    refetch: fetchWorkflows,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    createInstance,
    updateInstance,
    cancelInstance,
    executeStep,
    getTemplateById,
    getInstanceById,
    stats
  };
}; 