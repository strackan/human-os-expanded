import { createClient } from '@supabase/supabase-js';

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data, error } = await client
    .schema('founder_os')
    .from('claude_queue')
    .select('id, intent_type, status, error_message, notes, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
