/**
 * Apply Configuration Schema to Database
 *
 * Reads schema-config.sql and seed-config.sql and executes them
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'renubu-test.db');
const schemaPath = path.join(__dirname, 'schema-config.sql');
const seedPath = path.join(__dirname, 'seed-config.sql');

console.log('📊 Applying Configuration Schema');
console.log('================================\n');

// Open database
const db = new Database(dbPath);

try {
  // Read schema file
  console.log('1. Reading schema-config.sql...');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Execute schema
  console.log('2. Creating tables...');
  db.exec(schemaSql);
  console.log('   ✅ Tables created successfully\n');

  // Read seed file
  console.log('3. Reading seed-config.sql...');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  // Execute seed
  console.log('4. Inserting configuration data...');
  db.exec(seedSql);
  console.log('   ✅ Configuration data inserted successfully\n');

  // Verify tables exist
  console.log('5. Verifying tables...');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table'
      AND name IN ('plans', 'workflows', 'scoring_properties', 'workflow_properties', 'admin_log')
    ORDER BY name
  `).all();

  if (tables.length === 5) {
    console.log('   ✅ All 5 configuration tables verified:\n');
    tables.forEach(t => console.log(`      - ${t.name}`));
  } else {
    console.log(`   ⚠️  Expected 5 tables, found ${tables.length}`);
  }

  // Show configuration summary
  console.log('\n6. Configuration Summary:');
  console.log('   ========================\n');

  const planCount = db.prepare('SELECT COUNT(*) as count FROM plans').get();
  console.log(`   Plans: ${planCount.count} types`);

  const workflowCount = db.prepare('SELECT COUNT(*) as count FROM workflows').get();
  console.log(`   Workflows: ${workflowCount.count} total`);

  const scoringCount = db.prepare('SELECT COUNT(*) as count FROM scoring_properties').get();
  console.log(`   Scoring properties: ${scoringCount.count}`);

  const workflowPropCount = db.prepare('SELECT COUNT(*) as count FROM workflow_properties').get();
  console.log(`   Workflow properties: ${workflowPropCount.count}`);

  console.log('\n   Plan breakdown:');
  const plans = db.prepare(`
    SELECT p.plan_name, COUNT(w.id) as workflow_count
    FROM plans p
    LEFT JOIN workflows w ON p.id = w.plan_id
    GROUP BY p.id
    ORDER BY p.display_order
  `).all();

  plans.forEach(p => {
    console.log(`   - ${p.plan_name}: ${p.workflow_count} workflows`);
  });

  console.log('\n✅ Schema and configuration applied successfully!\n');

} catch (error) {
  console.error('\n❌ Error applying schema:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
