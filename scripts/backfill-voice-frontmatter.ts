/**
 * Backfill Voice File Frontmatter
 *
 * One-time migration script. Lists each user's voice files and adds `role`
 * to frontmatter based on filename convention. Files that already have
 * `role` in frontmatter are skipped.
 *
 * Usage: npx tsx scripts/backfill-voice-frontmatter.ts [slug1,slug2,...|all]
 *   --dry-run   Show what would change without uploading
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'human-os';

const FILENAME_ROLE_MAP: Record<string, string> = {
  '00_START_HERE.md': 'start_here',
  '01_WRITING_ENGINE.md': 'writing_engine',
  '02_THEMES.md': 'themes',
  '03_GUARDRAILS.md': 'guardrails',
  '04_STORIES.md': 'stories',
  '05_ANECDOTES.md': 'anecdotes',
  '06_OPENINGS.md': 'openings',
  '07_MIDDLES.md': 'middles',
  '08_ENDINGS.md': 'endings',
  '09_BLENDS.md': 'blends',
  '10_EXAMPLES.md': 'examples',
  'CONTEXT.md': 'context',
};

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

function parseFrontmatter(content: string): { raw: string; entries: Record<string, string>; body: string } | null {
  const match = content.match(FRONTMATTER_RE);
  if (!match) return null;

  const raw = match[0];
  const entries: Record<string, string> = {};

  for (const line of match[1]!.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    if (key) entries[key] = value;
  }

  return { raw, entries, body: content.slice(raw.length) };
}

async function downloadFile(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error || !data) return null;
  return await data.text();
}

async function uploadFile(filePath: string, content: string): Promise<boolean> {
  const blob = new Blob([content], { type: 'text/markdown' });
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, blob, {
    contentType: 'text/markdown',
    upsert: true,
  });
  if (error) {
    console.error(`    FAIL: ${filePath} -- ${error.message}`);
    return false;
  }
  return true;
}

async function processSlug(slug: string, dryRun: boolean): Promise<{ updated: number; skipped: number; noRole: number }> {
  const voiceDir = `contexts/${slug}/voice`;
  console.log(`\n  Listing ${voiceDir}...`);

  const { data: files, error } = await supabase.storage.from(BUCKET).list(voiceDir);
  if (error || !files) {
    console.error(`    Could not list ${voiceDir}: ${error?.message}`);
    return { updated: 0, skipped: 0, noRole: 0 };
  }

  const mdFiles = files.filter(f => f.name.endsWith('.md'));
  console.log(`    Found ${mdFiles.length} .md files`);

  let updated = 0;
  let skipped = 0;
  let noRole = 0;

  for (const file of mdFiles) {
    const filePath = `${voiceDir}/${file.name}`;
    const role = FILENAME_ROLE_MAP[file.name];

    if (!role) {
      console.log(`    ${file.name}: no role mapping (supplementary) -- skip`);
      noRole++;
      continue;
    }

    const content = await downloadFile(filePath);
    if (!content) {
      console.log(`    ${file.name}: could not download -- skip`);
      skipped++;
      continue;
    }

    const fm = parseFrontmatter(content);

    if (fm && fm.entries.role) {
      console.log(`    ${file.name}: already has role="${fm.entries.role}" -- skip`);
      skipped++;
      continue;
    }

    // Need to add role
    let newContent: string;

    if (fm) {
      // Has frontmatter but no role -- insert role line
      const fmLines = fm.raw.split('\n');
      // Insert role before closing ---
      const closingIdx = fmLines.lastIndexOf('---');
      fmLines.splice(closingIdx, 0, `role: "${role}"`);
      newContent = fmLines.join('\n') + fm.body;
    } else {
      // No frontmatter at all -- prepend it
      newContent = `---\nrole: "${role}"\n---\n${content}`;
    }

    if (dryRun) {
      console.log(`    ${file.name}: would add role="${role}"`);
    } else {
      const ok = await uploadFile(filePath, newContent);
      if (ok) {
        console.log(`    ${file.name}: added role="${role}"`);
      }
    }
    updated++;
  }

  return { updated, skipped, noRole };
}

async function discoverSlugs(): Promise<string[]> {
  const { data, error } = await supabase.storage.from(BUCKET).list('contexts');
  if (error || !data) {
    console.error('Could not list contexts:', error?.message);
    return [];
  }
  // Folders in storage have id=null typically, but we filter for non-file entries
  return data
    .filter(f => !f.name.includes('.'))
    .map(f => f.name);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const slugArg = args.find(a => !a.startsWith('--')) || 'all';

  console.log('Backfill Voice File Frontmatter');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  let slugs: string[];
  if (slugArg === 'all') {
    slugs = await discoverSlugs();
    console.log(`Discovered slugs: ${slugs.join(', ')}`);
  } else {
    slugs = slugArg.split(',').map(s => s.trim());
  }

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNoRole = 0;

  for (const slug of slugs) {
    console.log(`\n========================================`);
    console.log(`Processing: ${slug}`);
    console.log(`========================================`);

    const result = await processSlug(slug, dryRun);
    totalUpdated += result.updated;
    totalSkipped += result.skipped;
    totalNoRole += result.noRole;
  }

  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Skipped (already has role): ${totalSkipped}`);
  console.log(`  No role mapping (supplementary): ${totalNoRole}`);
  if (dryRun) {
    console.log('\n  (DRY RUN -- no files were modified)');
  }
}

main().catch(console.error);
