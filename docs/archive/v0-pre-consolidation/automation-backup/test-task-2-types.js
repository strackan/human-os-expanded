/**
 * Task 2 Validation Test: Workflow Type System
 *
 * Run this test to validate that all workflow type definitions and factory functions
 * work correctly and create proper data structures for the workflow system.
 *
 * USAGE: node test-task-2-types.js
 */

const { randomUUID } = require('crypto');
const {
  WorkflowType,
  WorkflowStatus,
  AccountPlan,
  ExperienceLevel,
  CommunicationStyle,
  WorkflowComplexity,
  createWorkflowInstance,
  createWorkflowAssignment,
  createWorkflowMetadata,
  createPriorityFactors,
  createUserContext,
  isValidWorkflowType,
  isValidWorkflowStatus,
  isValidAccountPlan
} = require('./workflow-types');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║         TASK 2: WORKFLOW TYPE SYSTEM VALIDATION TEST              ║');
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
// TEST 1: Enums Definition
// ============================================================================
logSection('TEST 1: Enums - Type Definitions');

try {
  logTest(
    'WorkflowType enum has all 4 types',
    WorkflowType.RENEWAL === 'renewal' &&
    WorkflowType.STRATEGIC === 'strategic' &&
    WorkflowType.OPPORTUNITY === 'opportunity' &&
    WorkflowType.RISK === 'risk',
    'renewal, strategic, opportunity, risk'
  );

  logTest(
    'WorkflowStatus enum has expected statuses',
    WorkflowStatus.PENDING === 'pending' &&
    WorkflowStatus.IN_PROGRESS === 'in_progress' &&
    WorkflowStatus.COMPLETED === 'completed' &&
    WorkflowStatus.SKIPPED === 'skipped' &&
    WorkflowStatus.FAILED === 'failed',
    'pending, in_progress, completed, skipped, failed'
  );

  logTest(
    'AccountPlan enum has all 4 plans',
    AccountPlan.INVEST === 'invest' &&
    AccountPlan.EXPAND === 'expand' &&
    AccountPlan.MANAGE === 'manage' &&
    AccountPlan.MONITOR === 'monitor',
    'invest, expand, manage, monitor'
  );

  logTest(
    'ExperienceLevel enum has all levels',
    ExperienceLevel.JUNIOR === 'junior' &&
    ExperienceLevel.MID === 'mid' &&
    ExperienceLevel.SENIOR === 'senior' &&
    ExperienceLevel.EXPERT === 'expert',
    'junior, mid, senior, expert'
  );

  logTest(
    'CommunicationStyle enum has expected styles',
    CommunicationStyle.FORMAL === 'formal' &&
    CommunicationStyle.STANDARD === 'standard' &&
    CommunicationStyle.CASUAL === 'casual' &&
    CommunicationStyle.TECHNICAL === 'technical',
    'formal, standard, casual, technical'
  );

  logTest(
    'WorkflowComplexity enum has complexity levels',
    WorkflowComplexity.SIMPLE === 'simple' &&
    WorkflowComplexity.STANDARD === 'standard' &&
    WorkflowComplexity.DETAILED === 'detailed',
    'simple, standard, detailed'
  );

  console.log('\n📋 Available Workflow Types:');
  console.log('─'.repeat(70));
  Object.entries(WorkflowType).forEach(([key, value]) => {
    console.log(`  ${key.padEnd(15)} = '${value}'`);
  });

} catch (error) {
  logTest('Enums defined correctly', false, error.message);
}

// ============================================================================
// TEST 2: WorkflowInstance - Create instances for all 4 types
// ============================================================================
logSection('TEST 2: WorkflowInstance - Create Workflow Instances');

