/**
 * Task 4 Validation Test: Workflow Scoring Algorithm
 *
 * Run this test to validate that workflow scoring correctly prioritizes
 * workflows based on ARR, urgency, account plan, and user context.
 *
 * USAGE: node test-task-4-scoring.js
 */

const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');
const { WorkflowType, createWorkflowInstance, createUserContext } = require('./workflow-types');
const {
  calculateWorkflowPriority,
  compareWorkflows,
  explainWorkflowScore,
  getARRMultiplier,
  getRenewalStageUrgency,
  getScoringConfig
} = require('./workflow-scoring');
const { getCustomersNeedingWorkflows } = require('./workflow-data-access');
const { determineWorkflowsForCustomer } = require('./workflow-determination');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║        TASK 4: WORKFLOW SCORING ALGORITHM VALIDATION TEST          ║');
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

// ============================================================================
// TEST 1: Configuration and Helper Functions
// ============================================================================
logSection('TEST 1: Configuration and Helper Functions');

try {
  const config = getScoringConfig();

  logTest(
    'Can retrieve scoring configuration',
    config !== null && config.arr_breakpoints !== undefined,
    'Configuration object returned'
  );

  logTest(
    'ARR breakpoints are configured',
    config.arr_breakpoints.high === 150000 &&
    config.arr_breakpoints.medium === 100000,
    `High: $${config.arr_breakpoints.high.toLocaleString()}, Medium: $${config.arr_breakpoints.medium.toLocaleString()}`
  );

  // Test ARR multipliers
  const highARRMultiplier = getARRMultiplier(200000);
  const mediumARRMultiplier = getARRMultiplier(125000);
  const lowARRMultiplier = getARRMultiplier(50000);

  logTest(
    'ARR multiplier works for high ARR',
    highARRMultiplier === 2.0,
    `$200k ARR → ${highARRMultiplier}x multiplier`
  );

  logTest(
    'ARR multiplier works for medium ARR',
    mediumARRMultiplier === 1.5,
    `$125k ARR → ${mediumARRMultiplier}x multiplier`
  );

  logTest(
    'ARR multiplier works for low ARR',
    lowARRMultiplier === 1.0,
    `$50k ARR → ${lowARRMultiplier}x multiplier`
  );

  // Test stage urgency
  const overdueUrgency = getRenewalStageUrgency('Overdue');
  const monitorUrgency = getRenewalStageUrgency('Monitor');

  logTest(
    'Stage urgency is highest for Overdue',
    overdueUrgency === 100,
    `Overdue urgency: ${overdueUrgency}`
  );

  logTest(
    'Stage urgency is lowest for Monitor',
    monitorUrgency === 20,
    `Monitor urgency: ${monitorUrgency}`
  );

  console.log('\n📋 Scoring Configuration Summary:');
  console.log('─'.repeat(70));
  console.log(`  ARR Breakpoints: $${config.arr_breakpoints.medium.toLocaleString()} (1.5x), $${config.arr_breakpoints.high.toLocaleString()} (2.0x)`);
  console.log(`  Account Plan Multipliers: invest=${config.account_plan_multipliers.invest}x, expand=${config.account_plan_multipliers.expand}x`);
  console.log(`  Workload Penalty: ${config.workload_penalty_per_workflow} points per workflow`);

} catch (error) {
  logTest('Configuration and helpers work', false, error.message);
}

// ============================================================================
// TEST 2: Basic Scoring - ARR Comparison
// ============================================================================
logSection('TEST 2: Basic Scoring - ARR Comparison (Same Stage)');

try {
  // Two customers in same renewal stage, different ARR
  const highARRCustomer = { customer_id: 'high-arr', arr: 200000, renewal_stage: 'Negotiate' };
  const lowARRCustomer = { customer_id: 'low-arr', arr: 50000, renewal_stage: 'Negotiate' };

  const highARRWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'high-arr',
    metadata: { renewal_stage: 'Negotiate' }
  });

  const lowARRWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'low-arr',
    metadata: { renewal_stage: 'Negotiate' }
  });

  const highARRScore = calculateWorkflowPriority(highARRWorkflow, highARRCustomer);
  const lowARRScore = calculateWorkflowPriority(lowARRWorkflow, lowARRCustomer);

  logTest(
    'High ARR customer scores higher than low ARR (same stage)',
    highARRScore.totalScore > lowARRScore.totalScore,
    `High ARR: ${highARRScore.totalScore}, Low ARR: ${lowARRScore.totalScore}`
  );

  logTest(
    'ARR multiplier is reflected in factors',
    highARRScore.factors.arr_multiplier === 2.0 &&
    lowARRScore.factors.arr_multiplier === 1.0,
    `High: ${highARRScore.factors.arr_multiplier}x, Low: ${lowARRScore.factors.arr_multiplier}x`
  );

  const scoreDifference = highARRScore.totalScore - lowARRScore.totalScore;
  console.log(`\n  📊 Score Difference: ${scoreDifference} points (${((scoreDifference / lowARRScore.totalScore) * 100).toFixed(0)}% higher)`);

} catch (error) {
  logTest('ARR-based scoring works', false, error.message);
}

