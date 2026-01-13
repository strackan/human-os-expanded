/**
 * Phase 3.3: Workflow Task Management System
 *
 * This migration creates the infrastructure for task-based workflow management:
 * - Workflow tasks with 7-day snooze enforcement
 * - Task artifacts (AI drafts, recommendations)
 * - In-product notifications (90-day retention)
 *
 * Key Requirements (HYBRID APPROACH):
 * - Maximum 7-day snooze period from FIRST SNOOZE (not task creation)
 * - Force action after 7 days from first snooze (no more snooze option)
 * - Configurable auto-skip grace period per task type (default 24 hours)
 * - Task reassignment/escalation support
 * - Cross-workflow task continuity
 * - Task category tracking (AI-generated vs CSM-manual)
 */

-- =====================================================
-- 1. Update workflow_executions status enum
-- =====================================================

-- Add new status for workflows that complete with pending tasks
ALTER TABLE public.workflow_executions
DROP CONSTRAINT IF EXISTS workflow_executions_status_check;

ALTER TABLE public.workflow_executions
ADD CONSTRAINT workflow_executions_status_check
CHECK (status IN ('not_started', 'in_progress', 'completed', 'completed_with_pending_tasks', 'snoozed', 'abandoned'));

-- =====================================================
-- 2. Workflow Tasks Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Workflow linkage (nullable for cross-workflow tasks)
    workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,
    step_execution_id UUID REFERENCES public.workflow_step_executions(id) ON DELETE SET NULL,
    original_workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,

    -- Customer and assignment
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    recommendation_id UUID,  -- Links to recommendation that generated this task

    -- Task details
    task_type TEXT NOT NULL CHECK (task_type IN (
        'review_contract',
        'draft_email',
        'schedule_meeting',
        'analyze_usage',
        'prepare_proposal',
        'follow_up',
        'escalate',
        'update_crm',
        'get_transcript',
        'review_recommendation',
        'custom'
    )),
    task_category TEXT CHECK (task_category IN ('ai_generated', 'csm_manual', 'system')),
    action TEXT NOT NULL, -- What the user should do
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Task status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'in_progress',
        'snoozed',
        'completed',
        'skipped',
        'reassigned'
    )),

    -- 7-DAY SNOOZE ENFORCEMENT (HYBRID APPROACH)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_snoozed_at TIMESTAMPTZ, -- When CSM first snoozes task (NULL until first snooze)
    max_snooze_date TIMESTAMPTZ, -- first_snoozed_at + 7 days (set by trigger)
    snoozed_until TIMESTAMPTZ, -- When task will resurface (can be sooner than max_snooze_date)
    snooze_count INTEGER DEFAULT 0, -- Track number of snoozes
    force_action BOOLEAN DEFAULT false, -- True after max_snooze_date passed
    auto_skip_at TIMESTAMPTZ, -- Configurable grace period after force_action

    -- Completion tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    skip_reason TEXT,

    -- Reassignment tracking
    reassigned_from UUID REFERENCES public.profiles(id),
    reassigned_at TIMESTAMPTZ,
    reassignment_reason TEXT,

    -- Cross-workflow tracking
    surfaced_in_workflows UUID[], -- Array of workflow_execution_ids where this task appeared

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS

    -- Enforce 7-day snooze limit: snoozed_until cannot exceed max_snooze_date
    CONSTRAINT max_snooze_enforced
        CHECK (snoozed_until IS NULL OR max_snooze_date IS NULL OR snoozed_until <= max_snooze_date),

    -- force_action requires max_snooze_date to be set
    CONSTRAINT force_action_requires_max_snooze_date
        CHECK (force_action = false OR max_snooze_date IS NOT NULL),

    -- auto_skip_at can only be set if force_action is true
    CONSTRAINT auto_skip_after_force_action
        CHECK (auto_skip_at IS NULL OR force_action = true),

    -- Completed/skipped tasks must have timestamps
    CONSTRAINT completion_timestamps
        CHECK (
            (status = 'completed' AND completed_at IS NOT NULL) OR
            (status = 'skipped' AND skipped_at IS NOT NULL) OR
            (status NOT IN ('completed', 'skipped'))
        )
);