try {
  // Create a renewal workflow instance
  const renewalWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'cust-001',
    config: { stage: 'Negotiate', template: 'renewal-negotiate' },
    priority_score: 85,
    metadata: { days_until_renewal: 75, renewal_stage: 'Negotiate' },
    status: WorkflowStatus.PENDING,
    assigned_to: 'user-001'
  });

  logTest(
    'Can create RENEWAL workflow instance',
    renewalWorkflow.type === 'renewal' &&
    renewalWorkflow.customer_id === 'cust-001' &&
    renewalWorkflow.priority_score === 85,
    `ID: ${renewalWorkflow.id.substring(0, 8)}..., Priority: ${renewalWorkflow.priority_score}`
  );

  // Create a strategic workflow instance
  const strategicWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.STRATEGIC,
    customer_id: 'cust-002',
    config: { account_plan: 'invest', template: 'strategic-invest' },
    priority_score: 75,
    metadata: { account_plan: 'invest', arr: 200000 },
    status: WorkflowStatus.PENDING,
    assigned_to: 'user-001'
  });

  logTest(
    'Can create STRATEGIC workflow instance',
    strategicWorkflow.type === 'strategic' &&
    strategicWorkflow.metadata.account_plan === 'invest',
    `Account plan: ${strategicWorkflow.metadata.account_plan}, Priority: ${strategicWorkflow.priority_score}`
  );

  // Create an opportunity workflow instance
  const opportunityWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.OPPORTUNITY,
    customer_id: 'cust-003',
    config: { opportunity_type: 'upsell', template: 'opportunity-upsell' },
    priority_score: 90,
    metadata: { opportunity_score: 85, estimated_value: 50000 },
    status: WorkflowStatus.PENDING
  });

  logTest(
    'Can create OPPORTUNITY workflow instance',
    opportunityWorkflow.type === 'opportunity' &&
    opportunityWorkflow.metadata.opportunity_score === 85,
    `Score: ${opportunityWorkflow.metadata.opportunity_score}, Priority: ${opportunityWorkflow.priority_score}`
  );

  // Create a risk workflow instance
  const riskWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RISK,
    customer_id: 'cust-004',
    config: { risk_level: 'high', template: 'risk-high' },
    priority_score: 95,
    metadata: { risk_score: 78, churn_probability: 0.65 },
    status: WorkflowStatus.IN_PROGRESS
  });

  logTest(
    'Can create RISK workflow instance',
    riskWorkflow.type === 'risk' &&
    riskWorkflow.metadata.risk_score === 78 &&
    riskWorkflow.status === 'in_progress',
    `Risk score: ${riskWorkflow.metadata.risk_score}, Status: ${riskWorkflow.status}`
  );

  logTest(
    'WorkflowInstance has all required fields',
    renewalWorkflow.id &&
    renewalWorkflow.type &&
    renewalWorkflow.customer_id &&
    renewalWorkflow.config &&
    typeof renewalWorkflow.priority_score === 'number' &&
    renewalWorkflow.priority_factors !== undefined &&
    renewalWorkflow.metadata &&
    renewalWorkflow.status &&
    renewalWorkflow.created_at &&
    renewalWorkflow.updated_at,
    'id, type, customer_id, config, priority_score, factors, metadata, status, timestamps'
  );

  console.log('\n📋 Sample Workflow Instance (Renewal):');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(renewalWorkflow, null, 2));

} catch (error) {
  logTest('WorkflowInstance creation works', false, error.message);
}

// ============================================================================
// TEST 3: WorkflowAssignment - Combine workflow with customer data
// ============================================================================
logSection('TEST 3: WorkflowAssignment - Dashboard Output Structure');

try {
  const mockWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'cust-123',
    config: { stage: 'Critical' },
    priority_score: 95,
    status: WorkflowStatus.PENDING
  });

  const mockCustomer = {
    customer_id: 'cust-123',
    domain: 'example.com',
    arr: 125000,
    renewal_date: '2026-01-15',
    owner: 'user-456'
  };

  const mockContext = {
    days_until_renewal: 15,
    renewal_stage: 'Critical',
    account_plan: 'invest',
    opportunity_score: null,
    risk_score: null
  };

  const assignment = createWorkflowAssignment({
    workflow: mockWorkflow,
    customer: mockCustomer,
    context: mockContext
  });

  logTest(
    'WorkflowAssignment combines workflow + customer + context',
    assignment.workflow &&
    assignment.customer &&
    assignment.context,
    'All three components present'
  );

  logTest(
    'Customer data is properly formatted',
    assignment.customer.id === 'cust-123' &&
    assignment.customer.domain === 'example.com' &&
    assignment.customer.arr === 125000,
    `${assignment.customer.domain}, ARR: $${assignment.customer.arr.toLocaleString()}`
  );

  logTest(
    'Context includes renewal information',
    assignment.context.days_until_renewal === 15 &&
    assignment.context.renewal_stage === 'Critical' &&
    assignment.context.account_plan === 'invest',
    `${assignment.context.days_until_renewal} days, ${assignment.context.renewal_stage} stage, ${assignment.context.account_plan} plan`
  );

  logTest(
    'Context handles null values for future features',
    assignment.context.opportunity_score === null &&
    assignment.context.risk_score === null,
    'Opportunity and risk scores are null (not yet implemented)'
  );

  console.log('\n📋 Sample Workflow Assignment:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(assignment, null, 2));

} catch (error) {
  logTest('WorkflowAssignment creation works', false, error.message);
}

