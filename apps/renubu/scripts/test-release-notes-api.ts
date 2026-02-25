/**
 * Test Release Notes API
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testReleaseNotesAPI() {
  console.log('Testing Release Notes API...\n');

  // Test 1: Check if releases table has data
  console.log('1. Checking releases table...');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error, count } = await supabase
    .from('releases')
    .select('version, name, actual_shipped', { count: 'exact' })
    .order('actual_shipped', { ascending: false, nullsFirst: false })
    .limit(5);

  if (error) {
    console.error('❌ Error querying releases:', error);
    return;
  }

  console.log(`✓ Found ${count} releases in database`);
  console.log('Recent releases:');
  data?.forEach(r => {
    console.log(`  - ${r.version}: ${r.name} (${r.actual_shipped || 'unreleased'})`);
  });

  // Test 2: Fetch from API endpoint
  console.log('\n2. Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/release-notes?limit=5');
    const result = await response.json();

    if (result.error) {
      console.error('❌ API returned error:', result.error);
    } else {
      console.log(`✓ API returned ${result.count} releases`);
      console.log('API response:', JSON.stringify(result, null, 2));
    }
  } catch (err) {
    console.error('❌ Failed to fetch from API:', err);
  }
}

testReleaseNotesAPI();
