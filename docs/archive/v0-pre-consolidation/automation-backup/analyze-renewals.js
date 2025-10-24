const Database = require('better-sqlite3');
const { getRenewalStage, getStageIcon } = require('./renewal-helpers');

const db = new Database('renubu-test.db', { readonly: true });

console.log('\n📅 DAYS UNTIL RENEWAL ANALYSIS\n');
console.log('='.repeat(80));

// Get all customers with their renewal dates
const customers = db.prepare(`
  SELECT
    c.domain,
    c.renewal_date,
    c.arr,
    CAST((julianday(c.renewal_date) - julianday('now')) AS INTEGER) as days_until_renewal
  FROM customers c
  ORDER BY days_until_renewal ASC
`).all();

console.log('\n📊 CUSTOMERS BY RENEWAL STAGE:\n');

customers.forEach(c => {
  const daysUntil = c.days_until_renewal;
  const monthsUntil = (daysUntil / 30).toFixed(1);
  const stage = getRenewalStage(daysUntil);
  const icon = getStageIcon(stage);

  console.log(`  ${icon} ${stage.padEnd(12)} | ${c.domain.padEnd(30)} | ${String(daysUntil).padStart(4)} days (${String(monthsUntil).padStart(4)} months) | $${c.arr.toLocaleString().padStart(10)} ARR`);
});

// Calculate statistics
const daysUntilRenewal = customers.map(c => c.days_until_renewal);
const avgDays = daysUntilRenewal.reduce((a, b) => a + b, 0) / daysUntilRenewal.length;
const minDays = Math.min(...daysUntilRenewal);
const maxDays = Math.max(...daysUntilRenewal);
const medianDays = daysUntilRenewal.sort((a, b) => a - b)[Math.floor(daysUntilRenewal.length / 2)];

console.log('\n📈 STATISTICS:\n');
console.log(`  Average days until renewal: ${Math.round(avgDays)} days (${(avgDays / 30).toFixed(1)} months)`);
console.log(`  Median days until renewal: ${medianDays} days (${(medianDays / 30).toFixed(1)} months)`);
console.log(`  Range: ${minDays} - ${maxDays} days (${(minDays / 30).toFixed(1)} - ${(maxDays / 30).toFixed(1)} months)`);

// Group by urgency buckets
const urgent = customers.filter(c => c.days_until_renewal < 60);
const soon = customers.filter(c => c.days_until_renewal >= 60 && c.days_until_renewal < 90);
const upcoming = customers.filter(c => c.days_until_renewal >= 90 && c.days_until_renewal < 180);
const later = customers.filter(c => c.days_until_renewal >= 180);

console.log('\n🎯 RENEWAL URGENCY BUCKETS:\n');
console.log(`  🔴 Urgent (< 60 days):      ${urgent.length} customers`);
console.log(`  🟡 Soon (60-90 days):       ${soon.length} customers`);
console.log(`  🟠 Upcoming (90-180 days):  ${upcoming.length} customers`);
console.log(`  🟢 Later (180+ days):       ${later.length} customers`);

// Group by renewal stage
const stageGroups = {};
customers.forEach(c => {
  const stage = getRenewalStage(c.days_until_renewal);
  if (!stageGroups[stage]) {
    stageGroups[stage] = [];
  }
  stageGroups[stage].push(c);
});

console.log('\n📋 CUSTOMERS BY RENEWAL STAGE:\n');
const stageOrder = ['Overdue', 'Emergency', 'Critical', 'Signature', 'Finalize', 'Negotiate', 'Engage', 'Prepare', 'Monitor'];
stageOrder.forEach(stage => {
  const customers = stageGroups[stage] || [];
  if (customers.length > 0) {
    const icon = getStageIcon(stage);
    const totalARR = customers.reduce((sum, c) => sum + c.arr, 0);
    console.log(`  ${icon} ${stage.padEnd(12)} - ${customers.length} customers - $${totalARR.toLocaleString()} ARR`);
  }
});

console.log('\n' + '='.repeat(80) + '\n');

db.close();