// ============================================================================
// TEST 3: Urgency Scoring - Stage Comparison
// ============================================================================
logSection('TEST 3: Urgency Scoring - Stage Comparison (Same Customer)');

try {
  const customer = { customer_id: 'test', arr: 100000 };

  const overdueWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'test',
    metadata: { renewal_stage: 'Overdue' }
  });

  const negotiateWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'test',
    metadata: { renewal_stage: 'Negotiate' }
  });

  const monitorWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'test',
    metadata: { renewal_stage: 'Monitor' }
  });

  const overdueScore = calculateWorkflowPriority(overdueWorkflow, customer);
  const negotiateScore = calculateWorkflowPriority(negotiateWorkflow, customer);
  const monitorScore = calculateWorkflowPriority(monitorWorkflow, customer);

  logTest(
    'Overdue scores higher than Negotiate',
    overdueScore.totalScore > negotiateScore.totalScore,
    `Overdue: ${overdueScore.totalScore}, Negotiate: ${negotiateScore.totalScore}`
  );

  logTest(
    'Negotiate scores higher than Monitor',
    negotiateScore.totalScore > monitorScore.totalScore,
    `Negotiate: ${negotiateScore.totalScore}, Monitor: ${monitorScore.totalScore}`
  );

  logTest(
    'Stage urgency is reflected in base score',
    overdueScore.factors.base_score > negotiateScore.factors.base_score &&
    negotiateScore.factors.base_score > monitorScore.factors.base_score,
    `Overdue: ${overdueScore.factors.base_score}, Negotiate: ${negotiateScore.factors.base_score}, Monitor: ${monitorScore.factors.base_score}`
  );

  console.log('\n  📊 Urgency Ranking:');
  console.log(`     1. Overdue:   ${overdueScore.totalScore} points`);
  console.log(`     2. Negotiate: ${negotiateScore.totalScore} points`);
  console.log(`     3. Monitor:   ${monitorScore.totalScore} points`);

} catch (error) {
  logTest('Urgency-based scoring works', false, error.message);
}

// ============================================================================
// TEST 4: Strategic Workflow Scoring
// ============================================================================
logSection('TEST 4: Strategic Workflow Scoring - Account Plan Impact');

try {
  const investCustomer = { customer_id: 'invest', arr: 150000, account_plan: 'invest' };
  const manageCustomer = { customer_id: 'manage', arr: 150000, account_plan: 'manage' };

  const investWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.STRATEGIC,
    customer_id: 'invest',
    metadata: { account_plan: 'invest' }
  });

  const manageWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.STRATEGIC,
    customer_id: 'manage',
    metadata: { account_plan: 'manage' }
  });

  const investScore = calculateWorkflowPriority(investWorkflow, investCustomer);
  const manageScore = calculateWorkflowPriority(manageWorkflow, manageCustomer);

  logTest(
    'Invest account scores higher than manage account',
    investScore.totalScore > manageScore.totalScore,
    `Invest: ${investScore.totalScore}, Manage: ${manageScore.totalScore}`
  );

  logTest(
    'Account plan multiplier is applied',
    investScore.factors.account_plan_multiplier === 1.5 &&
    manageScore.factors.account_plan_multiplier === 1.0,
    `Invest: ${investScore.factors.account_plan_multiplier}x, Manage: ${manageScore.factors.account_plan_multiplier}x`
  );

} catch (error) {
  logTest('Strategic workflow scoring works', false, error.message);
}

// ============================================================================
// TEST 5: User Context Impact - Workload Balancing
// ============================================================================
logSection('TEST 5: User Context Impact - Workload Balancing');

