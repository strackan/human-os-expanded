/**
 * Check voice files in Supabase storage for both Scott and Justin
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkEntity(slug: string) {
  console.log(`\n=== ${slug.toUpperCase()} ===\n`);

  // Check human-os bucket
  const { data: root } = await supabase.storage.from('human-os').list(`contexts/${slug}`);
  if (root && root.length > 0) {
    console.log(`human-os/contexts/${slug}/`);
    root.forEach(f => console.log(`  ${f.name}`));
  } else {
    console.log(`human-os/contexts/${slug}/ — empty or missing`);
  }

  const { data: voice } = await supabase.storage.from('human-os').list(`contexts/${slug}/voice`);
  if (voice && voice.length > 0) {
    console.log(`\nhuman-os/contexts/${slug}/voice/`);
    voice.forEach(f => console.log(`  ${f.name}`));
  } else {
    console.log(`\nhuman-os/contexts/${slug}/voice/ — empty or missing`);
  }

  // Check contexts bucket too
  const { data: ctxRoot } = await supabase.storage.from('contexts').list(slug);
  if (ctxRoot && ctxRoot.length > 0) {
    console.log(`\ncontexts/${slug}/`);
    ctxRoot.forEach(f => console.log(`  ${f.name}`));
  }

  const { data: ctxVoice } = await supabase.storage.from('contexts').list(`${slug}/voice`);
  if (ctxVoice && ctxVoice.length > 0) {
    console.log(`\ncontexts/${slug}/voice/`);
    ctxVoice.forEach(f => console.log(`  ${f.name}`));
  }

  // Check which new-format files exist
  console.log('\n--- New Pipeline File Check ---');
  const newFiles = [
    { path: `contexts/${slug}/DIGEST.md`, label: 'DIGEST (root)' },
    { path: `contexts/${slug}/voice/01_WRITING_ENGINE.md`, label: '01_WRITING_ENGINE' },
    { path: `contexts/${slug}/voice/06_OPENINGS.md`, label: '06_OPENINGS' },
    { path: `contexts/${slug}/voice/07_MIDDLES.md`, label: '07_MIDDLES' },
    { path: `contexts/${slug}/voice/08_ENDINGS.md`, label: '08_ENDINGS' },
    { path: `contexts/${slug}/voice/10_EXAMPLES.md`, label: '10_EXAMPLES' },
    { path: `contexts/${slug}/voice/02_THEMES.md`, label: '02_THEMES' },
    { path: `contexts/${slug}/voice/03_GUARDRAILS.md`, label: '03_GUARDRAILS' },
    { path: `contexts/${slug}/voice/04_STORIES.md`, label: '04_STORIES' },
    { path: `contexts/${slug}/voice/05_ANECDOTES.md`, label: '05_ANECDOTES' },
    { path: `contexts/${slug}/voice/CONTEXT.md`, label: 'CONTEXT' },
    { path: `contexts/${slug}/voice/09_BLENDS.md`, label: '09_BLENDS' },
    { path: `contexts/${slug}/voice/00_START_HERE.md`, label: '00_START_HERE' },
  ];

  for (const f of newFiles) {
    const { data, error } = await supabase.storage.from('human-os').download(f.path);
    if (error || !data) {
      // Check old name too
      const oldName = f.path.replace(/\d{2}_/, '');
      const { data: old } = await supabase.storage.from('human-os').download(oldName);
      if (old) {
        const text = await old.text();
        console.log(`  ${f.label}: ❌ Missing (but OLD format exists: ${text.length} chars)`);
      } else {
        console.log(`  ${f.label}: ❌ Missing`);
      }
    } else {
      const text = await data.text();
      console.log(`  ${f.label}: ✅ Found (${text.length} chars)`);
    }
  }
}

async function main() {
  await checkEntity('scott');
  await checkEntity('justin');
}

main().catch(console.error);
