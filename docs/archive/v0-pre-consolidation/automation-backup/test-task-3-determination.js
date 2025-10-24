/**
 * Task 3 Validation Test: Workflow Determination Logic
 *
 * Run this test to validate that workflow determination logic correctly
 * identifies which workflows each customer should receive.
 *
 * USAGE: node test-task-3-determination.js
 */

const Database = require('better-sqlite3');
const { WorkflowType } = require('./workflow-types');
const {
  shouldHaveRenewalWorkflow,
  shouldHaveStrategicWorkflow,
  shouldHaveOpportunityWorkflow,
  shouldHaveRiskWorkflow,
  determineWorkflowsForCustomer,
  getWorkflowDeterminationExplanation,
  getWorkflowThresholds
} = require('./workflow-determination');
const { getCustomersNeedingWorkflows } = require('./workflow-data-access');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║      TASK 3: WORKFLOW DETERMINATION LOGIC VALIDATION TEST          ║');
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
const sampleCompany = db.prepare('SELECT id FROM companies LIMIT 1').get();
db.close();

// ============================================================================
// TEST 1: Configuration and Thresholds
// ============================================================================
logSection('TEST 1: Configuration and Thresholds');

try {
  const thresholds = getWorkflowThresholds();

  logTest(
    'Can retrieve workflow thresholds',
    thresholds !== null && thresholds !== undefined,
    'Thresholds object returned'
  );

  logTest(
    'Strategic account plans are configured',
    Array.isArray(thresholds.strategic_account_plans) &&
    thresholds.strategic_account_plans.includes('invest') &&
    thresholds.strategic_account_plans.includes('expand'),
    `Strategic plans: ${thresholds.strategic_account_plans.join(', ')}`
  );

  logTest(
    'Opportunity threshold is set',
    typeof thresholds.opportunity_score_min === 'number',
    `Opportunity score min: ${thresholds.opportunity_score_min}`
  );

  logTest(
    'Risk threshold is set',
    typeof thresholds.risk_score_min === 'number',
    `Risk score min: ${thresholds.risk_score_min}`
  );

  console.log('\n📋 Current Thresholds:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(thresholds, null, 2));

} catch (error) {
  logTest('Configuration functions work', false, error.message);
}

// ============================================================================
// TEST 2: Renewal Workflow Determination
// ============================================================================
logSection('TEST 2: Renewal Workflow Determination');

try {
  // Customer with active renewal
  const customerWithRenewal = {
    customer_id: 'cust-001',
    domain: 'active-renewal.com',
    renewal_id: 'renewal-123',
    renewal_date: '2026-03-15',
    days_until_renewal: 120
  };

  logTest(
    'Customer with active renewal gets renewal workflow',
    shouldHaveRenewalWorkflow(customerWithRenewal),
    `Customer has renewal_id: ${customerWithRenewal.renewal_id}`
  );

  // Customer with renewal date but no renewal_id
  const customerWithRenewalDate = {
    customer_id: 'cust-002',
    domain: 'future-renewal.com',
    renewal_id: null,
    renewal_date: '2026-06-01',
    days_until_renewal: 200
  };

  logTest(
    'Customer with future renewal date gets renewal workflow',
    shouldHaveRenewalWorkflow(customerWithRenewalDate),
    `Renewal date: ${customerWithRenewalDate.renewal_date}`
  );

  // Customer with no renewal
  const customerWithoutRenewal = {
    customer_id: 'cust-003',
    domain: 'no-renewal.com',
    renewal_id: null,
    renewal_date: null
  };

  logTest(
    'Customer without renewal does NOT get renewal workflow',
    !shouldHaveRenewalWorkflow(customerWithoutRenewal),
    'No renewal_id or renewal_date'
  );

  // Customer with very overdue renewal (>30 days)
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 45);
  const customerOverdue = {
    customer_id: 'cust-004',
    domain: 'very-overdue.com',
    renewal_id: null,
    renewal_date: pastDate.toISOString().split('T')[0],
    days_until_renewal: -45
  };

  logTest(
    'Customer with >30 days overdue renewal does NOT get workflow',
    !shouldHaveRenewalWorkflow(customerOverdue),
    `${customerOverdue.days_until_renewal} days overdue (too old)`
  );

} catch (error) {
  logTest('Renewal workflow determination works', false, error.message);
}

