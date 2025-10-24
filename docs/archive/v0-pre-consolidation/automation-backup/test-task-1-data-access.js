/**
 * Task 1 Validation Test: Data Access Layer
 *
 * Run this test to validate that all data access functions work correctly
 * and return data in the expected format for building the workflow system.
 *
 * USAGE: node test-task-1-data-access.js
 */

const Database = require('better-sqlite3');
const {
  getCustomerData,
  getUserCustomers,
  getCustomerContacts,
  getActiveRenewals,
  getCustomerRenewals,
  getCustomersNeedingWorkflows,
  closeDatabase
} = require('./workflow-data-access.js');

console.log('\n╔════════════════════════════════════════════════════════════════════╗');
console.log('║         TASK 1: DATA ACCESS LAYER VALIDATION TEST                 ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

// Get sample data from database for testing
const db = new Database('renubu-test.db', { readonly: true });

// Get a sample customer
const sampleCustomer = db.prepare('SELECT id, domain FROM customers LIMIT 1').get();
// Get a sample owner/CSM
const sampleOwner = db.prepare('SELECT id, full_name FROM users LIMIT 1').get();
// Get a sample company
const sampleCompany = db.prepare('SELECT id, name FROM companies LIMIT 1').get();

db.close();

if (!sampleCustomer || !sampleOwner || !sampleCompany) {
  console.error('❌ ERROR: Database not seeded. Run `node seed.js` first.\n');
  process.exit(1);
}

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
// TEST 1: getCustomerData()
// ============================================================================
logSection('TEST 1: getCustomerData() - Comprehensive Customer Data');

try {
  const customerData = getCustomerData(sampleCustomer.id);

  logTest(
    'Returns customer data',
    customerData !== null && customerData.customer !== undefined,
    `Domain: ${customerData?.customer?.domain}`
  );

  logTest(
    'Includes contract data',
    customerData.contract !== null,
    `Contract: ${customerData?.contract?.contract_number}`
  );

  logTest(
    'Includes renewal data',
    customerData.renewal !== null,
    `Status: ${customerData?.renewal?.status}`
  );

  logTest(
    'Calculates days_until_renewal',
    typeof customerData.days_until_renewal === 'number',
    `Days until renewal: ${customerData.days_until_renewal}`
  );

  logTest(
    'Calculates renewal_stage',
    typeof customerData.renewal_stage === 'string' && customerData.renewal_stage.length > 0,
    `Stage: ${customerData.renewal_stage}`
  );

  logTest(
    'Includes account_plan if exists',
    customerData.account_plan !== undefined,
    `Account plan: ${customerData.account_plan || 'none'}`
  );

  console.log('\n📋 Sample Customer Data Structure:');
  console.log('─'.repeat(70));
  console.log(JSON.stringify(customerData, null, 2));

} catch (error) {
  logTest('getCustomerData() executes without errors', false, error.message);
}

// ============================================================================
// TEST 2: getCustomerData() with options
// ============================================================================
logSection('TEST 2: getCustomerData() - Optional Filtering');

try {
  const customerDataWithContacts = getCustomerData(sampleCustomer.id, { includeContacts: true });

  logTest(
    'includeContacts option adds contacts array',
    Array.isArray(customerDataWithContacts.contacts),
    `Contacts: ${customerDataWithContacts.contacts.length} found`
  );

  const customerDataWithHistory = getCustomerData(sampleCustomer.id, { includeHistory: true });

  logTest(
    'includeHistory option adds renewal_history array',
    Array.isArray(customerDataWithHistory.renewal_history),
    `Renewal history: ${customerDataWithHistory.renewal_history.length} records`
  );

} catch (error) {
  logTest('Optional filtering works', false, error.message);
}

// ============================================================================
// TEST 3: getUserCustomers()
// ============================================================================
logSection('TEST 3: getUserCustomers() - CSM Customer List');

try {
  const csmCustomers = getUserCustomers(sampleOwner.id);

  logTest(
    'Returns array of customers',
    Array.isArray(csmCustomers),
    `Found ${csmCustomers.length} customers for ${sampleOwner.full_name}`
  );

  if (csmCustomers.length > 0) {
    const firstCustomer = csmCustomers[0];

    logTest(
      'Includes essential fields',
      firstCustomer.domain && firstCustomer.arr !== undefined && firstCustomer.renewal_date,
      `Domain: ${firstCustomer.domain}, ARR: $${firstCustomer.arr?.toLocaleString()}`
    );

    logTest(
      'Includes calculated days_until_renewal',
      typeof firstCustomer.days_until_renewal === 'number',
      `Days until renewal: ${firstCustomer.days_until_renewal}`
    );

    logTest(
      'Includes calculated renewal_stage',
      typeof firstCustomer.renewal_stage === 'string',
      `Stage: ${firstCustomer.renewal_stage}`
    );

    console.log('\n📋 Sample CSM Customer List:');
    console.log('─'.repeat(70));
    csmCustomers.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.domain.padEnd(30)} | ARR: $${String(c.arr).padStart(8)} | ${c.days_until_renewal} days | ${c.renewal_stage}`);
    });
  }

} catch (error) {
  logTest('getUserCustomers() executes without errors', false, error.message);
}

// ============================================================================
// TEST 4: getActiveRenewals()
// ============================================================================
logSection('TEST 4: getActiveRenewals() - All Open Renewals');

try {
  const activeRenewals = getActiveRenewals();

  logTest(
    'Returns array of renewals',
    Array.isArray(activeRenewals),
    `Found ${activeRenewals.length} active renewals`
  );

  const companyRenewals = getActiveRenewals(sampleCompany.id);

  logTest(
    'Company filter works',
    Array.isArray(companyRenewals),
    `Found ${companyRenewals.length} renewals for ${sampleCompany.name}`
  );

  if (activeRenewals.length > 0) {
    const firstRenewal = activeRenewals[0];

    logTest(
      'Includes renewal and customer data',
      firstRenewal.renewal_id && firstRenewal.customer_id && firstRenewal.domain,
      `${firstRenewal.domain} - ${firstRenewal.contract_number}`
    );

    logTest(
      'Includes calculated days_until_renewal',
      typeof firstRenewal.days_until_renewal === 'number',
      `Days: ${firstRenewal.days_until_renewal}`
    );

    logTest(
      'Includes calculated renewal_stage',
      typeof firstRenewal.renewal_stage === 'string',
      `Stage: ${firstRenewal.renewal_stage}`
    );

    console.log('\n📋 Active Renewals (Top 5):');
    console.log('─'.repeat(70));
    activeRenewals.slice(0, 5).forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.domain.padEnd(30)} | ${String(r.days_until_renewal).padStart(4)} days | ${r.renewal_stage.padEnd(12)} | $${r.arr?.toLocaleString()}`);
    });
  }

} catch (error) {
  logTest('getActiveRenewals() executes without errors', false, error.message);
}

// ============================================================================
// TEST 5: getCustomerRenewals()
// ============================================================================
logSection('TEST 5: getCustomerRenewals() - Year-by-Year History');

try {
  const renewalHistory = getCustomerRenewals(sampleCustomer.id);

  logTest(
    'Returns renewal history array',
    Array.isArray(renewalHistory),
    `Found ${renewalHistory.length} historical renewals for ${sampleCustomer.domain}`
  );

  if (renewalHistory.length > 0) {
    const firstRenewal = renewalHistory[0];

    logTest(
      'Includes from/to ARR amounts',
      firstRenewal.from_arr !== undefined && firstRenewal.to_arr !== undefined,
      `From: $${firstRenewal.from_arr?.toLocaleString()} → To: $${firstRenewal.to_arr?.toLocaleString()}`
    );

    logTest(
      'Includes dates and contract info',
      firstRenewal.start_date && firstRenewal.end_date && firstRenewal.contract_number,
      `Contract: ${firstRenewal.contract_number}`
    );

    console.log('\n📋 Renewal History for ' + sampleCustomer.domain + ':');
    console.log('─'.repeat(70));
    renewalHistory.forEach((r, i) => {
      const growth = r.to_arr && r.from_arr ? ((r.to_arr - r.from_arr) / r.from_arr * 100).toFixed(1) : 'N/A';
      console.log(`  ${i + 1}. ${r.start_date} to ${r.end_date} | $${r.from_arr?.toLocaleString()} → $${r.to_arr?.toLocaleString()} | ${growth}% growth | ${r.status}`);
    });
  }

} catch (error) {
  logTest('getCustomerRenewals() executes without errors', false, error.message);
}

// ============================================================================
// TEST 6: getCustomerContacts()
// ============================================================================
logSection('TEST 6: getCustomerContacts() - Customer Contacts');

try {
  const contacts = getCustomerContacts(sampleCustomer.id);

  logTest(
    'Returns contacts array',
    Array.isArray(contacts),
    `Found ${contacts.length} contacts (contacts table not yet implemented, returns customer_properties)`
  );

  logTest(
    'Query executes without errors',
    true,
    'Ready for future contacts table integration'
  );

} catch (error) {
  logTest('getCustomerContacts() executes without errors', false, error.message);
}

// ============================================================================
// TEST 7: getCustomersNeedingWorkflows()
// ============================================================================
logSection('TEST 7: getCustomersNeedingWorkflows() - Workflow Generation Data');

try {
  const workflowCustomers = getCustomersNeedingWorkflows(sampleCompany.id);

  logTest(
    'Returns customers array',
    Array.isArray(workflowCustomers),
    `Found ${workflowCustomers.length} customers needing workflows`
  );

  const ownerWorkflowCustomers = getCustomersNeedingWorkflows(sampleCompany.id, sampleOwner.id);

  logTest(
    'Owner filter works',
    Array.isArray(ownerWorkflowCustomers),
    `Found ${ownerWorkflowCustomers.length} customers for owner ${sampleOwner.full_name}`
  );

  if (workflowCustomers.length > 0) {
    const firstCustomer = workflowCustomers[0];

    logTest(
      'Includes complete workflow context',
      firstCustomer.customer_id &&
      firstCustomer.domain &&
      firstCustomer.arr !== undefined &&
      firstCustomer.days_until_renewal !== undefined &&
      firstCustomer.renewal_stage,
      `Complete data for ${firstCustomer.domain}`
    );

    logTest(
      'Includes contract and renewal IDs',
      firstCustomer.contract_id !== undefined && firstCustomer.renewal_id !== undefined,
      `Contract: ${firstCustomer.contract_id}, Renewal: ${firstCustomer.renewal_id}`
    );

    logTest(
      'Includes account_plan',
      firstCustomer.account_plan !== undefined,
      `Account plan: ${firstCustomer.account_plan || 'none'}`
    );

    console.log('\n📋 Customers Needing Workflows (Top 5):');
    console.log('─'.repeat(70));
    workflowCustomers.slice(0, 5).forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.domain.padEnd(30)} | ${String(c.days_until_renewal).padStart(4)} days | ${c.renewal_stage.padEnd(12)} | Plan: ${(c.account_plan || 'none').padEnd(8)} | $${c.arr?.toLocaleString()}`);
    });
  }

} catch (error) {
  logTest('getCustomersNeedingWorkflows() executes without errors', false, error.message);
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
  console.log('║  ✅ ALL TESTS PASSED - DATA ACCESS LAYER READY FOR TASK 2         ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);
} else {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║  ❌ SOME TESTS FAILED - PLEASE REVIEW AND FIX BEFORE TASK 2       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');
  process.exit(1);
}

closeDatabase();
