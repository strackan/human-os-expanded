const { getRenewalWorkflowByDays } = require('./config-data-access');

/**
 * Hardcoded renewal stage mapping (Fallback)
 * Used only if database query fails
 */
function getRenewalStageFallback(daysUntilRenewal) {
  if (daysUntilRenewal < 0) return 'Overdue';
  if (daysUntilRenewal <= 6) return 'Emergency';
  if (daysUntilRenewal <= 13) return 'Critical';
  if (daysUntilRenewal <= 29) return 'Signature';
  if (daysUntilRenewal <= 59) return 'Finalize';
  if (daysUntilRenewal <= 89) return 'Negotiate';
  if (daysUntilRenewal <= 119) return 'Engage';
  if (daysUntilRenewal <= 179) return 'Prepare';
  return 'Monitor';
}

/**
 * Determines the renewal stage based on days until renewal date
 * Queries workflows table to find matching workflow based on trigger_config
 *
 * @param {number} daysUntilRenewal - Number of days until the renewal date
 * @returns {string} The renewal stage name (e.g., "Overdue", "Emergency", "Monitor")
 */
function getRenewalStage(daysUntilRenewal) {
  try {
    const workflow = getRenewalWorkflowByDays(daysUntilRenewal);

    if (workflow && workflow.workflow_name) {
      // workflow_name is like "Overdue Stage", "Emergency Stage", etc.
      // Return the stage name without " Stage" suffix
      return workflow.workflow_name.replace(' Stage', '');
    }
  } catch (error) {
    console.warn('[renewal-helpers] Database query failed, using fallback:', error.message);
  }

  // Fallback to hardcoded logic if database query fails
  return getRenewalStageFallback(daysUntilRenewal);
}

/**
 * Gets the stage urgency level for UI/reporting
 *
 * @param {string} stage - The renewal stage name
 * @returns {string} Urgency level: 'critical', 'high', 'medium', 'low'
 */
function getStageUrgency(stage) {
  const urgencyMap = {
    'Overdue': 'critical',
    'Emergency': 'critical',
    'Critical': 'critical',
    'Signature': 'high',
    'Finalize': 'high',
    'Negotiate': 'medium',
    'Engage': 'medium',
    'Prepare': 'low',
    'Monitor': 'low'
  };

  return urgencyMap[stage] || 'low';
}

/**
 * Gets the stage icon for display
 * Queries workflows table for icon if available
 *
 * @param {string} stage - The renewal stage name
 * @returns {string} Emoji icon for the stage
 */
function getStageIcon(stage) {
  try {
    const { getWorkflowByKey } = require('./config-data-access');

    // Convert stage name to workflow_key (e.g., "Overdue" → "overdue")
    const workflowKey = stage.toLowerCase();
    const workflow = getWorkflowByKey('plan-renewal', workflowKey);

    if (workflow && workflow.icon) {
      return workflow.icon;
    }
  } catch (error) {
    // Silently fall back to hardcoded icons if database query fails
  }

  // Fallback icon map
  const iconMap = {
    'Overdue': '🔴',
    'Emergency': '🚨',
    'Critical': '⚠️',
    'Signature': '✍️',
    'Finalize': '📝',
    'Negotiate': '🤝',
    'Engage': '💬',
    'Prepare': '📋',
    'Monitor': '👀'
  };

  return iconMap[stage] || '📊';
}

module.exports = {
  getRenewalStage,
  getStageUrgency,
  getStageIcon
};
