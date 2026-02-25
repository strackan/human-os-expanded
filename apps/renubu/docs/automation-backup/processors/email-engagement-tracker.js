/**
 * Email Engagement Tracker Processor
 *
 * Sets up tracking for sent emails (opens, clicks, replies).
 * Integrates with email provider (SendGrid, Mailgun, etc.).
 * Creates monitoring task to track engagement.
 *
 * Expected task.metadata:
 * {
 *   emailId: string,
 *   emailSubject: string,
 *   sentTo: string,
 *   trackOpens: boolean,
 *   trackClicks: boolean,
 *   notifyOnOpen: boolean
 * }
 */

const { getEmailProvider } = require('../services/emailService');
const { createTask } = require('../services/database');

/**
 * Execute email tracking setup
 *
 * @param {Object} context - Execution context
 * @param {Object} context.task - Task object
 * @param {Object} context.customer - Customer object
 * @param {Object} context.workflow - Workflow execution object
 * @returns {Object} Execution result
 */
async function execute({ task, customer, workflow }) {
  console.log(`   📧 Setting up email engagement tracking for ${customer.name}...`);

  const {
    emailId,
    emailSubject,
    sentTo,
    trackOpens = true,
    trackClicks = true,
    notifyOnOpen = false
  } = task.metadata;

  if (!emailId || !emailSubject || !sentTo) {
    throw new Error('Missing required metadata: emailId, emailSubject, sentTo');
  }

  try {
    console.log(`      Email: "${emailSubject}"`);
    console.log(`      Sent To: ${sentTo}`);
    console.log(`      Tracking: ${trackOpens ? 'Opens' : ''} ${trackClicks ? 'Clicks' : ''}`);

    // ─────────────────────────────────────────────────────────────────────
    // 1. Enable Tracking in Email Provider
    // ─────────────────────────────────────────────────────────────────────

    const emailProvider = await getEmailProvider();

    const trackingResult = await emailProvider.enableTracking(emailId, {
      trackOpens,
      trackClicks,
      webhookUrl: `${process.env.API_URL}/webhooks/email-engagement`,
      metadata: {
        customerId: customer.id,
        customerName: customer.name,
        workflowId: workflow.id,
        workflowName: workflow.workflow_name,
        taskId: task.id
      }
    });

    if (!trackingResult.success) {
      throw new Error(`Email tracking setup failed: ${trackingResult.error}`);
    }

    console.log(`      ✅ Tracking enabled for email: ${emailId}`);
    console.log(`      Webhook URL: ${trackingResult.webhookUrl}`);

    // ─────────────────────────────────────────────────────────────────────
    // 2. Create Monitoring Task (AI-driven, webhook-triggered)
    // ─────────────────────────────────────────────────────────────────────

    const monitoringTask = await createTask({
      workflow_execution_id: workflow.id,
      customer_id: customer.id,
      task_type: 'AI_TASK',
      owner: 'AI',
      action: 'Monitor Email Engagement',
      description: `Track engagement for email: "${emailSubject}" sent to ${sentTo}`,
      priority: 3,
      status: 'in_progress', // Active monitoring
      auto_execute: false, // Webhook-driven, not cron-driven
      processor: 'email-engagement-reporter.js',
      metadata: {
        emailId,
        emailSubject,
        sentTo,
        trackingEnabled: true,
        trackOpens,
        trackClicks,
        notifyOnOpen,
        engagementData: {
          opens: 0,
          clicks: 0,
          replies: 0,
          lastOpenedAt: null,
          lastClickedAt: null
        },
        createdBy: 'email-engagement-tracker'
      },
      original_workflow_execution_id: workflow.id
    });

    console.log(`      ✅ Monitoring task created: ${monitoringTask.id}`);

    // ─────────────────────────────────────────────────────────────────────
    // 3. Set Up Webhook Handler (if needed)
    // ─────────────────────────────────────────────────────────────────────

    // Webhook handler will:
    // - Receive open/click events from email provider
    // - Update monitoring task's metadata.engagementData
    // - Create notification if notifyOnOpen = true
    // - Mark task complete after X days or when email replied

    // Example webhook handler (implemented separately):
    // POST /webhooks/email-engagement
    // {
    //   "eventType": "open" | "click" | "reply",
    //   "emailId": "...",
    //   "timestamp": "2025-01-15T10:30:00Z",
    //   "metadata": { "taskId": "...", "customerId": "..." }
    // }

    // ─────────────────────────────────────────────────────────────────────
    // 4. Return Success
    // ─────────────────────────────────────────────────────────────────────

    return {
      success: true,
      message: `Email engagement tracking enabled for "${emailSubject}"`,
      emailId,
      trackingEnabled: true,
      monitoringTaskId: monitoringTask.id,
      webhookUrl: trackingResult.webhookUrl,
      trackingFeatures: {
        opens: trackOpens,
        clicks: trackClicks
      }
    };

  } catch (error) {
    console.error(`      ❌ Failed to set up email tracking: ${error.message}`);

    // Check if retryable
    const retryable = !error.message.includes('Email not found');

    return {
      success: false,
      error: error.message,
      retryable
    };
  }
}

