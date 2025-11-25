import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';

async function updateWorkflows() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Update 90-Day Renewal Workflow
  const { data: data90, error: error90 } = await supabase
    .from('workflow_definitions')
    .update({
      slide_sequence: [
        'greeting', 'review-brand-performance', 'review-contract-terms', 'identify-opportunities',
        'draft-email', 'meeting-debrief', 'create-recommendation', 'draft-email',
        'negotiation-guide', 'workflow-summary'
      ]
    })
    .eq('workflow_id', 'inhersight-90day-renewal')
    .select();
    
  if (error90) {
    console.error('Error updating 90-day:', error90);
  } else {
    console.log('Updated 90-day renewal:', data90);
  }

  // Update 120-Day At-Risk Workflow
  const { data: data120, error: error120 } = await supabase
    .from('workflow_definitions')
    .update({
      slide_sequence: [
        'greeting', 'identify-concerns', 'review-brand-performance', 'prepare-freebie',
        'draft-email', 'deliver-freebie', 'measure-freebie-impact', 'draft-email',
        'create-recommendation', 'draft-email', 'negotiation-guide', 'workflow-summary'
      ]
    })
    .eq('workflow_id', 'inhersight-120day-atrisk')
    .select();
    
  if (error120) {
    console.error('Error updating 120-day:', error120);
  } else {
    console.log('Updated 120-day at-risk:', data120);
  }
  
  console.log('\nWorkflow sequences updated successfully!');
}

updateWorkflows();
