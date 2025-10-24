/**
 * Test Suite for Configuration Data Access Layer
 *
 * Tests the database-backed configuration system including:
 * - Plans and workflows queries
 * - Scoring and workflow properties
 * - Caching functionality
 * - Update operations
 */

const {
  // Plans
  getAllPlans,
  getPlanByKey,
  getPlanById,

  // Workflows
  getWorkflowsByPlan,
  getWorkflowByKey,
  getWorkflowById,
  getRenewalWorkflowByDays,

  // Scoring configuration
  getAllScoringProperties,
  getScoringProperty,

  // Workflow configuration
  getAllWorkflowProperties,
  getWorkflowProperty,

  // Unified config
  getAllConfig,
  invalidateCache,

  // Database connection
  db
} = require('./config-data-access');

// Test counters
let passed = 0;
let failed = 0;
let total = 0;

function test(description, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✅ ${description}`);
  } catch (error) {
    failed++;
    console.log(`  ❌ ${description}`);
    console.log(`     Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║         CONFIGURATION DATA ACCESS LAYER TEST SUITE                ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// ============================================================================
// TEST SUITE 1: Plans Table
// ============================================================================

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  TEST SUITE 1: Plans Table Queries');
console.log('══════════════════════════════════════════════════════════════════════\n');

test('getAllPlans returns array of plans', () => {
  const plans = getAllPlans();
  assert(Array.isArray(plans), 'Should return array');
  assert(plans.length === 4, `Should return 4 plans, got ${plans.length}`);
});

test('Plans are returned in display_order', () => {
  const plans = getAllPlans();
  const orders = plans.map(p => p.display_order);
  assert(orders[0] === 1 && orders[1] === 2, 'Should be ordered by display_order');
});

test('Each plan has required fields', () => {
  const plan = getAllPlans()[0];
  assert(plan.id, 'Plan should have id');
  assert(plan.plan_key, 'Plan should have plan_key');
  assert(plan.plan_name, 'Plan should have plan_name');
  assert(plan.icon, 'Plan should have icon');
});

test('getPlanByKey returns correct plan', () => {
  const plan = getPlanByKey('renewal');
  assert(plan !== null, 'Should find renewal plan');
  assertEqual(plan.plan_key, 'renewal', 'Should return renewal plan');
  assertEqual(plan.plan_name, 'Renewal Planning', 'Should have correct name');
});

test('getPlanByKey returns undefined for invalid key', () => {
  const plan = getPlanByKey('invalid-plan-key');
  assertEqual(plan, undefined, 'Should return undefined for invalid key');
});

test('getPlanById returns correct plan', () => {
  const plan = getPlanById('plan-strategic');
  assert(plan !== null, 'Should find strategic plan');
  assertEqual(plan.plan_key, 'strategic', 'Should return strategic plan');
});

console.log('\n📋 Sample Plan Data:');
console.log('──────────────────────────────────────────────────────────────────────');
const samplePlan = getAllPlans()[0];
console.log(`  Plan: ${samplePlan.plan_name} (${samplePlan.plan_key})`);
console.log(`  Icon: ${samplePlan.icon}  Color: ${samplePlan.color}`);
console.log(`  Auto-assign: ${samplePlan.auto_assign ? 'Yes' : 'No'}  Requires approval: ${samplePlan.requires_approval ? 'Yes' : 'No'}`);

// ============================================================================
// TEST SUITE 2: Workflows Table
// ============================================================================

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  TEST SUITE 2: Workflows Table Queries');
console.log('══════════════════════════════════════════════════════════════════════\n');

test('getWorkflowsByPlan returns workflows for plan', () => {
  const workflows = getWorkflowsByPlan('plan-renewal');
  assert(Array.isArray(workflows), 'Should return array');
  assert(workflows.length === 9, `Should return 9 renewal workflows, got ${workflows.length}`);
});

test('Workflows are returned in sequence_order', () => {
  const workflows = getWorkflowsByPlan('plan-renewal');
  const orders = workflows.map(w => w.sequence_order);
  assert(orders[0] < orders[1], 'Should be ordered by sequence_order');
});

test('Each workflow has required fields', () => {
  const workflow = getWorkflowsByPlan('plan-renewal')[0];
  assert(workflow.id, 'Workflow should have id');
  assert(workflow.plan_id, 'Workflow should have plan_id');
  assert(workflow.workflow_key, 'Workflow should have workflow_key');
  assert(workflow.workflow_name, 'Workflow should have workflow_name');
  assert(workflow.trigger_type, 'Workflow should have trigger_type');
  assert(workflow.template_file, 'Workflow should have template_file');
});

test('getWorkflowByKey returns correct workflow', () => {
  const workflow = getWorkflowByKey('plan-renewal', 'overdue');
  assert(workflow !== null, 'Should find overdue workflow');
  assertEqual(workflow.workflow_key, 'overdue', 'Should return overdue workflow');
  assertEqual(workflow.urgency_score, 100, 'Should have urgency score 100');
});

test('getWorkflowById returns correct workflow', () => {
  const workflow = getWorkflowById('wf-renewal-emergency');
  assert(workflow !== null, 'Should find emergency workflow');
  assertEqual(workflow.workflow_key, 'emergency', 'Should return emergency workflow');
});

test('Workflow trigger_config is valid JSON', () => {
  const workflow = getWorkflowByKey('plan-renewal', 'overdue');
  const config = JSON.parse(workflow.trigger_config);
  assert(config.days_max !== undefined, 'Should have days_max in config');
});

console.log('\n📋 Sample Workflow Data:');
console.log('──────────────────────────────────────────────────────────────────────');
const sampleWorkflow = getWorkflowByKey('plan-renewal', 'emergency');
console.log(`  Workflow: ${sampleWorkflow.workflow_name} (${sampleWorkflow.workflow_key})`);
console.log(`  Icon: ${sampleWorkflow.icon}  Urgency: ${sampleWorkflow.urgency_score}`);
console.log(`  Trigger: ${sampleWorkflow.trigger_type} - ${sampleWorkflow.trigger_config}`);
console.log(`  Template: ${sampleWorkflow.template_file}`);

// ============================================================================
// TEST SUITE 3: Renewal Workflow by Days
// ============================================================================

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  TEST SUITE 3: getRenewalWorkflowByDays Logic');
console.log('══════════════════════════════════════════════════════════════════════\n');

test('Days -5 returns Overdue workflow', () => {
  const workflow = getRenewalWorkflowByDays(-5);
  assertEqual(workflow.workflow_key, 'overdue', 'Should return overdue for negative days');
});

test('Days 0 returns Emergency workflow', () => {
  const workflow = getRenewalWorkflowByDays(0);
  assertEqual(workflow.workflow_key, 'emergency', 'Should return emergency for day 0');
});

test('Days 5 returns Emergency workflow', () => {
  const workflow = getRenewalWorkflowByDays(5);
  assertEqual(workflow.workflow_key, 'emergency', 'Should return emergency for days 0-6');
});

test('Days 10 returns Critical workflow', () => {
  const workflow = getRenewalWorkflowByDays(10);
  assertEqual(workflow.workflow_key, 'critical', 'Should return critical for days 7-13');
});

test('Days 75 returns Negotiate workflow', () => {
  const workflow = getRenewalWorkflowByDays(75);
  assertEqual(workflow.workflow_key, 'negotiate', 'Should return negotiate for days 60-89');
});

test('Days 200 returns Monitor workflow', () => {
  const workflow = getRenewalWorkflowByDays(200);
  assertEqual(workflow.workflow_key, 'monitor', 'Should return monitor for 180+ days');
});

console.log('\n📋 Renewal Stage Boundaries:');
console.log('──────────────────────────────────────────────────────────────────────');
const testDays = [-5, 0, 7, 14, 30, 60, 90, 120, 180, 200];
testDays.forEach(days => {
  const workflow = getRenewalWorkflowByDays(days);
  console.log(`  ${days.toString().padStart(4)} days → ${workflow.workflow_name.padEnd(20)} (urgency: ${workflow.urgency_score})`);
});

// ============================================================================
// TEST SUITE 4: Scoring Properties
// ============================================================================

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  TEST SUITE 4: Scoring Properties');
console.log('══════════════════════════════════════════════════════════════════════\n');

test('getAllScoringProperties returns object', () => {
  const props = getAllScoringProperties();
  assert(typeof props === 'object', 'Should return object');
  assert(Object.keys(props).length > 0, 'Should have properties');
});

test('Scoring properties are parsed by type', () => {
  const props = getAllScoringProperties();
  assert(typeof props.arr_breakpoints === 'object', 'arr_breakpoints should be object');
  assert(typeof props.opportunity_base_score === 'number', 'opportunity_base_score should be number');
});

test('arr_breakpoints has high and medium thresholds', () => {
  const breakpoints = getScoringProperty('arr_breakpoints');
  assert(breakpoints.high === 150000, 'High threshold should be 150000');
  assert(breakpoints.medium === 100000, 'Medium threshold should be 100000');
});

test('arr_multipliers has correct values', () => {
  const multipliers = getScoringProperty('arr_multipliers');
  assert(multipliers.high === 2.0, 'High multiplier should be 2.0');
  assert(multipliers.medium === 1.5, 'Medium multiplier should be 1.5');
  assert(multipliers.low === 1.0, 'Low multiplier should be 1.0');
});

test('account_plan_multipliers has all plan types', () => {
  const multipliers = getScoringProperty('account_plan_multipliers');
  assert(multipliers.invest, 'Should have invest multiplier');
  assert(multipliers.expand, 'Should have expand multiplier');
  assert(multipliers.manage, 'Should have manage multiplier');
  assert(multipliers.monitor, 'Should have monitor multiplier');
});

test('experience_multipliers has all levels', () => {
  const multipliers = getScoringProperty('experience_multipliers');
  assert(multipliers.expert === 1.2, 'Expert should be 1.2');
  assert(multipliers.junior === 0.9, 'Junior should be 0.9');
});

console.log('\n📋 Scoring Configuration Sample:');
console.log('──────────────────────────────────────────────────────────────────────');
const arrBreakpoints = getScoringProperty('arr_breakpoints');
const arrMultipliers = getScoringProperty('arr_multipliers');
console.log('  ARR Scoring:');
console.log(`    High tier ($${arrBreakpoints.high.toLocaleString()}+): ${arrMultipliers.high}x`);
console.log(`    Medium tier ($${arrBreakpoints.medium.toLocaleString()}+): ${arrMultipliers.medium}x`);
console.log(`    Low tier: ${arrMultipliers.low}x`);

// ============================================================================
// TEST SUITE 5: Workflow Properties
// ============================================================================

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  TEST SUITE 5: Workflow Properties');
console.log('══════════════════════════════════════════════════════════════════════\n');

test('getAllWorkflowProperties returns object', () => {
  const props = getAllWorkflowProperties();
  assert(typeof props === 'object', 'Should return object');
  assert(Object.keys(props).length > 0, 'Should have properties');
});

test('opportunity_score_min has correct value', () => {
  const minScore = getWorkflowProperty('opportunity_score_min');
  assertEqual(minScore, 70, 'Opportunity min score should be 70');
});

test('risk_score_min has correct value', () => {
  const minScore = getWorkflowProperty('risk_score_min');
  assertEqual(minScore, 60, 'Risk min score should be 60');
});

test('renewal_advance_days has correct value', () => {
  const days = getWorkflowProperty('renewal_advance_days');
  assertEqual(days, 365, 'Renewal advance days should be 365');
});

console.log('\n📋 Workflow Properties:');
console.log('──────────────────────────────────────────────────────────────────────');
const workflowProps = getAllWorkflowProperties();
Object.entries(workflowProps).forEach(([key, value]) => {
  console.log(`  ${key}: ${value}`);
});

// ============================================================================
// TEST SUITE 6: Unified Config with Caching
// ============================================================================

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  TEST SUITE 6: Unified Config and Caching');
console.log('══════════════════════════════════════════════════════════════════════\n');

test('getAllConfig returns complete config object', () => {
  const config = getAllConfig();
  assert(config.plans, 'Should have plans');
  assert(config.scoring, 'Should have scoring');
  assert(config.workflow, 'Should have workflow properties');
  assert(config.loaded_at, 'Should have loaded_at timestamp');
});

test('Config has correct structure', () => {
  const config = getAllConfig();
  assert(Array.isArray(config.plans), 'Plans should be array');
  assert(typeof config.scoring === 'object', 'Scoring should be object');
  assert(typeof config.workflow === 'object', 'Workflow should be object');
});

test('Cache returns same object on subsequent calls', () => {
  const config1 = getAllConfig();
  const config2 = getAllConfig();
  assertEqual(config1.loaded_at, config2.loaded_at, 'Should return cached config');
});

test('invalidateCache forces reload', () => {
  const config1 = getAllConfig();
  invalidateCache();
  // Wait a tiny bit to ensure timestamp changes
  const now = Date.now();
  while (Date.now() === now) { }
  const config2 = getAllConfig();
  assert(config1.loaded_at !== config2.loaded_at, 'Should reload after invalidation');
});

test('Force refresh bypasses cache', () => {
  const config1 = getAllConfig();
  // Wait a tiny bit to ensure timestamp changes
  const now = Date.now();
  while (Date.now() === now) { }
  const config2 = getAllConfig(true);
  assert(config1.loaded_at !== config2.loaded_at, 'Should reload when forced');
});

console.log('\n📋 Unified Config Structure:');
console.log('──────────────────────────────────────────────────────────────────────');
const unifiedConfig = getAllConfig();
console.log(`  Plans: ${unifiedConfig.plans.length} types`);
console.log(`  Scoring properties: ${Object.keys(unifiedConfig.scoring).length} settings`);
console.log(`  Workflow properties: ${Object.keys(unifiedConfig.workflow).length} settings`);
console.log(`  Last loaded: ${unifiedConfig.loaded_at}`);

// ============================================================================
// TEST RESULTS
// ============================================================================

console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  TEST RESULTS');
console.log('══════════════════════════════════════════════════════════════════════\n');
console.log(`  ✅ Passed: ${passed}`);
console.log(`  ❌ Failed: ${failed}`);
console.log(`  📊 Total:  ${total}\n`);

// Close database connection
db.close();

if (failed === 0) {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ✅ ALL TESTS PASSED - CONFIG DATA ACCESS LAYER WORKING           ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME TESTS FAILED - REVIEW ERRORS ABOVE                       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}
