-- Seed Obsidian Black Renewal Workflow Definition
-- This inserts the workflow definition into the workflow_definitions table
-- so it can be loaded via composeFromDatabase()

INSERT INTO public.workflow_definitions (
  workflow_id,
  name,
  workflow_type,
  description,
  slide_sequence,
  slide_contexts,
  settings,
  module_id,
  is_active,
  is_demo,
  priority_weight,
  created_at,
  updated_at
) VALUES (
  'obsidian-black-renewal',
  'Obsidian Black Renewal',
  'renewal',
  'Renewal workflow using V2 template-based architecture',
  -- slide_sequence: array of slide IDs
  -- Phase 1: 90-day renewal preparation workflow
  ARRAY[
    'greeting',                    -- 1. Confirm Plan - Planning Checklist
    'review-brand-performance',    -- 2. Performance Review - Usage Metrics
    'review-contract-terms',       -- 3. Contract + Contact Review
    'identify-opportunities',      -- 4. Expansion Analysis
    'align-strategy',              -- 5. Align on Strategy (interactive)
    'prepare-meeting-deck',        -- 6. Prepare Meeting Deck (autonomous)
    'schedule-call',               -- 7. Schedule Meeting
    'workflow-summary-v2'          -- 8. Summary
  ],
  -- slide_contexts: JSONB with per-slide configuration
  '{
    "greeting": {
      "purpose": "renewal_preparation",
      "urgency": "medium",
      "variables": {
        "showPlanningChecklist": true,
        "checklistItems": [
          "Review brand performance metrics and trends",
          "Review contract terms and key contacts",
          "Identify expansion and upsell opportunities",
          "Align on 90-day engagement strategy",
          "Prepare meeting deck for customer",
          "Schedule renewal kick-off meeting"
        ],
        "checklistTitle": "Here''s what we''ll accomplish together:",
        "enableLLMGreeting": true,
        "buttons": [
          {
            "label": "Snooze",
            "value": "snooze",
            "label-background": "bg-gray-500 hover:bg-gray-600",
            "label-text": "text-white"
          },
          {
            "label": "Let''s Begin",
            "value": "start",
            "label-background": "bg-blue-600 hover:bg-blue-700",
            "label-text": "text-white"
          }
        ]
      }
    },
    "review-brand-performance": {
      "purpose": "renewal",
      "variables": {
        "enableLLMGreeting": true
      }
    },
    "review-contract-terms": {
      "purpose": "renewal",
      "variables": {}
    },
    "identify-opportunities": {
      "purpose": "renewal",
      "variables": {}
    },
    "align-strategy": {
      "purpose": "renewal",
      "variables": {
        "strategyOptions": ["Standard Renewal", "Expansion Play", "At-Risk Recovery", "Multi-Year Deal"]
      }
    },
    "prepare-meeting-deck": {
      "purpose": "renewal",
      "variables": {
        "autonomous": true
      }
    },
    "schedule-call": {
      "purpose": "renewal",
      "variables": {
        "meetingType": "renewal_kickoff",
        "suggestedDuration": 30
      }
    }
  }'::jsonb,
  -- settings: JSONB with workflow settings
  '{
    "layout": {
      "modalDimensions": {
        "width": 90,
        "height": 90,
        "top": 5,
        "left": 5
      },
      "dividerPosition": 50,
      "chatWidth": 50,
      "splitModeDefault": true
    },
    "chat": {
      "placeholder": "Ask me anything about this pricing opportunity...",
      "aiGreeting": "Good morning! Your ONE critical task today: Optimize pricing for {{customer.name}}''s upcoming renewal. They''re significantly underpriced and now is the perfect time to act."
    }
  }'::jsonb,
  'customer-success',
  true,
  true,
  500,
  NOW(),
  NOW()
)
ON CONFLICT (workflow_id) DO UPDATE SET
  name = EXCLUDED.name,
  workflow_type = EXCLUDED.workflow_type,
  description = EXCLUDED.description,
  slide_sequence = EXCLUDED.slide_sequence,
  slide_contexts = EXCLUDED.slide_contexts,
  settings = EXCLUDED.settings,
  module_id = EXCLUDED.module_id,
  is_active = EXCLUDED.is_active,
  is_demo = EXCLUDED.is_demo,
  priority_weight = EXCLUDED.priority_weight,
  updated_at = NOW();

-- Verify the workflow was inserted
SELECT
  workflow_id,
  name,
  workflow_type,
  array_length(slide_sequence, 1) as slide_count,
  is_demo,
  is_active
FROM public.workflow_definitions
WHERE workflow_id = 'obsidian-black-renewal';
