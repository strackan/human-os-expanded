/**
 * Check ACO Demo Data Script
 * Purpose: Verify if ACO customer and demo data exists in database
 */

import { execSync } from 'child_process';

console.log('🔍 Checking for existing ACO demo data...\n');

// Helper to run SQL via Supabase CLI
function runSQL(sql, description) {
  console.log(`Checking: ${description}...`);
  try {
    const result = execSync(
      `npx supabase db execute "${sql.replace(/"/g, '\\"')}"`,
      {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      }
    );
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, stderr: error.stderr };
  }
}

// Check 1: ACO Customer
console.log('\n1️⃣ Checking for ACO customer...');
const customerCheck = runSQL(
  "SELECT id, name, arr, health_score, is_demo FROM customers WHERE name = 'Apex Consolidated Operations' LIMIT 1;",
  'ACO Customer'
);

if (customerCheck.success && customerCheck.output.includes('Apex Consolidated Operations')) {
  console.log('  ✅ ACO customer EXISTS');
  console.log(customerCheck.output);
} else {
  console.log('  ❌ ACO customer NOT FOUND');
}

// Check 2: Demo Operations
console.log('\n2️⃣ Checking for Operation Blackout...');
const operationsCheck = runSQL(
  "SELECT name, status, cost_impact FROM demo_operations WHERE name = 'Operation Blackout' LIMIT 1;",
  'Operation Blackout'
);

if (operationsCheck.success && operationsCheck.output.includes('Operation Blackout')) {
  console.log('  ✅ Operation Blackout EXISTS');
  console.log(operationsCheck.output);
} else {
  console.log('  ❌ Operation Blackout NOT FOUND');
}

// Check 3: Demo Support Tickets
console.log('\n3️⃣ Checking for demo support tickets...');
const ticketsCheck = runSQL(
  "SELECT COUNT(*) as ticket_count FROM demo_support_tickets;",
  'Demo Support Tickets'
);

if (ticketsCheck.success) {
  console.log('  ✅ Demo tickets table accessible');
  console.log(ticketsCheck.output);
} else {
  console.log('  ❌ Demo tickets table not accessible');
}

// Check 4: Contacts
console.log('\n4️⃣ Checking for ACO contacts (Marcus & Elena)...');
const contactsCheck = runSQL(
  "SELECT first_name, last_name, title FROM contacts WHERE customer_id IN (SELECT id FROM customers WHERE name = 'Apex Consolidated Operations');",
  'ACO Contacts'
);

if (contactsCheck.success) {
  console.log('  ✅ Contacts query successful');
  console.log(contactsCheck.output);
} else {
  console.log('  ❌ Contacts query failed');
}

console.log('\n' + '='.repeat(60));
console.log('Summary: Check output above to determine if seeding is needed');
console.log('='.repeat(60) + '\n');
