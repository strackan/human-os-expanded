-- Fix function conflict by dropping the old version and keeping only the new one
-- Drop the old function without parameters
DROP FUNCTION IF EXISTS public.get_next_priority_task();

-- Keep only the new function with override_date parameter
-- The function should already exist from the previous migration 