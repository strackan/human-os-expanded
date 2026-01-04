-- ============================================================================
-- Weekly Planner Test Data Seed
-- Creates sample data for testing Phase 1 tables
-- ============================================================================

-- This seed assumes you have at least one user in profiles table
-- Run after: supabase db reset or supabase migration up

-- ============================================================================
-- SECTION 1: GET OR CREATE TEST USER
-- ============================================================================

-- Get first available user ID (or use yours)
DO $$
DECLARE
    test_user_id UUID;
    test_company_id UUID;
BEGIN
    -- Get an existing user (first one found)
    SELECT id, company_id INTO test_user_id, test_company_id
    FROM public.profiles
    LIMIT 1;

    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No users found in profiles table. Please create a user first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using test user: %', test_user_id;
    RAISE NOTICE 'Company ID: %', test_company_id;

    -- Store in a temp table for use in subsequent operations
    CREATE TEMP TABLE IF NOT EXISTS test_context (
        user_id UUID,
        company_id UUID
    );

    DELETE FROM test_context;
    INSERT INTO test_context (user_id, company_id) VALUES (test_user_id, test_company_id);
END $$;

-- ============================================================================
-- SECTION 2: USER WORK CONTEXT
-- ============================================================================

-- Insert active projects
INSERT INTO public.user_work_context (user_id, context_type, context_data)
SELECT
    user_id,
    'active_projects',
    jsonb_build_object(
        'projects', jsonb_build_array(
            jsonb_build_object(
                'name', 'Q1 Investor Update',
                'status', 'in_progress',
                'priority', 'high',
                'target_date', '2025-11-15',
                'notes', 'Need to finalize deck and financial projections'
            ),
            jsonb_build_object(
                'name', 'Renubu Labs - Weekly Planner',
                'status', 'in_progress',
                'priority', 'high',
                'target_date', '2025-12-15',
                'notes', 'Phase 1 foundation complete, building calendar integration'
            ),
            jsonb_build_object(
                'name', 'Customer Success Playbook',
                'status', 'planning',
                'priority', 'medium',
                'target_date', '2025-12-01',
                'notes', 'Document best practices for customer engagement'
            )
        )
    )
FROM test_context
ON CONFLICT (user_id, context_type) DO UPDATE
SET context_data = EXCLUDED.context_data,
    updated_at = NOW();

-- Insert goals (OKRs)
INSERT INTO public.user_work_context (user_id, context_type, context_data)
SELECT
    user_id,
    'goals',
    jsonb_build_object(
        'quarterly', jsonb_build_array(
            jsonb_build_object(
                'goal', 'Secure Series A funding',
                'target_date', '2025-12-31',
                'progress', 40,
                'category', 'business',
                'key_results', jsonb_build_array(
                    'Complete 20 investor meetings',
                    'Finalize pitch deck',
                    'Achieve $500K ARR'
                )
            ),
            jsonb_build_object(
                'goal', 'Launch Renubu Labs features',
                'target_date', '2025-12-15',
                'progress', 20,
                'category', 'product',
                'key_results', jsonb_build_array(
                    'Weekly planner Phase 1 complete',
                    'Calendar integration live',
                    '10 beta users testing'
                )
            )
        ),
        'annual', jsonb_build_array(
            jsonb_build_object(
                'goal', 'Build sustainable SaaS business',
                'target_date', '2025-12-31',
                'progress', 35,
                'category', 'business',
                'key_results', jsonb_build_array(
                    'Reach $1M ARR',
                    '100 paying customers',
                    'Team of 5 employees'
                )
            )
        )
    )
FROM test_context
ON CONFLICT (user_id, context_type) DO UPDATE
SET context_data = EXCLUDED.context_data,
    updated_at = NOW();

-- Insert focus areas
INSERT INTO public.user_work_context (user_id, context_type, context_data)
SELECT
    user_id,
    'focus_areas',
    jsonb_build_object(
        'areas', jsonb_build_array(
            jsonb_build_object(
                'area', 'Product Development',
                'why', 'Need to ship weekly planner and validate product-market fit',
                'time_allocation', '40%'
            ),
            jsonb_build_object(
                'area', 'Customer Success',
                'why', 'Ensure existing customers are healthy and expanding',
                'time_allocation', '30%'
            ),
            jsonb_build_object(
                'area', 'Fundraising',
                'why', 'Secure funding to scale the business',
                'time_allocation', '20%'
            ),
            jsonb_build_object(
                'area', 'Health & Family',
                'why', 'Maintain work-life balance and energy',
                'time_allocation', '10%'
            )
        )
    )
