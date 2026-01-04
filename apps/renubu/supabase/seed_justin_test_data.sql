-- ============================================================================
-- Justin Test Data for Demo Mode
-- Seeds calendar preferences and sample data for justin@renubu.com
-- Run this to populate test data for the weekly planner demo
-- ============================================================================

-- This assumes justin@renubu.com's user ID is: d152cc6c-8d71-4816-9b96-eccf249ed0ac
-- Adjust if needed

DO $$
DECLARE
    justin_user_id UUID := 'd152cc6c-8d71-4816-9b96-eccf249ed0ac';
    test_company_id UUID;
    test_customer_id UUID;
BEGIN
    -- Get Justin's company ID
    SELECT company_id INTO test_company_id
    FROM public.profiles
    WHERE id = justin_user_id;

    IF test_company_id IS NULL THEN
        RAISE EXCEPTION 'Justin user not found or has no company_id. User ID: %', justin_user_id;
    END IF;

    RAISE NOTICE 'Setting up test data for Justin (User: %, Company: %)', justin_user_id, test_company_id;

    -- ========================================================================
    -- 1. CALENDAR PREFERENCES - Work Hours
    -- ========================================================================

    -- Delete existing work hours for justin
    DELETE FROM public.user_calendar_preferences
    WHERE user_id = justin_user_id AND preference_type = 'work_hours';

    -- Insert work hours: Monday-Friday 9am-5pm
    INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
    VALUES
        (justin_user_id, 'work_hours', jsonb_build_object(
            'day', 'monday',
            'start_time', '09:00',
            'end_time', '17:00',
            'timezone', 'America/New_York'
        )),
        (justin_user_id, 'work_hours', jsonb_build_object(
            'day', 'tuesday',
            'start_time', '09:00',
            'end_time', '17:00',
            'timezone', 'America/New_York'
        )),
        (justin_user_id, 'work_hours', jsonb_build_object(
            'day', 'wednesday',
            'start_time', '09:00',
            'end_time', '17:00',
            'timezone', 'America/New_York'
        )),
        (justin_user_id, 'work_hours', jsonb_build_object(
            'day', 'thursday',
            'start_time', '09:00',
            'end_time', '17:00',
            'timezone', 'America/New_York'
        )),
        (justin_user_id, 'work_hours', jsonb_build_object(
            'day', 'friday',
            'start_time', '09:00',
            'end_time', '17:00',
            'timezone', 'America/New_York'
        ));

    RAISE NOTICE '✓ Created work hours (M-F 9am-5pm)';

    -- ========================================================================
    -- 2. CALENDAR PREFERENCES - Focus Blocks
    -- ========================================================================

    -- Delete existing focus blocks for justin
    DELETE FROM public.user_calendar_preferences
    WHERE user_id = justin_user_id AND preference_type = 'focus_blocks';

    -- Insert focus blocks: M/W/F mornings for deep work
    INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
    VALUES
        (justin_user_id, 'focus_blocks', jsonb_build_object(
            'day', 'monday',
            'start_time', '09:00',
            'end_time', '11:00',
            'label', 'Deep Work Monday'
        )),
        (justin_user_id, 'focus_blocks', jsonb_build_object(
            'day', 'wednesday',
            'start_time', '09:00',
            'end_time', '11:00',
            'label', 'Deep Work Wednesday'
        )),
        (justin_user_id, 'focus_blocks', jsonb_build_object(
            'day', 'friday',
            'start_time', '09:00',
            'end_time', '11:00',
            'label', 'Deep Work Friday'
        ));

    RAISE NOTICE '✓ Created focus blocks (M/W/F 9-11am)';

    -- ========================================================================
    -- 3. CALENDAR PREFERENCES - Energy Mapping
    -- ========================================================================

    -- Delete existing energy mapping for justin
    DELETE FROM public.user_calendar_preferences
    WHERE user_id = justin_user_id AND preference_type = 'energy_mapping';

    -- Insert energy mapping (typical pattern: high morning, low after lunch, medium late afternoon)
    INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
    VALUES
        (justin_user_id, 'energy_mapping', jsonb_build_object(
            'time_of_day', '09:00-11:00',
            'energy_level', 'high',
            'best_for', array['deep_work', 'creative', 'strategic']
        )),
        (justin_user_id, 'energy_mapping', jsonb_build_object(
            'time_of_day', '11:00-12:00',
            'energy_level', 'medium',
            'best_for', array['meetings', 'admin']
        )),
        (justin_user_id, 'energy_mapping', jsonb_build_object(
            'time_of_day', '12:00-14:00',
            'energy_level', 'low',
            'best_for', array['admin', 'email']
        )),
        (justin_user_id, 'energy_mapping', jsonb_build_object(
            'time_of_day', '14:00-16:00',
            'energy_level', 'medium',
            'best_for', array['meetings', 'customer']
        )),
        (justin_user_id, 'energy_mapping', jsonb_build_object(
            'time_of_day', '16:00-17:00',
            'energy_level', 'low',
            'best_for', array['planning', 'admin']
        ));

    RAISE NOTICE '✓ Created energy mapping';

    -- ========================================================================
    -- 4. CALENDAR PREFERENCES - Buffer Time
    -- ========================================================================

    -- Delete existing buffer time for justin
    DELETE FROM public.user_calendar_preferences
    WHERE user_id = justin_user_id AND preference_type = 'buffer_time';

    -- Insert buffer time preferences
    INSERT INTO public.user_calendar_preferences (user_id, preference_type, preference_data)
    VALUES
        (justin_user_id, 'buffer_time', jsonb_build_object(
            'before_meetings', 5,
            'after_meetings', 10,
            'between_tasks', 15,
            'respect_lunch', true,
            'lunch_start', '12:00',
            'lunch_end', '13:00'
        ));

    RAISE NOTICE '✓ Created buffer time preferences';

    -- ========================================================================
    -- 5. USER WORK CONTEXT - Goals and Projects
    -- ========================================================================

    -- Delete existing work context for justin
    DELETE FROM public.user_work_context WHERE user_id = justin_user_id;

    -- Insert active projects
    INSERT INTO public.user_work_context (user_id, context_type, context_data)
    VALUES
        (justin_user_id, 'active_projects', jsonb_build_object(
            'name', 'Renubu Labs Weekly Planner',
            'status', 'in_progress',
            'priority', 'high',
            'deadline', (CURRENT_DATE + INTERVAL '30 days')::text
        )),
        (justin_user_id, 'active_projects', jsonb_build_object(
            'name', 'Q1 Customer Success Review',
            'status', 'in_progress',
            'priority', 'medium',
            'deadline', (CURRENT_DATE + INTERVAL '45 days')::text
        )),
        (justin_user_id, 'active_projects', jsonb_build_object(
            'name', 'Workflow Automation Improvements',
            'status', 'planning',
            'priority', 'low',
            'deadline', (CURRENT_DATE + INTERVAL '60 days')::text
        ));

    -- Insert quarterly goals
    INSERT INTO public.user_work_context (user_id, context_type, context_data)
    VALUES
        (justin_user_id, 'quarterly_goals', jsonb_build_object(
            'goal', 'Launch Weekly Planner MVP',
            'quarter', 'Q1 2025',
            'progress', 60,
            'key_results', array[
                'Complete Phase 1 implementation',
                'Test with 5 beta users',
                'Gather feedback and iterate'
            ]
        )),
        (justin_user_id, 'quarterly_goals', jsonb_build_object(
            'goal', 'Improve Customer Retention',
            'quarter', 'Q1 2025',
            'progress', 40,
            'key_results', array[
                'Reduce churn by 15%',
                'Increase NPS by 10 points',
                'Launch proactive check-in workflow'
            ]
        ));

    -- Insert annual goals
    INSERT INTO public.user_work_context (user_id, context_type, context_data)
    VALUES
        (justin_user_id, 'annual_goals', jsonb_build_object(
            'goal', 'Build Renubu into the #1 CS platform',
            'year', 2025,
            'focus_areas', array[
                'Product innovation',
                'Customer success',
                'Team growth'
            ]
        ));

    RAISE NOTICE '✓ Created work context (projects and goals)';

    -- ========================================================================
    -- 6. SAMPLE CUSTOMER DATA (for workload analysis)
    -- ========================================================================

    -- Create a test customer if one doesn't exist
    INSERT INTO public.customers (id, company_id, name, status, health_score, created_at)
    VALUES (
        gen_random_uuid(),
        test_company_id,
        'Acme Corp (Test Customer)',
        'active',
        85,
        NOW() - INTERVAL '90 days'
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO test_customer_id;

    IF test_customer_id IS NULL THEN
        -- Get existing customer
        SELECT id INTO test_customer_id
        FROM public.customers
        WHERE company_id = test_company_id
        LIMIT 1;
    END IF;

    IF test_customer_id IS NOT NULL THEN
        RAISE NOTICE '✓ Using test customer: %', test_customer_id;

        -- Set renewal date
        INSERT INTO public.customer_properties (customer_id, property_key, property_value)
        VALUES (test_customer_id, 'renewal_date', to_jsonb((CURRENT_DATE + INTERVAL '45 days')::text))
        ON CONFLICT (customer_id, property_key) DO UPDATE
        SET property_value = EXCLUDED.property_value;

        RAISE NOTICE '✓ Set renewal date for test customer';
    ELSE
        RAISE NOTICE '⚠ No test customer available for workflow data';
    END IF;

    -- ========================================================================
    -- SUMMARY
    -- ========================================================================

    RAISE NOTICE '====================================';
    RAISE NOTICE 'Justin test data setup complete!';
    RAISE NOTICE 'User: justin@renubu.com';
    RAISE NOTICE 'Work Hours: M-F 9am-5pm ET';
    RAISE NOTICE 'Focus Blocks: M/W/F 9-11am';
    RAISE NOTICE 'Energy: High mornings, low post-lunch';
    RAISE NOTICE 'Projects: 3 active';
    RAISE NOTICE 'Goals: 2 quarterly, 1 annual';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Now test at: http://localhost:3000/test/calendar';

END $$;
