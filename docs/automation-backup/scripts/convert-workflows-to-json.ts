/**
 * Workflow TypeScript to JSON Converter
 *
 * Converts TypeScript workflow configs to JSON format for database seeding.
 *
 * Usage:
 *   npx ts-node automation/scripts/convert-workflows-to-json.ts
 *
 * Output:
 *   - JSON files in automation/database/seeds/workflows/
 *   - Validation report
 */

import * as fs from 'fs';
import * as path from 'path';

// Import workflow configs with notifications (the 3 that have been updated)
import { CriticalWorkflow } from '../renewal-configs/8-Critical';
import { EmergencyWorkflow } from '../renewal-configs/9-Emergency';
import { OverdueWorkflow } from '../renewal-configs/10-Overdue';

// Workflow mapping (only the 3 workflows with notifications for now)
const workflows = [
  { config: CriticalWorkflow, filename: '08-critical.json' },
  { config: EmergencyWorkflow, filename: '09-emergency.json' },
  { config: OverdueWorkflow, filename: '10-overdue.json' }
];

// Output directory
const outputDir = path.join(__dirname, '..', 'database', 'seeds', 'workflows');

// =====================================================
// Validation Functions
// =====================================================

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    stepCount: number;
    notificationCount: number;
    actionCount: number;
  };
}

function validateWorkflow(workflow: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let notificationCount = 0;
  let actionCount = 0;

  // Required fields
  if (!workflow.id) errors.push('Missing required field: id');
  if (!workflow.name) errors.push('Missing required field: name');
  if (!workflow.steps) errors.push('Missing required field: steps');

  // Steps validation
  if (workflow.steps && !Array.isArray(workflow.steps)) {
    errors.push('steps must be an array');
  } else if (workflow.steps) {
    workflow.steps.forEach((step: any, index: number) => {
      if (!step.id) errors.push(`Step ${index}: missing id`);
      if (!step.name) errors.push(`Step ${index}: missing name`);

      // Count notifications
      if (step.notifications && Array.isArray(step.notifications)) {
        notificationCount += step.notifications.length;

        step.notifications.forEach((notif: any, nIndex: number) => {
          if (!notif.type) errors.push(`Step ${index}, Notification ${nIndex}: missing type`);
          if (!notif.title) errors.push(`Step ${index}, Notification ${nIndex}: missing title`);
          if (!notif.recipients) errors.push(`Step ${index}, Notification ${nIndex}: missing recipients`);
        });
      }

      // Count actions
      if (step.ui?.actions && Array.isArray(step.ui.actions)) {
        actionCount += step.ui.actions.length;
      }
    });
  }

  // Warnings
  if (!workflow.description) warnings.push('Missing description (recommended)');
  if (!workflow.version) warnings.push('Missing version (recommended)');
  if (notificationCount === 0) warnings.push('No notifications configured');

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      stepCount: workflow.steps?.length || 0,
      notificationCount,
      actionCount
    }
  };
}

// =====================================================
// Conversion Function
// =====================================================

function convertWorkflow(workflow: any): string {
  // Convert to JSON with pretty formatting
  return JSON.stringify(workflow, null, 2);
}

// =====================================================
// Main Execution
// =====================================================

function main() {
  console.log('🔄 Converting TypeScript workflows to JSON...\n');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created directory: ${outputDir}\n`);
  }

  const results: Array<{
    filename: string;
    valid: boolean;
    validation: ValidationResult;
  }> = [];

  // Convert each workflow
  workflows.forEach(({ config, filename }) => {
    console.log(`Processing: ${config.name} (${config.id})`);

    // Validate
    const validation = validateWorkflow(config);

    if (!validation.valid) {
      console.log(`  ❌ Validation failed:`);
      validation.errors.forEach(err => console.log(`     - ${err}`));
    } else {
      console.log(`  ✅ Validation passed`);
    }

    if (validation.warnings.length > 0) {
      console.log(`  ⚠️  Warnings:`);
      validation.warnings.forEach(warn => console.log(`     - ${warn}`));
    }

    console.log(`  📊 Stats:`, validation.stats);

    // Convert to JSON
    const json = convertWorkflow(config);

    // Write to file
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, json, 'utf8');

    console.log(`  💾 Saved: ${outputPath}\n`);

    results.push({
      filename,
      valid: validation.valid,
      validation
    });
  });

  // Summary
  console.log('='.repeat(60));
  console.log('CONVERSION SUMMARY');
  console.log('='.repeat(60));

  const validCount = results.filter(r => r.valid).length;
  const totalNotifications = results.reduce((sum, r) => sum + r.validation.stats.notificationCount, 0);
  const totalActions = results.reduce((sum, r) => sum + r.validation.stats.actionCount, 0);

  console.log(`\nTotal workflows: ${results.length}`);
  console.log(`Valid: ${validCount}`);
  console.log(`Invalid: ${results.length - validCount}`);
  console.log(`Total notifications: ${totalNotifications}`);
  console.log(`Total actions: ${totalActions}`);

  // List invalid workflows
  const invalid = results.filter(r => !r.valid);
  if (invalid.length > 0) {
    console.log(`\n❌ Invalid workflows:`);
    invalid.forEach(r => {
      console.log(`  - ${r.filename}`);
      r.validation.errors.forEach(err => console.log(`    - ${err}`));
    });
  }

  // Generate summary report
  const report = {
    conversionDate: new Date().toISOString(),
    totalWorkflows: results.length,
    validWorkflows: validCount,
    invalidWorkflows: results.length - validCount,
    totalNotifications,
    totalActions,
    workflows: results.map(r => ({
      filename: r.filename,
      id: workflows.find(w => w.filename === r.filename)?.config.id,
      name: workflows.find(w => w.filename === r.filename)?.config.name,
      valid: r.valid,
      stats: r.validation.stats,
      errors: r.validation.errors,
      warnings: r.validation.warnings
    }))
  };

  const reportPath = path.join(outputDir, '_conversion_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n📄 Conversion report saved: ${reportPath}`);

  // Exit code
  if (validCount === results.length) {
    console.log(`\n✅ All workflows converted successfully!`);
    process.exit(0);
  } else {
    console.log(`\n❌ Some workflows failed validation. Fix errors and re-run.`);
    process.exit(1);
  }
}

// Run conversion
main();