FROM test_context
ON CONFLICT (user_id, context_type) DO UPDATE
SET context_data = EXCLUDED.context_data,
    updated_at = NOW();

-- ============================================================================
-- SECTION 3: CALENDAR PREFERENCES
-- ============================================================================

-- Work hours
INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
SELECT
    user_id,
    'work_hours',
    jsonb_build_object(
        'monday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'tuesday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'wednesday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'thursday', jsonb_build_object('start', '09:00', 'end', '17:00'),
        'friday', jsonb_build_object('start', '09:00', 'end', '15:00'),
        'saturday', jsonb_build_object('start', null, 'end', null),
        'sunday', jsonb_build_object('start', null, 'end', null)
    )
FROM test_context
ON CONFLICT (user_id, preference_type) DO UPDATE
SET preference_data = EXCLUDED.preference_data,
    updated_at = NOW();

-- Focus blocks (when you do your best deep work)
INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
SELECT
    user_id,
    'focus_blocks',
    jsonb_build_object(
        'monday', jsonb_build_array('09:00-12:00'),
        'tuesday', jsonb_build_array('09:00-12:00'),
        'wednesday', jsonb_build_array('09:00-11:00'),
        'thursday', jsonb_build_array('09:00-12:00', '14:00-16:00'),
        'friday', jsonb_build_array('09:00-12:00')
    )
FROM test_context
ON CONFLICT (user_id, preference_type) DO UPDATE
SET preference_data = EXCLUDED.preference_data,
    updated_at = NOW();

-- Energy mapping
INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
SELECT
    user_id,
    'energy_map',
    jsonb_build_object(
        'high_energy', jsonb_build_array('morning', 'early_afternoon'),
        'low_energy', jsonb_build_array('after_lunch', 'late_afternoon'),
        'best_for_deep_work', jsonb_build_array('09:00-12:00'),
        'best_for_meetings', jsonb_build_array('14:00-16:00')
    )
FROM test_context
ON CONFLICT (user_id, preference_type) DO UPDATE
SET preference_data = EXCLUDED.preference_data,
    updated_at = NOW();

-- Buffer time preferences
INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
SELECT
    user_id,
    'buffer_time',
    jsonb_build_object(
        'before_meetings', 5,
        'after_meetings', 10,
        'between_tasks', 15,
        'lunch_break', 60
    )
FROM test_context
ON CONFLICT (user_id, preference_type) DO UPDATE
SET preference_data = EXCLUDED.preference_data,
    updated_at = NOW();

-- Task duration defaults (in minutes)
INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
SELECT
    user_id,
    'task_defaults',
    jsonb_build_object(
        'deep', 90,
        'admin', 30,
        'meeting', 30,
        'personal', 60,
        'customer', 45
    )
FROM test_context
ON CONFLICT (user_id, preference_type) DO UPDATE
SET preference_data = EXCLUDED.preference_data,
    updated_at = NOW();

-- ============================================================================
-- SECTION 4: WEEKLY PLANS (Historical)
-- ============================================================================

-- Last week's plan (completed)
INSERT INTO public.weekly_plans (user_id, week_start_date, reflection_data, context_data, plan_data)
SELECT
    user_id,
    CURRENT_DATE - INTERVAL '7 days',
    jsonb_build_object(
        'what_felt_good', 'Shipped WorkloadAnalysisService on time, good momentum on labs project',
        'what_could_improve', 'Too many context switches, need better time blocking',
        'highlights', jsonb_build_array(
            'Launched Phase 1 foundation',
            'Positive customer feedback on strategic planning workflow',
            'Good team collaboration'
        ),
        'learnings', 'Deep work in mornings is 2x more productive than afternoons'
    ),
    jsonb_build_object(
        'total_hours_available', 40,
        'hours_scheduled', 32,
        'customer_count', 5,
        'priorities_count', 8
    ),
    jsonb_build_object(
        'priorities', jsonb_build_array('Ship WorkloadAnalysisService', 'Customer check-ins', 'Database migration'),
        'completion_rate', 75,
        'notes', 'Good week overall, slightly over-committed'
    )
