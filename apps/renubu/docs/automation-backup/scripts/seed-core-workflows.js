/**
 * Seed Core Workflows to Database
 *
 * Reads the 3 core workflow JSON files and inserts them into the workflows table.
 * These are marked as is_core = TRUE and tenant_id = NULL (global).
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'renubu',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function printError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function printInfo(message) {
  console.log(`${colors.yellow}ℹ ${message}${colors.reset}`);
}

function printHeader(message) {
  console.log('');
  console.log(`${colors.blue}===================================================================${colors.reset}`);
  console.log(`${colors.blue}${message}${colors.reset}`);
  console.log(`${colors.blue}===================================================================${colors.reset}`);
}

/**
 * Seed a single workflow
 */
async function seedWorkflow(client, filePath) {
  const fileName = path.basename(filePath);
  printInfo(`Processing: ${fileName}`);

  try {
    // Read and parse JSON file
    const content = fs.readFileSync(filePath, 'utf8');
    const workflow = JSON.parse(content);

    // Insert workflow
    const query = `
      INSERT INTO workflows (
        workflow_id,
        name,
        description,
        version,
        config,
        is_core,
        tenant_id,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, TRUE, NULL, NOW(), NOW()
      )
      ON CONFLICT (workflow_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        version = EXCLUDED.version,
        config = EXCLUDED.config,
        updated_at = NOW()
      RETURNING id, workflow_id, name;
    `;

    const values = [
      workflow.id,
      workflow.name,
      workflow.description,
      workflow.version,
      JSON.stringify(workflow),
    ];

    const result = await client.query(query, values);
    const inserted = result.rows[0];

    printSuccess(`Inserted/Updated: ${inserted.name} (${inserted.workflow_id})`);
    printInfo(`  UUID: ${inserted.id}`);
    printInfo(`  Steps: ${workflow.steps.length}`);

    // Count notifications
    let notificationCount = 0;
    workflow.steps.forEach(step => {
      if (step.notifications) {
        notificationCount += step.notifications.length;
      }
    });
    printInfo(`  Notifications: ${notificationCount}`);

    return true;
  } catch (error) {
    printError(`Failed to seed ${fileName}: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  printHeader('Seeding Core Workflows to Database');

  const workflowsDir = path.join(__dirname, '..', 'database', 'seeds', 'workflows');
  printInfo(`Reading workflows from: ${workflowsDir}`);

  // Find all JSON files
  const files = fs.readdirSync(workflowsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(workflowsDir, file))
    .sort();

  if (files.length === 0) {
    printError('No workflow JSON files found');
    process.exit(1);
  }

  printInfo(`Found ${files.length} workflow files`);

  // Connect to database
  const client = await pool.connect();
  let successCount = 0;
  let failureCount = 0;

  try {
    // Begin transaction
    await client.query('BEGIN');
    printInfo('Transaction started');

    // Seed each workflow
    for (const file of files) {
      console.log('');
      const success = await seedWorkflow(client, file);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    // Commit transaction
    await client.query('COMMIT');
    printSuccess('Transaction committed');

    // Summary
    printHeader('Seeding Summary');
    console.log(`Total workflows: ${files.length}`);
    console.log(`${colors.green}Successfully seeded: ${successCount}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failureCount}${colors.reset}`);

    if (failureCount === 0) {
      console.log('');
      printSuccess('All workflows seeded successfully!');
      process.exit(0);
    } else {
      console.log('');
      printError('Some workflows failed to seed');
      process.exit(1);
    }
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    printError('Transaction rolled back');
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run main
main().catch(err => {
  console.error(err);
  process.exit(1);
});
