const Database = require('better-sqlite3');

const db = new Database('renubu-test.db', { readonly: true });

const plans = db.prepare(`
  SELECT
    ap.*,
    co.name as customer_name
  FROM account_plan ap
  LEFT JOIN customers c ON ap.customer_id = c.id
  LEFT JOIN companies co ON c.company_id = co.id
  ORDER BY customer_name, plan_type
`).all();

console.log('\n📋 Account Plans in Database:\n');
plans.forEach(p => {
  console.log(`  ${p.customer_name} - ${p.plan_type.toUpperCase()} (active: ${p.active ? 'Yes' : 'No'}, started: ${p.start_date})`);
});

console.log(`\n  Total: ${plans.length} plans`);

db.close();