FROM test_context
ON CONFLICT (user_id, week_start_date) DO UPDATE
SET reflection_data = EXCLUDED.reflection_data,
    context_data = EXCLUDED.context_data,
    plan_data = EXCLUDED.plan_data;

-- Get the weekly_plan_id for commitments
DO $$
DECLARE
    last_week_plan_id UUID;
    test_user_id UUID;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;

    SELECT id INTO last_week_plan_id
    FROM public.weekly_plans
    WHERE user_id = test_user_id
    AND week_start_date = CURRENT_DATE - INTERVAL '7 days';

    IF last_week_plan_id IS NOT NULL THEN
        -- Insert last week's commitments
        INSERT INTO public.weekly_commitments (weekly_plan_id, commitment_text, category, priority, estimated_hours, actual_hours, actual_completed, outcome_notes)
        VALUES
            (last_week_plan_id, 'Ship WorkloadAnalysisService', 'work', 'high', 8, 10, TRUE, 'Completed - took longer than expected but quality was high'),
            (last_week_plan_id, 'Customer check-ins (5 customers)', 'customer', 'high', 3, 2.5, TRUE, 'Completed all check-ins, good conversations'),
            (last_week_plan_id, 'Database migration for weekly planner', 'work', 'high', 4, 3, TRUE, 'Done efficiently, well documented'),
            (last_week_plan_id, 'Review and respond to investor emails', 'work', 'medium', 2, 1.5, TRUE, 'Responded to all, one promising conversation'),
            (last_week_plan_id, 'Exercise 3x this week', 'health', 'medium', 3, 2, FALSE, 'Only did 2 sessions - need to prioritize better'),
            (last_week_plan_id, 'Date night with Ruth', 'personal', 'high', 3, 3, TRUE, 'Great evening, went to new restaurant'),
            (last_week_plan_id, 'Review Q1 financial projections', 'work', 'medium', 2, 0, FALSE, 'Ran out of time, pushing to this week'),
            (last_week_plan_id, 'Research calendar APIs for Phase 2', 'work', 'low', 2, 1, TRUE, 'Quick research, ready to implement');
    END IF;
END $$;

-- This week's plan (in progress)
INSERT INTO public.weekly_plans (user_id, week_start_date, reflection_data, context_data, plan_data)
SELECT
    user_id,
    DATE_TRUNC('week', CURRENT_DATE)::DATE,
    NULL, -- Not filled yet (reflection happens at end)
    jsonb_build_object(
        'total_hours_available', 40,
        'hours_scheduled', 18,
        'customer_count', 3,
        'priorities_count', 6
    ),
    jsonb_build_object(
        'priorities', jsonb_build_array(
            'Build CalendarService with OAuth',
            'Implement findNextOpening() algorithm',
            'Customer renewal calls'
        ),
        'status', 'in_progress'
    )
FROM test_context
ON CONFLICT (user_id, week_start_date) DO NOTHING;

-- ============================================================================
-- SECTION 5: RECURRING WORKFLOW (Weekly Planning)
-- ============================================================================

-- Note: This requires a workflow_definition for 'weekly-planning' to exist
-- We'll create a placeholder that can be updated later

INSERT INTO public.recurring_workflows (user_id, workflow_definition_id, recurrence_pattern, recurrence_config, next_trigger_at, is_active)
SELECT
    user_id,
    NULL, -- Will be updated when workflow is created
    'weekly',
    jsonb_build_object(
        'dayOfWeek', 'sunday',
        'time', '18:00',
        'timezone', 'America/New_York'
    ),
    -- Next Sunday at 6pm
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days' + INTERVAL '18 hours')::TIMESTAMPTZ,
    TRUE
FROM test_context;

-- ============================================================================
-- SECTION 6: SCHEDULED TASKS (This week)
-- ============================================================================

