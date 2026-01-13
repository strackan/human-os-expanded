-- ============================================================================
-- Add module_id and settings columns to workflow_definitions
-- ============================================================================
-- Purpose: Enable workflow organization and layout customization
-- Date: 2025-11-28
-- ============================================================================

-- Add module_id for organizing workflows by module
ALTER TABLE public.workflow_definitions
  ADD COLUMN IF NOT EXISTS module_id VARCHAR(100);

COMMENT ON COLUMN public.workflow_definitions.module_id IS
  'Module this workflow belongs to: customer-success, sales, onboarding, etc.';

-- Add settings for layout and chat configuration
ALTER TABLE public.workflow_definitions
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.workflow_definitions.settings IS
  'Workflow settings including layout (modalDimensions, dividerPosition) and chat (placeholder, aiGreeting)';

-- Create index for module_id lookups
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_module
  ON public.workflow_definitions(module_id);

-- Verification
SELECT 'Added module_id and settings columns to workflow_definitions' as status;
