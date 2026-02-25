import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixContexts() {
  // Fix 90-day renewal - remove review-account context, keep greeting
  const { data: data90, error: error90 } = await supabase
    .from('workflow_definitions')
    .update({
      slide_contexts: {
        greeting: {
          variables: {
            message:
              "Welcome! Let's prepare for the upcoming renewal with {{customer.name}}. I'll help you review their performance and prepare for the renewal conversation.",
          },
        },
      },
    })
    .eq('workflow_id', 'inhersight-90day-renewal')
    .select();

  if (error90) {
    console.error('Error updating 90-day:', error90);
  } else {
    console.log('Updated 90-day renewal contexts:', data90?.[0]?.slide_contexts);
  }

  // Fix 120-day at-risk - remove review-account context, keep greeting
  const { data: data120, error: error120 } = await supabase
    .from('workflow_definitions')
    .update({
      slide_contexts: {
        greeting: {
          variables: {
            message:
              "Let's address the at-risk status for {{customer.name}}. I'll guide you through identifying concerns and creating a recovery strategy.",
          },
        },
      },
    })
    .eq('workflow_id', 'inhersight-120day-atrisk')
    .select();

  if (error120) {
    console.error('Error updating 120-day:', error120);
  } else {
    console.log('Updated 120-day at-risk contexts:', data120?.[0]?.slide_contexts);
  }

  console.log('\nContexts fixed!');
}

fixContexts();
