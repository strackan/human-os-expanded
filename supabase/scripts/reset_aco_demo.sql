-- ============================================================================
-- ACO Demo Reset Script
-- Purpose: Reset all ACO demo data by calling the reset function
-- Usage: psql -f reset_aco_demo.sql OR call via API endpoint
-- Safety: Only deletes records where is_demo = true
-- ============================================================================

-- Call the reset function
SELECT * FROM public.reset_aco_demo();

-- Display results
\echo 'Demo reset complete. Check output above for deletion counts.'
