import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';

export interface Renewal {
  id: string;
  contract_id: string;
  customer_id: string;
  renewal_date: string;
  current_arr: number;
  proposed_arr?: number;
  probability: number;
  stage: string;
  risk_level: string;
  expansion_opportunity: number;
  assigned_to?: string;
  ai_risk_score?: number;
  ai_recommendations?: string;
  ai_confidence?: number;
  last_contact_date?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    name: string;
    industry: string;
    health_score: number;
  };
  contract?: {
    contract_number: string;
    arr: number;
  };
}

export interface RenewalFilters {
  stage?: string;
  risk_level?: string;
  assigned_to?: string;
  date_range?: {
    start: string;
    end: string;
  };
  probability_min?: number;
  probability_max?: number;
}

export interface UseRenewalsOptions {
  filters?: RenewalFilters;
  sortBy?: 'renewal_date' | 'current_arr' | 'probability' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseRenewalsReturn {
  renewals: Renewal[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRenewal: (id: string, updates: Partial<Renewal>) => Promise<void>;
  createRenewal: (renewal: Omit<Renewal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteRenewal: (id: string) => Promise<void>;
  getRenewalById: (id: string) => Renewal | undefined;
  filteredRenewals: Renewal[];
  stats: {
    total: number;
    byStage: Record<string, number>;
    byRiskLevel: Record<string, number>;
    totalValue: number;
    averageProbability: number;
  };
}

export const useRenewals = (options: UseRenewalsOptions = {}): UseRenewalsReturn => {
  const {
    filters = {},
    sortBy = 'renewal_date',
    sortOrder = 'asc',
    limit,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [renewals, setRenewals] = useState<Renewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchRenewals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('renewals')
        .select(`
          *,
          customers (
            name,
            industry,
            health_score
          ),
          contracts (
            contract_number,
            arr
          )
        `);

      // Apply filters
      if (filters.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters.risk_level) {
        query = query.eq('risk_level', filters.risk_level);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters.date_range) {
        query = query
          .gte('renewal_date', filters.date_range.start)
          .lte('renewal_date', filters.date_range.end);
      }
      if (filters.probability_min !== undefined) {
        query = query.gte('probability', filters.probability_min);
      }
      if (filters.probability_max !== undefined) {
        query = query.lte('probability', filters.probability_max);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setRenewals(data || []);
    } catch (err) {
      console.error('Error fetching renewals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch renewals');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, limit, supabase]);

  const updateRenewal = useCallback(async (id: string, updates: Partial<Renewal>) => {
    try {
      const { error: updateError } = await supabase
        .from('renewals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setRenewals(prev => 
        prev.map(renewal => 
          renewal.id === id 
            ? { ...renewal, ...updates, updated_at: new Date().toISOString() }
            : renewal
        )
      );
    } catch (err) {
      console.error('Error updating renewal:', err);
      throw err;
    }
  }, [supabase]);

  const createRenewal = useCallback(async (renewal: Omit<Renewal, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('renewals')
        .insert([renewal])
        .select(`
          *,
          customers (
            name,
            industry,
            health_score
          ),
          contracts (
            contract_number,
            arr
          )
        `)
        .single();

      if (createError) {
        throw createError;
      }

      setRenewals(prev => [...prev, data]);
    } catch (err) {
      console.error('Error creating renewal:', err);
      throw err;
    }
  }, [supabase]);

  const deleteRenewal = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('renewals')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setRenewals(prev => prev.filter(renewal => renewal.id !== id));
    } catch (err) {
      console.error('Error deleting renewal:', err);
      throw err;
    }
  }, [supabase]);

  const getRenewalById = useCallback((id: string) => {
    return renewals.find(renewal => renewal.id === id);
  }, [renewals]);

  // Computed values
  const filteredRenewals = useMemo(() => {
    return renewals;
  }, [renewals]);

  const stats = useMemo(() => {
    const byStage: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};
    let totalValue = 0;
    let totalProbability = 0;

    renewals.forEach(renewal => {
      // Count by stage
      byStage[renewal.stage] = (byStage[renewal.stage] || 0) + 1;
      
      // Count by risk level
      byRiskLevel[renewal.risk_level] = (byRiskLevel[renewal.risk_level] || 0) + 1;
      
      // Sum values
      totalValue += renewal.current_arr;
      totalProbability += renewal.probability;
    });

    return {
      total: renewals.length,
      byStage,
      byRiskLevel,
      totalValue,
      averageProbability: renewals.length > 0 ? totalProbability / renewals.length : 0
    };
  }, [renewals]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchRenewals();

    if (autoRefresh) {
      const interval = setInterval(fetchRenewals, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchRenewals, autoRefresh, refreshInterval]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('renewals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'renewals'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRenewals(prev => [...prev, payload.new as Renewal]);
          } else if (payload.eventType === 'UPDATE') {
            setRenewals(prev => 
              prev.map(renewal => 
                renewal.id === payload.new.id 
                  ? payload.new as Renewal 
                  : renewal
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setRenewals(prev => 
              prev.filter(renewal => renewal.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return {
    renewals,
    loading,
    error,
    refetch: fetchRenewals,
    updateRenewal,
    createRenewal,
    deleteRenewal,
    getRenewalById,
    filteredRenewals,
    stats
  };
}; 