// ============================================================================
// TEST 3: Strategic Workflow Determination
// ============================================================================
logSection('TEST 3: Strategic Workflow Determination');

try {
  // Customer with invest plan
  const investCustomer = {
    customer_id: 'cust-005',
    domain: 'invest-account.com',
    account_plan: 'invest'
  };

  logTest(
    'Customer with "invest" plan gets strategic workflow',
    shouldHaveStrategicWorkflow(investCustomer),
    `Account plan: ${investCustomer.account_plan}`
  );

  // Customer with expand plan
  const expandCustomer = {
    customer_id: 'cust-006',
    domain: 'expand-account.com',
    account_plan: 'expand'
  };

  logTest(
    'Customer with "expand" plan gets strategic workflow',
    shouldHaveStrategicWorkflow(expandCustomer),
    `Account plan: ${expandCustomer.account_plan}`
  );

  // Customer with manage plan
  const manageCustomer = {
    customer_id: 'cust-007',
    domain: 'manage-account.com',
    account_plan: 'manage'
  };

  logTest(
    'Customer with "manage" plan does NOT get strategic workflow',
    !shouldHaveStrategicWorkflow(manageCustomer),
    `Account plan: ${manageCustomer.account_plan} (not strategic)`
  );

  // Customer with monitor plan
  const monitorCustomer = {
    customer_id: 'cust-008',
    domain: 'monitor-account.com',
    account_plan: 'monitor'
  };

  logTest(
    'Customer with "monitor" plan does NOT get strategic workflow',
    !shouldHaveStrategicWorkflow(monitorCustomer),
    `Account plan: ${monitorCustomer.account_plan} (not strategic)`
  );

  // Customer with no plan
  const noPlanCustomer = {
    customer_id: 'cust-009',
    domain: 'no-plan.com',
    account_plan: null
  };

  logTest(
    'Customer with no account plan does NOT get strategic workflow',
    !shouldHaveStrategicWorkflow(noPlanCustomer),
    'No account plan set'
  );

} catch (error) {
  logTest('Strategic workflow determination works', false, error.message);
}

// ============================================================================
// TEST 4: Opportunity and Risk Workflows (Future Features)
// ============================================================================
logSection('TEST 4: Opportunity and Risk Workflows (Future Features)');

try {
  // Customer with no opportunity score
  const noOpportunity = {
    customer_id: 'cust-010',
    domain: 'no-opp.com',
    opportunity_score: null
  };

  logTest(
    'Customer without opportunity_score does NOT get opportunity workflow',
    !shouldHaveOpportunityWorkflow(noOpportunity),
    'Opportunity scores not implemented yet'
  );

  // Customer with hypothetical opportunity score
  const withOpportunity = {
    customer_id: 'cust-011',
    domain: 'high-opp.com',
    opportunity_score: 85
  };

  logTest(
    'Customer with high opportunity_score would get opportunity workflow',
    shouldHaveOpportunityWorkflow(withOpportunity),
    `Opportunity score: ${withOpportunity.opportunity_score} (above threshold)`
  );

  // Customer with low opportunity score
  const lowOpportunity = {
    customer_id: 'cust-012',
    domain: 'low-opp.com',
    opportunity_score: 50
  };

  logTest(
    'Customer with low opportunity_score does NOT get opportunity workflow',
    !shouldHaveOpportunityWorkflow(lowOpportunity),
    `Opportunity score: ${lowOpportunity.opportunity_score} (below threshold)`
  );

  // Customer with no risk score
  const noRisk = {
    customer_id: 'cust-013',
    domain: 'no-risk.com',
    risk_score: null
  };

  logTest(
    'Customer without risk_score does NOT get risk workflow',
    !shouldHaveRiskWorkflow(noRisk),
    'Risk scores not implemented yet'
  );

  // Customer with hypothetical risk score
  const withRisk = {
    customer_id: 'cust-014',
    domain: 'high-risk.com',
    risk_score: 75
  };

  logTest(
    'Customer with high risk_score would get risk workflow',
    shouldHaveRiskWorkflow(withRisk),
    `Risk score: ${withRisk.risk_score} (above threshold)`
  );

} catch (error) {
  logTest('Future workflow determination works', false, error.message);
}

