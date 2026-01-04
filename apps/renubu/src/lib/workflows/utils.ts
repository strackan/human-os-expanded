/**
 * Workflow Utilities
 *
 * Shared utility functions that can be used on both client and server.
 * No dependencies on server-only modules like next/headers.
 */

/**
 * Get current timestamp in various formats
 */
export function getCurrentTimestamp() {
  const now = new Date();
  return {
    iso: now.toISOString(),
    date: now.toISOString().split('T')[0],
    readable: now.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

/**
 * Calculate renewal urgency level based on days until renewal
 *
 * @param daysUntilRenewal - Days until contract renewal
 * @returns Urgency level
 */
export function calculateRenewalUrgency(
  daysUntilRenewal?: number
): 'critical' | 'high' | 'medium' | 'low' {
  if (!daysUntilRenewal) return 'low';

  if (daysUntilRenewal < 0) return 'critical'; // Overdue!
  if (daysUntilRenewal <= 30) return 'critical';
  if (daysUntilRenewal <= 60) return 'high';
  if (daysUntilRenewal <= 90) return 'medium';
  return 'low';
}

/**
 * Format currency for display
 *
 * @param amount - Amount in dollars
 * @returns Formatted string
 */
export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '$0';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ARR with K suffix for large numbers
 *
 * @param arr - ARR amount
 * @returns Formatted string (e.g., "$250K")
 */
export function formatARR(arr: number | undefined): string {
  if (arr === undefined || arr === null) return '$0';

  if (arr >= 1000000) {
    return `$${(arr / 1000000).toFixed(1)}M`;
  }
  if (arr >= 1000) {
    return `$${Math.round(arr / 1000)}K`;
  }
  return formatCurrency(arr);
}
