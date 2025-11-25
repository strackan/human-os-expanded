import { createClient } from '@supabase/supabase-js';
import { composeFromDatabase } from '../src/lib/workflows/db-composer';

const supabaseUrl = 'https://amugmkrihnjsxlpwdzcy.supabase.co';
const supabaseKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || '';

async function testFullCompose() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test 90-day renewal
  try {
    console.log('Testing composition of inhersight-90day-renewal...');

    const config90 = await composeFromDatabase(
      'inhersight-90day-renewal',
      null,
      { name: 'Test Company', current_arr: 50000, health_score: 75 },
      supabase
    );

    console.log('Success! 90-day Config:');
    console.log('- workflowId:', (config90 as any).workflowId);
    console.log('- slides:', config90.slides?.length);
    if (config90.slides) {
      config90.slides.forEach((slide, idx) => {
        console.log('  ' + (idx + 1) + '. ' + (slide.id || slide.title || 'unknown'));
      });
    }
  } catch (err: any) {
    console.error('90-day Composition failed:', err.message);
    console.error('Details:', JSON.stringify(err.details, null, 2));
  }

  console.log('\n---\n');

  // Test 120-day at-risk
  try {
    console.log('Testing composition of inhersight-120day-atrisk...');

    const config120 = await composeFromDatabase(
      'inhersight-120day-atrisk',
      null,
      { name: 'At Risk Company', current_arr: 30000, health_score: 45 },
      supabase
    );

    console.log('Success! 120-day Config:');
    console.log('- workflowId:', (config120 as any).workflowId);
    console.log('- slides:', config120.slides?.length);
    if (config120.slides) {
      config120.slides.forEach((slide, idx) => {
        console.log('  ' + (idx + 1) + '. ' + (slide.id || slide.title || 'unknown'));
      });
    }
  } catch (err: any) {
    console.error('120-day Composition failed:', err.message);
    console.error('Details:', JSON.stringify(err.details, null, 2));
  }
}

testFullCompose();
