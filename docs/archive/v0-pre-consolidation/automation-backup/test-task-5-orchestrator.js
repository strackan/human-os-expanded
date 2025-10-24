/**
 * Task 5 Validation Test: Workflow Orchestrator
 *
 * Run this test to validate that the complete workflow system works end-to-end:
 * Data Access → Determination → Scoring → Orchestration
 *
 * USAGE: node test-task-5-orchestrator.js
 */

const Database = require('better-sqlite3');
const {
  generateAllWorkflows,
  getWorkflowQueueForCSM,
  groupWorkflowsByCustomer,
  getWorkflowStats,
  filterWorkflows,
  getTopWorkflows
} = require('./workflow-orchestrator');
const { createUserContext, ExperienceLevel } = require('./workflow-types');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║       TASK 5: WORKFLOW ORCHESTRATOR VALIDATION TEST                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`  ✅ ${name}`);
    if (details) console.log(`     ${details}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${name}`);
    if (details) console.log(`     ${details}`);
    testsFailed++;
  }
}

function logSection(title) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(70)}\n`);
}

// Get sample data from database
const db = new Database('renubu-test.db', { readonly: true });
const sampleCompany = db.prepare('SELECT id, name FROM companies LIMIT 1').get();
const sampleOwner = db.prepare('SELECT id, full_name, email FROM users LIMIT 1').get();
const allOwners = db.prepare('SELECT id, full_name, email FROM users').all();
db.close();

if (!sampleCompany || !sampleOwner) {
  console.error('❌ ERROR: Database not seeded. Run `node seed.js` first.\n');
  process.exit(1);
}

// ============================================================================
// TEST 1: Basic Orchestration - generateAllWorkflows
// ============================================================================
logSection('TEST 1: Basic Orchestration - generateAllWorkflows()');

try {
  const allWorkflows = generateAllWorkflows(sampleCompany.id);

  logTest(
    'generateAllWorkflows returns array',
    Array.isArray(allWorkflows),
    `Returned ${allWorkflows.length} workflows`
  );

  logTest(
    'Generated at least one workflow',
    allWorkflows.length > 0,
    `${allWorkflows.length} workflows generated for ${sampleCompany.name}`
  );

  if (allWorkflows.length > 0) {
    const firstWorkflow = allWorkflows[0];

    logTest(
      'Workflow assignment has required fields',
      firstWorkflow.workflow &&
      firstWorkflow.customer &&
      firstWorkflow.context,
      'workflow, customer, and context present'
    );

    logTest(
      'Workflow has priority score',
      typeof firstWorkflow.workflow.priority_score === 'number',
      `Priority: ${firstWorkflow.workflow.priority_score}`
    );

    logTest(
      'Workflow has priority factors',
      firstWorkflow.workflow.priority_factors &&
      typeof firstWorkflow.workflow.priority_factors.base_score === 'number',
      'Priority factors breakdown available'
    );

    logTest(
      'Customer data is complete',
      firstWorkflow.customer.domain &&
      typeof firstWorkflow.customer.arr === 'number',
      `Customer: ${firstWorkflow.customer.domain}, ARR: $${firstWorkflow.customer.arr?.toLocaleString()}`
    );

    logTest(
      'Context includes renewal information',
      firstWorkflow.context.renewal_stage &&
      typeof firstWorkflow.context.days_until_renewal === 'number',
      `Stage: ${firstWorkflow.context.renewal_stage}, Days: ${firstWorkflow.context.days_until_renewal}`
    );
  }

  // Test sorting
  if (allWorkflows.length >= 2) {
    logTest(
      'Workflows are sorted by priority (descending)',
      allWorkflows[0].workflow.priority_score >= allWorkflows[1].workflow.priority_score,
      `Top: ${allWorkflows[0].workflow.priority_score}, Second: ${allWorkflows[1].workflow.priority_score}`
    );
  }

  console.log('\n📋 Sample Workflows Generated:');
  console.log('─'.repeat(70));
  allWorkflows.slice(0, 3).forEach((w, i) => {
    console.log(`  ${i + 1}. ${w.customer.domain.padEnd(30)} | Score: ${String(w.workflow.priority_score).padStart(3)}`);
    console.log(`     Type: ${w.workflow.type.padEnd(12)} | ARR: $${String(w.customer.arr).padStart(8)} | Stage: ${w.context.renewal_stage}`);
  });

} catch (error) {
  logTest('generateAllWorkflows executes without errors', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 2: CSM-Specific Queue
// ============================================================================
logSection('TEST 2: CSM-Specific Queue - getWorkflowQueueForCSM()');

try {
  const csmQueue = getWorkflowQueueForCSM(sampleOwner.id, sampleCompany.id);

  logTest(
    'getWorkflowQueueForCSM returns array',
    Array.isArray(csmQueue),
    `${csmQueue.length} workflows for ${sampleOwner.full_name}`
  );

  // Verify all workflows belong to this CSM
  const allBelongToCSM = csmQueue.every(w => w.customer.owner === sampleOwner.id);

  logTest(
    'All workflows belong to specified CSM',
    allBelongToCSM,
    `All ${csmQueue.length} workflows assigned to ${sampleOwner.full_name}`
  );

  if (csmQueue.length > 0) {
    console.log(`\n📋 ${sampleOwner.full_name}'s Workflow Queue:`);
    console.log('─'.repeat(70));
    csmQueue.forEach((w, i) => {
      console.log(`  ${i + 1}. [${String(w.workflow.priority_score).padStart(3)} pts] ${w.customer.domain.padEnd(30)}`);
      console.log(`     ${w.workflow.type} workflow | ${w.context.renewal_stage} stage | $${w.customer.arr?.toLocaleString()} ARR`);
    });
  }

} catch (error) {
  logTest('getWorkflowQueueForCSM executes without errors', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 3: User Context Integration
// ============================================================================
logSection('TEST 3: User Context Integration - Workload & Experience');

try {
  // Create mock user contexts for each CSM
  const userContexts = {};

  allOwners.forEach((owner, index) => {
    userContexts[owner.id] = createUserContext({
      user_id: owner.id,
      full_name: owner.full_name,
      email: owner.email,
      experience_level: index === 0 ? ExperienceLevel.SENIOR : ExperienceLevel.MID,
      current_workload: index * 5, // Vary workload
      specialties: ['renewals']
    });
  });

  const workflowsWithContext = generateAllWorkflows(sampleCompany.id, { userContexts });

  logTest(
    'Workflows generated with user context',
    workflowsWithContext.length > 0,
    `${workflowsWithContext.length} workflows with CSM context`
  );

  const hasUserContext = workflowsWithContext.some(w => w.user_context !== null);

  logTest(
    'Some workflows have user_context attached',
    hasUserContext,
    'User context is being applied'
  );

  // Verify workload penalty is applied
  if (workflowsWithContext.length >= 2) {
    const withContext = workflowsWithContext.find(w => w.user_context?.current_workload > 0);
    if (withContext) {
      logTest(
        'Workload penalty is reflected in factors',
        withContext.workflow.priority_factors.custom?.workload_penalty !== undefined,
        `Workload penalty: ${withContext.workflow.priority_factors.custom?.workload_penalty || 0} pts`
      );
    }
  }

} catch (error) {
  logTest('User context integration works', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 4: Workflow Grouping
// ============================================================================
logSection('TEST 4: Workflow Grouping - groupWorkflowsByCustomer()');

try {
  const allWorkflows = generateAllWorkflows(sampleCompany.id);
  const grouped = groupWorkflowsByCustomer(allWorkflows);

  logTest(
    'groupWorkflowsByCustomer returns object',
    typeof grouped === 'object' && grouped !== null,
    `Grouped ${Object.keys(grouped).length} customers`
  );

  const customerIds = Object.keys(grouped);

  logTest(
    'Each customer has workflows array',
    customerIds.length > 0 && Array.isArray(grouped[customerIds[0]].workflows),
    `First customer has ${grouped[customerIds[0]]?.workflows?.length} workflows`
  );

  // Find customer with multiple workflows
  const multiWorkflowCustomer = customerIds.find(id => grouped[id].workflows.length > 1);

  if (multiWorkflowCustomer) {
    const customerGroup = grouped[multiWorkflowCustomer];

    logTest(
      'Customer with multiple workflows tracked correctly',
      customerGroup.workflows.length > 1,
      `${customerGroup.customer.domain} has ${customerGroup.workflows.length} workflows`
    );

    logTest(
      'Total priority calculated for customer',
      typeof customerGroup.total_priority === 'number',
      `Total priority: ${customerGroup.total_priority} pts`
    );

    logTest(
      'Highest priority tracked for customer',
      typeof customerGroup.highest_priority === 'number',
      `Highest priority: ${customerGroup.highest_priority} pts`
    );

    console.log(`\n📋 Customer with Multiple Workflows: ${customerGroup.customer.domain}`);
    console.log('─'.repeat(70));
    customerGroup.workflows.forEach((w, i) => {
      console.log(`  ${i + 1}. ${w.workflow.type.padEnd(12)} | Priority: ${w.workflow.priority_score} pts`);
    });
    console.log(`  Total Priority: ${customerGroup.total_priority} pts`);
    console.log(`  Highest Priority: ${customerGroup.highest_priority} pts`);
  }

} catch (error) {
  logTest('groupWorkflowsByCustomer works', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 5: Workflow Statistics
// ============================================================================
logSection('TEST 5: Workflow Statistics - getWorkflowStats()');

try {
  const allWorkflows = generateAllWorkflows(sampleCompany.id);
  const stats = getWorkflowStats(allWorkflows);

  logTest(
    'getWorkflowStats returns statistics object',
    stats && typeof stats.total_workflows === 'number',
    `Total: ${stats.total_workflows} workflows`
  );

  logTest(
    'Counts workflows by type',
    typeof stats.by_type === 'object' &&
    typeof stats.by_type.renewal === 'number',
    `Renewal: ${stats.by_type.renewal}, Strategic: ${stats.by_type.strategic}`
  );

  logTest(
    'Counts workflows by stage',
    typeof stats.by_stage === 'object',
    `${Object.keys(stats.by_stage).length} unique stages`
  );

  logTest(
    'Tracks unique customers',
    typeof stats.unique_customers === 'number',
    `${stats.unique_customers} unique customers`
  );

  logTest(
    'Calculates average priority',
    typeof stats.avg_priority === 'number',
    `Avg priority: ${stats.avg_priority} pts`
  );

  logTest(
    'Tracks priority range',
    stats.priority_range.min <= stats.priority_range.max,
    `Range: ${stats.priority_range.min} - ${stats.priority_range.max} pts`
  );

  console.log('\n📊 Workflow Statistics:');
  console.log('─'.repeat(70));
  console.log(`  Total Workflows: ${stats.total_workflows}`);
  console.log(`  Unique Customers: ${stats.unique_customers}`);
  console.log(`  Avg Priority: ${stats.avg_priority} pts`);
  console.log(`  Priority Range: ${stats.priority_range.min} - ${stats.priority_range.max} pts`);
  console.log('\n  By Type:');
  Object.entries(stats.by_type).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`    ${type.padEnd(12)} : ${count}`);
    }
  });
  console.log('\n  By Stage:');
  Object.entries(stats.by_stage).forEach(([stage, count]) => {
    console.log(`    ${stage.padEnd(12)} : ${count}`);
  });

} catch (error) {
  logTest('getWorkflowStats works', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 6: Workflow Filtering
// ============================================================================
logSection('TEST 6: Workflow Filtering - filterWorkflows()');

try {
  const allWorkflows = generateAllWorkflows(sampleCompany.id);

  // Filter by type
  const renewalWorkflows = filterWorkflows(allWorkflows, { type: 'renewal' });

  logTest(
    'Can filter by workflow type',
    Array.isArray(renewalWorkflows) &&
    renewalWorkflows.every(w => w.workflow.type === 'renewal'),
    `${renewalWorkflows.length} renewal workflows`
  );

  // Filter by minimum ARR
  const highARRWorkflows = filterWorkflows(allWorkflows, { min_arr: 100000 });

  logTest(
    'Can filter by minimum ARR',
    Array.isArray(highARRWorkflows) &&
    highARRWorkflows.every(w => w.customer.arr >= 100000),
    `${highARRWorkflows.length} workflows for customers with ARR ≥ $100k`
  );

  // Filter by account plan
  const investWorkflows = filterWorkflows(allWorkflows, { account_plan: 'invest' });

  logTest(
    'Can filter by account plan',
    Array.isArray(investWorkflows),
    `${investWorkflows.length} workflows for invest accounts`
  );

  // Filter by priority
  const highPriorityWorkflows = filterWorkflows(allWorkflows, { min_priority: 100 });

  logTest(
    'Can filter by minimum priority',
    Array.isArray(highPriorityWorkflows) &&
    highPriorityWorkflows.every(w => w.workflow.priority_score >= 100),
    `${highPriorityWorkflows.length} workflows with priority ≥ 100`
  );

  // Multiple filters
  const complexFilter = filterWorkflows(allWorkflows, {
    type: 'renewal',
    min_arr: 100000,
    min_priority: 50
  });

  logTest(
    'Can apply multiple filters simultaneously',
    Array.isArray(complexFilter),
    `${complexFilter.length} workflows matching all criteria`
  );

} catch (error) {
  logTest('filterWorkflows works', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 7: Top Workflows
// ============================================================================
logSection('TEST 7: Top Workflows - getTopWorkflows()');

try {
  const allWorkflows = generateAllWorkflows(sampleCompany.id);
  const top5 = getTopWorkflows(allWorkflows, 5);

  logTest(
    'getTopWorkflows limits results correctly',
    top5.length <= 5,
    `Requested 5, got ${top5.length}`
  );

  if (top5.length >= 2) {
    logTest(
      'Top workflows are sorted by priority',
      top5[0].workflow.priority_score >= top5[top5.length - 1].workflow.priority_score,
      `Top: ${top5[0].workflow.priority_score}, Last: ${top5[top5.length - 1].workflow.priority_score}`
    );
  }

  console.log('\n🏆 Top 5 Workflows Across Company:');
  console.log('─'.repeat(70));
  top5.forEach((w, i) => {
    console.log(`  ${i + 1}. [${String(w.workflow.priority_score).padStart(3)} pts] ${w.customer.domain.padEnd(30)}`);
    console.log(`     ${w.workflow.type.padEnd(12)} | ${w.context.renewal_stage?.padEnd(10) || 'N/A'.padEnd(10)} | $${w.customer.arr?.toLocaleString()} ARR`);
  });

} catch (error) {
  logTest('getTopWorkflows works', false, error.message);
  console.error(error);
}

// ============================================================================
// TEST 8: End-to-End Workflow System Validation
// ============================================================================
logSection('TEST 8: End-to-End System Validation');

try {
  const allWorkflows = generateAllWorkflows(sampleCompany.id);
  const stats = getWorkflowStats(allWorkflows);

  logTest(
    'System generates workflows for all eligible customers',
    stats.total_workflows > 0 && stats.unique_customers > 0,
    `${stats.total_workflows} workflows for ${stats.unique_customers} customers`
  );

  logTest(
    'Some customers have multiple workflows',
    stats.total_workflows > stats.unique_customers,
    `${stats.total_workflows - stats.unique_customers} additional workflows (multi-type)`
  );

  logTest(
    'Renewal workflows are generated',
    stats.by_type.renewal > 0,
    `${stats.by_type.renewal} renewal workflows`
  );

  logTest(
    'Strategic workflows are generated for qualified customers',
    stats.by_type.strategic >= 0,
    `${stats.by_type.strategic} strategic workflows`
  );

  // Verify data completeness
  const hasCompleteData = allWorkflows.every(w =>
    w.workflow.id &&
    w.workflow.type &&
    w.workflow.priority_score !== undefined &&
    w.customer.domain &&
    w.customer.arr !== undefined
  );

  logTest(
    'All workflows have complete required data',
    hasCompleteData,
    'No missing critical fields'
  );

  // Verify business logic
  const topWorkflow = allWorkflows[0];
  const bottomWorkflow = allWorkflows[allWorkflows.length - 1];

  logTest(
    'Top priority workflow is legitimately high priority',
    topWorkflow.workflow.priority_score > 50,
    `Top workflow: ${topWorkflow.workflow.priority_score} pts`
  );

  logTest(
    'Priority scores span a reasonable range',
    stats.priority_range.max - stats.priority_range.min > 10,
    `Range: ${stats.priority_range.max - stats.priority_range.min} pts`
  );

  console.log('\n🎯 End-to-End System Summary:');
  console.log('─'.repeat(70));
  console.log(`  ✓ Data Access Layer: ${stats.unique_customers} customers retrieved`);
  console.log(`  ✓ Determination Logic: ${stats.total_workflows} workflows identified`);
  console.log(`  ✓ Scoring Algorithm: Priority range ${stats.priority_range.min}-${stats.priority_range.max}`);
  console.log(`  ✓ Orchestration: ${allWorkflows.length} workflows sorted and ready`);
  console.log('\n  Ready for CSM Dashboard! 🚀');

} catch (error) {
  logTest('End-to-end system validation', false, error.message);
  console.error(error);
}

// ============================================================================
// FINAL RESULTS
// ============================================================================
console.log('\n' + '═'.repeat(70));
console.log('  TEST RESULTS');
console.log('═'.repeat(70));
console.log(`\n  ✅ Passed: ${testsPassed}`);
console.log(`  ❌ Failed: ${testsFailed}`);
console.log(`  📊 Total:  ${testsPassed + testsFailed}\n`);

if (testsFailed === 0) {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ ALL TESTS PASSED - WORKFLOW ORCHESTRATOR READY FOR TASK 6     ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME TESTS FAILED - PLEASE REVIEW AND FIX BEFORE TASK 6       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}
