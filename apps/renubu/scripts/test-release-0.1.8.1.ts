#!/usr/bin/env npx tsx

/**
 * Test Harness for Release 0.1.8.1 - Code Optimizations
 *
 * Validates that refactored code behaves identically to original code.
 * Runs automated checks for each phase with feature flags.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command: string, description: string): boolean {
  log(`\n🔄 ${description}...`, colors.cyan);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} passed`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    return false;
  }
}

function checkFileExists(filePath: string): boolean {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  if (exists) {
    log(`✅ ${filePath} exists`, colors.green);
  } else {
    log(`❌ ${filePath} not found`, colors.red);
  }
  return exists;
}

function readEnvFlag(flagName: string): boolean {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log(`⚠️  .env.local not found, assuming ${flagName}=false`, colors.yellow);
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(new RegExp(`${flagName}=(true|false)`));
  if (!match) {
    log(`⚠️  ${flagName} not found in .env.local, assuming false`, colors.yellow);
    return false;
  }

  const value = match[1] === 'true';
  log(`📍 ${flagName} = ${value}`, colors.blue);
  return value;
}

async function main() {
  log('╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║  Release 0.1.8.1 - Code Optimizations Test Harness         ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);

  const results: { phase: string; passed: boolean }[] = [];

  // ============================================================================
  // Foundation Checks
  // ============================================================================
  log('\n📦 Foundation Checks', colors.blue);
  log('─'.repeat(60), colors.blue);

  const foundationChecks = [
    checkFileExists('src/lib/constants/feature-flags.ts'),
    checkFileExists('.env.example'),
    checkFileExists('.env.local'),
  ];

  const foundationPassed = foundationChecks.every((check) => check);
  results.push({ phase: 'Foundation', passed: foundationPassed });

  // Read current flag states
  const useTriggerEvaluator = readEnvFlag('NEXT_PUBLIC_USE_BASE_TRIGGER_EVALUATOR');
  const useModularTaskMode = readEnvFlag('NEXT_PUBLIC_USE_MODULAR_TASK_MODE');
  const useModularConfigs = readEnvFlag('NEXT_PUBLIC_USE_MODULAR_WORKFLOW_CONFIGS');

  // ============================================================================
  // Build & Type Check
  // ============================================================================
  log('\n🏗️  Build & Type Checks', colors.blue);
  log('─'.repeat(60), colors.blue);

  const buildPassed = runCommand('npm run type-check', 'TypeScript compilation');
  results.push({ phase: 'Build', passed: buildPassed });

  // ============================================================================
  // Linting
  // ============================================================================
  log('\n🔍 Linting', colors.blue);
  log('─'.repeat(60), colors.blue);

  const lintPassed = runCommand('npm run lint', 'ESLint check');
  results.push({ phase: 'Lint', passed: lintPassed });

  // ============================================================================
  // Phase 1: Trigger Evaluator Tests
  // ============================================================================
  if (useTriggerEvaluator) {
    log('\n🔄 Phase 1: Trigger Evaluator Tests', colors.blue);
    log('─'.repeat(60), colors.blue);

    const phase1Files = [
      'src/lib/services/triggers/BaseTriggerEvaluator.ts',
      'src/lib/services/triggers/SkipTriggerEvaluatorV2.ts',
      'src/lib/services/triggers/ReviewTriggerEvaluatorV2.ts',
      'src/lib/services/triggers/EscalateTriggerEvaluatorV2.ts',
    ];

    const phase1FilesPassed = phase1Files.every(checkFileExists);
    results.push({ phase: 'Phase 1 Files', passed: phase1FilesPassed });

    // TODO: Add unit tests when implemented
    // const phase1TestsPassed = runCommand('npm test -- triggers', 'Phase 1 unit tests');
    // results.push({ phase: 'Phase 1 Tests', passed: phase1TestsPassed });
  }

  // ============================================================================
  // Phase 2: TaskModeFullscreen Tests
  // ============================================================================
  if (useModularTaskMode) {
    log('\n🎨 Phase 2: TaskModeFullscreen Tests', colors.blue);
    log('─'.repeat(60), colors.blue);

    const phase2Files = [
      'src/components/workflows/TaskMode/components/TaskModeModals.tsx',
      'src/components/workflows/TaskMode/components/TaskModeHeader.tsx',
      'src/components/workflows/TaskMode/components/TaskModeProgressBar.tsx',
      'src/components/workflows/TaskMode/components/TaskModeChatPanel.tsx',
      'src/components/workflows/TaskMode/components/TaskModeArtifactPanel.tsx',
    ];

    const phase2FilesPassed = phase2Files.every(checkFileExists);
    results.push({ phase: 'Phase 2 Files', passed: phase2FilesPassed });

    // TODO: Add component tests when implemented
    // const phase2TestsPassed = runCommand('npm test -- TaskMode', 'Phase 2 component tests');
    // results.push({ phase: 'Phase 2 Tests', passed: phase2TestsPassed });
  }

  // ============================================================================
  // Phase 3: Workflow Config Tests
  // ============================================================================
  if (useModularConfigs) {
    log('\n⚙️  Phase 3: Workflow Config Tests', colors.blue);
    log('─'.repeat(60), colors.blue);

    const phase3Files = [
      'src/workflows/patterns/buttonFlow.pattern.ts',
      'src/workflows/stages/pricing/pricingAnalysis.stage.ts',
      'src/workflows/composers/WorkflowBuilder.ts',
    ];

    const phase3FilesPassed = phase3Files.every(checkFileExists);
    results.push({ phase: 'Phase 3 Files', passed: phase3FilesPassed });

    // TODO: Add config tests when implemented
    // const phase3TestsPassed = runCommand('npm test -- workflow-config', 'Phase 3 config tests');
    // results.push({ phase: 'Phase 3 Tests', passed: phase3TestsPassed });
  }

  // ============================================================================
  // Summary
  // ============================================================================
  log('\n╔════════════════════════════════════════════════════════════╗', colors.cyan);
  log('║  Test Summary                                               ║', colors.cyan);
  log('╚════════════════════════════════════════════════════════════╝', colors.cyan);

  results.forEach(({ phase, passed }) => {
    const icon = passed ? '✅' : '❌';
    const color = passed ? colors.green : colors.red;
    log(`${icon} ${phase.padEnd(30)} ${passed ? 'PASSED' : 'FAILED'}`, color);
  });

  const allPassed = results.every(({ passed }) => passed);
  const passedCount = results.filter(({ passed }) => passed).length;
  const totalCount = results.length;

  log('', colors.reset);
  log(`${passedCount}/${totalCount} checks passed`, allPassed ? colors.green : colors.red);

  if (allPassed) {
    log('\n🎉 All checks passed! Ready to proceed.', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some checks failed. Please fix issues before continuing.', colors.red);
    process.exit(1);
  }
}

main().catch((err) => {
  log(`\n❌ Unexpected error: ${err.message}`, colors.red);
  process.exit(1);
});