DO $$
DECLARE
    test_user_id UUID;
    current_week_plan_id UUID;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;

    SELECT id INTO current_week_plan_id
    FROM public.weekly_plans
    WHERE user_id = test_user_id
    AND week_start_date = DATE_TRUNC('week', CURRENT_DATE)::DATE;

    IF current_week_plan_id IS NOT NULL THEN
        -- Sample scheduled tasks for this week
        INSERT INTO public.scheduled_tasks (
            user_id,
            weekly_plan_id,
            task_name,
            task_description,
            task_type,
            estimated_minutes,
            scheduled_start,
            scheduled_end,
            calendar_event_id,
            was_completed,
            actual_duration_minutes
        )
        VALUES
            -- Monday
            (test_user_id, current_week_plan_id, 'Deep work: CalendarService OAuth', 'Implement Google Calendar OAuth flow', 'deep', 120,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' + INTERVAL '9 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' + INTERVAL '11 hours',
             NULL, TRUE, 130),

            (test_user_id, current_week_plan_id, 'Customer check-in: Obsidian Black', 'Renewal prep discussion', 'customer', 30,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' + INTERVAL '14 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 day' + INTERVAL '14 hours 30 minutes',
             NULL, TRUE, 35),

            -- Tuesday
            (test_user_id, current_week_plan_id, 'Build findNextOpening() algorithm', 'Core slot-finding logic with scoring', 'deep', 90,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '2 days' + INTERVAL '9 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '2 days' + INTERVAL '10 hours 30 minutes',
             NULL, FALSE, NULL),

            (test_user_id, current_week_plan_id, 'Review investor deck', 'Final review before Wednesday meeting', 'admin', 30,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '2 days' + INTERVAL '16 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '2 days' + INTERVAL '16 hours 30 minutes',
             NULL, FALSE, NULL),

            -- Wednesday
            (test_user_id, current_week_plan_id, 'Investor meeting: Sequoia', 'Series A pitch meeting', 'meeting', 60,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '3 days' + INTERVAL '10 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '3 days' + INTERVAL '11 hours',
             'evt_sequoia_pitch_123', FALSE, NULL),

            -- Thursday
            (test_user_id, current_week_plan_id, 'Customer success planning', 'Review playbook and update docs', 'admin', 45,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '4 days' + INTERVAL '14 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '4 days' + INTERVAL '14 hours 45 minutes',
             NULL, FALSE, NULL),

            -- Friday
            (test_user_id, current_week_plan_id, 'Team sync', 'Weekly team standup', 'meeting', 30,
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '5 days' + INTERVAL '9 hours',
             DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '5 days' + INTERVAL '9 hours 30 minutes',
             'evt_team_standup_456', FALSE, NULL);
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show summary of seeded data
DO $$
DECLARE
    test_user_id UUID;
    context_count INT;
    prefs_count INT;
    plans_count INT;
    commitments_count INT;
    tasks_count INT;
    recurring_count INT;
BEGIN
    SELECT user_id INTO test_user_id FROM test_context LIMIT 1;

    SELECT COUNT(*) INTO context_count FROM public.user_work_context WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO prefs_count FROM public.user_calendar_preferences WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO plans_count FROM public.weekly_plans WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO commitments_count FROM public.weekly_commitments wc
        JOIN public.weekly_plans wp ON wc.weekly_plan_id = wp.id
        WHERE wp.user_id = test_user_id;
    SELECT COUNT(*) INTO tasks_count FROM public.scheduled_tasks WHERE user_id = test_user_id;
    SELECT COUNT(*) INTO recurring_count FROM public.recurring_workflows WHERE user_id = test_user_id;

    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'WEEKLY PLANNER SEED DATA SUMMARY';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Test User ID: %', test_user_id;
    RAISE NOTICE '';
    RAISE NOTICE 'User Work Context entries: %', context_count;
    RAISE NOTICE '  - Active projects, goals, focus areas';
    RAISE NOTICE '';
    RAISE NOTICE 'Calendar Preferences: %', prefs_count;
    RAISE NOTICE '  - Work hours, focus blocks, energy map, buffer time, defaults';
    RAISE NOTICE '';
    RAISE NOTICE 'Weekly Plans: %', plans_count;
    RAISE NOTICE '  - Last week (completed) + This week (in progress)';
    RAISE NOTICE '';
    RAISE NOTICE 'Weekly Commitments: %', commitments_count;
    RAISE NOTICE '  - From last week with completion tracking';
    RAISE NOTICE '';
    RAISE NOTICE 'Scheduled Tasks: %', tasks_count;
    RAISE NOTICE '  - This weeks tasks (some completed, some pending)';
    RAISE NOTICE '';
    RAISE NOTICE 'Recurring Workflows: %', recurring_count;
    RAISE NOTICE '  - Weekly planning scheduled for Sunday 6pm';
    RAISE NOTICE '';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Seed complete! Ready to test WorkloadAnalysisService.';
    RAISE NOTICE '=================================================================';
END $$;

-- Clean up temp table
DROP TABLE IF EXISTS test_context;
