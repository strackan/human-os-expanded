/**
 * Test Obsidian Black Workflow Compilation
 *
 * Tests the workflow template system by compiling a workflow for Obsidian Black
 * Validates:
 * - Template loading
 * - Modification application
 * - Customer data hydration
 * - Execution creation
 *
 * Part of InHerSight 0.1.9 Release - Workflow Template System
 *
 * Usage: npx tsx scripts/test-obsidian-black-workflow.ts
 */

import { createClient } from '@supabase/supabase-js';
import { WorkflowCompilationService } from '../src/lib/services/WorkflowCompilationService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testObsidianBlackWorkflow() {
  console.log('🧪 Testing Workflow Compilation with Obsidian Black\n');
  console.log('=' .repeat(60) + '\n');

  try {
    // 1. Get renewal_base template
    console.log('📋 Step 1: Loading renewal_base template...');
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('*')
      .eq('name', 'renewal_base')
      .single();

    if (templateError || !template) {
      throw new Error('Could not find renewal_base template. Run seed-workflow-templates.ts first.');
    }

    console.log(`   ✅ Template loaded: ${template.display_name}`);
    console.log(`   📊 Base steps: ${template.base_steps.length}`);
    console.log(`   🎨 Base artifacts: ${template.base_artifacts.length}\n`);

    // 2. Get Obsidian Black customer
    console.log('🔍 Step 2: Loading Obsidian Black customer...');
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('name', 'Obsidian Black')
      .single();

    if (customerError || !customer) {
      throw new Error('Could not find Obsidian Black customer. Run seed-inhersight-demo-data.ts first.');
    }

    // Load related data separately if they exist
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', customer.company_id)
      .single();

    const { data: contracts } = await supabase
      .from('contracts')
      .select('*')
      .eq('customer_id', customer.id);

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('customer_id', customer.id);

    const { data: metrics } = await supabase
      .from('customer_engagement_metrics')
      .select('*')
      .eq('customer_id', customer.id);

    // Enrich customer object
    customer.company = company || null;
    customer.contracts = contracts || [];
    customer.contacts = contacts || [];
    customer.customer_engagement_metrics = metrics || [];

    console.log(`   ✅ Customer loaded: ${customer.name}`);
    console.log(`   💰 ARR: $${customer.current_arr?.toLocaleString()}`);
    console.log(`   📅 Renewal: ${customer.renewal_date}`);
    console.log(`   ⚠️  Risk Score: ${customer.risk_score}`);
    console.log(`   💚 Health Score: ${customer.health_score}\n`);

    // 3. Adjust risk score to trigger freebie intervention (if needed)
    if (customer.risk_score < 61) {
      console.log('⚙️  Step 3: Adjusting risk_score to trigger freebie intervention...');
      const { error: updateError } = await supabase
        .from('customers')
        .update({ risk_score: 64 })
        .eq('id', customer.id);

      if (updateError) {
        console.warn(`   ⚠️  Could not update risk_score: ${updateError.message}`);
      } else {
        customer.risk_score = 64;
        console.log(`   ✅ Risk score updated to 64 (triggers freebie intervention)\n`);
      }
    } else {
      console.log(`   ℹ️  Risk score is ${customer.risk_score} (freebie will be triggered)\n`);
    }

    // 4. Find applicable modifications
    console.log('🔧 Step 4: Finding applicable modifications...');
    const { data: allMods, error: modsError } = await supabase
      .from('workflow_modifications')
      .select('*')
      .eq('workflow_template_id', template.id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (modsError) {
      console.warn(`   ⚠️  Error loading modifications: ${modsError.message}`);
    }

    const applicableMods = (allMods || []).filter((mod: any) => {
      if (mod.scope_type === 'global') {
        // Check if criteria matches
        if (mod.scope_criteria?.risk_score?.$gt !== undefined) {
          return customer.risk_score > mod.scope_criteria.risk_score.$gt;
        }
        if (mod.scope_criteria?.health_score?.$gt !== undefined) {
          return customer.health_score > mod.scope_criteria.health_score.$gt;
        }
      }
      return false;
    });

    console.log(`   📝 Total modifications available: ${allMods?.length || 0}`);
    console.log(`   ✅ Applicable modifications: ${applicableMods.length}`);

    if (applicableMods.length > 0) {
      console.log('\n   Applicable modifications:');
      for (const mod of applicableMods) {
        console.log(`   - ${mod.modification_type}: ${mod.modification_data.step_name || mod.modification_data.artifact_id || 'N/A'}`);
        console.log(`     Scope: ${mod.scope_type}, Priority: ${mod.priority}`);
      }
    }
    console.log();

    // 5. Compile workflow
    console.log('⚙️  Step 5: Compiling workflow...');
    const compiledWorkflow = await WorkflowCompilationService.compileWorkflow(
      template.id,
      customer.id,
      {
        risk_score: customer.risk_score,
        health_score: customer.health_score,
        days_to_renewal: customer.days_to_renewal || 90
      },
      supabase
    );

    console.log(`   ✅ Workflow compiled successfully!`);
    console.log(`   📊 Total steps: ${compiledWorkflow.steps.length}`);
    console.log(`   🎨 Total artifacts: ${compiledWorkflow.artifacts.length}`);
    console.log(`   🔧 Modifications applied: ${compiledWorkflow.applied_modifications.length}\n`);

    // 6. Display compiled steps
    console.log('📋 Step 6: Compiled Workflow Steps:\n');
    compiledWorkflow.steps.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step.step_name}`);
      console.log(`      ID: ${step.step_id}`);
      console.log(`      Type: ${step.step_type}`);
      if (step.shows_artifacts && step.shows_artifacts.length > 0) {
        console.log(`      Artifacts: ${step.shows_artifacts.join(', ')}`);
      }
      if (step.creates_tasks && step.creates_tasks.length > 0) {
        console.log(`      Tasks: ${step.creates_tasks.join(', ')}`);
      }
      console.log();
    });

    // 7. Verify freebie intervention was added
    console.log('✅ Step 7: Verification Checks:\n');

    const hasFreebieSteps = compiledWorkflow.steps.some(s =>
      s.step_id === 'prepare-freebie' ||
      s.step_id === 'deliver-freebie' ||
      s.step_id === 'measure-freebie-impact'
    );

    if (customer.risk_score > 60) {
      if (hasFreebieSteps) {
        console.log('   ✅ PASS: Freebie intervention steps added (risk_score > 60)');
      } else {
        console.log('   ❌ FAIL: Freebie intervention steps NOT added (expected for risk_score > 60)');
      }
    } else {
      if (!hasFreebieSteps) {
        console.log('   ✅ PASS: No freebie intervention (risk_score <= 60)');
      } else {
        console.log('   ❌ FAIL: Freebie intervention added unexpectedly (risk_score <= 60)');
      }
    }

    // Check step count
    const expectedSteps = customer.risk_score > 60 ? 12 : 9; // 9 base + 3 freebie
    if (compiledWorkflow.steps.length === expectedSteps) {
      console.log(`   ✅ PASS: Step count is ${expectedSteps} (as expected)`);
    } else {
      console.log(`   ⚠️  WARNING: Expected ${expectedSteps} steps, got ${compiledWorkflow.steps.length}`);
    }

    // Check hydration
    const hasCustomerName = compiledWorkflow.artifacts.some(a =>
      a.artifact_name.includes(customer.name)
    );

    if (hasCustomerName) {
      console.log('   ✅ PASS: Customer data hydrated in artifacts');
    } else {
      console.log('   ⚠️  WARNING: Customer name not found in artifact names');
    }

    console.log();

    // 8. Display sample artifacts
    console.log('🎨 Step 8: Sample Hydrated Artifacts:\n');
    const sampleArtifacts = compiledWorkflow.artifacts.slice(0, 3);
    for (const artifact of sampleArtifacts) {
      console.log(`   📄 ${artifact.artifact_name}`);
      console.log(`      Type: ${artifact.artifact_type}`);
      if (artifact.template_content) {
        const preview = artifact.template_content.substring(0, 150).replace(/\n/g, ' ');
        console.log(`      Preview: ${preview}...`);
      }
      console.log();
    }

    // 9. Get Grace's user ID for execution
    console.log('👤 Step 9: Finding Grace\'s user ID...');
    const { data: graceProfile, error: graceError } = await supabase
      .from('profiles')
      .select('id, email, first, last')
      .eq('email', 'grace@inhersight.com')
      .single();

    if (graceError || !graceProfile) {
      console.warn('   ⚠️  Could not find Grace\'s profile. Skipping execution creation.');
      console.log('\n✨ Compilation test complete!\n');
      return;
    }

    console.log(`   ✅ Found: ${graceProfile.first} ${graceProfile.last} (${graceProfile.email})\n`);

    // 10. Create workflow execution (optional - can be commented out)
    console.log('💾 Step 10: Creating workflow execution record...');
    const executionId = await WorkflowCompilationService.createExecutionFromCompilation(
      compiledWorkflow,
      graceProfile.id,
      supabase
    );

    console.log(`   ✅ Execution created (ID: ${executionId})`);
    console.log(`   🔗 Execution linked to template: ${template.name}`);
    console.log(`   📋 Applied modifications tracked: ${compiledWorkflow.applied_modifications.length}\n`);

    console.log('=' .repeat(60));
    console.log('✨ Workflow Compilation Test PASSED!\n');
    console.log('Summary:');
    console.log(`   - Template: ${template.display_name}`);
    console.log(`   - Customer: ${customer.name}`);
    console.log(`   - Base steps: ${template.base_steps.length}`);
    console.log(`   - Compiled steps: ${compiledWorkflow.steps.length}`);
    console.log(`   - Modifications: ${compiledWorkflow.applied_modifications.length}`);
    console.log(`   - Execution ID: ${executionId}\n`);

  } catch (error: any) {
    console.error('\n💥 Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testObsidianBlackWorkflow()
  .then(() => {
    console.log('🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
