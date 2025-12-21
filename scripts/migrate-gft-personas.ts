/**
 * Migrate personas from OLD GFT to NEW gft schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const OLD_URL = 'https://assxvqtqjinoagwcpxpo.supabase.co';
const OLD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzc3h2cXRxamlub2Fnd2NweHBvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxOTMzNCwiZXhwIjoyMDc0Mjk1MzM0fQ.gNQ-Puth3WfHahtGu8lSoP4jh_3LTBljyEd3Ki_S7Rw';

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('Migrating personas from OLD to NEW database...\n');

  const oldClient = createClient(OLD_URL, OLD_KEY);
  const newClient = createClient(NEW_URL, NEW_KEY);

  // Fetch personas from old database
  console.log('Fetching personas from OLD database...');
  const { data: oldPersonas, error: oldErr } = await oldClient
    .from('personas')
    .select('*');

  if (oldErr) {
    console.error('Error fetching old personas:', oldErr);
    return;
  }

  console.log(`Found ${oldPersonas?.length} personas in OLD database\n`);

  if (!oldPersonas || oldPersonas.length === 0) {
    console.log('No personas to migrate.');
    return;
  }

  // Show personas
  console.log('Personas to migrate:');
  oldPersonas.forEach(p => {
    console.log(`  - ${p.persona_name} (${p.persona_slug})`);
  });

  // Check if any already exist in new database
  const { data: existingPersonas } = await newClient
    .schema('gft')
    .from('personas')
    .select('persona_slug');

  const existingSlugs = new Set(existingPersonas?.map(p => p.persona_slug) || []);
  const newPersonas = oldPersonas.filter(p => !existingSlugs.has(p.persona_slug));

  if (newPersonas.length === 0) {
    console.log('\nAll personas already exist in NEW database.');
    return;
  }

  console.log(`\nMigrating ${newPersonas.length} new personas...`);

  // Insert into new database
  const { data: inserted, error: insertErr } = await newClient
    .schema('gft')
    .from('personas')
    .insert(newPersonas.map(p => ({
      id: p.id,
      persona_name: p.persona_name,
      persona_slug: p.persona_slug,
      search_keywords: p.search_keywords,
      job_title_patterns: p.job_title_patterns,
      description: p.description,
      seniority_level: p.seniority_level,
      typical_departments: p.typical_departments,
      connection_message_template: p.connection_message_template,
      follow_up_template: p.follow_up_template,
      pain_points: p.pain_points,
      value_propositions: p.value_propositions,
      expected_skills: p.expected_skills,
      common_interests: p.common_interests,
      typical_responsibilities: p.typical_responsibilities,
      ai_messaging_prompt: p.ai_messaging_prompt,
      ai_skills_file_prompt: p.ai_skills_file_prompt,
      is_active: p.is_active,
      priority: p.priority,
      notes: p.notes,
      created_by: p.created_by,
      created_at: p.created_at,
      updated_at: p.updated_at,
    })))
    .select();

  if (insertErr) {
    console.error('Error inserting personas:', insertErr);
    return;
  }

  console.log(`Successfully migrated ${inserted?.length} personas!`);

  // Test the region assignment function
  console.log('\n=== Testing Region Assignment Function ===');
  const testLocations = [
    'Raleigh, North Carolina, United States',
    'San Francisco, California',
    'New York, NY',
    'Austin, TX',
    'Remote',
    'London, United Kingdom',
  ];

  for (const loc of testLocations) {
    const { data } = await newClient.rpc('assign_region_to_contact', { p_location: loc }, { schema: 'gft' });
    const regionId = data;

    if (regionId) {
      const { data: region } = await newClient
        .schema('gft')
        .from('regions')
        .select('display_name')
        .eq('id', regionId)
        .single();
      console.log(`  "${loc}" -> ${region?.display_name}`);
    } else {
      console.log(`  "${loc}" -> No match`);
    }
  }
}

main().catch(console.error);
