-- ============================================================================
-- Weekly Planner - Phase 1: Core Tables
-- Renubu Labs Feature: Weekly Planning & Calendar Intelligence
-- ============================================================================
--
-- This migration creates tables for the Weekly Planner labs feature:
-- - user_work_context: Store user's goals, projects, focus areas
-- - weekly_plans: Track weekly planning sessions
-- - weekly_commitments: Individual commitments and outcomes
-- - recurring_workflows: Schedule recurring workflows (weekly planning)
-- - user_calendar_integrations: OAuth tokens for Google/Microsoft calendars
-- - user_calendar_preferences: Work hours, focus blocks, energy mapping
-- - scheduled_tasks: Tasks scheduled via findNextOpening()
--
-- Enables:
-- - AI-guided weekly planning workflow
-- - Calendar integration (read + write)
-- - Auto-scheduling with findNextOpening()
-- - Pattern recognition across weeks
-- - Integration with existing customer/workflow data
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER WORK CONTEXT
-- ============================================================================

-- Store user's ongoing projects, goals, and focus areas
CREATE TABLE IF NOT EXISTS public.user_work_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Context type
    context_type TEXT NOT NULL
        CHECK (context_type IN ('active_projects', 'goals', 'focus_areas', 'okrs')),

    -- Flexible JSONB storage for context-specific data
    -- active_projects: [{ customer_id, name, status, priority }]
    -- goals: [{ goal, target_date, progress, category }]
    -- focus_areas: [{ area, why, time_allocation }]
    context_data JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Indexes
    UNIQUE(user_id, context_type)
);

CREATE INDEX IF NOT EXISTS idx_user_work_context_user_id
    ON public.user_work_context(user_id);

COMMENT ON TABLE public.user_work_context IS
    'Stores user work context (projects, goals, focus areas) for weekly planning';

-- ============================================================================
-- SECTION 2: WEEKLY PLANNING
-- ============================================================================

-- Track weekly planning sessions
CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workflow_execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE SET NULL,

    -- Week identification
    week_start_date DATE NOT NULL, -- Monday of the week

    -- Planning data from workflow
    reflection_data JSONB, -- Responses from weekly reflection
    context_data JSONB,    -- Snapshot of workload, calendar, goals
    plan_data JSONB,       -- Finalized weekly plan and priorities

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user_id
    ON public.weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_week_start
    ON public.weekly_plans(week_start_date DESC);

COMMENT ON TABLE public.weekly_plans IS
    'Stores weekly planning sessions with reflection, context, and commitments';

-- Individual weekly commitments with outcome tracking
CREATE TABLE IF NOT EXISTS public.weekly_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_plan_id UUID NOT NULL REFERENCES public.weekly_plans(id) ON DELETE CASCADE,

    -- Commitment details
    commitment_text TEXT NOT NULL,
    category TEXT CHECK (category IN ('work', 'personal', 'customer', 'relationships', 'health', 'learning')),
    priority TEXT CHECK (priority IN ('high', 'medium', 'low')),

    -- Time tracking
    estimated_hours NUMERIC(4, 1),
    actual_hours NUMERIC(4, 1),

    -- Outcome tracking
    actual_completed BOOLEAN DEFAULT FALSE,
    outcome_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weekly_commitments_plan_id
    ON public.weekly_commitments(weekly_plan_id);

COMMENT ON TABLE public.weekly_commitments IS
    'Individual commitments within a weekly plan with outcome tracking';

-- ============================================================================
-- SECTION 3: RECURRING WORKFLOWS
-- ============================================================================

-- Schedule recurring workflows (e.g., weekly planning every Sunday 6pm)
CREATE TABLE IF NOT EXISTS public.recurring_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    workflow_definition_id UUID REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,

    -- Recurrence configuration
    recurrence_pattern TEXT NOT NULL
        CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly')),
    recurrence_config JSONB NOT NULL, -- { dayOfWeek: 'sunday', time: '18:00', timezone: 'America/New_York' }

    -- Scheduling
    next_trigger_at TIMESTAMPTZ NOT NULL,
    last_triggered_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recurring_workflows_user_id
    ON public.recurring_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_workflows_trigger
    ON public.recurring_workflows(next_trigger_at)
    WHERE is_active = TRUE;

COMMENT ON TABLE public.recurring_workflows IS
    'Schedules recurring workflows like weekly planning sessions';

-- ============================================================================
-- SECTION 4: CALENDAR INTEGRATION
-- ============================================================================

-- Store OAuth tokens for calendar providers (Google, Microsoft)
CREATE TABLE IF NOT EXISTS public.user_calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Provider
    provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft')),

    -- OAuth tokens (encrypted at application layer)
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Calendar configuration
    calendar_id TEXT, -- Primary calendar ID

    -- Permissions
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,  -- Read calendar events
    write_enabled BOOLEAN NOT NULL DEFAULT FALSE, -- Write events (for auto-scheduling)

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user_id
    ON public.user_calendar_integrations(user_id);

COMMENT ON TABLE public.user_calendar_integrations IS
    'OAuth tokens and configuration for Google/Microsoft calendar integration';

