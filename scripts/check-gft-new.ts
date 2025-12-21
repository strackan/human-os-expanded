/**
 * Check what's in the NEW gft schema
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const NEW_URL = process.env.SUPABASE_URL!;
const NEW_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  console.log('Checking NEW gft schema...\n');

  const client = createClient(NEW_URL, NEW_KEY);

  const tables = ['contacts', 'companies', 'activities', 'li_posts', 'li_post_engagements', 'regions'];

  for (const table of tables) {
    const { data, error, count } = await client
      .schema('gft')
      .from(table)
      .select('*', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      console.log(`gft.${table}: ERROR - ${error.message}`);
    } else {
      console.log(`gft.${table}: ${count ?? data?.length ?? 0} rows`);
      if (data && data.length > 0) {
        console.log('  Sample:', JSON.stringify(data[0], null, 2).substring(0, 300));
      }
    }
  }
}

main().catch(console.error);
