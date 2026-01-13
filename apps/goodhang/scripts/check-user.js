const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // First, let's see ALL sessions to find the user
  console.log('\n=== ALL COMPLETED SESSIONS ===');
  const { data: sessions, error: sessErr } = await supabase
    .from('cs_assessment_sessions')
    .select('id, user_id, status, created_at, completed_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  if (sessErr) {
    console.log('Sessions error:', sessErr.message);
  } else if (sessions && sessions.length > 0) {
    sessions.forEach((s, i) => {
      console.log((i+1) + '. User:', s.user_id, '| Status:', s.status, '| Completed:', s.completed_at);
    });
  } else {
    console.log('No completed sessions found');
  }

  // Check all profiles
  console.log('\n=== ALL PROFILES ===');
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, email, assessment_status')
    .limit(20);

  if (pErr) {
    console.log('Profile error:', pErr.message);
    return;
  }

  if (profiles && profiles.length > 0) {
    profiles.forEach((p, i) => {
      console.log((i+1) + '. Email:', p.email, '| Status:', p.assessment_status, '| ID:', p.id);
    });
  } else {
    console.log('No profiles found');
  }

  // Check activation keys
  console.log('\n=== ALL ACTIVATION KEYS ===');
  const { data: keys, error: keyErr } = await supabase
    .from('activation_keys')
    .select('code, user_id, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (keyErr) {
    console.log('Keys error:', keyErr.message);
  } else if (keys && keys.length > 0) {
    keys.forEach((k, i) => {
      console.log((i+1) + '. Code:', k.code, '| User:', k.user_id, '| Expires:', k.expires_at);
    });
  } else {
    console.log('No activation keys found');
  }
}

check();