try {
  const customer = { customer_id: 'test', arr: 100000, renewal_stage: 'Negotiate' };
  const workflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'test',
    metadata: { renewal_stage: 'Negotiate' }
  });

  // CSM with low workload
  const lowWorkloadCSM = createUserContext({
    user_id: 'csm-1',
    full_name: 'Low Workload CSM',
    email: 'low@test.com',
    current_workload: 2,
    experience_level: 'mid'
  });

  // CSM with high workload
  const highWorkloadCSM = createUserContext({
    user_id: 'csm-2',
    full_name: 'High Workload CSM',
    email: 'high@test.com',
    current_workload: 15,
    experience_level: 'mid'
  });

  const lowWorkloadScore = calculateWorkflowPriority(workflow, customer, lowWorkloadCSM);
  const highWorkloadScore = calculateWorkflowPriority(workflow, customer, highWorkloadCSM);

  logTest(
    'CSM with low workload gets higher priority than high workload CSM',
    lowWorkloadScore.totalScore > highWorkloadScore.totalScore,
    `Low workload (2): ${lowWorkloadScore.totalScore}, High workload (15): ${highWorkloadScore.totalScore}`
  );

  const workloadDifference = lowWorkloadScore.totalScore - highWorkloadScore.totalScore;

  logTest(
    'Workload penalty is applied correctly',
    workloadDifference > 0,
    `Penalty difference: ${workloadDifference} points`
  );

} catch (error) {
  logTest('User context workload balancing works', false, error.message);
}

// ============================================================================
// TEST 6: User Context Impact - Experience Level
// ============================================================================
logSection('TEST 6: User Context Impact - Experience Level');

try {
  const customer = { customer_id: 'enterprise', arr: 250000, renewal_stage: 'Critical' };
  const workflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'enterprise',
    metadata: { renewal_stage: 'Critical' }
  });

  const expertCSM = createUserContext({
    user_id: 'expert',
    full_name: 'Expert CSM',
    email: 'expert@test.com',
    experience_level: 'expert',
    current_workload: 10
  });

  const juniorCSM = createUserContext({
    user_id: 'junior',
    full_name: 'Junior CSM',
    email: 'junior@test.com',
    experience_level: 'junior',
    current_workload: 10
  });

  const expertScore = calculateWorkflowPriority(workflow, customer, expertCSM);
  const juniorScore = calculateWorkflowPriority(workflow, customer, juniorCSM);

  logTest(
    'Expert CSM gets higher priority for complex workflows',
    expertScore.totalScore > juniorScore.totalScore,
    `Expert: ${expertScore.totalScore}, Junior: ${juniorScore.totalScore}`
  );

  logTest(
    'Experience multiplier is applied',
    expertScore.factors.custom.experience_multiplier === 1.2 &&
    juniorScore.factors.custom.experience_multiplier === 0.9,
    `Expert: ${expertScore.factors.custom.experience_multiplier}x, Junior: ${juniorScore.factors.custom.experience_multiplier}x`
  );

} catch (error) {
  logTest('Experience level impact works', false, error.message);
}

// ============================================================================
// TEST 7: Workflow Comparison and Sorting
// ============================================================================
logSection('TEST 7: Workflow Comparison and Sorting');

try {
  const workflows = [
    { priority_score: 50, name: 'Low Priority' },
    { priority_score: 150, name: 'High Priority' },
    { priority_score: 100, name: 'Medium Priority' },
    { priority_score: 200, name: 'Highest Priority' }
  ];

  const sorted = workflows.sort(compareWorkflows);

  logTest(
    'compareWorkflows sorts by priority (descending)',
    sorted[0].priority_score === 200 &&
    sorted[1].priority_score === 150 &&
    sorted[2].priority_score === 100 &&
    sorted[3].priority_score === 50,
    'Sorted: 200, 150, 100, 50'
  );

  console.log('\n  📊 Sorted Workflows:');
  sorted.forEach((w, i) => {
    console.log(`     ${i + 1}. ${w.name.padEnd(20)} - ${w.priority_score} points`);
  });

} catch (error) {
  logTest('Workflow sorting works', false, error.message);
}

// ============================================================================
// TEST 8: Score Explanation
// ============================================================================
logSection('TEST 8: Score Explanation - Transparency');

try {
  const customer = { customer_id: 'explain', arr: 180000, renewal_stage: 'Emergency' };
  const workflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'explain',
    metadata: { renewal_stage: 'Emergency' }
  });

  const userContext = createUserContext({
    user_id: 'csm',
    full_name: 'Test CSM',
    email: 'test@csm.com',
    experience_level: 'senior',
    current_workload: 5
  });

  const scoringResult = calculateWorkflowPriority(workflow, customer, userContext);
  const explanation = explainWorkflowScore(scoringResult, workflow, customer);

  logTest(
    'Score explanation includes total score',
    explanation.total_score === scoringResult.totalScore,
    `Total score: ${explanation.total_score}`
  );

  logTest(
    'Explanation includes breakdown components',
    Array.isArray(explanation.breakdown) && explanation.breakdown.length > 0,
    `${explanation.breakdown.length} components explained`
  );

  logTest(
    'Explanation includes calculation formula',
    explanation.calculation && explanation.calculation.includes('='),
    'Formula provided'
  );

  console.log('\n📋 Sample Score Explanation:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(explanation, null, 2));

} catch (error) {
  logTest('Score explanation works', false, error.message);
}

