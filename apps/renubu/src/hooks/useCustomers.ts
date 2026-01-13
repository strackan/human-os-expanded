import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  domain?: string;
  industry: string;
  health_score: number;
  current_arr: number;
  renewal_date?: string;
  primary_contact_id?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  properties?: CustomerProperties;
  renewals?: RenewalSummary[];
}

export interface CustomerProperties {
  id: string;
  customer_id: string;
  usage_score: number;
  health_score: number;
  nps_score: number;
  current_arr: number;
  expansion_potential: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  revenue_impact_tier: number;
  churn_risk_score: number;
  last_activity_date?: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalSummary {
  id: string;
  renewal_date: string;
  current_arr: number;
  proposed_arr?: number;
  probability: number;
  stage: string;
  risk_level: string;
  days_until_renewal: number;
}

export interface CustomerFilters {
  industry?: string;
  health_score_min?: number;
  health_score_max?: number;
  risk_level?: string;
  assigned_to?: string;
}

export interface UseCustomersOptions {
  filters?: CustomerFilters;
  sortBy?: 'name' | 'health_score' | 'current_arr' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  includeProperties?: boolean;
  includeRenewals?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createCustomer: (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  updateCustomerProperties: (customerId: string, properties: Partial<CustomerProperties>) => Promise<void>;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomerByDomain: (domain: string) => Customer | undefined;
  calculateHealthScore: (customerId: string) => Promise<number>;
  assessRiskLevel: (customerId: string) => Promise<string>;
  stats: {
    total: number;
    byIndustry: Record<string, number>;
    byRiskLevel: Record<string, number>;
    averageHealthScore: number;
    totalARR: number;
    atRiskCustomers: number;
  };
}

export const useCustomers = (options: UseCustomersOptions = {}): UseCustomersReturn => {
  const {
    filters = {},
    sortBy = 'name',
    sortOrder = 'asc',
    limit,
    includeProperties = true,
    includeRenewals = false,
    autoRefresh = false,
    refreshInterval = 30000
  } = options;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('customers')
        .select(`
          *,
          properties:customer_properties(*),
          renewals:renewals(
            id,
            renewal_date,
            current_arr,
            proposed_arr,
            probability,
            stage,
            risk_level
          )
        `);

      // Apply filters
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.health_score_min !== undefined) {
        query = query.gte('health_score', filters.health_score_min);
      }
      if (filters.health_score_max !== undefined) {
        query = query.lte('health_score', filters.health_score_max);
      }
      if (filters.risk_level) {
        query = query.eq('properties.risk_level', filters.risk_level);
      }
      if (filters.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
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

      // Process customers and add computed fields
      const processedCustomers = (data || []).map(customer => {
        const properties = customer.properties?.[0];
        const renewals = customer.renewals || [];
        
        // Calculate days until renewal for each renewal
        const processedRenewals = renewals.map((renewal: any) => ({
          ...renewal,
          days_until_renewal: Math.ceil(
            (new Date(renewal.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        }));

        return {
          ...customer,
          properties: includeProperties ? properties : undefined,
          renewals: includeRenewals ? processedRenewals : undefined
        };
      });

      setCustomers(processedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, limit, includeProperties, includeRenewals, supabase]);

  const createCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      setCustomers(prev => [...prev, data]);
      return data.id;
    } catch (err) {
      console.error('Error creating customer:', err);
      throw err;
    }
  }, [supabase]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id 
            ? { ...customer, ...updates, updated_at: new Date().toISOString() }
            : customer
        )
      );
    } catch (err) {
      console.error('Error updating customer:', err);
      throw err;
    }
  }, [supabase]);

  const deleteCustomer = useCallback(async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      setCustomers(prev => prev.filter(customer => customer.id !== id));
    } catch (err) {
      console.error('Error deleting customer:', err);
      throw err;
    }
  }, [supabase]);

  const updateCustomerProperties = useCallback(async (customerId: string, properties: Partial<CustomerProperties>) => {
    try {
      // Check if properties exist for this customer
      const { data: existingProperties } = await supabase
        .from('customer_properties')
        .select('id')
        .eq('customer_id', customerId)
        .single();

      if (existingProperties) {
        // Update existing properties
        const { error: updateError } = await supabase
          .from('customer_properties')
          .update({
            ...properties,
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new properties
        const { error: createError } = await supabase
          .from('customer_properties')
          .insert([{
            customer_id: customerId,
            ...properties
          }]);

        if (createError) {
          throw createError;
        }
      }

      // Update local state
      setCustomers(prev =>
        prev.map(customer => {
          if (customer.id === customerId) {
            return {
              ...customer,
              properties: {
                ...customer.properties,
                ...properties,
                updated_at: new Date().toISOString()
              } as typeof customer.properties
            };
          }
          return customer;
        })
      );
    } catch (err) {
      console.error('Error updating customer properties:', err);
      throw err;
    }
  }, [supabase]);

  const getCustomerById = useCallback((id: string) => {
    return customers.find(customer => customer.id === id);
  }, [customers]);

  const getCustomerByDomain = useCallback((domain: string) => {
    return customers.find(customer => customer.domain === domain);
  }, [customers]);

  const calculateHealthScore = useCallback(async (customerId: string): Promise<number> => {
    try {
      const customer = getCustomerById(customerId);
      if (!customer || !customer.properties) {
        return 0;
      }

      const { usage_score, nps_score, churn_risk_score } = customer.properties;
      
      // Simple health score calculation (can be enhanced with more sophisticated logic)
      let healthScore = 0;
      
      // Usage score (0-100) - 40% weight
      healthScore += (usage_score || 0) * 0.4;
      
      // NPS score (0-10) - 30% weight
      healthScore += ((nps_score || 0) / 10) * 100 * 0.3;
      
      // Churn risk (inverse) - 30% weight
      const churnRiskInverse = Math.max(0, 10 - (churn_risk_score || 0));
      healthScore += (churnRiskInverse / 10) * 100 * 0.3;

      // Update the customer's health score
      await updateCustomerProperties(customerId, { health_score: Math.round(healthScore) });
      
      return Math.round(healthScore);
    } catch (err) {
      console.error('Error calculating health score:', err);
      throw err;
    }
  }, [getCustomerById, updateCustomerProperties]);

  const assessRiskLevel = useCallback(async (customerId: string): Promise<string> => {
    try {
      const customer = getCustomerById(customerId);
      if (!customer || !customer.properties) {
        return 'medium';
      }

      const { health_score, churn_risk_score, current_arr } = customer.properties;
      
      // Risk assessment logic
      let riskScore = 0;
      
      // Health score impact (lower health = higher risk)
      if (health_score < 30) riskScore += 3;
      else if (health_score < 50) riskScore += 2;
      else if (health_score < 70) riskScore += 1;
      
      // Churn risk impact
      if (churn_risk_score > 7) riskScore += 3;
      else if (churn_risk_score > 5) riskScore += 2;
      else if (churn_risk_score > 3) riskScore += 1;
      
      // Revenue impact (higher ARR = higher risk if unhealthy)
      if (current_arr > 100000 && health_score < 50) riskScore += 1;
      
      let riskLevel: string;
      if (riskScore >= 5) riskLevel = 'critical';
      else if (riskScore >= 3) riskLevel = 'high';
      else if (riskScore >= 1) riskLevel = 'medium';
      else riskLevel = 'low';

      // Update the customer's risk level
      await updateCustomerProperties(customerId, { risk_level: riskLevel as any });
      
      return riskLevel;
    } catch (err) {
      console.error('Error assessing risk level:', err);
      throw err;
    }
  }, [getCustomerById, updateCustomerProperties]);

  // Computed stats
  const stats = useMemo(() => {
    const byIndustry: Record<string, number> = {};
    const byRiskLevel: Record<string, number> = {};
    let totalHealthScore = 0;
    let totalARR = 0;
    let atRiskCustomers = 0;

    customers.forEach(customer => {
      // Count by industry
      byIndustry[customer.industry] = (byIndustry[customer.industry] || 0) + 1;
      
      // Count by risk level
      const riskLevel = customer.properties?.risk_level || 'medium';
      byRiskLevel[riskLevel] = (byRiskLevel[riskLevel] || 0) + 1;
      
      // Sum health scores
      totalHealthScore += customer.health_score;
      
      // Sum ARR
      totalARR += customer.current_arr || 0;
      
      // Count at-risk customers
      if (customer.properties?.risk_level === 'high' || customer.properties?.risk_level === 'critical') {
        atRiskCustomers++;
      }
    });

    return {
      total: customers.length,
      byIndustry,
      byRiskLevel,
      averageHealthScore: customers.length > 0 ? totalHealthScore / customers.length : 0,
      totalARR,
      atRiskCustomers
    };
  }, [customers]);

  // Auto-refresh functionality
  useEffect(() => {
    fetchCustomers();

    if (autoRefresh) {
      const interval = setInterval(fetchCustomers, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchCustomers, autoRefresh, refreshInterval]);

  // Real-time subscriptions
  useEffect(() => {
    const customerChannel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setCustomers(prev => [...prev, payload.new as Customer]);
          } else if (payload.eventType === 'UPDATE') {
            setCustomers(prev => 
              prev.map(customer => 
                customer.id === payload.new.id 
                  ? payload.new as Customer 
                  : customer
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setCustomers(prev => 
              prev.filter(customer => customer.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    const propertiesChannel = supabase
      .channel('customer-properties-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_properties'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newProperties = payload.new as CustomerProperties;
            setCustomers(prev => 
              prev.map(customer => {
                if (customer.id === newProperties.customer_id) {
                  return {
                    ...customer,
                    properties: newProperties
                  };
                }
                return customer;
              })
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(customerChannel);
      supabase.removeChannel(propertiesChannel);
    };
  }, [supabase]);

  return {
    customers,
    loading,
    error,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerProperties,
    getCustomerById,
    getCustomerByDomain,
    calculateHealthScore,
    assessRiskLevel,
    stats
  };
}; 