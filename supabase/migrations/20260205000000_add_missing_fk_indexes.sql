-- ============================================================================
-- Add Missing Foreign Key Indexes
-- ============================================================================
-- Performance optimization: Add indexes on foreign key columns that are
-- frequently used in JOINs and WHERE clauses but are missing indexes.
-- ============================================================================

-- HIGH PRIORITY: Frequently joined tables

-- contracts.customer_id - Used in customer detail views, contract matrix
CREATE INDEX IF NOT EXISTS idx_contracts_customer_id
ON public.contracts(customer_id);

-- workflow_executions.workflow_config_id - Used in workflow lookups
CREATE INDEX IF NOT EXISTS idx_workflow_executions_config_id
ON public.workflow_executions(workflow_config_id);

-- workflow_step_executions.workflow_execution_id - Already has FK, ensure index
CREATE INDEX IF NOT EXISTS idx_workflow_step_executions_execution_id
ON public.workflow_step_executions(workflow_execution_id);

-- Composite index for workflow execution queries by customer and status
CREATE INDEX IF NOT EXISTS idx_workflow_executions_customer_status
ON public.workflow_executions(customer_id, status, last_activity_at DESC)
WHERE status IN ('not_started', 'in_progress', 'snoozed', 'pending_review');

-- MEDIUM PRIORITY: Less frequently used but still beneficial

-- renewals.contract_id - Used in renewal reports
CREATE INDEX IF NOT EXISTS idx_renewals_contract_id
ON public.renewals(contract_id);

-- workflow_executions.user_id - Used in "my workflows" queries
CREATE INDEX IF NOT EXISTS idx_workflow_executions_user_id
ON public.workflow_executions(user_id);

-- LOW PRIORITY: Occasional queries

-- renewals.assigned_to - Used in assignment queries
CREATE INDEX IF NOT EXISTS idx_renewals_assigned_to
ON public.renewals(assigned_to);

-- events.user_id - Used in activity feeds
CREATE INDEX IF NOT EXISTS idx_events_user_id
ON public.events(user_id);

-- alerts.user_id - Used in alert queries
CREATE INDEX IF NOT EXISTS idx_alerts_user_id
ON public.alerts(user_id);

-- ============================================================================
-- Scoring System Indexes (from Phase 1)
-- ============================================================================

-- customer_signals: Composite index for the exact query pattern in getLatestSignals()
CREATE INDEX IF NOT EXISTS idx_signals_customer_company_key_recent
ON public.customer_signals(customer_id, company_id, signal_key, recorded_at DESC);

-- customer_category_indices: For score lookups by customer
CREATE INDEX IF NOT EXISTS idx_category_indices_customer_recent
ON public.customer_category_indices(customer_id, calculated_at DESC);

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Missing foreign key indexes added:';
  RAISE NOTICE '- idx_contracts_customer_id';
  RAISE NOTICE '- idx_workflow_executions_config_id';
  RAISE NOTICE '- idx_workflow_step_executions_execution_id';
  RAISE NOTICE '- idx_workflow_executions_customer_status';
  RAISE NOTICE '- idx_renewals_contract_id';
  RAISE NOTICE '- idx_workflow_executions_user_id';
  RAISE NOTICE '- idx_signals_customer_company_key_recent';
  RAISE NOTICE '- idx_category_indices_customer_recent';
END $$;
