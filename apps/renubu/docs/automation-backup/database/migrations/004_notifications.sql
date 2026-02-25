-- Migration 004: Flexible Notification System
-- Lightweight notification/alert system for reminder button

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
-- Stores in-app notifications shown in reminder button
-- Separate from escalations/reassignments - this is just communication
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,

  -- Notification content
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  priority INT DEFAULT 3,  -- 1 = urgent (pulsing red), 2 = high, 3 = normal, 4-5 = low

  -- Metadata for navigation and context
  metadata JSONB,  -- {customerId, workflowStage, taskId, daysOverdue, etc.}

  -- State tracking
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,

  -- Optional: Link to related entities
  task_id UUID REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  workflow_execution_id UUID REFERENCES workflow_executions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,

  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 5),
  CONSTRAINT valid_type CHECK (type IN (
    'task_requires_decision',
    'task_deadline_approaching',
    'workflow_started',
    'escalation_required',
    'overdue_alert',
    'key_task_pending',
    'recommendation_available',
    'approval_needed'
  ))
);

-- Indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority) WHERE priority <= 2; -- Urgent notifications
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_customer_id ON notifications(customer_id) WHERE customer_id IS NOT NULL;

-- ============================================================
-- NOTIFICATION FUNCTIONS
-- ============================================================

-- Auto-cleanup: Delete read notifications older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE read = true
  AND read_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to create notification with template variable resolution
-- (Template resolution happens in application layer, this is just a helper)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_priority INT DEFAULT 3,
  p_metadata JSONB DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_task_id UUID DEFAULT NULL,
  p_workflow_execution_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    priority,
    metadata,
    customer_id,
    task_id,
    workflow_execution_id
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_priority,
    p_metadata,
    p_customer_id,
    p_task_id,
    p_workflow_execution_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SAMPLE DATA (for development/testing)
-- ============================================================

-- Sample notifications for CSM user (assuming user exists from migration 003)
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  metadata,
  customer_id
) VALUES
  (
    '00000000-0000-0000-0000-000000000005', -- Carol CSM from migration 003
    'overdue_alert',
    'Renewal 7 Days Overdue',
    'Acme Corp renewal is 7 days overdue. Manager has been notified.',
    2, -- High priority
    '{"customerId": "sample-123", "workflowStage": "overdue", "daysOverdue": 7}'::jsonb,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'task_deadline_approaching',
    'QBR Scheduled Tomorrow',
    'Quarterly Business Review with Acme Corp is scheduled for tomorrow at 2pm',
    3, -- Normal priority
    '{"customerId": "sample-123", "eventType": "qbr", "daysUntil": 1}'::jsonb,
    NULL
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    'recommendation_available',
    'AI Recommends Price Increase Discussion',
    'Based on usage patterns, consider discussing 5% price increase with Acme Corp',
    4, -- Low priority
    '{"customerId": "sample-123", "recommendationType": "pricing", "suggestedIncrease": 5}'::jsonb,
    NULL
  );

-- Sample urgent notification for manager
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  priority,
  metadata
) VALUES
  (
    '00000000-0000-0000-0000-000000000003', -- Alice Manager from migration 003
    'approval_needed',
    'Manager Acknowledgment Required',
    'Emergency renewal for TechCorp requires your immediate acknowledgment',
    1, -- Urgent (pulsing red badge)
    '{"customerId": "sample-456", "workflowStage": "emergency", "hoursRemaining": 36, "requiresAcknowledgment": true}'::jsonb
  );

-- ============================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================

-- View: Unread notifications with user details
CREATE VIEW unread_notifications AS
SELECT
  n.*,
  u.email AS user_email,
  u.name AS user_name,
  c.name AS customer_name,
  c.arr AS customer_arr
FROM notifications n
JOIN users u ON n.user_id = u.id
LEFT JOIN customers c ON n.customer_id = c.id
WHERE n.read = false
ORDER BY n.priority ASC, n.created_at DESC;

-- View: Urgent notifications (priority 1-2)
CREATE VIEW urgent_notifications AS
SELECT
  n.*,
  u.email AS user_email,
  u.name AS user_name
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.read = false
AND n.priority <= 2
ORDER BY n.priority ASC, n.created_at DESC;

-- ============================================================
-- CRON JOB HELPERS
-- ============================================================

-- Daily cleanup of old read notifications
-- Run this via cron: SELECT cleanup_old_notifications();

-- Get notification summary by user (useful for digest emails)
CREATE OR REPLACE FUNCTION get_user_notification_summary(p_user_id UUID)
RETURNS TABLE(
  total_unread BIGINT,
  urgent_count BIGINT,
  high_count BIGINT,
  normal_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE read = false) AS total_unread,
    COUNT(*) FILTER (WHERE read = false AND priority = 1) AS urgent_count,
    COUNT(*) FILTER (WHERE read = false AND priority = 2) AS high_count,
    COUNT(*) FILTER (WHERE read = false AND priority >= 3) AS normal_count
  FROM notifications
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- EXAMPLE USAGE
-- ============================================================

/*
-- Create a notification for a CSM about an overdue renewal
SELECT create_notification(
  p_user_id := 'csm-uuid',
  p_type := 'overdue_alert',
  p_title := 'Renewal 15 Days Overdue',
  p_message := 'Acme Corp renewal is 15 days overdue. VP CS has been looped in.',
  p_priority := 1,
  p_metadata := '{"customerId": "abc-123", "daysOverdue": 15, "workflowStage": "overdue"}'::jsonb,
  p_customer_id := 'abc-123'
);

-- Get all unread notifications for a user
SELECT * FROM notifications
WHERE user_id = 'user-uuid'
AND read = false
ORDER BY priority ASC, created_at DESC;

-- Mark notification as read
UPDATE notifications
SET read = true, read_at = NOW()
WHERE id = 'notification-uuid';

-- Get notification summary
SELECT * FROM get_user_notification_summary('user-uuid');

-- Cleanup old notifications (run daily via cron)
SELECT cleanup_old_notifications();
*/