// ============================================================================
// TEST 5: determineWorkflowsForCustomer - Combined Logic
// ============================================================================
logSection('TEST 5: determineWorkflowsForCustomer - Combined Logic');

try {
  // Scenario 1: Customer with only renewal
  const renewalOnly = {
    customer_id: 'cust-015',
    domain: 'renewal-only.com',
    renewal_id: 'renewal-456',
    renewal_date: '2026-05-01',
    account_plan: 'manage'
  };

  const workflows1 = determineWorkflowsForCustomer(renewalOnly);

  logTest(
    'Customer with manage plan + renewal gets only renewal workflow',
    workflows1.length === 1 && workflows1.includes(WorkflowType.RENEWAL),
    `Workflows: ${workflows1.join(', ')}`
  );

  // Scenario 2: Customer with renewal + strategic
  const renewalAndStrategic = {
    customer_id: 'cust-016',
    domain: 'renewal-strategic.com',
    renewal_id: 'renewal-789',
    renewal_date: '2026-04-01',
    account_plan: 'invest',
    days_until_renewal: 90
  };

  const workflows2 = determineWorkflowsForCustomer(renewalAndStrategic);

  logTest(
    'Customer with invest plan + renewal gets both workflows',
    workflows2.length === 2 &&
    workflows2.includes(WorkflowType.RENEWAL) &&
    workflows2.includes(WorkflowType.STRATEGIC),
    `Workflows: ${workflows2.join(', ')}`
  );

  // Scenario 3: Customer with no workflows
  const noWorkflows = {
    customer_id: 'cust-017',
    domain: 'no-workflows.com',
    renewal_id: null,
    renewal_date: null,
    account_plan: null
  };

  const workflows3 = determineWorkflowsForCustomer(noWorkflows);

  logTest(
    'Customer meeting no criteria gets no workflows',
    workflows3.length === 0,
    `Workflows: ${workflows3.length === 0 ? 'none' : workflows3.join(', ')}`
  );

  // Scenario 4: Enterprise customer with all future workflows
  const allWorkflows = {
    customer_id: 'cust-018',
    domain: 'enterprise-all.com',
    renewal_id: 'renewal-999',
    renewal_date: '2026-03-01',
    account_plan: 'invest',
    opportunity_score: 85,
    risk_score: 75
  };

  const workflows4 = determineWorkflowsForCustomer(allWorkflows);

  logTest(
    'Enterprise customer with high scores gets all 4 workflow types',
    workflows4.length === 4 &&
    workflows4.includes(WorkflowType.RENEWAL) &&
    workflows4.includes(WorkflowType.STRATEGIC) &&
    workflows4.includes(WorkflowType.OPPORTUNITY) &&
    workflows4.includes(WorkflowType.RISK),
    `Workflows: ${workflows4.join(', ')}`
  );

} catch (error) {
  logTest('determineWorkflowsForCustomer works', false, error.message);
}

// ============================================================================
// TEST 6: Workflow Determination Explanations
// ============================================================================
logSection('TEST 6: Workflow Determination Explanations');

