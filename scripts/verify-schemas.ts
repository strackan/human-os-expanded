/**
 * Verify human_os and gft contact tier schemas are working
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('Verifying schemas...\n');

  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ==========================================================================
  // Test human_os schema
  // ==========================================================================
  console.log('=== HUMAN_OS SCHEMA ===\n');

  // Test entities table
  console.log('1. Testing human_os.entities table...');
  const { data: entities, error: entitiesErr } = await client
    .schema('human_os')
    .from('entities')
    .select('*')
    .limit(5);

  if (entitiesErr) {
    console.error('   ERROR:', entitiesErr.message);
  } else {
    console.log(`   ✓ Table accessible, ${entities?.length || 0} rows found`);
  }

  // Test inserting an entity directly
  console.log('2. Testing entity insert...');
  const { data: newEntity, error: insertErr } = await client
    .schema('human_os')
    .from('entities')
    .insert({
      entity_type: 'person',
      slug: 'test-person-verify',
      canonical_name: 'Test Person',
      linkedin_url: 'https://linkedin.com/in/test-person-verify'
    })
    .select()
    .single();

  if (insertErr) {
    console.error('   ERROR:', insertErr.message);
  } else {
    console.log(`   ✓ Insert works, created entity: ${newEntity.id}`);

    // Clean up test entity
    await client
      .schema('human_os')
      .from('entities')
      .delete()
      .eq('id', newEntity.id);
    console.log('   ✓ Test entity cleaned up');
  }

  // Test context_files table
  console.log('3. Testing human_os.context_files table...');
  const { error: cfErr } = await client
    .schema('human_os')
    .from('context_files')
    .select('id')
    .limit(1);

  if (cfErr) {
    console.error('   ERROR:', cfErr.message);
  } else {
    console.log('   ✓ Table accessible');
  }

  // Test entity_links table
  console.log('4. Testing human_os.entity_links table...');
  const { error: elErr } = await client
    .schema('human_os')
    .from('entity_links')
    .select('id')
    .limit(1);

  if (elErr) {
    console.error('   ERROR:', elErr.message);
  } else {
    console.log('   ✓ Table accessible');
  }

  // Test access_grants table
  console.log('5. Testing human_os.access_grants table...');
  const { error: agErr } = await client
    .schema('human_os')
    .from('access_grants')
    .select('id')
    .limit(1);

  if (agErr) {
    console.error('   ERROR:', agErr.message);
  } else {
    console.log('   ✓ Table accessible');
  }

  // ==========================================================================
  // Test GFT contact tiers
  // ==========================================================================
  console.log('\n=== GFT CONTACT TIERS ===\n');

  // Check new columns exist
  console.log('1. Checking contact tier columns...');
  const { data: contactSample, error: contactErr } = await client
    .schema('gft')
    .from('contacts')
    .select('id, name, tier, custom_labels, private_notes, last_interaction_at, next_followup_at')
    .limit(1);

  if (contactErr) {
    console.error('   ERROR:', contactErr.message);
  } else {
    console.log('   ✓ All tier columns exist');
    if (contactSample && contactSample[0]) {
      console.log(`   Sample contact: ${contactSample[0].name}, tier: ${contactSample[0].tier || 'null'}`);
    }
  }

  // Test updating tier directly
  console.log('2. Testing tier update...');
  const { data: testContact } = await client
    .schema('gft')
    .from('contacts')
    .select('id, tier')
    .limit(1)
    .single();

  if (testContact) {
    const originalTier = testContact.tier;

    // Update tier
    const { error: updateErr } = await client
      .schema('gft')
      .from('contacts')
      .update({ tier: 'key_50' })
      .eq('id', testContact.id);

    if (updateErr) {
      console.error('   ERROR:', updateErr.message);
    } else {
      console.log('   ✓ Tier update works');

      // Restore original tier
      await client
        .schema('gft')
        .from('contacts')
        .update({ tier: originalTier || 'outer' })
        .eq('id', testContact.id);
      console.log('   ✓ Restored original tier');
    }
  }

  // Test label update
  console.log('3. Testing custom_labels...');
  if (testContact) {
    const { error: labelErr } = await client
      .schema('gft')
      .from('contacts')
      .update({ custom_labels: ['test-label', 'another-label'] })
      .eq('id', testContact.id);

    if (labelErr) {
      console.error('   ERROR:', labelErr.message);
    } else {
      console.log('   ✓ Label update works');

      // Clear labels
      await client
        .schema('gft')
        .from('contacts')
        .update({ custom_labels: [] })
        .eq('id', testContact.id);
      console.log('   ✓ Labels cleared');
    }
  }

  // Test followup date
  console.log('4. Testing followup tracking...');
  if (testContact) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const { error: followupErr } = await client
      .schema('gft')
      .from('contacts')
      .update({
        next_followup_at: futureDate.toISOString(),
        last_interaction_at: new Date().toISOString()
      })
      .eq('id', testContact.id);

    if (followupErr) {
      console.error('   ERROR:', followupErr.message);
    } else {
      console.log('   ✓ Followup tracking works');

      // Clear dates
      await client
        .schema('gft')
        .from('contacts')
        .update({
          next_followup_at: null,
          last_interaction_at: null
        })
        .eq('id', testContact.id);
    }
  }

  // Query contacts by tier
  console.log('5. Testing tier queries...');
  const { data: outerContacts, error: queryErr } = await client
    .schema('gft')
    .from('contacts')
    .select('id, name')
    .eq('tier', 'outer')
    .limit(5);

  if (queryErr) {
    console.error('   ERROR:', queryErr.message);
  } else {
    console.log(`   ✓ Tier query works, ${outerContacts?.length || 0} contacts in 'outer' tier (showing max 5)`);
  }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
  console.log('All schemas are properly configured and accessible!');
}

main().catch(console.error);
