import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addReleases() {
  console.log('🚀 Adding Flow Control releases (1.1, 1.2, 1.3, 1.4)...\n');

  // Status and category IDs from database
  const PLANNING_STATUS = '551e9aaa-b207-4b71-9dd6-c2d7b891cd32';
  const WORKFLOW_CATEGORY = 'cbb8eee3-d6fe-4ced-bc5f-93546d7fc469';
  const AI_CATEGORY = 'c20fe637-96f4-4888-8a9e-fa175e0a18ea';
  const PLANNED_FEATURE_STATUS = 'f0d85453-6f39-4c26-a946-6bca7e8bfad3';

  // ========================================================================
  // RELEASES
  // ========================================================================

  const releases = [
    {
      version: '1.1',
      name: 'Skip Enhanced',
      status_id: PLANNING_STATUS,
      phase_number: 11,
      planned_start: '2025-12-23',
      planned_end: '2026-01-03',
      description: 'Not now, but don\'t forget. Skip with all 4 trigger conventions (DATE, EVENT, EVENT and DATE, EVENT or DATE), patterns, analytics, bulk operations.',
    },
    {
      version: '1.2',
      name: 'Escalate Enhanced',
      status_id: PLANNING_STATUS,
      phase_number: 12,
      planned_start: '2026-01-06',
      planned_end: '2026-01-17',
      description: 'Get help when you need it. Escalate with all 4 trigger conventions, routing rules, analytics. Milestone: Flow Control Complete.',
    },
    {
      version: '1.3',
      name: 'String-Tie',
      status_id: PLANNING_STATUS,
      phase_number: 13,
      planned_start: '2026-01-20',
      planned_end: '2026-01-31',
      description: 'Just tell it what you need. LLM-powered quick actions for Snooze, Skip, and Escalate. Natural language for all 4 trigger conventions.',
    },
    {
      version: '1.4',
      name: '[Open - TBD]',
      status_id: PLANNING_STATUS,
      phase_number: 14,
      planned_start: '2026-02-03',
      planned_end: '2026-02-14',
      description: 'Reserved for refinements, urgent customer needs, or features that emerge during 1.0-1.3 development.',
    },
  ];

  console.log('📝 Upserting releases (insert or update)...');
  const insertedReleases: any[] = [];

  for (const release of releases) {
    // Check if release exists
    const { data: existing } = await supabase
      .from('releases')
      .select('id')
      .eq('version', release.version)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('releases')
        .update(release)
        .eq('version', release.version)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error updating ${release.version}:`, error);
        continue;
      }
      insertedReleases.push(data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('releases')
        .insert(release)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting ${release.version}:`, error);
        continue;
      }
      insertedReleases.push(data);
    }
  }

  console.log('✅ Releases ready:\n');
  insertedReleases.forEach(r => console.log(`   ${r.version} - ${r.name}`));

  // ========================================================================
  // FEATURES
  // ========================================================================

  const releaseMap = new Map(insertedReleases.map(r => [r.version, r.id]));

  const features = [
    // ====================================================================
    // 1.1 - SKIP ENHANCED
    // ====================================================================
    {
      slug: 'skip-trigger-conventions',
      title: 'Skip - All Trigger Conventions',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.1'),
      priority: 1,
      effort_hrs: 18,
      business_case: 'Complete parity with Snooze. Users can skip with DATE only, EVENT only, EVENT and DATE (both required), or EVENT or DATE (whichever first). Enables sophisticated skip-and-revisit workflows.',
      technical_approach: `
- Extend skip API to accept trigger_type: 'date' | 'event' | 'and' | 'or'
- Reuse condition evaluation service from Snooze (Phase 1.0)
- Add skip_conditions JSONB field to workflow_executions
- Daily cron evaluates skip conditions alongside snooze conditions
- UI: Skip modal with condition builder (reuse from Snooze)
      `.trim(),
      success_criteria: [
        'Can skip with DATE only: "Re-evaluate on Nov 15th"',
        'Can skip with EVENT only: "Re-evaluate when ARR > $50k"',
        'Can skip with EVENT and DATE: "Re-evaluate on Nov 15th AND if ARR > $50k"',
        'Can skip with EVENT or DATE: "Re-evaluate on Nov 15th OR when ARR > $50k"',
        'Skipped workflows wake correctly based on conditions',
        '90%+ accuracy in condition detection',
      ],
    },
    {
      slug: 'skip-patterns-analytics',
      title: 'Skip Patterns & Analytics',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.1'),
      priority: 2,
      effort_hrs: 8,
      business_case: 'Help users understand what they skip and why. Identify patterns like "always skips pricing workflows on Fridays" to improve workflow design or scheduling.',
      technical_approach: `
- Track skip_reason in workflow_executions
- Create skip_analytics view with aggregations
- Dashboard widget: Skip patterns by workflow type, day of week, time of day
- ML-ready: Export skip data for future pattern detection
      `.trim(),
      success_criteria: [
        'Dashboard shows skip frequency by workflow type',
        'Can filter: "What did I skip last week?"',
        'Exportable skip history (CSV)',
      ],
    },
    {
      slug: 'bulk-skip-operations',
      title: 'Bulk Skip Operations',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.1'),
      priority: 3,
      effort_hrs: 4,
      business_case: 'When a user goes on vacation or has a big deadline, they should be able to bulk-skip workflows efficiently.',
      technical_approach: `
- Multi-select on workflow list
- Bulk skip action with shared condition/reason
- API: POST /api/workflows/bulk-skip with workflow_ids array
      `.trim(),
      success_criteria: [
        'Can select 10+ workflows and skip all at once',
        'Shared skip condition applies to all',
        'Undo within 5 seconds (toast with undo button)',
      ],
    },

    // ====================================================================
    // 1.2 - ESCALATE ENHANCED
    // ====================================================================
    {
      slug: 'escalate-trigger-conventions',
      title: 'Escalate - All Trigger Conventions',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.2'),
      priority: 1,
      effort_hrs: 18,
      business_case: 'Complete parity with Snooze. Users can escalate immediately or conditionally based on date, event, or combination. Enables automated escalation workflows.',
      technical_approach: `
- Extend escalate API to accept trigger_type: 'date' | 'event' | 'and' | 'or'
- Add escalate_conditions JSONB field to workflow_executions
- Daily cron evaluates escalation conditions
- Auto-notify escalated user when conditions met
- UI: Escalate modal with condition builder
      `.trim(),
      success_criteria: [
        'Can escalate with DATE only: "Escalate on Nov 15th if not resolved"',
        'Can escalate with EVENT only: "Escalate when ARR > $50k"',
        'Can escalate with EVENT and DATE: "Escalate on Nov 15th AND if ARR > $50k"',
        'Can escalate with EVENT or DATE: "Escalate on Nov 15th OR when ARR > $50k"',
        'Escalated user receives notification when conditions trigger',
        '90%+ accuracy in condition detection',
      ],
    },
    {
      slug: 'escalation-routing-rules',
      title: 'Escalation Routing Rules',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.2'),
      priority: 2,
      effort_hrs: 8,
      business_case: 'Automatic routing: "Escalate high-value renewals to VP" or "Escalate technical issues to Solutions team". Reduces manual escalation decisions.',
      technical_approach: `
- Create escalation_rules table with conditions and target users/teams
- Rule engine: Evaluate rules on escalation trigger
- UI: Admin settings for escalation rules
- Example rule: IF arr > 100000 THEN escalate_to = "VP of CS"
      `.trim(),
      success_criteria: [
        'Admin can create escalation rules',
        'Rules apply automatically based on workflow properties',
        'Can override automatic escalation manually',
      ],
    },
    {
      slug: 'escalation-analytics',
      title: 'Escalation Analytics',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.2'),
      priority: 3,
      effort_hrs: 4,
      business_case: 'Help managers understand escalation patterns. Identify if certain CSMs escalate too often or if certain workflow types always need escalation.',
      technical_approach: `
- Track escalation_reason in workflow_executions
- Create escalation_analytics view
- Dashboard: Escalation frequency by user, workflow type, reason
      `.trim(),
      success_criteria: [
        'Dashboard shows escalation frequency',
        'Can filter by date range, user, workflow type',
        'Exportable escalation history (CSV)',
      ],
    },

    // ====================================================================
    // 1.3 - STRING-TIE
    // ====================================================================
    {
      slug: 'string-tie-llm-inference',
      title: 'String-Tie LLM Inference Service',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: AI_CATEGORY,
      release_id: releaseMap.get('1.3'),
      priority: 1,
      effort_hrs: 16,
      business_case: 'Core intelligence: Parse natural language like "remind me next Tuesday" or "escalate if they don\'t respond" into structured triggers. Makes flow control effortless.',
      technical_approach: `
- Create stringTieService with LLM integration
- System prompt: Infer action (snooze/skip/escalate), timing, conditions
- Input: Natural language + workflow context
- Output: Structured trigger (type, date, event, reasoning)
- Fallback: If LLM fails, default to sensible timing
- Examples in prompt to guide LLM behavior
      `.trim(),
      success_criteria: [
        '"remind me next Tuesday" → Snooze DATE only (next Tuesday 9am)',
        '"ping me when this heats up" → Snooze EVENT only (health_score > 60)',
        '"check back Friday if they haven\'t responded" → Snooze EVENT and DATE',
        '"follow up next week or when they reply" → Snooze EVENT or DATE',
        '"get my boss involved if this drags on" → Escalate EVENT only',
        '80%+ user satisfaction with inferred timing',
        '<5 second inference time',
      ],
    },
    {
      slug: 'string-tie-quick-actions',
      title: 'String-Tie Quick Action UI',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: WORKFLOW_CATEGORY,
      release_id: releaseMap.get('1.3'),
      priority: 2,
      effort_hrs: 12,
      business_case: 'Make it stupid simple. One button ("Tie a String"), one input field, no decisions. System handles the rest.',
      technical_approach: `
- Add "Tie a String" button to task/workflow views
- Modal: Single text input + action inference
- Display inferred action: "I'll snooze this until Tuesday at 2pm"
- User can accept or manually adjust
- Toast confirmation: "Got it, string tied for you"
      `.trim(),
      success_criteria: [
        'Can create reminder in <5 seconds',
        'Modal shows inferred action clearly',
        'User can accept with one click',
        'Can manually edit if needed',
        'Works for Snooze, Skip, and Escalate',
      ],
    },
    {
      slug: 'string-tie-analytics',
      title: 'String-Tie Usage Analytics',
      status_id: PLANNED_FEATURE_STATUS,
      category_id: AI_CATEGORY,
      release_id: releaseMap.get('1.3'),
      priority: 3,
      effort_hrs: 7,
      business_case: 'Track LLM inference quality. Identify patterns where LLM misunderstands intent. Feed learnings back into prompt refinement.',
      technical_approach: `
- Track: original_input, inferred_action, user_accepted (bool)
- If user manually edits: Track corrections
- Dashboard: String-tie usage, acceptance rate, common corrections
- Export data for LLM prompt improvement
      `.trim(),
      success_criteria: [
        'Tracks every string-tie action',
        'Dashboard shows acceptance rate over time',
        'Can see common correction patterns',
        'Exportable for analysis',
      ],
    },
  ];

  console.log('\n📝 Upserting features (insert or update)...');
  const insertedFeatures: any[] = [];

  for (const feature of features) {
    // Check if feature exists
    const { data: existing } = await supabase
      .from('features')
      .select('id')
      .eq('slug', feature.slug)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('features')
        .update(feature)
        .eq('slug', feature.slug)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error updating ${feature.slug}:`, error);
        continue;
      }
      insertedFeatures.push(data);
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('features')
        .insert(feature)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting ${feature.slug}:`, error);
        continue;
      }
      insertedFeatures.push(data);
    }
  }

  console.log('✅ Features ready:\n');

  // Group by release
  const featuresByRelease = insertedFeatures.reduce((acc, f) => {
    const release = insertedReleases.find(r => r.id === f.release_id);
    const version = release?.version || 'Unknown';
    if (!acc[version]) acc[version] = [];
    acc[version].push(f);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(featuresByRelease).forEach(([version, feats]) => {
    const release = insertedReleases.find(r => r.version === version);
    const featsList = feats as any[];
    const totalEffort = featsList.reduce((sum: number, f: any) => sum + (f.effort_hrs || 0), 0);
    console.log(`\n   ${version} - ${release?.name} (${totalEffort}h total):`);
    featsList.forEach((f: any) => console.log(`      - ${f.title} (${f.effort_hrs}h)`));
  });

  console.log('\n\n✅ All done! Flow Control releases ready.');
  console.log('\n📊 Summary:');
  console.log(`   - 4 releases ready (1.1, 1.2, 1.3, 1.4)`);
  console.log(`   - ${insertedFeatures.length} features ready`);
  console.log(`   - Total effort: ${insertedFeatures.reduce((sum, f) => sum + (f.effort_hrs || 0), 0)}h`);
}

addReleases().catch(console.error);
