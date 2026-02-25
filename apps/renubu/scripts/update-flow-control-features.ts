import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateFeatures() {
  console.log('🔄 Updating Flow Control feature entries with corrected architecture...\n');

  // ========================================================================
  // 1.1 - SKIP ENHANCED
  // ========================================================================

  const skipTriggerConventionsUpdate = {
    technical_approach: `
- Extend workflow_executions with skip_triggers JSONB array
- Each trigger: { id, type: 'date' | 'event', config, createdAt }
- Add skip_trigger_logic field: 'OR' | 'AND'
- Reuse condition evaluation service from Snooze (Phase 1.0)
- Create skip_triggers history table for evaluation tracking
- Daily cron evaluates skip conditions alongside snooze conditions
- UI: EnhancedSkipModal with TriggerBuilder (reuses Phase 1.0 components)
    `.trim(),
  };

  const skipPatternsUpdate = {
    technical_approach: `
- Track skip_reason, skip_triggers structure in workflow_executions
- Create skip_analytics view with aggregations (trigger types, logic, duration)
- Dashboard widget: Skip patterns by workflow type, day of week, trigger distribution
- ML-ready: Export skip data for future pattern detection
    `.trim(),
  };

  const bulkSkipUpdate = {
    technical_approach: `
- Multi-select on workflow list
- Bulk skip action with shared trigger configuration
- API: POST /api/workflows/bulk-skip with workflow_ids array + triggers array
- All workflows receive same skip_triggers and skip_trigger_logic
    `.trim(),
  };

  // ========================================================================
  // 1.2 - ESCALATE ENHANCED
  // ========================================================================

  const escalateTriggerConventionsUpdate = {
    technical_approach: `
- Extend workflow_executions with escalate_triggers JSONB array
- Each trigger: { id, type: 'date' | 'event', config, createdAt }
- Add escalate_trigger_logic field: 'OR' | 'AND'
- Add escalate_to_user_id field (who receives escalation)
- Create escalate_triggers history table for evaluation tracking
- Daily cron evaluates escalation conditions, notifies escalated user when fired
- UI: EnhancedEscalateModal with TriggerBuilder
    `.trim(),
  };

  const escalationRoutingUpdate = {
    technical_approach: `
- Create escalation_rules table with conditions and target users/teams
- Rule engine: Evaluate rules on escalation trigger using workflow properties
- UI: Admin settings for escalation rules (condition builder + user selector)
- Example rule: IF arr > 100000 THEN escalate_to_user_id = "VP of CS"
- Rules applied automatically before manual escalation UI
    `.trim(),
  };

  const escalationAnalyticsUpdate = {
    technical_approach: `
- Track escalation_reason, escalate_triggers, escalate_to_user_id
- Create escalation_analytics view with aggregations
- Dashboard: Escalation frequency by user, workflow type, recipient, trigger patterns
- Team-level analytics for managers
    `.trim(),
  };

  // Update features
  const updates = [
    { slug: 'skip-trigger-conventions', update: skipTriggerConventionsUpdate },
    { slug: 'skip-patterns-analytics', update: skipPatternsUpdate },
    { slug: 'bulk-skip-operations', update: bulkSkipUpdate },
    { slug: 'escalate-trigger-conventions', update: escalateTriggerConventionsUpdate },
    { slug: 'escalation-routing-rules', update: escalationRoutingUpdate },
    { slug: 'escalation-analytics', update: escalationAnalyticsUpdate },
  ];

  console.log(`📝 Updating ${updates.length} features...\n`);

  for (const { slug, update } of updates) {
    const { data, error } = await supabase
      .from('features')
      .update(update)
      .eq('slug', slug)
      .select();

    if (error) {
      console.error(`❌ Error updating ${slug}:`, error);
      continue;
    }

    console.log(`✅ Updated: ${slug}`);
  }

  console.log('\n✅ All features updated successfully!');
  console.log('\nUpdated technical_approach fields to reference:');
  console.log('  - JSONB trigger arrays (skip_triggers, escalate_triggers)');
  console.log('  - Trigger logic fields (skip_trigger_logic, escalate_trigger_logic)');
  console.log('  - Phase 1.0 architecture patterns');
}

updateFeatures().catch(console.error);
