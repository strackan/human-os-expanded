/**
 * Migrate regions from OLD GFT to NEW gft schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const OLD_URL = 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3h2cXRxamlub2Fnd2NweHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxOTMzNCwiZXhwIjoyMDc0Mjk1MzM0fQ.gNQ-Puth3WfHahtGu8lSoP4jh_3LTBljyEd3Ki_S7Rw';

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('Migrating regions from OLD to NEW database...\n');

  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  // Fetch regions from old database
  console.log('Fetching regions from OLD database...');
  const { data: oldRegions, error: oldErr } = await oldClient
    .from('regions')
    .select('*');

  if (oldErr) {
    console.error('Error fetching old regions:', oldErr);
    return;
  }

  console.log(`Found ${oldRegions?.length} regions in OLD database\n`);

  if (!oldRegions || oldRegions.length === 0) {
    console.log('No regions to migrate.');
    return;
  }

  // Show regions
  console.log('Regions to migrate:');
  oldRegions.forEach(r => {
    console.log(`  - ${r.display_name} (${r.name}) - pop: ${r.metro_population?.toLocaleString()}`);
  });

  // Check if any already exist in new database
  const { data: existingRegions } = await newClient
    .schema('gft')
    .from('regions')
    .select('name');

  const existingNames = new Set(existingRegions?.map(r => r.name) || []);
  const newRegions = oldRegions.filter(r => !existingNames.has(r.name));

  if (newRegions.length === 0) {
    console.log('\nAll regions already exist in NEW database.');
    return;
  }

  console.log(`\nMigrating ${newRegions.length} new regions...`);

  // Insert into new database
  const { data: inserted, error: insertErr } = await newClient
    .schema('gft')
    .from('regions')
    .insert(newRegions.map(r => ({
      id: r.id,
      name: r.name,
      display_name: r.display_name,
      state_code: r.state_code,
      country_code: r.country_code,
      metro_population: r.metro_population,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone,
      notes: r.notes,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })))
    .select();

  if (insertErr) {
    console.error('Error inserting regions:', insertErr);
    return;
  }

  console.log(`Successfully migrated ${inserted?.length} regions!`);

  // Verify
  const { data: finalRegions } = await newClient
    .schema('gft')
    .from('regions')
    .select('name, display_name');

  console.log('\nRegions in NEW database:');
  finalRegions?.forEach(r => console.log(`  - ${r.display_name}`));
}

main().catch(console.error);
