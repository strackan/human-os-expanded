/**
 * Data Transformer Utility
 *
 * Transforms API responses into the variable format expected by workflow configs.
 * This keeps the config-driven system flexible while adapting to API data structures.
 *
 * Workflow configs expect variables like:
 * - {{customer.name}} → "Acme Corp"
 * - {{customer.arr}} → "$725,000"
 * - {{customer.contact.name}} → "Michael Roberts"
 *
 * API returns database structure (CustomerWithContact):
 * - name, current_arr, renewal_date, health_score, primary_contact, etc.
 */

import { CustomerWithContact } from '@/types/customer';

/**
 * Workflow Variables Interface
 * The expected structure for workflow engine variable injection
 */
export interface WorkflowVariables {
  customer: {
    name: string;
    arr: string;
    renewalDate: string;
    healthScore: number;
    riskScore: number;
    contact: {
      name: string;
      email: string;
    };
  };
  data: {
    financials: {
      currentARR: number;
    };
  };
  intelligence: {
    riskScore: number;
  };
}

/**
 * Transform API customer data to workflow variables
 */
export function transformCustomerToWorkflowVariables(
  customer: CustomerWithContact
): WorkflowVariables {
  // Calculate risk score (inverse of health score for demo)
  const riskScore = Math.max(0, 100 - customer.health_score);

  // Format ARR as currency
  const formattedARR = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(customer.current_arr);

  // Format renewal date
  const formattedRenewalDate = new Date(customer.renewal_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Build contact name
  const contactName = customer.primary_contact
    ? `${customer.primary_contact.first_name} ${customer.primary_contact.last_name}`
    : 'Primary Contact';

  const contactEmail = customer.primary_contact?.email || 'contact@customer.com';

  return {
    customer: {
      name: customer.name,
      arr: formattedARR,
      renewalDate: formattedRenewalDate,
      healthScore: customer.health_score,
      riskScore: riskScore,
      contact: {
        name: contactName,
        email: contactEmail
      }
    },
    data: {
      financials: {
        currentARR: customer.current_arr
      }
    },
    intelligence: {
      riskScore: riskScore
    }
  };
}
