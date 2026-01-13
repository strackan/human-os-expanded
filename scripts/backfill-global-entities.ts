/**
 * Backfill global.entities from gft.contacts
 *
 * Uses the global.resolve_entity() function to find or create
 * global entities for each contact, then links them.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zulowgscotdrqlccomht.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY environment variable required');
  process.exit(1);
}

async function backfillGlobalEntities() {
  console.log('=== Backfilling Global Entities from GFT Contacts ===\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    db: { schema: 'gft' }
  });

  // Get all contacts without global_entity_id
  console.log('1. Fetching unlinked contacts...');
  const { data: contacts, error: fetchError } = await supabase
    .from('contacts')
    .select('id, name, linkedin_url, email, current_job_title, company, location')
    .is('global_entity_id', null)
    .limit(1000);

  if (fetchError) {
    console.error('Error fetching contacts:', fetchError);
    process.exit(1);
  }

  console.log(`   Found ${contacts?.length || 0} unlinked contacts\n`);

  if (!contacts || contacts.length === 0) {
    console.log('No contacts to backfill');
    return;
  }

  // Process each contact
  console.log('2. Resolving global entities...');
  let success = 0;
  let failed = 0;

  for (const contact of contacts) {
    try {
      // Call the resolve_entity function via RPC
      const globalClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      const { data: entityId, error: resolveError } = await globalClient.rpc(
        'resolve_entity',
        {
          p_linkedin_url: contact.linkedin_url,
          p_email: contact.email,
          p_name: contact.name,
          p_company: contact.company,
          p_title: contact.current_job_title,
          p_location: contact.location
        },
        { schema: 'global' }
      );

      if (resolveError) {
        console.error(`   ✗ ${contact.name}: ${resolveError.message}`);
        failed++;
        continue;
      }

      // Update the contact with the global_entity_id
      const { error: updateError } = await supabase
        .from('contacts')
        .update({ global_entity_id: entityId })
        .eq('id', contact.id);

      if (updateError) {
        console.error(`   ✗ ${contact.name}: Update failed - ${updateError.message}`);
        failed++;
        continue;
      }

      console.log(`   ✓ ${contact.name} -> ${entityId}`);
      success++;
    } catch (err) {
      console.error(`   ✗ ${contact.name}: ${err}`);
      failed++;
    }
  }

  console.log(`\n=== Backfill Complete ===`);
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

backfillGlobalEntities().catch(console.error);
