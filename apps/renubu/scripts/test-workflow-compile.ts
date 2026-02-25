/**
 * Test Workflow Compilation
 *
 * Compiles a workflow and shows the result to debug artifact issues
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { WorkflowCompilationService } from '../src/lib/services/WorkflowCompilationService';
import { WorkflowConfigTransformer } from '../src/lib/services/WorkflowConfigTransformer';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompile() {
  console.log('🔧 Testing workflow compilation...\n');

  // Get renewal_base template
  const { data: template } = await supabase
    .from('workflow_templates')
    .select('id, name')
    .eq('name', 'renewal_base')
    .single();

  if (!template) {
    console.error('❌ Template not found');
    return;
  }

  console.log(`📋 Template: ${template.name} (${template.id})\n`);

  // Get a customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, risk_score, opportunity_score, health_score, renewal_date, company_id')
    .eq('name', 'Test')
    .single();

  if (!customer) {
    console.error('❌ No customers found');
    return;
  }

  console.log(`👤 Customer: ${customer.name} (${customer.id})`);
  console.log(`   Risk: ${customer.risk_score}, Health: ${customer.health_score}`);

  // Get full customer with relations
  const { data: fullCustomer } = await supabase
    .from('customers')
    .select(`
      *,
      company:companies(*)
    `)
    .eq('id', customer.id)
    .single();

  const { data: customerContacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('customer_id', customer.id);

  console.log(`   Company: ${(fullCustomer?.company as any)?.name || 'none'}`);
  console.log(`   Contacts: ${customerContacts?.length || 0}\n`);

  // Compile workflow
  const daysToRenewal = customer.renewal_date
    ? Math.ceil((new Date(customer.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : undefined;

  const compiled = await WorkflowCompilationService.compileWorkflow(
    template.id,
    customer.id,
    {
      risk_score: customer.risk_score,
      opportunity_score: customer.opportunity_score,
      health_score: customer.health_score,
      days_to_renewal: daysToRenewal,
    },
    supabase
  );

  console.log(`✅ Compiled workflow:`);
  console.log(`   Steps: ${compiled.steps.length}`);
  console.log(`   Artifacts: ${compiled.artifacts.length}`);
  console.log(`   Modifications applied: ${compiled.applied_modifications.length}\n`);

  console.log('📊 Steps with artifacts:');
  compiled.steps.forEach((step, idx) => {
    console.log(`   ${idx + 1}. ${step.step_name}`);
    console.log(`      shows_artifacts: ${step.shows_artifacts?.join(', ') || 'none'}`);
  });

  console.log('\n🎨 Available artifacts:');
  compiled.artifacts.forEach((art: any) => {
    console.log(`   - ${art.artifact_id}: ${art.artifact_name} (${art.artifact_type})`);
  });

  // Transform to WorkflowConfig
  const workflowConfig = WorkflowConfigTransformer.transformToWorkflowConfig(
    compiled,
    customer.name
  );

  console.log('\n📱 Transformed slides:');
  workflowConfig.slides?.forEach((slide: any, idx: number) => {
    console.log(`   ${idx + 1}. ${slide.title}`);
    console.log(`      artifact sections: ${slide.artifacts?.sections?.length || 0}`);
    if (slide.artifacts?.sections && slide.artifacts.sections.length > 0) {
      slide.artifacts.sections.forEach((section: any) => {
        console.log(`         - ${section.title} (${section.type})`);
        if (section.type === 'custom') {
          if (section.data?.componentType) {
            console.log(`           ✅ componentType: ${section.data.componentType}`);
            console.log(`           props keys: ${Object.keys(section.data.props || {}).join(', ')}`);

            // Show email details for EmailArtifact
            if (section.data.componentType === 'EmailArtifact') {
              const props = section.data.props;
              console.log(`           📧 Email Details:`);
              console.log(`              To: ${props.to}`);
              console.log(`              Subject: ${props.subject}`);
              console.log(`              Body (first 100 chars): ${props.body?.substring(0, 100)}...`);
            }
          } else {
            console.log(`           ❌ NO componentType - will not render!`);
            console.log(`           data keys: ${Object.keys(section.data || {}).join(', ')}`);
          }
        }
      });
    }
  });
}

testCompile()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });
