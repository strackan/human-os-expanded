import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('=== Questions in Database ===\n');

  // Count by domain
  const { data: questions, error } = await supabase
    .from('questions')
    .select('slug, domain, category, subcategory')
    .in('domain', ['fos', 'core'])
    .order('domain')
    .order('slug');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Total questions:', questions.length);

  // Group by domain
  const byDomain: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const q of questions) {
    byDomain[q.domain] = (byDomain[q.domain] || 0) + 1;
    byCategory[`${q.domain}:${q.category}`] = (byCategory[`${q.domain}:${q.category}`] || 0) + 1;
  }

  console.log('\nBy Domain:');
  for (const [k, v] of Object.entries(byDomain)) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\nBy Category:');
  for (const [k, v] of Object.entries(byCategory)) {
    console.log(`  ${k}: ${v}`);
  }

  console.log('\nSample questions (first 5):');
  for (const q of questions.slice(0, 5)) {
    console.log(`  [${q.slug}] ${q.domain}/${q.category}/${q.subcategory}`);
  }
}

check().catch(console.error);
