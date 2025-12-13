/**
 * Test script for pack_search and serendipity engine
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('=== Testing Pack Search & Serendipity Engine ===\n');

  // 1. Test pack_search function
  console.log('1. Testing pack_search function...');
  const { data: searchResults, error: searchError } = await supabase.rpc('pack_search', {
    p_keyword: null,
    p_entity_type: 'person',
    p_pack_type: null,
    p_tags: null,
    p_location: null,
    p_layer: null,
    p_limit: 5,
  });

  if (searchError) {
    console.error('Error in pack_search:', searchError.message);
  } else {
    console.log(`Found ${searchResults?.length || 0} results:`);
    searchResults?.forEach((r: { entity_name: string; entity_type: string; headline: string }) => {
      console.log(`  - ${r.entity_name} (${r.entity_type}): ${r.headline || 'no headline'}`);
    });
  }

  // 2. Create test entities for serendipity testing
  console.log('\n2. Creating test entities for serendipity...');

  // Create two test people
  const { data: person1 } = await supabase
    .from('entities')
    .upsert({
      slug: 'test-alice',
      name: 'Alice Test',
      entity_type: 'person',
      metadata: { location: 'San Francisco' },
    }, { onConflict: 'slug' })
    .select()
    .single();

  const { data: person2 } = await supabase
    .from('entities')
    .upsert({
      slug: 'test-bob',
      name: 'Bob Test',
      entity_type: 'person',
      metadata: { location: 'New York' },
    }, { onConflict: 'slug' })
    .select()
    .single();

  if (person1 && person2) {
    // Create identity packs with overlapping interests
    await supabase.from('identity_packs').upsert([
      {
        entity_id: person1.id,
        pack_type: 'interests',
        headline: 'Whiskey enthusiast and tech investor',
        tags: ['whiskey', 'investing', 'startups'],
        visibility: 'public',
      },
      {
        entity_id: person2.id,
        pack_type: 'interests',
        headline: 'Bourbon collector and angel investor',
        tags: ['whiskey', 'bourbon', 'investing', 'golf'],
        visibility: 'public',
      },
    ], { onConflict: 'entity_id,pack_type' });

    console.log('Created test entities: test-alice, test-bob');

    // 3. Test find_connection_points
    console.log('\n3. Testing find_connection_points...');
    const { data: connections, error: connError } = await supabase.rpc('find_connection_points', {
      p_viewer_slug: 'test-alice',
      p_target_slug: 'test-bob',
    });

    if (connError) {
      console.error('Error in find_connection_points:', connError.message);
    } else {
      console.log(`Found ${connections?.length || 0} connection points:`);
      connections?.forEach((c: { connection_type: string; topic: string; strength: number }) => {
        console.log(`  - [${c.connection_type}] ${c.topic} (strength: ${c.strength})`);
      });
    }

    // 4. Test generate_openers
    console.log('\n4. Testing generate_openers...');
    const { data: openers, error: openError } = await supabase.rpc('generate_openers', {
      p_viewer_slug: 'test-alice',
      p_target_slug: 'test-bob',
      p_limit: 3,
    });

    if (openError) {
      console.error('Error in generate_openers:', openError.message);
    } else {
      console.log(`Generated ${openers?.length || 0} conversation openers:`);
      openers?.forEach((o: { opener: string; based_on: string }) => {
        console.log(`  - "${o.opener.slice(0, 80)}..."`);
        console.log(`    (based on: ${o.based_on})`);
      });
    }

    // 5. Test pack_search with keyword
    console.log('\n5. Testing pack_search with keyword "whiskey"...');
    const { data: whiskeyResults, error: whiskeyError } = await supabase.rpc('pack_search', {
      p_keyword: 'whiskey',
      p_entity_type: null,
      p_pack_type: null,
      p_tags: null,
      p_location: null,
      p_layer: null,
      p_limit: 5,
    });

    if (whiskeyError) {
      console.error('Error:', whiskeyError.message);
    } else {
      console.log(`Found ${whiskeyResults?.length || 0} results for "whiskey":`);
      whiskeyResults?.forEach((r: { entity_name: string; relevance_score: number; matching_snippet: string }) => {
        console.log(`  - ${r.entity_name} (score: ${r.relevance_score})`);
        console.log(`    Snippet: ${r.matching_snippet?.slice(0, 60) || 'none'}...`);
      });
    }

    // Cleanup
    console.log('\n6. Cleaning up test data...');
    await supabase.from('identity_packs').delete().in('entity_id', [person1.id, person2.id]);
    await supabase.from('entities').delete().in('slug', ['test-alice', 'test-bob']);
    console.log('Test data cleaned up.');
  }

  console.log('\n=== Search Tests Complete ===');
}

main().catch(console.error);
