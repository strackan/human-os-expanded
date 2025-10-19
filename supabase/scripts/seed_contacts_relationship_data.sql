-- ============================================================================
-- Seed Contacts Relationship Data
-- Purpose: Add relationship metadata for Obsidian Black contacts (Marcus & Elena)
-- Phase: 2B.1 (Data Extraction)
-- ============================================================================

DO $$
DECLARE
  v_aco_customer_id UUID := '550e8400-e29b-41d4-a716-446655440001';
BEGIN

-- Update Marcus Castellan with relationship metadata
UPDATE public.contacts
SET
  relationship_strength = 'weak',
  communication_style = 'Direct, results-focused, low patience for excuses. Prefers data-driven discussions and concrete action plans.',
  key_concerns = '[
    "Recent service disruptions have impacted critical operations",
    "Team credibility is at risk after missed commitments",
    "Needs proof that things will actually improve",
    "Timeline pressure - cannot afford more delays"
  ]'::jsonb,
  leverage_points = '[
    "Strong historical relationship before recent issues",
    "Platform is deeply embedded in their operations",
    "Previous quarters showed excellent collaboration",
    "Switching costs would be significant"
  ]'::jsonb,
  recent_interactions = 'Sent escalation email titled "Year Two is your proving ground" expressing frustration with service reliability and demanding accountability call.',
  relationship_notes = 'COO level contact. Currently frustrated but historically strong relationship. Key decision maker for renewal.',
  updated_at = NOW()
WHERE customer_id = v_aco_customer_id
  AND first_name = 'Marcus'
  AND last_name = 'Castellan';

RAISE NOTICE 'Marcus Castellan relationship data updated';

-- Update Elena Voss with relationship metadata
UPDATE public.contacts
SET
  relationship_strength = 'moderate',
  communication_style = 'Collaborative, detail-oriented, appreciates transparency. Open to problem-solving but needs to see commitment.',
  key_concerns = '[
    "Her team bore the brunt of recent service issues",
    "Needs operational stability to meet departmental goals",
    "Worried about ongoing support responsiveness",
    "Budget scrutiny after paying premium pricing"
  ]'::jsonb,
  leverage_points = '[
    "Still advocates for the platform within the organization",
    "Understands technical complexity and acknowledges past wins",
    "Open to co-creating solutions",
    "Values the relationship and wants it to work"
  ]'::jsonb,
  recent_interactions = 'Has been responsive but cautious in recent check-ins. Mentioned team frustrations but expressed willingness to work through issues if we show real commitment.',
  relationship_notes = 'VP Technical Operations. Still supportive but concerned. Critical for technical credibility and user adoption.',
  updated_at = NOW()
WHERE customer_id = v_aco_customer_id
  AND first_name = 'Elena'
  AND last_name = 'Voss';

RAISE NOTICE 'Elena Voss relationship data updated';

END $$;

-- Verification query
SELECT
  first_name || ' ' || last_name as name,
  title,
  relationship_strength,
  jsonb_array_length(key_concerns) as concerns_count,
  jsonb_array_length(leverage_points) as leverage_points_count,
  CASE WHEN recent_interactions IS NOT NULL THEN 'Yes' ELSE 'No' END as has_interactions
FROM public.contacts
WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY is_primary DESC;

RAISE NOTICE '✅ Obsidian Black contacts relationship data seeded';
