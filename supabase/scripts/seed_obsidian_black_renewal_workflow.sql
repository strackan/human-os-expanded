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
  ARRAY[
    'greeting',
    'review-account',
    'pricing-analysis-v2',
    'prepare-quote-v2',
    'draft-email-v2',
    'workflow-summary-v2'
  ],
  -- slide_contexts: JSONB with per-slide configuration
  '{
    "greeting": {
      "purpose": "renewal_preparation",
      "urgency": "critical",
      "variables": {
        "showPlanningChecklist": true,
        "checklistItems": [
          "Review account health and contract details",
          "Analyze current pricing vs. market benchmarks",
          "Generate optimized renewal quote",
          "Draft personalized outreach email",
          "Create action plan and next steps"
        ],
        "checklistTitle": "Here''s what we''ll accomplish together:",
        "greetingText": "Good afternoon, Justin. You''ve got one critical task for today:\n\n**Renewal Planning for {{customer.name}}.**\n\nWe need to review contract terms, make sure we''ve got the right contacts, and put our initial forecast in.\n\nThe full plan is on the right. Ready to get started?",
        "buttons": [
          {
            "label": "Review Later",
            "value": "snooze",
            "label-background": "bg-gray-500 hover:bg-gray-600",
            "label-text": "text-white"
          },
          {
            "label": "Let''s Begin!",
            "value": "start",
            "label-background": "bg-blue-600 hover:bg-blue-700",
            "label-text": "text-white"
          }
        ]
      }
    },
    "review-account": {
      "purpose": "renewal",
      "variables": {
        "ask_for_assessment": false,
        "focus_metrics": ["arr", "price_per_seat", "renewal_date", "health_score", "utilization", "yoy_growth"],
        "insightText": "Please review {{customer.name}}''s current status to the right:\n\n**Key Insights:**\n• 20% usage increase over prior month\n• 4 months to renewal - time to engage\n• Paying less per unit than 65% of customers - Room for expansion\n• Recent negative comments in support - May need to investigate\n• Key contract items - 5% limit on price increases. Consider amendment.\n\nMake sure you''ve reviewed the contract and stakeholder. When you''re ready, click to move onto pricing.",
        "buttonLabel": "Analyze Pricing Strategy"
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
