import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function show() {
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('metadata')
    .eq('id', '408c50a8-748d-4ba2-9852-c49b95c26345')
    .single();

  const questions = session?.metadata?.outstanding_questions || [];

  // Group by category
  const byCategory: Record<string, any[]> = {};
  for (const q of questions) {
    const cat = q.category || 'uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(q);
  }

  console.log(`\n=== OUTSTANDING QUESTIONS FOR SCOTT (${questions.length} total) ===\n`);

  for (const [category, qs] of Object.entries(byCategory).sort()) {
    console.log(`\n### ${category.toUpperCase()} (${qs.length})\n`);
    for (const q of qs) {
      console.log(`[${q.slug}] ${q.text}`);
    }
  }
}

show().catch(console.error);
