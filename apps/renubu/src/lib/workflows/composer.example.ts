/**
 * Workflow Composer Examples
 *
 * This file demonstrates how to use the workflow composer to:
 * 1. Compose workflows from slide library
 * 2. Validate compositions
 * 3. Build complete configs
 * 4. Create workflow variants
 */

import {
  composeWorkflow,
  validateComposition,
  buildWorkflowConfig,
  previewComposition,
  cloneComposition,
} from './composer';
import { executiveContactLostComposition } from './compositions/executiveContactLostComposition';
import { standardRenewalComposition } from './compositions/standardRenewalComposition';

/**
 * Example 1: Compose a workflow from definition
 */
export function example1_ComposeWorkflow() {
  console.log('=== Example 1: Compose Workflow ===\n');

  // Compose the executive contact lost workflow
  const slides = composeWorkflow(executiveContactLostComposition);

  console.log(`Composed ${slides.length} slides:`);
  slides.forEach((slide, index) => {
    console.log(`  ${index + 1}. ${slide.title} slide`);
  });

  return slides;
}

/**
 * Example 2: Validate a composition
 */
export function example2_ValidateComposition() {
  console.log('\n=== Example 2: Validate Composition ===\n');

  // Validate a good composition
  const goodValidation = validateComposition(executiveContactLostComposition);
  console.log('Executive Contact Lost validation:', goodValidation);

  // Validate a bad composition
  const badComposition = {
    id: 'bad-workflow',
    name: 'Bad Workflow',
    moduleId: 'customer-success',
    category: 'risk' as const,
    description: 'A bad workflow for testing validation',
    slideSequence: ['greeting', 'nonexistent-slide', 'workflow-summary'],
  };

  const badValidation = validateComposition(badComposition);
  console.log('\nBad workflow validation:', badValidation);

  return { goodValidation, badValidation };
}

/**
 * Example 3: Build complete WorkflowConfig
 */
export function example3_BuildWorkflowConfig() {
  console.log('\n=== Example 3: Build WorkflowConfig ===\n');

  // Customer data (would come from database)
  const customerContext = {
    name: 'Acme Corp',
    current_arr: 250000,
    health_score: 72,
    renewal_date: '2026-03-15',
    contract_start_date: '2025-03-15',
    contract_end_date: '2026-03-15',
  };

  // Build complete config
  const config = buildWorkflowConfig(
    executiveContactLostComposition,
    customerContext
  );

  console.log('Generated config:');
  console.log(`  Customer: ${config.customer?.name}`);
  console.log(`  Slides: ${config.slides?.length}`);
  console.log(`  Has layout settings: ${Boolean(config.layout)}`);
  console.log(`  Has chat settings: ${Boolean(config.chat)}`);

  return config;
}

/**
 * Example 4: Preview a composition
 */
export function example4_PreviewComposition() {
  console.log('\n=== Example 4: Preview Composition ===\n');

  const preview = previewComposition(standardRenewalComposition);

  console.log(`Workflow: ${preview.name}`);
  console.log(`Category: ${preview.category}`);
  console.log(`Slides: ${preview.slideCount}`);
  console.log(`Sequence: ${preview.slideIds.join(' → ')}`);
  console.log(`Has contexts: ${preview.hasContexts}`);
  console.log(`Valid: ${preview.validation.valid}`);

  return preview;
}

/**
 * Example 5: Create workflow variants
 */
export function example5_CreateVariants() {
  console.log('\n=== Example 5: Create Workflow Variants ===\n');

  // Create a "Quick Renewal" variant - only 4 slides instead of 9
  const quickRenewal = cloneComposition(standardRenewalComposition, {
    id: 'quick-renewal',
    name: 'Quick Renewal',
    description: 'Streamlined renewal workflow for low-touch customers',
    slideSequence: [
      'greeting',
      'review-account',
      'prepare-quote',
      'workflow-summary',
    ],
  });

  console.log('Original renewal:');
  console.log(`  Slides: ${standardRenewalComposition.slideSequence.length}`);
  console.log(`  Sequence: ${standardRenewalComposition.slideSequence.join(', ')}`);

  console.log('\nQuick renewal variant:');
  console.log(`  Slides: ${quickRenewal.slideSequence.length}`);
  console.log(`  Sequence: ${quickRenewal.slideSequence.join(', ')}`);
  console.log(`  Time saved: ~${(standardRenewalComposition.slideSequence.length - quickRenewal.slideSequence.length) * 3} minutes`);

  return quickRenewal;
}

/**
 * Example 6: Same slide, different behavior via context
 */
export function example6_ContextCustomization() {
  console.log('\n=== Example 6: Context-Based Customization ===\n');

  console.log('The "prepare-quote" slide is used in BOTH workflows:\n');

  console.log('Risk workflow context:');
  console.log(
    JSON.stringify(
      executiveContactLostComposition.slideContexts?.['prepare-quote'],
      null,
      2
    )
  );
  console.log('→ Produces: "I\'ve drafted a RETENTION OFFER for {{customer}}..."\n');

  console.log('Renewal workflow context:');
  console.log(
    JSON.stringify(
      standardRenewalComposition.slideContexts?.['prepare-quote'],
      null,
      2
    )
  );
  console.log('→ Produces: "I\'ve prepared a RENEWAL QUOTE for {{customer}}..."\n');

  console.log('✅ Same slide code, different output based on context!');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  example1_ComposeWorkflow();
  example2_ValidateComposition();
  example3_BuildWorkflowConfig();
  example4_PreviewComposition();
  example5_CreateVariants();
  example6_ContextCustomization();

  console.log('\n=== All Examples Complete ===\n');
}

// Uncomment to run examples:
// runAllExamples();