// ============================================================================
// TEST 4: PriorityFactors - Scoring breakdown
// ============================================================================
logSection('TEST 4: PriorityFactors - Scoring Transparency');

try {
  const factors = createPriorityFactors({
    base_score: 50,
    arr_multiplier: 1.5,
    urgency_score: 80,
    stage_bonus: 10,
    account_plan_multiplier: 1.2,
    opportunity_bonus: 0,
    risk_penalty: 0,
    custom: { is_overdue: false }
  });

  logTest(
    'PriorityFactors has all scoring components',
    typeof factors.base_score === 'number' &&
    typeof factors.arr_multiplier === 'number' &&
    typeof factors.urgency_score === 'number' &&
    typeof factors.stage_bonus === 'number' &&
    typeof factors.account_plan_multiplier === 'number',
    'All numeric scoring factors present'
  );

  logTest(
    'PriorityFactors supports custom fields',
    factors.custom && factors.custom.is_overdue === false,
    'Custom metadata: is_overdue = false'
  );

  const calculatedScore = (factors.base_score + factors.urgency_score + factors.stage_bonus)
    * factors.arr_multiplier
    * factors.account_plan_multiplier;

  logTest(
    'PriorityFactors enables score calculation',
    calculatedScore > 0,
    `Calculated score: ${calculatedScore.toFixed(2)} = (50 + 80 + 10) × 1.5 × 1.2`
  );

  console.log('\n📋 Sample Priority Factors:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(factors, null, 2));
  console.log(`\n  📊 Total Score: ${calculatedScore.toFixed(2)}`);

} catch (error) {
  logTest('PriorityFactors creation works', false, error.message);
}

// ============================================================================
// TEST 5: WorkflowMetadata - Extensible metadata
// ============================================================================
logSection('TEST 5: WorkflowMetadata - Workflow Context');

try {
  const metadata = createWorkflowMetadata({
    workflow_type: WorkflowType.RENEWAL,
    trigger_reason: 'Customer entering Negotiate stage',
    source_data: {
      days_until_renewal: 75,
      previous_stage: 'Engage',
      current_stage: 'Negotiate'
    },
    custom: {
      auto_generated: true,
      template_version: 'v2.1'
    }
  });

  logTest(
    'WorkflowMetadata has core fields',
    metadata.workflow_type === 'renewal' &&
    metadata.trigger_reason &&
    metadata.source_data &&
    metadata.generated_at,
    'workflow_type, trigger_reason, source_data, generated_at'
  );

  logTest(
    'WorkflowMetadata supports custom fields',
    metadata.custom.auto_generated === true &&
    metadata.custom.template_version === 'v2.1',
    'Custom fields: auto_generated, template_version'
  );

  console.log('\n📋 Sample Workflow Metadata:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(metadata, null, 2));

} catch (error) {
  logTest('WorkflowMetadata creation works', false, error.message);
}

// ============================================================================
// TEST 6: Validation Helpers
// ============================================================================
logSection('TEST 6: Validation Helpers');

try {
  logTest(
    'isValidWorkflowType validates correct types',
    isValidWorkflowType('renewal') &&
    isValidWorkflowType('strategic') &&
    isValidWorkflowType('opportunity') &&
    isValidWorkflowType('risk'),
    'All 4 workflow types are valid'
  );

  logTest(
    'isValidWorkflowType rejects invalid types',
    !isValidWorkflowType('invalid') &&
    !isValidWorkflowType('') &&
    !isValidWorkflowType(null),
    'Invalid types are rejected'
  );

  logTest(
    'isValidWorkflowStatus validates correct statuses',
    isValidWorkflowStatus('pending') &&
    isValidWorkflowStatus('in_progress') &&
    isValidWorkflowStatus('completed'),
    'Valid statuses pass validation'
  );

  logTest(
    'isValidAccountPlan validates correct plans',
    isValidAccountPlan('invest') &&
    isValidAccountPlan('expand') &&
    isValidAccountPlan('manage') &&
    isValidAccountPlan('monitor'),
    'All 4 account plans are valid'
  );

  logTest(
    'isValidAccountPlan rejects invalid plans',
    !isValidAccountPlan('invalid') &&
    !isValidAccountPlan('premium'),
    'Invalid plans are rejected'
  );

} catch (error) {
  logTest('Validation helpers work', false, error.message);
}

// ============================================================================
// TEST 7: Real-world Scenario - Multiple workflows for one customer
// ============================================================================
logSection('TEST 7: Real-World Scenario - Customer with Multiple Workflows');

try {
  const customerId = 'cust-enterprise-001';
  const customerData = {
    customer_id: customerId,
    domain: 'enterprise-corp.com',
    arr: 250000,
    renewal_date: '2026-02-15',
    owner: 'csm-jane'
  };

  // This customer is in Negotiate stage (60 days out)
  const renewalWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: customerId,
    config: { stage: 'Negotiate', template: 'renewal-negotiate' },
    priority_score: 85,
    metadata: { days_until_renewal: 60, renewal_stage: 'Negotiate' }
  });

  // They also have an invest account plan
  const strategicWorkflow = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.STRATEGIC,
    customer_id: customerId,
    config: { account_plan: 'invest', template: 'strategic-invest' },
    priority_score: 75,
    metadata: { account_plan: 'invest', arr: 250000 }
  });

  // Create assignments for both
  const renewalAssignment = createWorkflowAssignment({
    workflow: renewalWorkflow,
    customer: customerData,
    context: {
      days_until_renewal: 60,
      renewal_stage: 'Negotiate',
      account_plan: 'invest'
    }
  });

  const strategicAssignment = createWorkflowAssignment({
    workflow: strategicWorkflow,
    customer: customerData,
    context: {
      days_until_renewal: 60,
      renewal_stage: 'Negotiate',
      account_plan: 'invest'
    }
  });

  logTest(
    'Can create multiple workflows for same customer',
    renewalWorkflow.customer_id === strategicWorkflow.customer_id &&
    renewalWorkflow.type !== strategicWorkflow.type,
    `Customer ${customerId} has both renewal and strategic workflows`
  );

  logTest(
    'Workflows have different priorities',
    renewalWorkflow.priority_score !== strategicWorkflow.priority_score,
    `Renewal: ${renewalWorkflow.priority_score}, Strategic: ${strategicWorkflow.priority_score}`
  );

  logTest(
    'Both assignments share customer data',
    renewalAssignment.customer.domain === strategicAssignment.customer.domain,
    `Both reference ${renewalAssignment.customer.domain}`
  );

  console.log('\n📋 Enterprise Customer with Multiple Workflows:');
  console.log('─'.repeat(70));
  console.log(`  Customer: ${customerData.domain}`);
  console.log(`  ARR: $${customerData.arr.toLocaleString()}`);
  console.log(`  Account Plan: invest`);
  console.log(`  Days Until Renewal: 60 (Negotiate stage)`);
  console.log('\n  Workflows Assigned:');
  console.log(`    1. ${renewalWorkflow.type.toUpperCase().padEnd(12)} - Priority: ${renewalWorkflow.priority_score} - ${renewalWorkflow.config.template}`);
  console.log(`    2. ${strategicWorkflow.type.toUpperCase().padEnd(12)} - Priority: ${strategicWorkflow.priority_score} - ${strategicWorkflow.config.template}`);

} catch (error) {
  logTest('Multi-workflow scenario works', false, error.message);
}

