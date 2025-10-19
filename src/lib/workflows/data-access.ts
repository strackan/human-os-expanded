/**
 * Workflow Data Access Layer
 *
 * Handles all database queries for workflow system
 * Abstracts Supabase queries for customer and workflow data
 *
 * Ported from automation-backup SQLite implementation to Supabase PostgreSQL
 */

import { createClient } from '@/lib/supabase-server';
import type { CustomerData } from './types';

/**
 * Database Customer Row Interface
 * Maps to customers table schema
 */
interface DatabaseCustomer {
  id: string;
  name: string;
  domain: string | null;
  current_arr: number;
  renewal_date: string | null;
  assigned_to: string | null;
  account_plan: string | null;
  risk_score: number | null;
  opportunity_score: number | null;
}

/**
 * Database Renewal Row Interface
 * Maps to renewals table schema
 */
interface DatabaseRenewal {
  id: string;
  customer_id: string;
  renewal_date: string;
  current_arr: number;
  stage: string;
}

/**
 * Calculate days until renewal from renewal date
 */
function calculateDaysUntilRenewal(renewalDate: string | null): number | null {
  if (!renewalDate) return null;

  const today = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Transform database customer row to CustomerData interface
 */
function transformCustomerData(
  customer: DatabaseCustomer,
  renewal?: DatabaseRenewal | null
): CustomerData {
  return {
    id: customer.id,
    customer_id: customer.id,
    domain: customer.domain || '',
    arr: Number(customer.current_arr || 0),
    renewal_date: customer.renewal_date,
    owner: customer.assigned_to || '',
    account_plan: customer.account_plan,
    risk_score: customer.risk_score,
    opportunity_score: customer.opportunity_score,
    // Renewal-specific fields
    renewal_id: renewal?.id,
    renewal_stage: renewal?.stage,
    days_until_renewal: calculateDaysUntilRenewal(renewal?.renewal_date || customer.renewal_date)
  };
}

/**
 * Get all customers that need workflows for a specific company
 *
 * @param companyId - Company ID to filter by
 * @param ownerId - Optional CSM owner ID to filter by
 * @returns Array of customer data with workflow context
 */
export async function getCustomersNeedingWorkflows(
  companyId: string,
  ownerId?: string
): Promise<CustomerData[]> {
  const supabase = createClient();

  try {
    // Build query for customers
    let customerQuery = supabase
      .from('customers')
      .select(`
        id,
        name,
        domain,
        current_arr,
        renewal_date,
        assigned_to,
        account_plan,
        risk_score,
        opportunity_score
      `)
      .eq('company_id', companyId);

    // Filter by owner if provided
    if (ownerId) {
      customerQuery = customerQuery.eq('assigned_to', ownerId);
    }

    const { data: customers, error: customerError } = await customerQuery;

    if (customerError) {
      console.error('[data-access] Error fetching customers:', customerError);
      return [];
    }

    if (!customers || customers.length === 0) {
      return [];
    }

    // Get active renewals for these customers
    const customerIds = customers.map(c => c.id);
    const { data: renewals, error: renewalError } = await supabase
      .from('renewals')
      .select('id, customer_id, renewal_date, current_arr, stage')
      .in('customer_id', customerIds)
      .order('renewal_date', { ascending: true });

    if (renewalError) {
      console.error('[data-access] Error fetching renewals:', renewalError);
    }

    // Create a map of customer_id to renewal
    const renewalMap = new Map<string, DatabaseRenewal>();
    if (renewals) {
      renewals.forEach(renewal => {
        // Use the first (earliest) renewal for each customer
        if (!renewalMap.has(renewal.customer_id)) {
          renewalMap.set(renewal.customer_id, renewal as DatabaseRenewal);
        }
      });
    }

    // Transform and return customer data
    return customers.map(customer =>
      transformCustomerData(
        customer as DatabaseCustomer,
        renewalMap.get(customer.id)
      )
    );

  } catch (error) {
    console.error('[data-access] Unexpected error in getCustomersNeedingWorkflows:', error);
    return [];
  }
}

/**
 * Get a single customer by ID with workflow context
 *
 * @param customerId - Customer ID
 * @returns Customer data or null if not found
 */
export async function getCustomerById(customerId: string): Promise<CustomerData | null> {
  const supabase = createClient();

  try {
    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        domain,
        current_arr,
        renewal_date,
        assigned_to,
        account_plan,
        risk_score,
        opportunity_score
      `)
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('[data-access] Error fetching customer:', customerError);
      return null;
    }

    // Get active renewal for this customer
    const { data: renewal, error: renewalError } = await supabase
      .from('renewals')
      .select('id, customer_id, renewal_date, current_arr, stage')
      .eq('customer_id', customerId)
      .order('renewal_date', { ascending: true })
      .limit(1)
      .single();

    if (renewalError && renewalError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (not an error in this case)
      console.error('[data-access] Error fetching renewal:', renewalError);
    }

    return transformCustomerData(
      customer as DatabaseCustomer,
      renewal as DatabaseRenewal | null
    );

  } catch (error) {
    console.error('[data-access] Unexpected error in getCustomerById:', error);
    return null;
  }
}

/**
 * Update customer account plan
 *
 * @param customerId - Customer ID
 * @param accountPlan - New account plan ('invest' | 'expand' | 'manage' | 'monitor')
 * @returns Success status
 */
export async function updateCustomerAccountPlan(
  customerId: string,
  accountPlan: string
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('customers')
      .update({ account_plan: accountPlan })
      .eq('id', customerId);

    if (error) {
      console.error('[data-access] Error updating account plan:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[data-access] Unexpected error in updateCustomerAccountPlan:', error);
    return false;
  }
}

/**
 * Update customer risk and opportunity scores
 *
 * @param customerId - Customer ID
 * @param scores - Object with risk_score and/or opportunity_score
 * @returns Success status
 */
export async function updateCustomerScores(
  customerId: string,
  scores: {
    risk_score?: number;
    opportunity_score?: number;
  }
): Promise<boolean> {
  const supabase = createClient();

  try {
    const updateData: any = {};
    if (scores.risk_score !== undefined) {
      updateData.risk_score = scores.risk_score;
    }
    if (scores.opportunity_score !== undefined) {
      updateData.opportunity_score = scores.opportunity_score;
    }

    const { error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId);

    if (error) {
      console.error('[data-access] Error updating customer scores:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('[data-access] Unexpected error in updateCustomerScores:', error);
    return false;
  }
}

/**
 * Get customers by account plan
 *
 * @param companyId - Company ID
 * @param accountPlan - Account plan to filter by
 * @returns Array of customers with this account plan
 */
export async function getCustomersByAccountPlan(
  companyId: string,
  accountPlan: string
): Promise<CustomerData[]> {
  const supabase = createClient();

  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        domain,
        current_arr,
        renewal_date,
        assigned_to,
        account_plan,
        risk_score,
        opportunity_score
      `)
      .eq('company_id', companyId)
      .eq('account_plan', accountPlan);

    if (error) {
      console.error('[data-access] Error fetching customers by account plan:', error);
      return [];
    }

    if (!customers || customers.length === 0) {
      return [];
    }

    // Transform data (without renewals for simplicity in this query)
    return customers.map(customer =>
      transformCustomerData(customer as DatabaseCustomer)
    );

  } catch (error) {
    console.error('[data-access] Unexpected error in getCustomersByAccountPlan:', error);
    return [];
  }
}