// ============================================================================
// TEST 9: Edge Cases
// ============================================================================
logSection('TEST 9: Edge Cases - Robustness');

try {
  // Customer with $0 ARR
  const zeroARRCustomer = { customer_id: 'zero', arr: 0, renewal_stage: 'Negotiate' };
  const zeroARRWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'zero',
    metadata: { renewal_stage: 'Negotiate' }
  });

  const zeroARRScore = calculateWorkflowPriority(zeroARRWorkflow, zeroARRCustomer);

  logTest(
    'Handles $0 ARR without errors',
    zeroARRScore.totalScore > 0,
    `Score: ${zeroARRScore.totalScore} (uses 1.0x multiplier)`
  );

  // Customer with missing renewal_stage
  const noStageCustomer = { customer_id: 'nostage', arr: 100000 };
  const noStageWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'nostage',
    metadata: {}
  });

  const noStageScore = calculateWorkflowPriority(noStageWorkflow, noStageCustomer);

  logTest(
    'Handles missing renewal_stage without errors',
    typeof noStageScore.totalScore === 'number',
    `Score: ${noStageScore.totalScore}`
  );

  // Workflow without user context
  const noUserScore = calculateWorkflowPriority(zeroARRWorkflow, zeroARRCustomer, null);

  logTest(
    'Handles missing user context',
    typeof noUserScore.totalScore === 'number',
    `Score: ${noUserScore.totalScore} (no user context penalties/bonuses)`
  );

} catch (error) {
  logTest('Edge cases handled correctly', false, error.message);
}

// ============================================================================
// TEST 10: Real Database Workflows - Complete Scenario
// ============================================================================
logSection('TEST 10: Real Database Workflows - End-to-End Scoring');

try {
  const db = new Database('renubu-test.db', { readonly: true });
  const sampleCompany = db.prepare('SELECT id FROM companies LIMIT 1').get();
  db.close();

  const customers = getCustomersNeedingWorkflows(sampleCompany.id);

  logTest(
    'Can score real database customers',
    customers.length > 0,
    `Processing ${customers.length} customers`
  );

  const scoredWorkflows = [];

  customers.forEach(customer => {
    const workflowTypes = determineWorkflowsForCustomer(customer);

    workflowTypes.forEach(type => {
      const workflow = createWorkflowInstance({
        id: randomUUID(),
        type: type,
        customer_id: customer.customer_id,
        metadata: {
          renewal_stage: customer.renewal_stage,
          account_plan: customer.account_plan,
          days_until_renewal: customer.days_until_renewal
        }
      });

      const scoring = calculateWorkflowPriority(workflow, customer);

      scoredWorkflows.push({
        workflow,
        customer,
        priority_score: scoring.totalScore,
        factors: scoring.factors
      });
    });
  });

  // Sort by priority
  scoredWorkflows.sort(compareWorkflows);

  logTest(
    'Generated and scored multiple workflows',
    scoredWorkflows.length > 0,
    `${scoredWorkflows.length} workflows scored`
  );

  logTest(
    'Workflows are sorted by priority',
    scoredWorkflows.length >= 2 ? scoredWorkflows[0].priority_score >= scoredWorkflows[1].priority_score : true,
    'Highest priority first'
  );

  console.log('\n📋 Top 5 Prioritized Workflows:');
  console.log('─'.repeat(70));
  scoredWorkflows.slice(0, 5).forEach((sw, i) => {
    console.log(`\n  ${i + 1}. ${sw.customer.domain.padEnd(30)} | Score: ${sw.priority_score}`);
    console.log(`     Type: ${sw.workflow.type.padEnd(12)} | ARR: $${String(sw.customer.arr).padStart(8)} | Stage: ${sw.customer.renewal_stage}`);
    console.log(`     Factors: Base=${sw.factors.base_score}, ARR×${sw.factors.arr_multiplier}, Plan×${sw.factors.account_plan_multiplier}`);
  });

  // Verify business logic
  if (scoredWorkflows.length > 0) {
    const topWorkflow = scoredWorkflows[0];
    logTest(
      'Top workflow is legitimately high priority',
      topWorkflow.priority_score > 50,
      `Top score: ${topWorkflow.priority_score} for ${topWorkflow.customer.domain}`
    );
  }

} catch (error) {
  logTest('Real database workflow scoring works', false, error.message);
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
  console.log('║  ✅ ALL TESTS PASSED - WORKFLOW SCORING READY FOR TASK 5          ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME TESTS FAILED - PLEASE REVIEW AND FIX BEFORE TASK 5       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}
