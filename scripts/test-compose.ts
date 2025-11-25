import { createClient } from '@supabase/supabase-js';
import { SLIDE_LIBRARY, validateSlideSequence } from '../src/lib/workflows/slides/index';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';

async function testCompose() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch workflow
  const { data, error } = await supabase
    .from('workflow_definitions')
    .select('*')
    .eq('workflow_id', 'inhersight-90day-renewal')
    .single();
    
  if (error) {
    console.error('Fetch error:', error);
    return;
  }
  
  console.log('Workflow:', data.name);
  console.log('Slide sequence:', data.slide_sequence);
  
  // Validate slides
  const validation = validateSlideSequence(data.slide_sequence || []);
  console.log('\nValidation:', validation);
  
  // Show available slides
  console.log('\nAvailable slides in SLIDE_LIBRARY:');
  Object.keys(SLIDE_LIBRARY).sort().forEach(id => console.log('  -', id));
}

testCompose();
