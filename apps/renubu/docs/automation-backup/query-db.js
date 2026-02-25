const Database = require('better-sqlite3');

const db = new Database('renubu-test.db', { readonly: true });

console.log('\n📊 DATABASE CONTENTS\n');
console.log('=' .repeat(80));

// Query companies
console.log('\n🏢 COMPANIES:');
const companies = db.prepare('SELECT * FROM companies').all();
companies.forEach(c => {
  console.log(`  ${c.name} (${c.domain})`);
});

// Query users
console.log('\n👥 USERS:');
const users = db.prepare(`
  SELECT u.*, c.name as company_name
  FROM users u
  JOIN companies c ON u.company_id = c.id
`).all();
users.forEach(u => {
  console.log(`  ${u.full_name} - ${u.email} @ ${u.company_name}`);
});

// Query customers
console.log('\n📈 CUSTOMERS:');
const customers = db.prepare(`
  SELECT
    c.domain,
    c.arr,
    c.renewal_date,
    u.full_name as owner_name,
    co.name as company_name
  FROM customers c
  JOIN users u ON c.owner = u.id
  JOIN companies co ON c.company_id = co.id
  ORDER BY c.arr DESC
`).all();

customers.forEach(c => {
  console.log(`  ${c.domain.padEnd(30)} $${c.arr.toLocaleString().padStart(10)} | Renewal: ${c.renewal_date} | Owner: ${c.owner_name} @ ${c.company_name}`);
});

// Query contracts
console.log('\n📄 CONTRACTS:');
const contracts = db.prepare(`
  SELECT
    ct.id,
    ct.contract_number,
    ct.start_date,
    ct.end_date,
    ct.initial_arr,
    ct.initial_onetime,
    ct.active,
    c.domain as customer_domain
  FROM contracts ct
  JOIN customers c ON ct.customer_id = c.id
  ORDER BY ct.start_date DESC
`).all();

contracts.forEach(ct => {
  const statusIcon = ct.active ? '🟢' : '⚪';
  const status = ct.active ? 'ACTIVE' : 'EXPIRED';
  console.log(`  ${statusIcon} ${ct.contract_number.padEnd(20)} | ${ct.customer_domain.padEnd(25)} | Initial: $${ct.initial_arr.toLocaleString().padStart(10)} ARR | Started: ${ct.start_date}`);
});

// Query renewals (grouped by contract)
console.log('\n🔄 RENEWALS (showing trends):');
const renewalsGrouped = db.prepare(`
  SELECT
    r.opp_id,
    r.start_date,
    r.end_date,
    r.starting_arr,
    r.ending_arr,
    r.status,
    r.active_stage,
    r.active,
    ct.contract_number,
    c.domain as customer_domain
  FROM renewals r
  JOIN contracts ct ON r.contract_id = ct.id
  JOIN customers c ON ct.customer_id = c.id
  ORDER BY c.domain, r.start_date ASC
`).all();

let currentCustomer = null;
renewalsGrouped.forEach(r => {
  if (currentCustomer !== r.customer_domain) {
    if (currentCustomer !== null) console.log(''); // Blank line between customers
    console.log(`\n  ${r.customer_domain} (${r.contract_number}):`);
    currentCustomer = r.customer_domain;
  }

  const statusIcon = r.active ? '🟢' : '✅';
  const endingDisplay = r.ending_arr === null ? 'OPEN' : (r.ending_arr === 0 ? 'CHURNED' : `$${r.ending_arr.toLocaleString()}`);
  const growth = r.ending_arr && r.ending_arr > 0 ? ((r.ending_arr - r.starting_arr) / r.starting_arr * 100).toFixed(1) + '%' : '';

  console.log(`    ${statusIcon} ${r.opp_id} | ${r.start_date} → ${r.end_date} | $${r.starting_arr.toLocaleString().padStart(8)} → ${endingDisplay.padEnd(10)} ${growth ? '| +' + growth : ''} | ${r.status} (${r.active_stage})`);
});

// Summary stats
console.log('\n📊 SUMMARY:');
const stats = db.prepare(`
  SELECT
    COUNT(*) as total_customers,
    SUM(arr) as total_arr,
    AVG(arr) as avg_arr,
    MIN(arr) as min_arr,
    MAX(arr) as max_arr
  FROM customers
`).get();

const contractStats = db.prepare(`
  SELECT
    COUNT(*) as total_contracts,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_contracts,
    SUM(initial_arr) as total_contract_arr,
    SUM(initial_onetime) as total_onetime
  FROM contracts
`).get();

const renewalStats = db.prepare(`
  SELECT
    COUNT(*) as total_renewals,
    SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_renewals,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_renewals
  FROM renewals
`).get();

console.log(`  Total Customers: ${stats.total_customers}`);
console.log(`  Total Contracts: ${contractStats.total_contracts} (${contractStats.active_contracts} active)`);
console.log(`  Total Renewals: ${renewalStats.total_renewals} (${renewalStats.active_renewals} active, ${renewalStats.completed_renewals} completed)`);
console.log(`  Total ARR: $${stats.total_arr.toLocaleString()}`);
console.log(`  Average ARR: $${Math.round(stats.avg_arr).toLocaleString()}`);
console.log(`  ARR Range: $${stats.min_arr.toLocaleString()} - $${stats.max_arr.toLocaleString()}`);

console.log('\n' + '='.repeat(80) + '\n');

db.close();
