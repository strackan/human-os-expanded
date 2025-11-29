/**
 * Extract Workflows to JSON (Node.js)
 *
 * Simple script to extract workflow configs from TypeScript files and convert to JSON
 */

const fs = require('fs');
const path = require('path');

// Workflow files to process
const workflowFiles = [
  { file: '8-Critical.ts', output: '08-critical.json' },
  { file: '9-Emergency.ts', output: '09-emergency.json' },
  { file: '10-Overdue.ts', output: '10-overdue.json' }
];

const configsDir = path.join(__dirname, '..', 'renewal-configs');
const outputDir = path.join(__dirname, '..', 'database', 'seeds', 'workflows');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ Created directory: ${outputDir}\n`);
}

console.log('🔄 Extracting workflows from TypeScript files...\n');

// Validation stats
const stats = {
  total: 0,
  success: 0,
  failed: 0,
  totalNotifications: 0
};

workflowFiles.forEach(({ file, output }) => {
  const inputPath = path.join(configsDir, file);
  const outputPath = path.join(outputDir, output);

  console.log(`Processing: ${file}`);

  try {
    // Read TypeScript file
    const tsContent = fs.readFileSync(inputPath, 'utf8');

    // Extract the workflow object using regex
    // Find: export const XXXWorkflow: WorkflowConfig = { ... }
    const match = tsContent.match(/export const \w+Workflow.*?=\s*({[\s\S]*?});?\s*$/m);

    if (!match) {
      console.log(`  ❌ Could not find workflow export in ${file}`);
      stats.failed++;
      return;
    }

    // The captured group contains the object literal
    let objectLiteral = match[1];

    // Need to evaluate this as JavaScript to get the actual object
    // We'll use a safer approach - write a temp file and require it
    const tempFile = path.join(__dirname, `_temp_${Date.now()}.js`);

    // Create a module that exports the workflow
    const moduleContent = `
// Import statements from original file
${tsContent.match(/^import.*?$/gm)?.join('\n') || ''}

// Export the workflow
module.exports = ${objectLiteral};
`;

    fs.writeFileSync(tempFile, moduleContent, 'utf8');

    // Require it
    const workflow = require(tempFile);

    // Clean up temp file
    fs.unlinkSync(tempFile);

    // Count notifications
    let notificationCount = 0;
    if (workflow.steps && Array.isArray(workflow.steps)) {
      workflow.steps.forEach(step => {
        if (step.notifications && Array.isArray(step.notifications)) {
          notificationCount += step.notifications.length;
        }
      });
    }

    // Write JSON
    fs.writeFileSync(outputPath, JSON.stringify(workflow, null, 2), 'utf8');

    console.log(`  ✅ Extracted: ${workflow.name} (${workflow.id})`);
    console.log(`  📊 ${workflow.steps?.length || 0} steps, ${notificationCount} notifications`);
    console.log(`  💾 Saved: ${outputPath}\n`);

    stats.success++;
    stats.totalNotifications += notificationCount;

  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
    stats.failed++;
  }

  stats.total++;
});

// Summary
console.log('='.repeat(60));
console.log('EXTRACTION SUMMARY');
console.log('='.repeat(60));
console.log(`Total files: ${stats.total}`);
console.log(`Success: ${stats.success}`);
console.log(`Failed: ${stats.failed}`);
console.log(`Total notifications: ${stats.totalNotifications}`);

if (stats.success === stats.total) {
  console.log('\n✅ All workflows extracted successfully!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some workflows failed to extract');
  process.exit(1);
}