// ============================================================================
// TEST 8: UserContext - CSM Context and Preferences
// ============================================================================
logSection('TEST 8: UserContext - CSM Personalization');

try {
  // Create a senior CSM with high performance
  const seniorCSM = createUserContext({
    user_id: 'csm-001',
    full_name: 'Sarah Johnson',
    email: 'sarah@company.com',
    experience_level: ExperienceLevel.SENIOR,
    current_workload: 12,
    specialties: ['renewals', 'enterprise', 'strategic'],
    preferences: {
      communication_style: CommunicationStyle.FORMAL,
      workflow_complexity: WorkflowComplexity.DETAILED
    },
    performance_metrics: {
      close_rate: 0.94,
      avg_response_time: 2.5,
      customer_satisfaction: 92
    },
    territories: ['North America', 'Enterprise']
  });

  logTest(
    'Can create UserContext with all fields',
    seniorCSM.user_id === 'csm-001' &&
    seniorCSM.full_name === 'Sarah Johnson' &&
    seniorCSM.experience_level === 'senior',
    `${seniorCSM.full_name} - ${seniorCSM.experience_level} level CSM`
  );

  logTest(
    'UserContext includes workload information',
    seniorCSM.current_workload === 12,
    `Current workload: ${seniorCSM.current_workload} workflows`
  );

  logTest(
    'UserContext includes specialties',
    Array.isArray(seniorCSM.specialties) &&
    seniorCSM.specialties.includes('renewals') &&
    seniorCSM.specialties.includes('enterprise'),
    `Specialties: ${seniorCSM.specialties.join(', ')}`
  );

  logTest(
    'UserContext includes preferences',
    seniorCSM.preferences.communication_style === 'formal' &&
    seniorCSM.preferences.workflow_complexity === 'detailed',
    `Prefers formal, detailed workflows`
  );

  logTest(
    'UserContext includes performance metrics',
    seniorCSM.performance_metrics.close_rate === 0.94 &&
    seniorCSM.performance_metrics.customer_satisfaction === 92,
    `94% close rate, 92 CSAT`
  );

  // Create a junior CSM
  const juniorCSM = createUserContext({
    user_id: 'csm-002',
    full_name: 'Mike Chen',
    email: 'mike@company.com',
    experience_level: ExperienceLevel.JUNIOR,
    current_workload: 5,
    specialties: ['renewals'],
    preferences: {
      communication_style: CommunicationStyle.STANDARD,
      workflow_complexity: WorkflowComplexity.SIMPLE
    },
    performance_metrics: {
      close_rate: 0.78,
      avg_response_time: 5.2,
      customer_satisfaction: 85
    },
    territories: ['SMB']
  });

  logTest(
    'Can create junior CSM with different preferences',
    juniorCSM.experience_level === 'junior' &&
    juniorCSM.preferences.workflow_complexity === 'simple',
    `${juniorCSM.full_name} - prefers simple workflows`
  );

  // Create workflow assignment with user context
  const workflowWithUserContext = createWorkflowInstance({
    id: randomUUID(),
    type: WorkflowType.RENEWAL,
    customer_id: 'cust-123',
    config: { stage: 'Negotiate', complexity: 'detailed' },
    priority_score: 85,
    assigned_to: seniorCSM.user_id
  });

  const assignmentWithUser = createWorkflowAssignment({
    workflow: workflowWithUserContext,
    customer: {
      customer_id: 'cust-123',
      domain: 'enterprise.com',
      arr: 250000,
      renewal_date: '2026-02-01',
      owner: seniorCSM.user_id
    },
    context: {
      days_until_renewal: 60,
      renewal_stage: 'Negotiate',
      account_plan: 'invest'
    },
    user_context: seniorCSM
  });

  logTest(
    'WorkflowAssignment can include user_context',
    assignmentWithUser.user_context !== null &&
    assignmentWithUser.user_context.user_id === 'csm-001',
    `Assignment includes CSM context for ${assignmentWithUser.user_context.full_name}`
  );

  logTest(
    'User context enables personalized workflows',
    assignmentWithUser.user_context.preferences.workflow_complexity === 'detailed' &&
    assignmentWithUser.workflow.config.complexity === 'detailed',
    'Workflow complexity matches CSM preference'
  );

  console.log('\n📋 Senior CSM Context:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(seniorCSM, null, 2));

  console.log('\n📋 Comparison: Senior vs Junior CSM:');
  console.log('─'.repeat(70));
  console.log(`  Senior CSM: ${seniorCSM.full_name}`);
  console.log(`    Experience: ${seniorCSM.experience_level}, Workload: ${seniorCSM.current_workload}, Close Rate: ${seniorCSM.performance_metrics.close_rate}`);
  console.log(`    Preferences: ${seniorCSM.preferences.communication_style} style, ${seniorCSM.preferences.workflow_complexity} complexity`);
  console.log(`\n  Junior CSM: ${juniorCSM.full_name}`);
  console.log(`    Experience: ${juniorCSM.experience_level}, Workload: ${juniorCSM.current_workload}, Close Rate: ${juniorCSM.performance_metrics.close_rate}`);
  console.log(`    Preferences: ${juniorCSM.preferences.communication_style} style, ${juniorCSM.preferences.workflow_complexity} complexity`);
  console.log('\n  💡 Use Cases:');
  console.log('     - Prioritize high-value renewals to senior CSMs');
  console.log('     - Adjust workflow language based on communication style');
  console.log('     - Simplify steps for junior CSMs, add detail for senior CSMs');
  console.log('     - Balance workload when assigning new workflows');

} catch (error) {
  logTest('UserContext creation and usage works', false, error.message);
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
  console.log('║  ✅ ALL TESTS PASSED - WORKFLOW TYPE SYSTEM READY FOR TASK 3      ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME TESTS FAILED - PLEASE REVIEW AND FIX BEFORE TASK 3       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}
