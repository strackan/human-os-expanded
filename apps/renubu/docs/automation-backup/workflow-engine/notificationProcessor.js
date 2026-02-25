/**
 * Notification Processor
 *
 * Evaluates and sends notifications defined in workflow configs.
 * Notifications are SEPARATE from escalations/reassignments - they're just alerts.
 *
 * Supports:
 * - Conditional sending (evaluate template expressions)
 * - Template variable resolution
 * - Multiple recipients
 * - Priority-based urgency
 * - Rich metadata for navigation
 */

const Handlebars = require('handlebars');
const db = require('../database/db');

/**
 * Register Handlebars helpers for condition evaluation
 */
function registerHelpers() {
  // Greater than or equal
  Handlebars.registerHelper('gte', (a, b) => a >= b);

  // Less than or equal
  Handlebars.registerHelper('lte', (a, b) => a <= b);

  // Equals
  Handlebars.registerHelper('eq', (a, b) => a === b);

  // AND logic
  Handlebars.registerHelper('and', function(...args) {
    return args.slice(0, -1).every(Boolean);
  });

  // OR logic
  Handlebars.registerHelper('or', function(...args) {
    return args.slice(0, -1).some(Boolean);
  });

  // Math absolute value
  Handlebars.registerHelper('abs', (num) => Math.abs(num));
}

// Initialize helpers
registerHelpers();

/**
 * Evaluate a condition template expression
 *
 * @param {string} condition - Template expression like "{{workflow.daysOverdue >= 7}}"
 * @param {object} context - Data context with customer, workflow, csm, etc.
 * @returns {boolean} - True if condition passes
 */
function evaluateCondition(condition, context) {
  if (!condition) return true; // No condition = always send

  try {
    // Compile and execute the condition template
    const template = Handlebars.compile(condition);
    const result = template(context);

    // Handle different result types
    if (typeof result === 'string') {
      // Convert string to boolean
      return result.trim().toLowerCase() === 'true' || result.trim() !== '' && result.trim() !== '0' && result.trim() !== 'false';
    }

    return Boolean(result);
  } catch (error) {
    console.error('Error evaluating notification condition:', error);
    console.error('Condition:', condition);
    console.error('Context:', JSON.stringify(context, null, 2));
    return false; // Fail closed - don't send notification if condition fails
  }
}

/**
 * Resolve template string with context
 *
 * @param {string} template - Template string like "{{customer.name}} is overdue"
 * @param {object} context - Data context
 * @returns {string} - Resolved string
 */
function resolveTemplate(template, context) {
  if (!template) return '';

  try {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(context);
  } catch (error) {
    console.error('Error resolving template:', error);
    console.error('Template:', template);
    return template; // Return unresolved template on error
  }
}

/**
 * Resolve template array (for recipients list)
 *
 * @param {string[]} templates - Array of template strings
 * @param {object} context - Data context
 * @returns {string[]} - Resolved array (flattened if needed)
 */
function resolveTemplateArray(templates, context) {
  if (!templates || !Array.isArray(templates)) return [];

  const resolved = templates.map(t => {
    const result = resolveTemplate(t, context);

    // Handle case where template resolves to a comma-separated list
    if (result.includes(',')) {
      return result.split(',').map(s => s.trim()).filter(Boolean);
    }

    return result;
  });

  // Flatten array (in case some templates resolved to arrays)
  return resolved.flat().filter(Boolean);
}

/**
 * Resolve object with template values
 *
 * @param {object} obj - Object with template string values
 * @param {object} context - Data context
 * @returns {object} - Resolved object
 */
