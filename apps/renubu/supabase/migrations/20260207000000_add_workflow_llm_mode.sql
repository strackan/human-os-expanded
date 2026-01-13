-- Migration: Add use_llm_mode column to workflow_definitions
-- Purpose: Per-workflow control of LLM orchestration mode
-- Default: true (LLM mode enabled by default)
-- Revert: Set use_llm_mode = false for specific workflow_id to use V1 (standard) mode

-- Add the column
ALTER TABLE workflow_definitions
ADD COLUMN IF NOT EXISTS use_llm_mode BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN workflow_definitions.use_llm_mode IS
'When true, workflow uses LLM orchestration (V2). When false, uses standard slide progression (V1). Default: true';

-- Update existing workflows to have explicit value
UPDATE workflow_definitions
SET use_llm_mode = true
WHERE use_llm_mode IS NULL;
