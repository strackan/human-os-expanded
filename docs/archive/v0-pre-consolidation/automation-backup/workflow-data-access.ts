/**
 * Workflow Data Access Layer
 *
 * Provides clean, reusable query functions for workflow generation
 */

import Database from 'better-sqlite3';
import { getRenewalStage } from './renewal-helpers';

const db = new Database('renubu-test.db', { readonly: true });

interface GetCustomerDataOptions {
  includeHistory?: boolean;
  includeContacts?: boolean;
}

interface CustomerData {
  customer: any;
  contract: any;
  renewal: any;
  account_plan: any;
  days_until_renewal: number;
  renewal_stage: string;
  contacts?: any[];
  renewal_history?: any[];
}

/**
 * Get comprehensive customer data with flexible filtering
 *
 * @param customerId - The customer ID
 * @param options - Optional filters to include additional data
 * @returns Full customer context
 */
export function getCustomerData(customerId: string, options: GetCustomerDataOptions = {}): CustomerData | null {
  // Get core customer data with active contract and renewal
  const query = `
    SELECT
      c.*,
      co.id as contract_id,
      co.contract_number,
      co.start_date as contract_start_date,
      co.end_date as contract_end_date,
      co.initial_arr,
      co.initial_onetime,
      r.id as renewal_id,
      r.start_date as renewal_start_date,
      r.end_date as renewal_end_date,
      r.starting_arr,
      r.ending_arr,
      r.status as renewal_status,
      r.active_stage,
      r.opp_id,
      CAST((julianday(c.renewal_date) - julianday('now')) AS INTEGER) as days_until_renewal,
      ap.plan_type as account_plan
    FROM customers c
    LEFT JOIN contracts co ON c.id = co.customer_id AND co.active = 1
    LEFT JOIN renewals r ON co.id = r.contract_id AND r.active = 1
    LEFT JOIN account_plan ap ON c.id = ap.customer_id AND ap.active = 1
    WHERE c.id = ?
  `;

  const row = db.prepare(query).get(customerId);

  if (!row) {
    return null;
  }

  const result: CustomerData = {
    customer: {
      id: row.id,
      company_id: row.company_id,
      domain: row.domain,
      arr: row.arr,
      renewal_date: row.renewal_date,
      owner: row.owner,
      created_at: row.created_at,
      updated_at: row.updated_at
    },
    contract: row.contract_id ? {
      id: row.contract_id,
      contract_number: row.contract_number,
      start_date: row.contract_start_date,
      end_date: row.contract_end_date,
      initial_arr: row.initial_arr,
      initial_onetime: row.initial_onetime
    } : null,
    renewal: row.renewal_id ? {
      id: row.renewal_id,
      start_date: row.renewal_start_date,
      end_date: row.renewal_end_date,
      starting_arr: row.starting_arr,
      ending_arr: row.ending_arr,
      status: row.renewal_status,
      active_stage: row.active_stage,
      opp_id: row.opp_id
    } : null,
    account_plan: row.account_plan || null,
    days_until_renewal: row.days_until_renewal,
    renewal_stage: getRenewalStage(row.days_until_renewal)
  };

  // Include contacts if requested
  if (options.includeContacts) {
    // Note: No contacts table exists yet, so checking customer_properties for contact data
    const contacts = db.prepare(`
      SELECT * FROM customer_properties
      WHERE customer_id = ? AND property_key LIKE 'contact_%'
    `).all(customerId);
    result.contacts = contacts;
  }

  // Include renewal history if requested
  if (options.includeHistory) {
    result.renewal_history = getCustomerRenewals(customerId);
  }

  return result;
}

/**
 * Get all customers assigned to a CSM with basic data
 *
 * @param ownerId - The CSM user ID
 * @returns Array of customers with essential fields
 */
export function getUserCustomers(ownerId: string) {
  const query = `
    SELECT
      c.id,
      c.domain,
      c.arr,
      c.renewal_date,
      CAST((julianday(c.renewal_date) - julianday('now')) AS INTEGER) as days_until_renewal,
      ap.plan_type as account_plan
    FROM customers c
    LEFT JOIN account_plan ap ON c.id = ap.customer_id AND ap.active = 1
    WHERE c.owner = ?
    ORDER BY c.arr DESC
  `;

  const customers = db.prepare(query).all(ownerId);

  return customers.map((customer: any) => ({
    ...customer,
    renewal_stage: getRenewalStage(customer.days_until_renewal)
  }));
}

