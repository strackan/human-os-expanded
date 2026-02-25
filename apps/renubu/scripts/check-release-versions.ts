import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReleases() {
  console.log('🔍 Checking releases table...\n');

  // Get all releases
  const { data: releases, error } = await supabase
    .from('releases')
    .select(`
      version,
      name,
      actual_shipped,
      status_id,
      release_statuses(slug)
    `)
    .order('version', { ascending: false });

  if (error) {
    console.error('❌ Error fetching releases:', error);
    return;
  }

  console.log('📦 All releases in database:');
  console.log('─'.repeat(100));
  releases?.forEach(r => {
    const status = (r.release_statuses as any)?.slug || 'unknown';
    console.log(`Version: ${r.version.padEnd(8)} | Status: ${status.padEnd(15)} | Shipped: ${r.actual_shipped || 'Not shipped'} | ${r.name}`);
  });

  console.log('\n🎯 Releases marked as "complete":');
  console.log('─'.repeat(100));
  const complete = releases?.filter(r => (r.release_statuses as any)?.slug === 'complete');
  complete?.forEach(r => {
    console.log(`Version: ${r.version.padEnd(8)} | Shipped: ${r.actual_shipped || 'Not shipped'} | ${r.name}`);
  });

  console.log('\n📍 Current API would return:');
  const current = complete?.find(r => r.actual_shipped);
  if (current) {
    console.log(`✅ Version ${current.version} (${current.name}) - Shipped: ${current.actual_shipped}`);
  } else {
    console.log('⚠️ No completed release with actual_shipped date found');
  }
}

checkReleases().then(() => process.exit(0));