-- Indexes for performance
CREATE INDEX idx_workflow_tasks_customer ON public.workflow_tasks(customer_id);
CREATE INDEX idx_workflow_tasks_assigned_to ON public.workflow_tasks(assigned_to);
CREATE INDEX idx_workflow_tasks_status ON public.workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_workflow_execution ON public.workflow_tasks(workflow_execution_id);
CREATE INDEX idx_workflow_tasks_snoozed_until ON public.workflow_tasks(snoozed_until) WHERE status = 'snoozed';
CREATE INDEX idx_workflow_tasks_auto_skip ON public.workflow_tasks(auto_skip_at) WHERE auto_skip_at IS NOT NULL;
CREATE INDEX idx_workflow_tasks_force_action ON public.workflow_tasks(force_action) WHERE force_action = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_workflow_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workflow_tasks_updated_at_trigger
    BEFORE UPDATE ON public.workflow_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_tasks_updated_at();

-- Trigger to set max_snooze_date and first_snoozed_at when task first transitions to snoozed
CREATE OR REPLACE FUNCTION set_max_snooze_date()
RETURNS TRIGGER AS $$
BEGIN
    -- When task first transitions to 'snoozed' status
    IF NEW.status = 'snoozed' AND (OLD.status IS NULL OR OLD.status != 'snoozed') THEN
        -- Set first_snoozed_at if not already set
        IF NEW.first_snoozed_at IS NULL THEN
            NEW.first_snoozed_at := NOW();
        END IF;

        -- Set max_snooze_date to 7 days from first snooze
        IF NEW.max_snooze_date IS NULL THEN
            NEW.max_snooze_date := NEW.first_snoozed_at + INTERVAL '7 days';
        END IF;

        -- Increment snooze count
        NEW.snooze_count := COALESCE(NEW.snooze_count, 0) + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_max_snooze_date_trigger
    BEFORE INSERT OR UPDATE ON public.workflow_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_max_snooze_date();

-- RLS Policies
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks assigned to them or created by them
CREATE POLICY "Users can view their own tasks"
    ON public.workflow_tasks
    FOR SELECT
    USING (
        auth.uid() = assigned_to OR
        auth.uid() = created_by OR
        auth.uid() IN (SELECT id FROM public.profiles WHERE company_id = (
            SELECT company_id FROM public.profiles WHERE id = assigned_to
        ))
    );

-- Users can create tasks
CREATE POLICY "Users can create tasks"
    ON public.workflow_tasks
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Users can update their assigned tasks
CREATE POLICY "Users can update their assigned tasks"
    ON public.workflow_tasks
    FOR UPDATE
    USING (auth.uid() = assigned_to OR auth.uid() = created_by);

-- =====================================================
-- 3. Workflow Task Artifacts Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_task_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.workflow_tasks(id) ON DELETE CASCADE,

    -- Artifact details
    artifact_type TEXT NOT NULL CHECK (artifact_type IN (
        'email_draft',
        'contract_analysis',
        'meeting_notes',
        'proposal_draft',
        'recommendation',
        'custom'
    )),
    title TEXT NOT NULL,
    content JSONB NOT NULL, -- Structured content (email body, analysis results, etc.)

    -- Generation metadata
    generated_by TEXT DEFAULT 'manual' CHECK (generated_by IN ('manual', 'ai', 'template')),
    ai_model TEXT, -- e.g., 'gpt-4', 'claude-3' (for future LLM integration)
    generation_prompt TEXT, -- The prompt used (for future reference)

    -- Status
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_workflow_task_artifacts_task ON public.workflow_task_artifacts(task_id);
CREATE INDEX idx_workflow_task_artifacts_type ON public.workflow_task_artifacts(artifact_type);

-- Trigger for updated_at
CREATE TRIGGER update_workflow_task_artifacts_updated_at_trigger
    BEFORE UPDATE ON public.workflow_task_artifacts
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_tasks_updated_at();