/**
 * Get all contacts for a customer
 * Note: Contacts table doesn't exist yet - returns customer_properties with contact_ prefix
 *
 * @param customerId - The customer ID
 * @returns Array of contact data
 */
export function getCustomerContacts(customerId: string) {
  const query = `
    SELECT * FROM customer_properties
    WHERE customer_id = ? AND property_key LIKE 'contact_%'
  `;

  return db.prepare(query).all(customerId);
}

/**
 * Get all open/active renewals with calculated stage
 *
 * @param companyId - Optional company filter
 * @returns Array of renewals with customer context
 */
export function getActiveRenewals(companyId?: string) {
  let query = `
    SELECT
      r.id as renewal_id,
      r.start_date,
      r.end_date,
      r.starting_arr,
      r.ending_arr,
      r.status,
      r.active_stage,
      c.id as customer_id,
      c.domain,
      c.arr,
      c.renewal_date,
      CAST((julianday(c.renewal_date) - julianday('now')) AS INTEGER) as days_until_renewal,
      co.contract_number
    FROM renewals r
    JOIN contracts co ON r.contract_id = co.id
    JOIN customers c ON co.customer_id = c.id
    WHERE r.active = 1
  `;

  const params: any[] = [];

  if (companyId) {
    query += ` AND c.company_id = ?`;
    params.push(companyId);
  }

  query += ` ORDER BY days_until_renewal ASC`;

  const renewals = db.prepare(query).all(...params);

  return renewals.map((renewal: any) => ({
    ...renewal,
    renewal_stage: getRenewalStage(renewal.days_until_renewal)
  }));
}

/**
 * Get year-by-year renewal history for a customer
 *
 * @param customerId - The customer ID
 * @returns Array of all renewals with from/to ARR and dates
 */
export function getCustomerRenewals(customerId: string) {
  const query = `
    SELECT
      r.id,
      r.start_date,
      r.end_date,
      r.starting_arr as from_arr,
      r.ending_arr as to_arr,
      r.status,
      r.active,
      co.contract_number,
      co.id as contract_id
    FROM renewals r
    JOIN contracts co ON r.contract_id = co.id
    WHERE co.customer_id = ?
    ORDER BY r.start_date ASC
  `;

  return db.prepare(query).all(customerId);
}

/**
 * Get all customers needing workflows with full context
 * Optimized query that joins all necessary data for workflow generation
 *
 * @param companyId - The company ID
 * @param ownerId - Optional CSM filter
 * @returns Array of customers with complete workflow context
 */
export function getCustomersNeedingWorkflows(companyId: string, ownerId?: string) {
  let query = `
    SELECT
      c.id as customer_id,
      c.domain,
      c.arr,
      c.renewal_date,
      c.owner,
      CAST((julianday(c.renewal_date) - julianday('now')) AS INTEGER) as days_until_renewal,
      co.id as contract_id,
      co.contract_number,
      co.start_date as contract_start_date,
      co.end_date as contract_end_date,
      r.id as renewal_id,
      r.starting_arr,
      r.ending_arr,
      r.status as renewal_status,
      ap.plan_type as account_plan
    FROM customers c
    LEFT JOIN contracts co ON c.id = co.customer_id AND co.active = 1
    LEFT JOIN renewals r ON co.id = r.contract_id AND r.active = 1
    LEFT JOIN account_plan ap ON c.id = ap.customer_id AND ap.active = 1
    WHERE c.company_id = ?
  `;

  const params: any[] = [companyId];

  if (ownerId) {
    query += ` AND c.owner = ?`;
    params.push(ownerId);
  }

  query += ` ORDER BY days_until_renewal ASC`;

  const customers = db.prepare(query).all(...params);

  return customers.map((customer: any) => ({
    ...customer,
    renewal_stage: getRenewalStage(customer.days_until_renewal)
  }));
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  db.close();
}
