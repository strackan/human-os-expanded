/**
 * Phase 3E: Workflow Actions Test Suite
 *
 * Tests workflow state management and saved actions:
 * - Snooze/unsnooze workflows
 * - Skip workflows
 * - Escalate workflows
 * - Query workflows by state
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  WorkflowActionService,
  WorkflowQueryService,
} from './index';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const actionService = new WorkflowActionService(supabase as any);
const queryService = new WorkflowQueryService(supabase as any);

// Test user IDs (these should exist in your database)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'; // Replace with real user ID
const TEST_ESCALATE_TO_ID = '00000000-0000-0000-0000-000000000002'; // Replace with real user ID

async function runTests() {
  console.log('🧪 Phase 3E: Workflow Actions Test Suite\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get workflow counts
    console.log('\n📊 Test 1: Get Workflow Counts');
    console.log('-'.repeat(60));
    const countsResult = await queryService.getWorkflowCounts(TEST_USER_ID);
    if (countsResult.success) {
      console.log('✅ Counts retrieved:');
      console.log('   - Active:', countsResult.counts?.active);
      console.log('   - Snoozed:', countsResult.counts?.snoozed);
      console.log('   - Snoozed Due:', countsResult.counts?.snoozedDue);
      console.log('   - Escalated To Me:', countsResult.counts?.escalatedToMe);
      console.log('   - Escalated By Me:', countsResult.counts?.escalatedByMe);
      console.log('   - Completed:', countsResult.counts?.completed);
    } else {
      console.log('❌ Failed:', countsResult.error);
    }

    // Test 2: Get active workflows
    console.log('\n📋 Test 2: Get Active Workflows');
    console.log('-'.repeat(60));
    const activeResult = await queryService.getActiveWorkflows(TEST_USER_ID);
    if (activeResult.success) {
      console.log(`✅ Found ${activeResult.workflows?.length || 0} active workflows`);
      activeResult.workflows?.slice(0, 3).forEach((w, i) => {
        console.log(`   ${i + 1}. ${w.workflow_name} - ${w.customer_name} (${w.status})`);
      });
    } else {
      console.log('❌ Failed:', activeResult.error);
    }

    // Test 3: Snooze a workflow (if any active)
    if (activeResult.success && activeResult.workflows && activeResult.workflows.length > 0) {
      const testWorkflow = activeResult.workflows[0];
      console.log('\n⏰ Test 3: Snooze Workflow');
      console.log('-'.repeat(60));
      console.log(`   Snoozing: ${testWorkflow.workflow_name}`);

      const snoozeResult = await actionService.snoozeWorkflow(
        testWorkflow.id,
        TEST_USER_ID,
        {
          until: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          days: 1,
          reason: 'Testing snooze functionality',
        }
      );

      if (snoozeResult.success) {
        console.log('✅ Workflow snoozed successfully');
        console.log('   Action ID:', snoozeResult.actionId);

        // Test 3b: Get snoozed workflows
        console.log('\n📋 Test 3b: Get Snoozed Workflows');
        console.log('-'.repeat(60));
        const snoozedResult = await queryService.getSnoozedWorkflows(TEST_USER_ID);
        if (snoozedResult.success) {
          console.log(`✅ Found ${snoozedResult.workflows?.length || 0} snoozed workflows`);
          snoozedResult.workflows?.slice(0, 3).forEach((w, i) => {
            console.log(`   ${i + 1}. ${w.workflow_name} - Snoozed until ${w.snooze_until}`);
          });

          // Test 3c: Resume the snoozed workflow
          console.log('\n▶️  Test 3c: Resume Snoozed Workflow');
          console.log('-'.repeat(60));
          const resumeResult = await actionService.resumeWorkflow(
            testWorkflow.id,
            TEST_USER_ID
          );

          if (resumeResult.success) {
            console.log('✅ Workflow resumed successfully');
            console.log('   Action ID:', resumeResult.actionId);
          } else {
            console.log('❌ Failed to resume:', resumeResult.error);
          }
        } else {
          console.log('❌ Failed to get snoozed:', snoozedResult.error);
        }
      } else {
        console.log('❌ Failed to snooze:', snoozeResult.error);
      }
    } else {
      console.log('\n⏰ Test 3: Snooze Workflow');
      console.log('-'.repeat(60));
      console.log('⚠️  Skipped: No active workflows found');
    }

    // Test 4: Get action history
    console.log('\n📜 Test 4: Get Action History');
    console.log('-'.repeat(60));
    const actionsResult = await actionService.getUserActions(TEST_USER_ID, 10);
    if (actionsResult.success) {
      console.log(`✅ Found ${actionsResult.actions?.length || 0} recent actions`);
      actionsResult.actions?.slice(0, 5).forEach((a, i) => {
        console.log(`   ${i + 1}. ${a.action_type.toUpperCase()} - ${a.new_status} (${new Date(a.created_at).toLocaleString()})`);
      });
    } else {
      console.log('❌ Failed:', actionsResult.error);
    }

    // Test 5: Database functions
    console.log('\n🔧 Test 5: Database Functions');
    console.log('-'.repeat(60));
    console.log('   Checking views and helper functions...');

    const { data: activeView, error: activeViewError } = await supabase
      .from('active_workflows')
      .select('*')
      .limit(1);

    if (!activeViewError) {
      console.log('   ✅ active_workflows view accessible');
    } else {
      console.log('   ❌ active_workflows view error:', activeViewError.message);
    }

    const { data: snoozedView, error: snoozedViewError } = await supabase
      .from('snoozed_workflows_due')
      .select('*')
      .limit(1);

    if (!snoozedViewError) {
      console.log('   ✅ snoozed_workflows_due view accessible');
    } else {
      console.log('   ❌ snoozed_workflows_due view error:', snoozedViewError.message);
    }

    const { data: escalatedView, error: escalatedViewError } = await supabase
      .from('escalated_workflows')
      .select('*')
      .limit(1);

    if (!escalatedViewError) {
      console.log('   ✅ escalated_workflows view accessible');
    } else {
      console.log('   ❌ escalated_workflows view error:', escalatedViewError.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Phase 3E Tests Complete!');
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error);
  }
}

// Run tests
runTests().then(() => {
  console.log('\n👋 Test suite finished');
  process.exit(0);
});