/**
 * Validate task metadata before execution
 *
 * @param {Object} task - Task object
 * @returns {Object} Validation result
 */
function validate(task) {
  const { metadata } = task;

  if (!metadata) {
    return { valid: false, error: 'Missing metadata' };
  }

  if (!metadata.emailId) {
    return { valid: false, error: 'Missing emailId in metadata' };
  }

  if (!metadata.emailSubject) {
    return { valid: false, error: 'Missing emailSubject in metadata' };
  }

  if (!metadata.sentTo) {
    return { valid: false, error: 'Missing sentTo (recipient email) in metadata' };
  }

  return { valid: true };
}

/**
 * Process email engagement webhook event
 * (Called by webhook handler, not by executor)
 *
 * @param {Object} event - Webhook event
 * @returns {Object} Processing result
 */
async function processEngagementEvent(event) {
  const { eventType, emailId, timestamp, metadata } = event;

  if (!metadata || !metadata.taskId) {
    throw new Error('Missing taskId in webhook metadata');
  }

  const task = await getTaskById(metadata.taskId);

  if (!task) {
    throw new Error(`Monitoring task not found: ${metadata.taskId}`);
  }

  // Update engagement data
  const engagementData = task.metadata.engagementData || {
    opens: 0,
    clicks: 0,
    replies: 0
  };

  switch (eventType) {
    case 'open':
      engagementData.opens += 1;
      engagementData.lastOpenedAt = timestamp;
      console.log(`   📧 Email opened: ${task.metadata.emailSubject} (${engagementData.opens}x)`);
      break;

    case 'click':
      engagementData.clicks += 1;
      engagementData.lastClickedAt = timestamp;
      console.log(`   🖱️  Email link clicked: ${task.metadata.emailSubject} (${engagementData.clicks}x)`);
      break;

    case 'reply':
      engagementData.replies += 1;
      engagementData.lastRepliedAt = timestamp;
      console.log(`   ✉️  Email replied: ${task.metadata.emailSubject}`);
      break;

    default:
      console.warn(`   ⚠️  Unknown event type: ${eventType}`);
  }

  // Update task
  await updateTaskStatus(task.id, {
    metadata: {
      ...task.metadata,
      engagementData,
      lastEngagementAt: timestamp
    }
  });

  // Notify CSM if configured
  if (task.metadata.notifyOnOpen && eventType === 'open' && engagementData.opens === 1) {
    await createNotification({
      user_id: metadata.csmId || 'system',
      task_id: task.id,
      type: 'email_engagement',
      title: 'Email Opened',
      message: `${metadata.customerName} opened email: "${task.metadata.emailSubject}"`,
      priority: 3
    });
  }

  // Mark task complete if email replied
  if (eventType === 'reply') {
    await updateTaskStatus(task.id, {
      status: 'completed',
      completed_at: new Date(),
      execution_status: 'success',
      execution_result: {
        success: true,
        completedVia: 'email_reply',
        engagementData
      }
    });
  }

  return {
    success: true,
    eventProcessed: eventType,
    updatedEngagement: engagementData
  };
}

module.exports = {
  execute,
  validate,
  processEngagementEvent
};