function resolveObject(obj, context) {
  if (!obj || typeof obj !== 'object') return obj;

  const resolved = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      resolved[key] = resolveTemplate(value, context);
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveObject(value, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

/**
 * Get user ID from email
 *
 * @param {string} email - User email
 * @returns {Promise<string|null>} - User UUID
 */
async function getUserIdByEmail(email) {
  try {
    const result = await db.query(
      'SELECT id FROM users WHERE email = $1 AND active = true',
      [email]
    );

    return result.rows[0]?.id || null;
  } catch (error) {
    console.error('Error fetching user by email:', email, error);
    return null;
  }
}

/**
 * Create a notification in the database
 *
 * @param {string} userId - User UUID
 * @param {object} notification - Notification data
 * @returns {Promise<string|null>} - Notification UUID or null on error
 */
async function createNotification(userId, notification) {
  try {
    const result = await db.query(
      `INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        metadata,
        customer_id,
        task_id,
        workflow_execution_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id`,
      [
        userId,
        notification.type,
        notification.title,
        notification.message,
        notification.priority || 3,
        notification.metadata ? JSON.stringify(notification.metadata) : null,
        notification.customerId || null,
        notification.taskId || null,
        notification.workflowExecutionId || null
      ]
    );

    console.log(`✅ Notification created for user ${userId}:`, notification.title);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating notification:', error);
    console.error('Notification data:', notification);
    return null;
  }
}

/**
 * Process notifications for a workflow step
 *
 * @param {object} step - Workflow step config with optional `notifications` array
 * @param {object} context - Workflow context data (customer, csm, workflow, company, etc.)
 * @returns {Promise<number>} - Count of notifications sent
 */
async function processNotifications(step, context) {
  if (!step.notifications || !Array.isArray(step.notifications)) {
    return 0;
  }

  let sentCount = 0;

  for (const notificationConfig of step.notifications) {
    try {
      // 1. Evaluate condition (if present)
      const shouldSend = evaluateCondition(notificationConfig.condition, context);

      if (!shouldSend) {
        console.log(`⏭️  Skipping notification (condition not met): ${notificationConfig.title}`);
        continue;
      }

      // 2. Resolve template variables in notification content
      const notification = {
        type: notificationConfig.type,
        title: resolveTemplate(notificationConfig.title, context),
        message: resolveTemplate(notificationConfig.message, context),
        priority: notificationConfig.priority || 3,
        metadata: resolveObject(notificationConfig.metadata, context),
        customerId: resolveTemplate(notificationConfig.customerId || '{{customer.id}}', context),
        workflowExecutionId: context.workflow?.executionId || null,
        taskId: notificationConfig.taskId || null
      };

      // 3. Resolve recipient list
      const recipientEmails = resolveTemplateArray(notificationConfig.recipients, context);

      if (recipientEmails.length === 0) {
        console.warn('⚠️  No recipients for notification:', notification.title);
        continue;
      }

      // 4. Send to each recipient
      for (const email of recipientEmails) {
        const userId = await getUserIdByEmail(email);

        if (!userId) {
          console.warn(`⚠️  User not found for email: ${email}`);
          continue;
        }

        const notificationId = await createNotification(userId, notification);

        if (notificationId) {
          sentCount++;
        }
      }

      console.log(`📧 Sent notification "${notification.title}" to ${recipientEmails.length} recipient(s)`);

    } catch (error) {
      console.error('Error processing notification:', error);
      console.error('Notification config:', notificationConfig);
    }
  }

  return sentCount;
}

/**
 * Process notification from an action's onSuccess handler
 *
 * @param {object} actionResult - Action execution result with `sendNotification` config
 * @param {object} context - Workflow context data
 * @returns {Promise<number>} - Count of notifications sent
 */
async function processActionNotification(actionResult, context) {
  if (!actionResult.sendNotification) {
    return 0;
  }

  const notificationConfig = actionResult.sendNotification;

  // Wrap in array and use main processor
  const fakeStep = {
    notifications: [notificationConfig]
  };

  return await processNotifications(fakeStep, context);
}

/**
 * Send a one-off notification (for use in executors/processors)
 *
 * @param {string} recipientEmail - Recipient email
 * @param {object} notification - Notification data
 * @returns {Promise<string|null>} - Notification UUID or null
 */
async function sendNotification(recipientEmail, notification) {
  const userId = await getUserIdByEmail(recipientEmail);

  if (!userId) {
    console.warn(`⚠️  User not found for email: ${recipientEmail}`);
    return null;
  }

  return await createNotification(userId, notification);
}

module.exports = {
  processNotifications,
  processActionNotification,
  sendNotification,

  // Export utilities for testing
  evaluateCondition,
  resolveTemplate,
  resolveTemplateArray,
  resolveObject
};
