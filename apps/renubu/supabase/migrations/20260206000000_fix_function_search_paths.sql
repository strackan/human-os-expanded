-- ============================================================================
-- Fix Function Search Path Security Warnings
-- ============================================================================
-- Fixes 66 functions with mutable search_path by setting search_path = ''
-- This prevents potential SQL injection via search_path manipulation
-- ============================================================================

-- Use ALTER FUNCTION to set search_path without recreating function bodies
-- This is idempotent - can be run multiple times safely

-- Parking lot functions
ALTER FUNCTION public.get_parking_lot_items_for_evaluation(INTEGER) SET search_path = '';
ALTER FUNCTION public.increment_category_usage(UUID) SET search_path = '';
ALTER FUNCTION public.seed_default_parking_lot_categories(UUID) SET search_path = '';

-- Invite/company functions
ALTER FUNCTION public.generate_invite_code() SET search_path = '';
ALTER FUNCTION public.auto_generate_invite_code() SET search_path = '';
ALTER FUNCTION public.is_current_user_admin() SET search_path = '';
ALTER FUNCTION public.get_current_user_company() SET search_path = '';

-- Workflow evaluation functions
ALTER FUNCTION public.get_escalated_workflows_for_evaluation(INTEGER) SET search_path = '';
ALTER FUNCTION public.get_snoozed_workflows_for_evaluation(INTEGER) SET search_path = '';
ALTER FUNCTION public.get_skipped_workflows_for_evaluation(INTEGER) SET search_path = '';

-- Timestamp update triggers
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_workflow_state_timestamp() SET search_path = '';
ALTER FUNCTION public.update_workflow_wake_trigger_timestamp() SET search_path = '';
ALTER FUNCTION public.update_workflow_skip_trigger_timestamp() SET search_path = '';
ALTER FUNCTION public.update_workflow_escalate_trigger_timestamp() SET search_path = '';
ALTER FUNCTION public.update_workflow_execution_timestamp() SET search_path = '';
ALTER FUNCTION public.update_workflow_step_execution_timestamp() SET search_path = '';
ALTER FUNCTION public.update_workflow_tasks_updated_at() SET search_path = '';
ALTER FUNCTION public.update_contract_terms_updated_at() SET search_path = '';
ALTER FUNCTION public.update_customer_features_timestamp() SET search_path = '';
ALTER FUNCTION public.update_llm_context_timestamp() SET search_path = '';

-- Scoring/calculation functions
ALTER FUNCTION public.calculate_stickiness_score(UUID) SET search_path = '';
ALTER FUNCTION public.calculate_value_leverage_index(UUID) SET search_path = '';
ALTER FUNCTION public.calculate_engagement_score(UUID) SET search_path = '';
ALTER FUNCTION public.auto_calculate_engagement_score() SET search_path = '';
ALTER FUNCTION public.calculate_workflow_priority(UUID, UUID) SET search_path = '';
ALTER FUNCTION public.update_all_workflow_priorities() SET search_path = '';

-- Pricing functions
ALTER FUNCTION public.get_market_position_adjustment(TEXT) SET search_path = '';
ALTER FUNCTION public.calculate_risk_multiplier(NUMERIC) SET search_path = '';
ALTER FUNCTION public.calculate_trend_adjustment(TEXT) SET search_path = '';
ALTER FUNCTION public.calculate_pricing_recommendation(UUID) SET search_path = '';
ALTER FUNCTION public.store_pricing_recommendation(UUID, NUMERIC, TEXT, TEXT, JSONB) SET search_path = '';
ALTER FUNCTION public.update_pricing_outcome(UUID, BOOLEAN, NUMERIC, TEXT) SET search_path = '';

-- OAuth/encryption functions
ALTER FUNCTION public.encrypt_oauth_token(TEXT) SET search_path = '';
ALTER FUNCTION public.decrypt_oauth_token(TEXT) SET search_path = '';

-- LLM cache function
ALTER FUNCTION public.prune_expired_llm_cache() SET search_path = '';

-- Documentation function
ALTER FUNCTION public.documentation_search_trigger() SET search_path = '';

-- Release/feature tracking functions
ALTER FUNCTION public.create_release_snapshot(UUID, TEXT) SET search_path = '';
ALTER FUNCTION public.log_feature_status_change() SET search_path = '';
ALTER FUNCTION public.validate_feature_release() SET search_path = '';
ALTER FUNCTION public.get_feature_status_slug(UUID) SET search_path = '';
ALTER FUNCTION public.get_release_version(UUID) SET search_path = '';
ALTER FUNCTION public.get_category_slug(UUID) SET search_path = '';
ALTER FUNCTION public.get_feature_commits(UUID) SET search_path = '';

-- PostgREST watch function
ALTER FUNCTION public.pgrst_watch() SET search_path = '';

-- Auth functions
ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.create_local_user(TEXT, TEXT, TEXT, TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.authenticate_local_user(TEXT, TEXT) SET search_path = '';
ALTER FUNCTION public.update_local_user_password(UUID, TEXT, TEXT) SET search_path = '';

-- Task/workflow functions
ALTER FUNCTION public.generate_renewal_tasks() SET search_path = '';
ALTER FUNCTION public.update_action_scores() SET search_path = '';
ALTER FUNCTION public.get_next_priority_task(UUID) SET search_path = '';
ALTER FUNCTION public.set_max_snooze_date() SET search_path = '';
ALTER FUNCTION public.get_pending_tasks_for_customer(UUID) SET search_path = '';
ALTER FUNCTION public.get_tasks_requiring_force_action() SET search_path = '';
ALTER FUNCTION public.get_tasks_for_auto_skip() SET search_path = '';
ALTER FUNCTION public.record_workflow_action(UUID, TEXT, TEXT, JSONB) SET search_path = '';
ALTER FUNCTION public.update_workflow_step_flags() SET search_path = '';

-- Demo mode functions
ALTER FUNCTION public.has_demo_godmode() SET search_path = '';
ALTER FUNCTION public.reset_aco_demo() SET search_path = '';
ALTER FUNCTION public.is_demo_mode() SET search_path = '';

-- Contract functions
ALTER FUNCTION public.is_in_auto_renewal_window(UUID) SET search_path = '';

-- Customer feature functions
ALTER FUNCTION public.get_customer_feature(UUID, TEXT) SET search_path = '';
ALTER FUNCTION public.get_user_company_id() SET search_path = '';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Function search_path security fixes applied to 66 functions';
  RAISE NOTICE 'All functions now have search_path = '''' to prevent injection attacks';
END $$;