-- Store user calendar preferences (work hours, focus blocks, energy mapping)
CREATE TABLE IF NOT EXISTS public.user_calendar_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Preference type
    preference_type TEXT NOT NULL
        CHECK (preference_type IN ('work_hours', 'focus_blocks', 'energy_map', 'buffer_time', 'task_defaults')),

    -- Flexible JSONB storage
    -- work_hours: { "monday": { "start": "09:00", "end": "17:00" }, ... }
    -- focus_blocks: { "monday": ["09:00-12:00"], "thursday": ["14:00-16:00"] }
    -- energy_map: { "high_energy": ["morning"], "low_energy": ["after_lunch"] }
    -- buffer_time: { "before_meetings": 5, "after_meetings": 10, "between_tasks": 15 }
    -- task_defaults: { "deep": 90, "admin": 30, "meeting": 30, "personal": 60 }
    preference_data JSONB NOT NULL DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, preference_type)
);

CREATE INDEX IF NOT EXISTS idx_calendar_preferences_user_id
    ON public.user_calendar_preferences(user_id);

COMMENT ON TABLE public.user_calendar_preferences IS
    'User preferences for calendar scheduling (work hours, focus blocks, energy levels)';

-- ============================================================================
-- SECTION 5: SCHEDULED TASKS
-- ============================================================================

-- Track tasks scheduled via findNextOpening() algorithm
CREATE TABLE IF NOT EXISTS public.scheduled_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    weekly_plan_id UUID REFERENCES public.weekly_plans(id) ON DELETE SET NULL,

    -- Task details
    task_name TEXT NOT NULL,
    task_description TEXT,
    task_type TEXT CHECK (task_type IN ('deep', 'admin', 'meeting', 'personal', 'customer')),

    -- Time allocation
    estimated_minutes INTEGER NOT NULL,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,

    -- Calendar integration
    calendar_event_id TEXT, -- ID from Google/Microsoft calendar
    calendar_provider TEXT CHECK (calendar_provider IN ('google', 'microsoft')),

    -- Outcome tracking
    was_completed BOOLEAN,
    actual_duration_minutes INTEGER,
    completion_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id
    ON public.scheduled_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_weekly_plan
    ON public.scheduled_tasks(weekly_plan_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_scheduled_start
    ON public.scheduled_tasks(scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_calendar_event
    ON public.scheduled_tasks(calendar_event_id)
    WHERE calendar_event_id IS NOT NULL;

COMMENT ON TABLE public.scheduled_tasks IS
    'Tasks auto-scheduled via findNextOpening() with calendar event tracking';

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.user_work_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_calendar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data

-- user_work_context
CREATE POLICY user_work_context_select_own ON public.user_work_context
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_work_context_insert_own ON public.user_work_context
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_work_context_update_own ON public.user_work_context
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY user_work_context_delete_own ON public.user_work_context
    FOR DELETE USING (auth.uid() = user_id);

-- weekly_plans
CREATE POLICY weekly_plans_select_own ON public.weekly_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY weekly_plans_insert_own ON public.weekly_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY weekly_plans_update_own ON public.weekly_plans
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY weekly_plans_delete_own ON public.weekly_plans
    FOR DELETE USING (auth.uid() = user_id);

-- weekly_commitments
CREATE POLICY weekly_commitments_select_own ON public.weekly_commitments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.weekly_plans
            WHERE weekly_plans.id = weekly_commitments.weekly_plan_id
            AND weekly_plans.user_id = auth.uid()
        )
    );
CREATE POLICY weekly_commitments_insert_own ON public.weekly_commitments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.weekly_plans
            WHERE weekly_plans.id = weekly_commitments.weekly_plan_id
            AND weekly_plans.user_id = auth.uid()
        )
    );
CREATE POLICY weekly_commitments_update_own ON public.weekly_commitments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.weekly_plans
            WHERE weekly_plans.id = weekly_commitments.weekly_plan_id
            AND weekly_plans.user_id = auth.uid()
        )
    );
CREATE POLICY weekly_commitments_delete_own ON public.weekly_commitments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.weekly_plans
            WHERE weekly_plans.id = weekly_commitments.weekly_plan_id
            AND weekly_plans.user_id = auth.uid()
        )
    );

-- recurring_workflows
CREATE POLICY recurring_workflows_select_own ON public.recurring_workflows
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recurring_workflows_insert_own ON public.recurring_workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recurring_workflows_update_own ON public.recurring_workflows
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY recurring_workflows_delete_own ON public.recurring_workflows
    FOR DELETE USING (auth.uid() = user_id);

-- user_calendar_integrations
CREATE POLICY calendar_integrations_select_own ON public.user_calendar_integrations
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY calendar_integrations_insert_own ON public.user_calendar_integrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY calendar_integrations_update_own ON public.user_calendar_integrations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY calendar_integrations_delete_own ON public.user_calendar_integrations
    FOR DELETE USING (auth.uid() = user_id);

-- user_calendar_preferences
CREATE POLICY calendar_preferences_select_own ON public.user_calendar_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY calendar_preferences_insert_own ON public.user_calendar_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY calendar_preferences_update_own ON public.user_calendar_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY calendar_preferences_delete_own ON public.user_calendar_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- scheduled_tasks
CREATE POLICY scheduled_tasks_select_own ON public.scheduled_tasks
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY scheduled_tasks_insert_own ON public.scheduled_tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY scheduled_tasks_update_own ON public.scheduled_tasks
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY scheduled_tasks_delete_own ON public.scheduled_tasks
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 7: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_user_work_context_updated_at
    BEFORE UPDATE ON public.user_work_context
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recurring_workflows_updated_at
    BEFORE UPDATE ON public.recurring_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_integrations_updated_at
    BEFORE UPDATE ON public.user_calendar_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_preferences_updated_at
    BEFORE UPDATE ON public.user_calendar_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON public.scheduled_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
