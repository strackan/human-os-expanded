/**
 * Test script for renewal workflow mapper
 * Demonstrates automatic workflow assignment based on renewal stage
 */

const { getRenewalStage } = require('./renewal-helpers');
const {
  getConfigForStage,
  generateRenewalWorkflow,
  getAllStages,
  hasWorkflowForStage
} = require('./renewal-workflow-mapper');

console.log('\n🧪 TESTING RENEWAL WORKFLOW MAPPER\n');
console.log('='.repeat(80));

// Test 1: List all stages
console.log('\n📋 All Available Renewal Stages:');
const stages = getAllStages();
stages.forEach((stage, index) => {
  console.log(`  ${index + 1}. ${stage}`);
});

// Test 2: Test stage to config mapping
console.log('\n🔄 Stage to Config Mapping Test:\n');

const testCases = [
  { days: -5, customer: 'pastdue.com', arr: 50000 },
  { days: 3, customer: 'urgent.com', arr: 100000 },
  { days: 10, customer: 'critical.com', arr: 75000 },
  { days: 20, customer: 'signature.com', arr: 150000 },
  { days: 45, customer: 'finalize.com', arr: 200000 },
  { days: 75, customer: 'negotiate.com', arr: 85000 },
  { days: 100, customer: 'engage.com', arr: 120000 },
  { days: 150, customer: 'prepare.com', arr: 95000 },
  { days: 200, customer: 'monitor.com', arr: 180000 }
];

testCases.forEach(testCase => {
  const stage = getRenewalStage(testCase.days);
  const hasWorkflow = hasWorkflowForStage(stage);

  console.log(`${testCase.customer.padEnd(20)} | ${String(testCase.days).padStart(4)} days | Stage: ${stage.padEnd(12)} | Has workflow: ${hasWorkflow ? '✅' : '❌'}`);

  // Try to get the config
  try {
    const config = getConfigForStage(stage);
    console.log(`  → Config: ${config.stage} - ${config.description}`);
  } catch (error) {
    console.log(`  → Error: ${error.message}`);
  }
  console.log('');
});

// Test 3: Generate full workflow instance
console.log('\n🎯 Generate Workflow Instance Example:\n');

const mockCustomer = {
  id: 'cust-123',
  domain: 'example.com',
  arr: 125000
};

const mockRenewal = {
  id: 'renewal-456',
  days_until_renewal: 75
};

try {
  const workflow = generateRenewalWorkflow(mockCustomer, mockRenewal);

  console.log('Customer:', mockCustomer.domain);
  console.log('Days until renewal:', mockRenewal.days_until_renewal);
  console.log('Generated Stage:', workflow._metadata.stage);
  console.log('Workflow Config:', workflow.stage, '-', workflow.description);
  console.log('Metadata:', JSON.stringify(workflow._metadata, null, 2));
} catch (error) {
  console.log('Error:', error.message);
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ Workflow mapping system ready!');
console.log('📝 Next step: Design actual workflow configs for each stage\n');
