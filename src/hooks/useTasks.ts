import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';

export interface RenewalTask {
  id: string;
  renewal_id: string;
  task_template_id: string;
  assigned_user_id?: string;
  action_score: number;
  deadline_urgency_score: number;
  days_to_deadline: number;
  task_deadline_date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  outcome_achieved: boolean;
  is_overdue: boolean;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  task_name?: string;
  task_description?: string;
  phase?: string;
  complexity_score?: number;
  customer_name?: string;
  renewal_date?: string;
  current_arr?: number;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  phase: 'planning' | 'preparation' | 'outreach' | 'negotiation' | 'documentation' | 'closure';
  earliest_start_day: number;
  latest_completion_day: number;
  deadline_type: 'soft' | 'hard';
  grace_period_days: number;
  complexity_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskFilters {
  status?: string;
  phase?: string;
  assigned_user_id?: string;
  renewal_id?: string;
  is_overdue?: boolean;
  priority_min?: number;
  priority_max?: number;
}

export interface UseTasksOptions {
  filters?: TaskFilters;
  sortBy?: 'action_score' | 'days_to_deadline' | 'created_at' | 'task_deadline_date';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeTemplates?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTasksReturn {
  tasks: RenewalTask[];
  templates: TaskTemplate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createTask: (task: Omit<RenewalTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<RenewalTask>) => Promise<void>;
  completeTask: (id: string, outcome: boolean, notes?: string) => Promise<void>;
  assignTask: (id: string, userId: string) => Promise<void>;
  getTaskById: (id: string) => RenewalTask | undefined;
  getNextPriorityTask: () => Promise<RenewalTask | null>;
  generateTasksForRenewal: (renewalId: string) => Promise<void>;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byPhase: Record<string, number>;
    overdue: number;
    highPriority: number;
    averageActionScore: number;
  };
}

export const useTasks = (options: UseTasksOptions = {}): UseTasksReturn => {
  const {
    filters = {},
    sortBy = 'action_score',
    sortOrder = 'desc',
    limit,
    includeTemplates = true,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [tasks, setTasks] = useState<RenewalTask[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = [];

      // Fetch tasks
      let taskQuery = supabase
        .from('renewal_tasks')
        .select(`
          *,
          task_templates!inner(
            name,
            description,
            phase,
            complexity_score
          ),
          renewals!inner(
            renewal_date,
            current_arr,
            customers!inner(name)
          )
        `);

      // Apply filters
      if (filters.status) {
        taskQuery = taskQuery.eq('status', filters.status);
      }
      if (filters.phase) {
        taskQuery = taskQuery.eq('task_templates.phase', filters.phase);
      }
      if (filters.assigned_user_id) {
        taskQuery = taskQuery.eq('assigned_user_id', filters.assigned_user_id);
      }
      if (filters.renewal_id) {
        taskQuery = taskQuery.eq('renewal_id', filters.renewal_id);
      }
      if (filters.is_overdue !== undefined) {
        taskQuery = taskQuery.eq('is_overdue', filters.is_overdue);
      }
      if (filters.priority_min !== undefined) {
        taskQuery = taskQuery.gte('action_score', filters.priority_min);
      }
      if (filters.priority_max !== undefined) {
        taskQuery = taskQuery.lte('action_score', filters.priority_max);
      }

      // Apply sorting
      taskQuery = taskQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply limit
      if (limit) {
        taskQuery = taskQuery.limit(limit);
      }

      promises.push(taskQuery);

      // Fetch templates if needed
      if (includeTemplates) {
        const templateQuery = supabase
          .from('task_templates')
          .select('*')
          .eq('is_active', true)
          .order('phase', { ascending: true });

        promises.push(templateQuery);
      }

      const results = await Promise.all(promises);

      // Process task results
      const { data: taskData, error: taskError } = results[0];
      if (taskError) throw taskError;

      const processedTasks = (taskData || []).map(task => ({
        ...task,
        task_name: task.task_templates?.name,
        task_description: task.task_templates?.description,
        phase: task.task_templates?.phase,
        complexity_score: task.task_templates?.complexity_score,
        customer_name: task.renewals?.customers?.name,
        renewal_date: task.renewals?.renewal_date,
        current_arr: task.renewals?.current_arr
      }));

      setTasks(processedTasks);

      // Process template results
      if (includeTemplates) {
        const { data: templateData, error: templateError } = results[1];
        if (templateError) throw templateError;
        setTemplates(templateData || []);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, limit, includeTemplates, supabase]);

  const createTask = useCallback(async (task: Omit<RenewalTask, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('renewal_tasks')
        .insert([task])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setTasks(prev => [...prev, data]);
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    }
  }, [supabase]);

  const updateTask = useCallback(async (id: string, updates: Partial<RenewalTask>) => {
    try {
      const { error: updateError } = await supabase
        .from('renewal_tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setTasks(prev => 
        prev.map(task => 
          task.id === id 
            ? { ...task, ...updates, updated_at: new Date().toISOString() }
            : task
        )
      );
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  }, [supabase]);

  const completeTask = useCallback(async (id: string, outcome: boolean, notes?: string) => {
    await updateTask(id, {
      status: 'completed',
      outcome_achieved: outcome,
      completed_at: new Date().toISOString(),
      notes: notes || undefined
    });
  }, [updateTask]);

  const assignTask = useCallback(async (id: string, userId: string) => {
    await updateTask(id, {
      assigned_user_id: userId,
      status: 'in_progress'
    });
  }, [updateTask]);

  const getTaskById = useCallback((id: string) => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  const getNextPriorityTask = useCallback(async (): Promise<RenewalTask | null> => {
    try {
      const { data, error } = await supabase.rpc('get_next_priority_task');

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as RenewalTask;
    } catch (err) {
      console.error('Error getting next priority task:', err);
      throw err;
    }
  }, [supabase]);

  const generateTasksForRenewal = useCallback(async (renewalId: string) => {
    try {
      const { error } = await supabase.rpc('generate_renewal_tasks', {
        renewal_uuid: renewalId
      });

      if (error) {
        throw error;
      }

      // Refresh tasks after generation
      await fetchTasks();
    } catch (err) {
      console.error('Error generating tasks for renewal:', err);
      throw err;
    }
  }, [supabase, fetchTasks]);

  // Computed stats
  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const byPhase: Record<string, number> = {};
    let totalActionScore = 0;
    let overdueCount = 0;
    let highPriorityCount = 0;

    tasks.forEach(task => {
      // Count by status
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      
      // Count by phase
      if (task.phase) {
        byPhase[task.phase] = (byPhase[task.phase] || 0) + 1;
      }
      
      // Sum action scores
      totalActionScore += task.action_score;
      
      // Count overdue tasks
      if (task.is_overdue) {
        overdueCount++;
      }
      
      // Count high priority tasks (action score > 7)
      if (task.action_score > 7) {
        highPriorityCount++;
      }
    });

    return {
      total: tasks.length,
      byStatus,
      byPhase,
      overdue: overdueCount,
      highPriority: highPriorityCount,
      averageActionScore: tasks.length > 0 ? totalActionScore / tasks.length : 0
    };
  }, [tasks]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchTasks();

    if (autoRefresh) {
      const interval = setInterval(fetchTasks, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchTasks, autoRefresh, refreshInterval]);

  // Real-time subscriptions
  useEffect(() => {
    const taskChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'renewal_tasks'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as RenewalTask]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => 
              prev.map(task => 
                task.id === payload.new.id 
                  ? payload.new as RenewalTask 
                  : task
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => 
              prev.filter(task => task.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const templateChannel = supabase
      .channel('task-templates-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_templates'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTemplates(prev => [...prev, payload.new as TaskTemplate]);
          } else if (payload.eventType === 'UPDATE') {
            setTemplates(prev => 
              prev.map(template => 
                template.id === payload.new.id 
                  ? payload.new as TaskTemplate 
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

    return () => {
      supabase.removeChannel(taskChannel);
      supabase.removeChannel(templateChannel);
    };
  }, [supabase]);

  return {
    tasks,
    templates,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    completeTask,
    assignTask,
    getTaskById,
    getNextPriorityTask,
    generateTasksForRenewal,
    stats
  };
}; 