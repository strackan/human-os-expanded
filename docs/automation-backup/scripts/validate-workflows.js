/**
 * Workflow JSON Validation Script (Node.js)
 *
 * Validates extracted workflow JSON files to ensure:
 * - Valid JSON syntax
 * - Required fields present
 * - UI artifacts excluded (as designed)
 * - Notifications present
 * - Template syntax valid
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Test counters
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Helper functions
function printSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
  passedTests++;
  totalTests++;
}

function printFailure(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
  failedTests++;
  totalTests++;
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
 * Test 1: JSON Syntax Validation
 */
function validateJsonSyntax(filePath) {
  printHeader(`Test 1: JSON Syntax Validation - ${path.basename(filePath)}`);

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    printSuccess('Valid JSON syntax');
    return true;
  } catch (error) {
    printFailure(`Invalid JSON syntax: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Required Fields
 */
function validateRequiredFields(workflow, filePath) {
  printHeader(`Test 2: Required Fields - ${path.basename(filePath)}`);

  const requiredFields = ['id', 'name', 'description', 'version', 'trigger', 'context', 'steps'];
  let allPresent = true;

  requiredFields.forEach(field => {
    if (workflow.hasOwnProperty(field) && workflow[field] !== null && workflow[field] !== undefined) {
      printSuccess(`Field '${field}' present`);
    } else {
      printFailure(`Field '${field}' missing or null`);
      allPresent = false;
    }
  });

  return allPresent;
}

/**
 * Test 3: UI Artifacts Excluded
 */
function validateNoUiArtifacts(workflow, filePath) {
  printHeader(`Test 3: UI Artifacts Excluded - ${path.basename(filePath)}`);

  const stepsWithArtifacts = workflow.steps.filter(step => step.ui && step.ui.artifacts);

  if (stepsWithArtifacts.length > 0) {
    printFailure(`UI artifacts found in ${stepsWithArtifacts.length} steps (should be excluded)`);
    printInfo(`Found in steps: ${stepsWithArtifacts.map(s => s.id).join(', ')}`);
    return false;
  } else {
    printSuccess('No UI artifacts found (correctly excluded)');
    return true;
  }
}

/**
 * Test 4: UI Actions Excluded
 */
function validateNoUiActions(workflow, filePath) {
  printHeader(`Test 4: UI Actions Excluded - ${path.basename(filePath)}`);

  const stepsWithActions = workflow.steps.filter(step => step.ui && step.ui.actions);

  if (stepsWithActions.length > 0) {
    printFailure(`UI actions found in ${stepsWithActions.length} steps (should be excluded)`);
    printInfo(`Found in steps: ${stepsWithActions.map(s => s.id).join(', ')}`);
    return false;
  } else {
    printSuccess('No UI actions found (correctly excluded)');
    return true;
  }
}

/**
 * Test 5: Notifications Present
 */
function validateHasNotifications(workflow, filePath) {
  printHeader(`Test 5: Notifications Present - ${path.basename(filePath)}`);

  const notificationCounts = {};
  let totalNotifications = 0;

  workflow.steps.forEach(step => {
    if (step.notifications && Array.isArray(step.notifications)) {
      notificationCounts[step.id] = step.notifications.length;
      totalNotifications += step.notifications.length;
    }
  });

  if (totalNotifications > 0) {
    printSuccess(`Found ${totalNotifications} notifications across ${Object.keys(notificationCounts).length} steps`);
    Object.entries(notificationCounts).forEach(([stepId, count]) => {
      printInfo(`  Step: ${stepId} - ${count} notification(s)`);
    });
    return true;
  } else {
    printFailure('No notifications found');
    return false;
  }
}

/**
 * Test 6: Handlebars Template Syntax
 */
function validateTemplateSyntax(workflow, filePath) {
  printHeader(`Test 6: Handlebars Template Syntax - ${path.basename(filePath)}`);

  let templateCount = 0;
  let syntaxValid = true;
  const errors = [];

  // Recursively find all template strings
  function findTemplates(obj, path = '') {
    if (typeof obj === 'string') {
      if (obj.includes('{{')) {
        templateCount++;
        const opening = (obj.match(/\{\{/g) || []).length;
        const closing = (obj.match(/\}\}/g) || []).length;

        if (opening !== closing) {
          errors.push({ path, template: obj.substring(0, 100), opening, closing });
          syntaxValid = false;
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => findTemplates(item, `${path}[${index}]`));
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => findTemplates(value, path ? `${path}.${key}` : key));
    }
  }

  findTemplates(workflow);

  if (syntaxValid) {
    printSuccess(`All ${templateCount} templates have matching braces`);
  } else {
    printFailure(`Found ${errors.length} templates with mismatched braces`);
    errors.forEach(err => {
      printInfo(`  Path: ${err.path}, Opening: ${err.opening}, Closing: ${err.closing}`);
    });
  }

  return syntaxValid;
}

/**
 * Test 7: Workflow Structure
 */
function validateWorkflowStructure(workflow, filePath) {
  printHeader(`Test 7: Workflow Structure - ${path.basename(filePath)}`);

  printInfo(`Found ${workflow.steps.length} steps`);

  let allStepsValid = true;

  workflow.steps.forEach((step, index) => {
    if (!step.id) {
      printFailure(`Step ${index} missing 'id'`);
      allStepsValid = false;
    } else if (!step.name) {
      printFailure(`Step ${index} (${step.id}) missing 'name'`);
      allStepsValid = false;
    } else if (!step.type) {
      printFailure(`Step ${index} (${step.id}) missing 'type'`);
      allStepsValid = false;
    } else {
      printSuccess(`Step: ${step.id} (${step.name}) - type: ${step.type}`);
    }
  });

  return allStepsValid;
}

/**
 * Test 8: Notification Structure
 */
function validateNotificationStructure(workflow, filePath) {
  printHeader(`Test 8: Notification Structure - ${path.basename(filePath)}`);

  let allValid = true;
  let notificationCount = 0;

  workflow.steps.forEach(step => {
    if (step.notifications && Array.isArray(step.notifications)) {
      step.notifications.forEach((notification, index) => {
        notificationCount++;
        const hasType = !!notification.type;
        const hasTitle = !!notification.title;
        const hasRecipients = !!notification.recipients;

        if (hasType && hasTitle && hasRecipients) {
          printSuccess(`Step ${step.id}: notification ${index + 1} (${notification.type}) has required fields`);
        } else {
          const missing = [];
          if (!hasType) missing.push('type');
          if (!hasTitle) missing.push('title');
          if (!hasRecipients) missing.push('recipients');
          printFailure(`Step ${step.id}: notification ${index + 1} missing: ${missing.join(', ')}`);
          allValid = false;
        }
      });
    }
  });

  if (notificationCount === 0) {
    printInfo('No notifications to validate');
  }

  return allValid;
}

/**
 * Main validation function
 */
function validateWorkflow(filePath) {
  console.log('');
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Validating: ${path.basename(filePath)}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════════${colors.reset}`);

  // Test 1: Parse JSON
  if (!validateJsonSyntax(filePath)) {
    printInfo('Skipping remaining tests due to JSON syntax error');
    return;
  }

  // Load workflow
  const workflow = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Run all tests
  validateRequiredFields(workflow, filePath);
  validateNoUiArtifacts(workflow, filePath);
  validateNoUiActions(workflow, filePath);
  validateHasNotifications(workflow, filePath);
  validateTemplateSyntax(workflow, filePath);
  validateWorkflowStructure(workflow, filePath);
  validateNotificationStructure(workflow, filePath);
}

/**
 * Main execution
 */
function main() {
  const workflowsDir = path.join(__dirname, '..', 'database', 'seeds', 'workflows');

  printHeader('Workflow JSON Validation Suite');
  printInfo(`Validating workflows in: ${workflowsDir}`);

  // Find all JSON files
  const files = fs.readdirSync(workflowsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(workflowsDir, file))
    .sort();

  if (files.length === 0) {
    console.log(`${colors.red}No workflow JSON files found in ${workflowsDir}${colors.reset}`);
    process.exit(1);
  }

  printInfo(`Found ${files.length} workflow files`);

  // Validate each workflow
  files.forEach(validateWorkflow);

  // Summary
  console.log('');
  printHeader('VALIDATION SUMMARY');
  console.log(`Total tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log('');

  if (failedTests === 0) {
    console.log(`${colors.green}✓ All validations passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some validations failed${colors.reset}`);
    process.exit(1);
  }
}

// Run main
main();
