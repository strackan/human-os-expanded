/**
 * Workflow Customer Data Utilities
 *
 * Fetches customer data from the database for use in workflow configurations.
 * Replaces hardcoded mock data with dynamic database-driven data.
 */

import { CustomerWithContact } from '@/types/customer';

// Define the shape of demo operations data
export interface DemoOperation {
  id?: string;
  customer_id: string;
  name: string;
  status: 'success' | 'failed' | 'in_progress';
  failure_reason?: string;
  cost_impact?: number;
  quarter: string;
  operation_date: string;
  created_at?: string;
  updated_at?: string;
}

// Define the shape of demo support tickets data
export interface DemoSupportTicket {
  id?: string;
  customer_id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  resolution_time_hours?: number;
  sentiment: 'neutral' | 'frustrated' | 'satisfied';
  created_at: string;
}

// Define the shape of renewal data
export interface RenewalData {
  id: string;
  customer_id: string;
  renewal_date: string;
  current_arr: number;
  proposed_arr?: number;
  probability: number;
  stage: string;
  risk_level: string;
  expansion_opportunity?: number;
  ai_risk_score?: number;
  ai_recommendations?: string;
  ai_confidence?: number;
  last_contact_date?: string;
  next_action?: string;
  next_action_date?: string;
  notes?: string;
  current_phase?: string;
}

// Define the shape of customer properties data
export interface CustomerProperties {
  customer_id: string;
  usage_score?: number;
  health_score: number;
  nps_score?: number;
  current_arr: number;
  revenue_impact_tier?: number;
  churn_risk_score?: number;
}

// Complete customer data for workflows
export interface WorkflowCustomerData {
  customer: CustomerWithContact;
  renewal?: RenewalData;
  operations?: DemoOperation[];
  supportTickets?: DemoSupportTicket[];
  properties?: CustomerProperties;
  contacts: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    title?: string;
    is_primary: boolean;
  }>;
}

/**
 * Fetch all customer data needed for a workflow
 */
export async function fetchWorkflowCustomerData(
  customerId: string
): Promise<WorkflowCustomerData> {
  try {
    // Fetch customer basic data
    const customerResponse = await fetch(`/api/customers/${customerId}`);
    if (!customerResponse.ok) {
      throw new Error(`Failed to fetch customer: ${customerResponse.statusText}`);
    }
    const { customer } = await customerResponse.json();

    // Fetch all contacts for this customer
    const contactsResponse = await fetch(`/api/customers/${customerId}/contacts`);
    const contacts = contactsResponse.ok
      ? (await contactsResponse.json()).contacts || []
      : [];

    // Fetch renewal data
    const renewalResponse = await fetch(`/api/renewals?customer_id=${customerId}`);
    const renewals = renewalResponse.ok
      ? (await renewalResponse.json()).renewals || []
      : [];
    const renewal = renewals.length > 0 ? renewals[0] : undefined;

    // Fetch demo operations
    const operationsResponse = await fetch(`/api/demo/operations?customer_id=${customerId}`);
    const operations = operationsResponse.ok
      ? (await operationsResponse.json()).operations || []
      : [];

    // Fetch demo support tickets
    const ticketsResponse = await fetch(`/api/demo/support-tickets?customer_id=${customerId}`);
    const supportTickets = ticketsResponse.ok
      ? (await ticketsResponse.json()).tickets || []
      : [];

    // Fetch customer properties (advanced scoring)
    const propertiesResponse = await fetch(`/api/customers/${customerId}/properties`);
    const properties = propertiesResponse.ok
      ? (await propertiesResponse.json()).properties
      : undefined;

    return {
      customer,
      renewal,
      operations,
      supportTickets,
      properties,
      contacts
    };
  } catch (error) {
    console.error('Error fetching workflow customer data:', error);
    throw error;
  }
}

/**
 * Calculate days until renewal date
 */
export function calculateDaysUntilRenewal(renewalDate: string): number {
  const today = new Date();
  const renewal = new Date(renewalDate);
  const diffTime = renewal.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format ARR for display (e.g., $185K or $1.8M)
 */
export function formatARR(arr: number): string {
  if (arr >= 1000000) {
    return `$${(arr / 1000000).toFixed(1)}M`;
  } else if (arr >= 1000) {
    return `$${(arr / 1000).toFixed(0)}K`;
  } else {
    return `$${arr.toFixed(0)}`;
  }
}

/**
 * Format health score (stored as integer, display as decimal)
 * Database stores 64 for 6.4, 42 for 4.2, etc.
 */
export function formatHealthScore(score: number): string {
  return (score / 10).toFixed(1);
}

/**
 * Get health score status color
 */
export function getHealthScoreStatus(score: number): 'red' | 'orange' | 'green' {
  const normalizedScore = score / 10; // Convert 64 -> 6.4
  if (normalizedScore < 4) return 'red';
  if (normalizedScore < 7) return 'orange';
  return 'green';
}

/**
 * Get full contact name
 */
export function getContactFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

/**
 * Format renewal date for display
 */
export function formatRenewalDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
