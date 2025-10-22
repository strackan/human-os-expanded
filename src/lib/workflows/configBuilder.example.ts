/**
 * Config Builder Examples
 *
 * This file demonstrates the complete workflow config building pipeline:
 * 1. Fetching data from database
 * 2. Composing slides from library
 * 3. Hydrating with customer data
 * 4. Building complete configs
 */

import {
  buildWorkflowConfigFromDatabase,
  buildWorkflowConfigFromExecution,
  previewWorkflow,
  getAvailableWorkflows,
} from './configBuilder';

/**
 * Example 1: Build workflow config from scratch
 *
 * This is the most common use case - you have a workflow ID and customer ID,
 * and you want to build a complete config.
 */
export async function example1_BuildFromDatabase() {
  console.log('=== Example 1: Build Config from Database ===\n');

  // Build a renewal workflow for a customer
  const config = await buildWorkflowConfigFromDatabase(
    'standard-renewal', // Workflow ID
    '550e8400-e29b-41d4-a716-446655440001' // Customer ID (Obsidian Black from demo)
  );

  if (config) {
    console.log('✅ Config built successfully!');
    console.log(`  Customer: ${config.customer.name}`);
    console.log(`  Slides: ${config.slides.length}`);
    console.log(`  First slide layout: ${config.slides[0]?.layout}`);

    // You can now use this config in TaskMode:
    // <TaskModeFullscreen config={config} />
  } else {
    console.log('❌ Failed to build config');
  }

  return config;
}

/**
 * Example 2: Build from execution ID
 *
 * When you have a workflow_executions row, you can build the config directly
 * from the execution ID. This is useful for resuming workflows.
 */
export async function example2_BuildFromExecution() {
  console.log('\n=== Example 2: Build from Execution ID ===\n');

  const config = await buildWorkflowConfigFromExecution(
    'some-execution-uuid-here'
  );

  if (config) {
    console.log('✅ Config loaded from execution!');
    console.log(`  Customer: ${config.customer.name}`);
    console.log(`  Slides: ${config.slides.length}`);
  }

  return config;
}

/**
 * Example 3: Preview workflows
 *
 * Get a quick preview without building the full config.
 */
export async function example3_PreviewWorkflows() {
  console.log('\n=== Example 3: Preview Workflows ===\n');

  // Preview what a renewal workflow would look like for a customer
  const preview = await previewWorkflow(
    'standard-renewal',
    '550e8400-e29b-41d4-a716-446655440001'
  );

  if (preview) {
    console.log('Workflow preview:');
    console.log(`  Workflow: ${preview.workflowName}`);
    console.log(`  Customer: ${preview.customer.name}`);
    console.log(`  Slides: ${preview.slideCount}`);
    console.log(`  Sequence: ${preview.slideSequence.join(' → ')}`);
  }

  return preview;
}

/**
 * Example 4: List available workflows
 */
export async function example4_ListWorkflows() {
  console.log('\n=== Example 4: Available Workflows ===\n');

  const workflows = getAvailableWorkflows();

  console.log(`Found ${workflows.length} workflows:\n`);

  workflows.forEach((workflow, index) => {
    console.log(`${index + 1}. ${workflow.name}`);
    console.log(`   ID: ${workflow.id}`);
    console.log(`   Category: ${workflow.category}`);
    console.log('');
  });

  return workflows;
}

/**
 * Example 5: Building with additional context
 *
 * You can pass additional context for workflow-specific data.
 */
export async function example5_BuildWithContext() {
  console.log('\n=== Example 5: Build with Additional Context ===\n');

  const config = await buildWorkflowConfigFromDatabase(
    'exec-contact-lost',
    '550e8400-e29b-41d4-a716-446655440001',
    {
      // CSM who owns this workflow
      csmId: 'some-csm-uuid',

      // Additional context specific to this workflow
      additionalContext: {
        departed_contact: {
          name: 'Jane Smith',
          title: 'VP of Engineering',
          departure_date: '2025-10-15',
        },
        replacement_contact: {
          name: 'John Doe',
          title: 'SVP of Engineering',
          email: 'john.doe@acme.com',
        },
      },
    }
  );

  if (config) {
    console.log('✅ Config built with additional context!');
    console.log(`  Customer: ${config.customer.name}`);
    console.log(`  Slides: ${config.slides.length}`);

    // The slides will now have placeholders replaced:
    // {{departed_contact.name}} → "Jane Smith"
    // {{replacement_contact.email}} → "john.doe@acme.com"
  }

  return config;
}

/**
 * Example 6: Real-world usage in a page component
 */
export async function example6_RealWorldUsage() {
  console.log('\n=== Example 6: Real-World Usage ===\n');

  // Simulating what would happen in a Next.js page component:

  console.log('// In your page component:\n');
  console.log(`
async function WorkflowPage({ params }: { params: { customerId: string } }) {
  // Build the config
  const config = await buildWorkflowConfigFromDatabase(
    'standard-renewal',
    params.customerId
  );

  if (!config) {
    return <div>Workflow not found</div>;
  }

  // Render TaskMode with the config
  return (
    <TaskModeFullscreen
      config={config}
      onComplete={async (completed) => {
        if (completed) {
          // Update workflow_executions status to 'completed'
          await updateWorkflowStatus(executionId, 'completed');
        }
      }}
    />
  );
}
  `);

  console.log('\n✅ This is how you\'d use it in a real application!');
}

/**
 * Example 7: Complete pipeline visualization
 */
export async function example7_PipelineVisualization() {
  console.log('\n=== Example 7: Complete Pipeline ===\n');

  console.log('The config building pipeline:\n');

  console.log('1. 📋 Workflow Composition (from database or registry)');
  console.log('   ↓');
  console.log('   { id: "standard-renewal",');
  console.log('     slideSequence: ["greeting", "review-account", ...],');
  console.log('     slideContexts: { ... } }');
  console.log('');

  console.log('2. 🧩 Slide Composition (from slide library)');
  console.log('   ↓');
  console.log('   SLIDE_LIBRARY["greeting"](context) → SlideDefinition');
  console.log('   SLIDE_LIBRARY["review-account"](context) → SlideDefinition');
  console.log('   ...');
  console.log('');

  console.log('3. 💾 Data Fetching (from database)');
  console.log('   ↓');
  console.log('   SELECT * FROM customers WHERE id = ?');
  console.log('   SELECT * FROM contacts WHERE customer_id = ?');
  console.log('   SELECT * FROM contracts WHERE customer_id = ?');
  console.log('');

  console.log('4. 💧 Template Hydration (replace placeholders)');
  console.log('   ↓');
  console.log('   "Hello {{customer.name}}" → "Hello Acme Corp"');
  console.log('   "ARR: {{customer.current_arr}}" → "ARR: $250K"');
  console.log('');

  console.log('5. ✅ Complete WorkflowConfig (ready for TaskMode)');
  console.log('   ↓');
  console.log('   { customer: { name: "Acme Corp" },');
  console.log('     slides: [ ... fully hydrated slides ... ] }');
  console.log('');

  console.log('🎉 The entire pipeline is now automated and database-driven!');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  await example1_BuildFromDatabase();
  // await example2_BuildFromExecution(); // Requires valid execution ID
  await example3_PreviewWorkflows();
  await example4_ListWorkflows();
  await example5_BuildWithContext();
  example6_RealWorldUsage();
  example7_PipelineVisualization();

  console.log('\n=== All Examples Complete ===\n');
}

// Uncomment to run examples:
// runAllExamples();