-- RLS Policies
ALTER TABLE public.workflow_task_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifacts for their tasks"
    ON public.workflow_task_artifacts
    FOR SELECT
    USING (
        task_id IN (
            SELECT id FROM public.workflow_tasks
            WHERE assigned_to = auth.uid() OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can create artifacts for their tasks"
    ON public.workflow_task_artifacts
    FOR INSERT
    WITH CHECK (
        task_id IN (
            SELECT id FROM public.workflow_tasks
            WHERE assigned_to = auth.uid() OR created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update artifacts for their tasks"
    ON public.workflow_task_artifacts
    FOR UPDATE
    USING (
        task_id IN (
            SELECT id FROM public.workflow_tasks
            WHERE assigned_to = auth.uid() OR created_by = auth.uid()
        )
    );

-- =====================================================
-- 4. Task Type Configuration Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.task_type_config (
    task_type TEXT PRIMARY KEY,
    auto_skip_enabled BOOLEAN DEFAULT true,
    auto_skip_grace_hours INTEGER DEFAULT 24,  -- Hours after force_action before auto-skip
    requires_manual_escalation BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configurations
INSERT INTO public.task_type_config (task_type, auto_skip_enabled, auto_skip_grace_hours, requires_manual_escalation, description) VALUES
    ('draft_email', true, 24, false, 'Auto-skip after 24 hours'),
    ('review_contract', true, 48, false, 'Auto-skip after 48 hours (high-value task, longer grace period)'),
    ('schedule_meeting', true, 24, false, 'Auto-skip after 24 hours'),
    ('analyze_usage', true, 24, false, 'Auto-skip after 24 hours'),
    ('prepare_proposal', true, 48, false, 'Auto-skip after 48 hours (high-value task)'),
    ('follow_up', true, 24, false, 'Auto-skip after 24 hours'),
    ('escalate', false, NULL, true, 'Never auto-skip, requires manual escalation to manager'),
    ('update_crm', true, 24, false, 'Auto-skip after 24 hours'),
    ('get_transcript', true, 24, false, 'Auto-skip after 24 hours'),
    ('review_recommendation', true, 24, false, 'Auto-skip after 24 hours'),
    ('custom', true, 24, false, 'Auto-skip after 24 hours')
ON CONFLICT (task_type) DO NOTHING;

-- RLS Policies
ALTER TABLE public.task_type_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task type config"
    ON public.task_type_config
    FOR SELECT
    USING (true);

CREATE POLICY "Only admins can modify task type config"
    ON public.task_type_config
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================
-- 5. In-Product Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.in_product_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and targeting
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Notification details
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'task_assigned',
        'task_snoozed_resurfaced',
        'task_force_action_warning',
        'task_auto_skipped',
        'task_reassigned',
        'workflow_completed',
        'custom'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    -- Links and actions
    link_url TEXT, -- Deep link to task/workflow
    link_text TEXT, -- CTA text (e.g., "View Task")

    -- Related entities
    task_id UUID REFERENCES public.workflow_tasks(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,

    -- 90-day retention
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_notifications_user ON public.in_product_notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.in_product_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_expires ON public.in_product_notifications(expires_at);
CREATE INDEX idx_notifications_task ON public.in_product_notifications(task_id);
CREATE INDEX idx_notifications_created ON public.in_product_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE public.in_product_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON public.in_product_notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
    ON public.in_product_notifications
    FOR INSERT
    WITH CHECK (true); -- Will be called by service role

CREATE POLICY "Users can update their own notifications"
    ON public.in_product_notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- =====================================================
-- 5. Helper Functions
-- =====================================================

-- Function to get pending tasks for a customer (across all workflows)
CREATE OR REPLACE FUNCTION get_pending_tasks_for_customer(p_customer_id UUID)
RETURNS TABLE (
    task_id UUID,
    task_type TEXT,
    action TEXT,
    description TEXT,
    priority TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    snoozed_until TIMESTAMPTZ,
    force_action BOOLEAN,
    days_until_deadline INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        workflow_tasks.task_type,
        workflow_tasks.action,
        workflow_tasks.description,
        workflow_tasks.priority,
        workflow_tasks.status,
        workflow_tasks.created_at,
        workflow_tasks.snoozed_until,
        workflow_tasks.force_action,
        EXTRACT(DAY FROM (max_snooze_date - NOW()))::INTEGER as days_until_deadline
    FROM public.workflow_tasks
    WHERE customer_id = p_customer_id
        AND status IN ('pending', 'snoozed', 'in_progress')
    ORDER BY
        CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END,
        created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks requiring force action (past 7-day deadline)
CREATE OR REPLACE FUNCTION get_tasks_requiring_force_action()
RETURNS TABLE (
    task_id UUID,
    customer_id UUID,
    assigned_to UUID,
    task_type TEXT,
    action TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        workflow_tasks.customer_id,
        workflow_tasks.assigned_to,
        workflow_tasks.task_type,
        workflow_tasks.action
    FROM public.workflow_tasks
    WHERE status = 'snoozed'
        AND NOW() >= max_snooze_date
        AND force_action = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks ready for auto-skip
CREATE OR REPLACE FUNCTION get_tasks_for_auto_skip()
RETURNS TABLE (
    task_id UUID,
    customer_id UUID,
    assigned_to UUID,
    task_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        id,
        workflow_tasks.customer_id,
        workflow_tasks.assigned_to,
        workflow_tasks.task_type
    FROM public.workflow_tasks
    WHERE force_action = true
        AND auto_skip_at IS NOT NULL
        AND NOW() >= auto_skip_at
        AND status NOT IN ('completed', 'skipped');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Comments for Documentation
-- =====================================================

COMMENT ON TABLE public.workflow_tasks IS 'Task management system with 7-day snooze enforcement (from first snooze) and cross-workflow continuity. HYBRID APPROACH.';
COMMENT ON COLUMN public.workflow_tasks.first_snoozed_at IS 'When CSM first snoozes the task. NULL until first snooze. Starts the 7-day countdown.';
COMMENT ON COLUMN public.workflow_tasks.max_snooze_date IS 'Set to first_snoozed_at + 7 days by trigger. Tasks cannot be snoozed beyond this date. Database constraint enforced.';
COMMENT ON COLUMN public.workflow_tasks.force_action IS 'Set to true when NOW() >= max_snooze_date. User must complete or skip, no more snoozing.';
COMMENT ON COLUMN public.workflow_tasks.auto_skip_at IS 'Configurable grace period after force_action. Default 24-48 hours based on task_type_config. Task auto-skips if no action taken.';
COMMENT ON COLUMN public.workflow_tasks.surfaced_in_workflows IS 'Array of workflow_execution_id values where this task was shown to user (cross-workflow continuity).';
COMMENT ON COLUMN public.workflow_tasks.task_category IS 'ai_generated: Created by AI recommendation engine. csm_manual: Created manually by CSM. system: Created by system automation.';
COMMENT ON COLUMN public.workflow_tasks.original_workflow_execution_id IS 'The workflow that originally created this task. Used for cross-workflow task tracking.';

COMMENT ON TABLE public.workflow_task_artifacts IS 'Stores AI-generated or manual artifacts (email drafts, analyses, etc.) linked to tasks';

COMMENT ON TABLE public.task_type_config IS 'Configuration for auto-skip grace periods per task type. Allows different deadlines for high-value vs routine tasks.';
COMMENT ON COLUMN public.task_type_config.auto_skip_grace_hours IS 'Hours after force_action before task is auto-skipped. review_contract: 48h, draft_email: 24h, escalate: never';
COMMENT ON COLUMN public.task_type_config.requires_manual_escalation IS 'If true, do not auto-skip. Instead escalate to manager.';

COMMENT ON TABLE public.in_product_notifications IS 'In-product notifications with 90-day retention. Auto-deleted from badge when read.';
COMMENT ON COLUMN public.in_product_notifications.expires_at IS 'Notifications expire after 90 days and should be cleaned up by cron job';