try {
  const testCustomer = {
    customer_id: 'cust-019',
    domain: 'explanation-test.com',
    renewal_id: 'renewal-123',
    renewal_date: '2026-02-15',
    days_until_renewal: 60,
    account_plan: 'invest',
    arr: 250000
  };

  const explanation = getWorkflowDeterminationExplanation(testCustomer);

  logTest(
    'Explanation includes customer identification',
    explanation.customer_id === testCustomer.customer_id &&
    explanation.domain === testCustomer.domain,
    `${explanation.domain} (${explanation.customer_id})`
  );

  logTest(
    'Explanation lists applicable workflows',
    Array.isArray(explanation.workflows) &&
    explanation.workflows.length > 0,
    `${explanation.workflows.length} workflows: ${explanation.workflows.join(', ')}`
  );

  logTest(
    'Explanation provides reasons for each workflow',
    explanation.reasons && Object.keys(explanation.reasons).length > 0,
    `Reasons provided for ${Object.keys(explanation.reasons).length} workflows`
  );

  logTest(
    'Renewal reason mentions days until renewal',
    explanation.reasons.renewal && explanation.reasons.renewal.includes('60 days'),
    explanation.reasons.renewal
  );

  logTest(
    'Strategic reason mentions account plan',
    explanation.reasons.strategic && explanation.reasons.strategic.includes('invest'),
    explanation.reasons.strategic
  );

  console.log('\n📋 Sample Workflow Determination Explanation:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(explanation, null, 2));

} catch (error) {
  logTest('Explanation function works', false, error.message);
}

// ============================================================================
// TEST 7: Real Database Customers
// ============================================================================
logSection('TEST 7: Real Database Customers - Workflow Assignment');

try {
  const realCustomers = getCustomersNeedingWorkflows(sampleCompany.id);

  logTest(
    'Can determine workflows for real database customers',
    realCustomers.length > 0,
    `Processing ${realCustomers.length} customers from database`
  );

  // Analyze real customers
  let renewalCount = 0;
  let strategicCount = 0;
  let multiWorkflowCount = 0;

  console.log('\n📋 Real Customer Workflow Analysis:');
  console.log('─'.repeat(70));

  realCustomers.forEach(customer => {
    const workflows = determineWorkflowsForCustomer(customer);

    if (workflows.includes(WorkflowType.RENEWAL)) renewalCount++;
    if (workflows.includes(WorkflowType.STRATEGIC)) strategicCount++;
    if (workflows.length > 1) multiWorkflowCount++;

    if (workflows.length > 0) {
      console.log(`\n  ${customer.domain.padEnd(30)} | ARR: $${String(customer.arr).padStart(8)}`);
      console.log(`    Account Plan: ${(customer.account_plan || 'none').padEnd(10)} | Days: ${String(customer.days_until_renewal).padStart(4)} | Stage: ${customer.renewal_stage}`);
      console.log(`    Workflows: ${workflows.join(', ')}`);
    }
  });

  console.log('\n  Summary:');
  console.log(`    Total customers: ${realCustomers.length}`);
  console.log(`    Renewal workflows: ${renewalCount}`);
  console.log(`    Strategic workflows: ${strategicCount}`);
  console.log(`    Customers with multiple workflows: ${multiWorkflowCount}`);

  logTest(
    'At least one customer has renewal workflow',
    renewalCount > 0,
    `${renewalCount} customers need renewal workflows`
  );

  logTest(
    'Some customers have multiple workflows',
    multiWorkflowCount > 0,
    `${multiWorkflowCount} customers have 2+ workflows`
  );

  // Test specific scenarios with real data
  const investCustomers = realCustomers.filter(c => c.account_plan === 'invest');
  const expandCustomers = realCustomers.filter(c => c.account_plan === 'expand');

  if (investCustomers.length > 0) {
    const investWorkflows = determineWorkflowsForCustomer(investCustomers[0]);
    logTest(
      'Real "invest" customer gets strategic workflow',
      investWorkflows.includes(WorkflowType.STRATEGIC),
      `${investCustomers[0].domain} has invest plan`
    );
  }

  if (expandCustomers.length > 0) {
    const expandWorkflows = determineWorkflowsForCustomer(expandCustomers[0]);
    logTest(
      'Real "expand" customer gets strategic workflow',
      expandWorkflows.includes(WorkflowType.STRATEGIC),
      `${expandCustomers[0].domain} has expand plan`
    );
  }

} catch (error) {
  logTest('Real customer workflow determination works', false, error.message);
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
  console.log('║  ✅ ALL TESTS PASSED - WORKFLOW DETERMINATION READY FOR TASK 4    ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME TESTS FAILED - PLEASE REVIEW AND FIX BEFORE TASK 4       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}
