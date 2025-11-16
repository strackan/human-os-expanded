/**
 * Quick script to create a test invite
 * Usage: npx tsx scripts/create-test-invite.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function createTestInvite() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      name: 'Justin Test',
      email: 'justin+test@renubu.com',
      company: 'Test Company',
      job_title: 'Tester',
      linkedin_url: 'https://linkedin.com/in/test',
      source: 'test_script',
    })
    .select('id, name, email, invite_code')
    .single();

  if (error) {
    console.error('❌ Error creating contact:', error);
    process.exit(1);
  }

  console.log('\n✅ Test invite created successfully!\n');
  console.log('Contact Details:');
  console.log('─────────────────────────────────────────');
  console.log(`Name:        ${contact.name}`);
  console.log(`Email:       ${contact.email}`);
  console.log(`Invite Code: ${contact.invite_code}`);
  console.log(`\n📧 Share this link:`);
  console.log(`http://localhost:3200/assessment/start?code=${contact.invite_code}`);
  console.log('─────────────────────────────────────────\n');
}

createTestInvite();
