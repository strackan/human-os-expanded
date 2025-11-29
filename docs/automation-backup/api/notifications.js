/**
 * Notifications API
 *
 * REST API for in-app notification system (reminder button).
 * Handles notification CRUD, mark as read, and fetching.
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

/**
 * Middleware: Require authentication (placeholder - replace with your auth)
 */
function requireAuth(req, res, next) {
  // TODO: Replace with your actual authentication middleware
  // For now, assuming req.user is set by upstream middleware
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
}

/**
 * GET /api/notifications
 *
 * Fetch user's notifications (unread first, then recent read)
 */
router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const unreadOnly = req.query.unread === 'true';

    let query = `
      SELECT
        n.*,
        c.name AS customer_name,
        c.arr AS customer_arr,
        wt.action AS task_action,
        we.workflow_name
      FROM notifications n
      LEFT JOIN customers c ON n.customer_id = c.id
      LEFT JOIN workflow_tasks wt ON n.task_id = wt.id
      LEFT JOIN workflow_executions we ON n.workflow_execution_id = we.id
      WHERE n.user_id = $1
    `;

    const params = [userId];

    if (unreadOnly) {
      query += ' AND n.read = false';
    }

    query += `
      ORDER BY
        n.read ASC,           -- Unread first
        n.priority ASC,       -- Then by priority (1 = urgent)
        n.created_at DESC     -- Then by date
      LIMIT $2 OFFSET $3
    `;

    params.push(limit, offset);

    const result = await db.query(query, params);

    // Format dates
    const notifications = result.rows.map(n => ({
      ...n,
      createdAt: n.created_at,
      readAt: n.read_at,
      metadata: typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata
    }));

    res.json({
      success: true,
      notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/unread-count
 *
 * Get count of unread notifications (for badge)
 */
router.get('/notifications/unread-count', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        COUNT(*) AS total_unread,
        COUNT(*) FILTER (WHERE priority <= 2) AS urgent_count
      FROM notifications
      WHERE user_id = $1 AND read = false`,
      [userId]
    );

    res.json({
      success: true,
      unreadCount: parseInt(result.rows[0].total_unread) || 0,
      urgentCount: parseInt(result.rows[0].urgent_count) || 0
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

/**
 * PATCH /api/notifications/:id
 *
 * Mark notification as read
 */
router.patch('/notifications/:id', requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;
    const { read } = req.body;

    // Verify notification belongs to user
    const checkResult = await db.query(
      'SELECT id FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Update notification
    const result = await db.query(
      `UPDATE notifications
      SET read = $1, read_at = CASE WHEN $1 = true THEN NOW() ELSE NULL END
      WHERE id = $2 AND user_id = $3
      RETURNING *`,
      [read, notificationId, userId]
    );

    res.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications/mark-all-read
 *
 * Mark all unread notifications as read
 */
router.post('/notifications/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `UPDATE notifications
      SET read = true, read_at = NOW()
      WHERE user_id = $1 AND read = false
      RETURNING id`,
      [userId]
    );

    res.json({
      success: true,
      markedCount: result.rows.length
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all as read',
      message: error.message
    });
  }
});

/**
 * DELETE /api/notifications/:id
 *
 * Delete a notification
 */
router.delete('/notifications/:id', requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      deleted: true
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
      message: error.message
    });
  }
});

/**
 * POST /api/notifications
 *
 * Create a new notification (for use by workflow engine or manual sending)
 */
router.post('/notifications', requireAuth, async (req, res) => {
  try {
    const {
      userId,  // Target user (can be different from req.user if admin/system)
      type,
      title,
      message,
      priority = 3,
      metadata,
      customerId,
      taskId,
      workflowExecutionId
    } = req.body;

    // Validate required fields
    if (!userId || !type || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, type, title'
      });
    }

    // TODO: Add authorization check (can req.user send notification to userId?)

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
      RETURNING *`,
      [
        userId,
        type,
        title,
        message,
        priority,
        metadata ? JSON.stringify(metadata) : null,
        customerId || null,
        taskId || null,
        workflowExecutionId || null
      ]
    );

    res.status(201).json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message
    });
  }
});

/**
 * GET /api/notifications/summary
 *
 * Get notification summary (for dashboard widgets)
 */
router.get('/notifications/summary', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT
        COUNT(*) FILTER (WHERE read = false) AS total_unread,
        COUNT(*) FILTER (WHERE read = false AND priority = 1) AS urgent,
        COUNT(*) FILTER (WHERE read = false AND priority = 2) AS high,
        COUNT(*) FILTER (WHERE read = false AND priority >= 3) AS normal,
        COUNT(*) FILTER (WHERE read = false AND type = 'task_requires_decision') AS requires_decision,
        COUNT(*) FILTER (WHERE read = false AND type = 'overdue_alert') AS overdue_alerts,
        COUNT(*) FILTER (WHERE read = false AND type = 'approval_needed') AS approvals_needed
      FROM notifications
      WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      summary: {
        totalUnread: parseInt(result.rows[0].total_unread) || 0,
        byPriority: {
          urgent: parseInt(result.rows[0].urgent) || 0,
          high: parseInt(result.rows[0].high) || 0,
          normal: parseInt(result.rows[0].normal) || 0
        },
        byType: {
          requiresDecision: parseInt(result.rows[0].requires_decision) || 0,
          overdueAlerts: parseInt(result.rows[0].overdue_alerts) || 0,
          approvalsNeeded: parseInt(result.rows[0].approvals_needed) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch summary'
    });
  }
});

module.exports = router;
