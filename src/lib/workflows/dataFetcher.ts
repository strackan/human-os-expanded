/**
 * Workflow Data Fetcher
 *
 * Provides clean, typed functions for fetching customer data needed for workflow hydration.
 *
 * This layer sits between the database and the template hydrator, fetching all the data
 * needed to replace placeholders like {{customer.name}} with actual values.
 *
 * Key Responsibilities:
 * 1. Fetch customer data from multiple tables
 * 2. Aggregate related data (contacts, contracts, properties)
 * 3. Provide typed interfaces for workflow data
 * 4. Handle missing data gracefully with defaults
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Customer data structure for workflow hydration
 */
export interface WorkflowCustomerData {
  // Core customer info
  id: string;
  name: string;
  domain?: string;
  industry?: string;

  // Financial metrics
  current_arr: number;
  health_score: number;
  churn_risk_score?: number;
  utilization_percent?: number;

  // Contract info
  contract_start_date?: string;
  contract_end_date?: string;
  contract_term?: number; // months
  renewal_date?: string;
  auto_renewal?: boolean;
  contract_status?: string;

  // Usage & engagement
  usage_score?: number;
  nps_score?: number;
  adoption_rate?: number;
  license_count?: number;
  active_users?: number;

  // Relationship
  relationship_strength?: 'strong' | 'medium' | 'weak';

  // Growth metrics
  yoy_growth?: number;
  last_month_growth?: number;

  // Contacts
  primary_contact?: ContactData;
  contacts?: ContactData[];

  // Computed fields
  days_until_renewal?: number;
  renewal_likelihood?: number;
}

/**
 * Contact data structure
 */
export interface ContactData {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  title?: string;
  is_primary: boolean;
}

/**
 * Departed contact data (for risk workflows)
 */
export interface DepartedContactData {
  name: string;
  title?: string;
  departure_date?: string;
}

/**
 * CSM data structure
 */
export interface CSMData {
  id: string;
  name: string;
  email: string;
}

/**
 * Fetch complete customer context for workflow hydration
 *
 * @param customerId - Customer UUID
 * @returns Complete customer data with all related info
 *
 * @example
 * const customerData = await fetchCustomerContext('uuid-here');
 * console.log(customerData.name); // "Acme Corp"
 * console.log(customerData.primary_contact?.email); // "john@acme.com"
 */
export async function fetchCustomerContext(
  customerId: string
): Promise<WorkflowCustomerData | null> {
  const supabase = await createClient();

  try {
    // Fetch customer base data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      console.error('Error fetching customer:', customerError);
      return null;
    }

    // Fetch customer properties (extended metrics)
    const { data: properties } = await supabase
      .from('customer_properties')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    // Fetch active contract
    const { data: contract } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .single();

    // Fetch contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false });

    // Build contact data
    const contactsData: ContactData[] = (contacts || []).map((c) => ({
      id: c.id,
      name: `${c.first_name} ${c.last_name}`,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      title: c.title,
      is_primary: c.is_primary || false,
    }));

    const primaryContact = contactsData.find((c) => c.is_primary) || contactsData[0];

    // Calculate days until renewal
    let daysUntilRenewal: number | undefined;
    const renewalDate = customer.renewal_date || contract?.end_date;
    if (renewalDate) {
      const today = new Date();
      const renewal = new Date(renewalDate);
      daysUntilRenewal = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Build complete customer context
    const customerData: WorkflowCustomerData = {
      // Core info
      id: customer.id,
      name: customer.name,
      domain: customer.domain,
      industry: customer.industry,

      // Financial metrics
      current_arr: properties?.current_arr || customer.current_arr || 0,
      health_score: properties?.health_score || customer.health_score || 0,
      churn_risk_score: properties?.churn_risk_score,
      utilization_percent: properties?.utilization_percent,

      // Contract info
      contract_start_date: contract?.start_date,
      contract_end_date: contract?.end_date,
      contract_term: contract?.contract_term,
      renewal_date: renewalDate,
      auto_renewal: contract?.auto_renewal,
      contract_status: contract?.status,

      // Usage & engagement
      usage_score: properties?.usage_score,
      nps_score: properties?.nps_score,
      adoption_rate: properties?.adoption_rate,
      license_count: properties?.license_count || contract?.seats,
      active_users: properties?.active_users,

      // Relationship
      relationship_strength: properties?.relationship_strength,

      // Growth metrics
      yoy_growth: properties?.yoy_growth,
      last_month_growth: properties?.last_month_growth,

      // Contacts
      primary_contact: primaryContact,
      contacts: contactsData,

      // Computed fields
      days_until_renewal: daysUntilRenewal,
      renewal_likelihood: properties?.renewal_likelihood,
    };

    return customerData;
  } catch (error) {
    console.error('Error in fetchCustomerContext:', error);
    return null;
  }
}

/**
 * Fetch CSM (assigned user) data
 *
 * @param csmId - CSM user UUID
 * @returns CSM data
 */
export async function fetchCSMData(csmId: string): Promise<CSMData | null> {
  const supabase = await createClient();

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', csmId)
      .single();

    if (error || !user) {
      console.error('Error fetching CSM:', error);
      return null;
    }

    return {
      id: user.id,
      name: user.full_name || user.email,
      email: user.email,
    };
  } catch (error) {
    console.error('Error in fetchCSMData:', error);
    return null;
  }
}

/**
 * Fetch workflow execution data
 *
 * Used for resuming workflows or accessing workflow-specific data.
 *
 * @param executionId - Workflow execution UUID
 * @returns Execution data including customer context
 */
export async function fetchWorkflowExecution(executionId: string) {
  const supabase = await createClient();

  try {
    const { data: execution, error } = await supabase
      .from('workflow_executions')
      .select(
        `
        *,
        workflow_definition:workflow_definitions(*),
        customer:customers(*)
      `
      )
      .eq('id', executionId)
      .single();

    if (error || !execution) {
      console.error('Error fetching execution:', error);
      return null;
    }

    // Also fetch full customer context
    const customerContext = execution.customer_id
      ? await fetchCustomerContext(execution.customer_id)
      : null;

    return {
      ...execution,
      customer_context: customerContext,
    };
  } catch (error) {
    console.error('Error in fetchWorkflowExecution:', error);
    return null;
  }
}

/**
 * Fetch departed contact data (for risk workflows)
 *
 * This would typically come from the workflow trigger data or execution_data.
 *
 * @param executionId - Workflow execution UUID
 * @returns Departed contact info
 */
export async function fetchDepartedContactData(
  executionId: string
): Promise<DepartedContactData | null> {
  const supabase = await createClient();

  try {
    const { data: execution } = await supabase
      .from('workflow_executions')
      .select('execution_data')
      .eq('id', executionId)
      .single();

    if (execution?.execution_data?.departed_contact) {
      return execution.execution_data.departed_contact;
    }

    // Default fallback
    return {
      name: 'Former Executive',
      title: 'Unknown',
    };
  } catch (error) {
    console.error('Error in fetchDepartedContactData:', error);
    return null;
  }
}

// Re-export utility functions from utils.ts
export {
  getCurrentTimestamp,
  calculateRenewalUrgency,
  formatCurrency,
  formatARR,
} from './utils';
