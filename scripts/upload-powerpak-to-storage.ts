/**
 * Upload Powerpak Files to Supabase Storage
 *
 * Uploads Justin's powerpak files from local filesystem to the human-os bucket.
 * Splits 02_TEMPLATE_COMPONENTS.md into separate O/M/E files + appends
 * Transitions and Flavor Elements to WRITING_ENGINE.
 *
 * Usage: npx tsx scripts/upload-powerpak-to-storage.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET = 'human-os';
const SLUG = 'justin';
const POWERPAK_DIR = path.resolve(__dirname, '../../powerpak/justin_os');

// =============================================================================
// STORAGE HELPERS
// =============================================================================

async function uploadFile(remotePath: string, content: string): Promise<boolean> {
  const blob = new Blob([content], { type: 'text/markdown' });
  const { error } = await supabase.storage.from(BUCKET).upload(remotePath, blob, {
    contentType: 'text/markdown',
    upsert: true,
  });
  if (error) {
    console.error(`  FAIL: ${remotePath} -- ${error.message}`);
    return false;
  }
  console.log(`  OK: ${remotePath} (${content.length} chars)`);
  return true;
}

function readLocalFile(filename: string): string {
  const filePath = path.join(POWERPAK_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Powerpak file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

// =============================================================================
// TEMPLATE COMPONENTS SPLITTER
// =============================================================================

interface SplitResult {
  openings: string;
  middles: string;
  endings: string;
  writingEngineAppendix: string; // Transitions + Flavor Elements
}

function splitTemplateComponents(content: string): SplitResult {
  // Split on major sections using ## headers
  const openingsMatch = content.match(/## OPENINGS \(Pick One\)([\s\S]*?)(?=## MIDDLES)/);
  const middlesMatch = content.match(/## MIDDLES \(Pick 1-2, Can Combine\)([\s\S]*?)(?=## ENDINGS)/);
  const endingsMatch = content.match(/## ENDINGS \(Pick One\)([\s\S]*?)(?=## TRANSITIONS)/);
  const transitionsMatch = content.match(/## TRANSITIONS \(Glue Between Sections\)([\s\S]*?)(?=## FLAVOR ELEMENTS)/);
  const flavorMatch = content.match(/## FLAVOR ELEMENTS \(Sprinkle Throughout\)([\s\S]*?)(?=## PROVEN BLENDS|## MIXING INSTRUCTIONS|$)/);

  if (!openingsMatch || !middlesMatch || !endingsMatch) {
    throw new Error('Failed to split TEMPLATE_COMPONENTS.md -- expected sections not found');
  }

  const openings = `---
status: "bespoke"
role: "openings"
---
# OPENINGS: Justin Strackany

**Pick one opener per piece. Match energy to content type.**

${openingsMatch[1]!.trim()}
`;

  const middles = `---
status: "bespoke"
role: "middles"
---
# MIDDLES: Justin Strackany

**Pick 1-2 middles. Can combine. Check pairing suggestions.**

${middlesMatch[1]!.trim()}
`;

  const endings = `---
status: "bespoke"
role: "endings"
---
# ENDINGS: Justin Strackany

**Pick one ending. Check pairing suggestions for what works with your opener.**

${endingsMatch[1]!.trim()}
`;

  // Transitions + Flavor Elements go into WRITING_ENGINE appendix
  let appendix = '';
  if (transitionsMatch) {
    appendix += `\n\n## TRANSITIONS (Glue Between Sections)\n\n${transitionsMatch[1]!.trim()}`;
  }
  if (flavorMatch) {
    appendix += `\n\n## FLAVOR ELEMENTS (Sprinkle Throughout)\n\n${flavorMatch[1]!.trim()}`;
  }

  return { openings, middles, endings, writingEngineAppendix: appendix };
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('Uploading Justin powerpak files to Supabase storage');
  console.log(`Source: ${POWERPAK_DIR}`);
  console.log(`Destination: ${BUCKET}/contexts/${SLUG}/voice/`);
  console.log('');

  // Verify powerpak directory exists
  if (!fs.existsSync(POWERPAK_DIR)) {
    console.error(`Powerpak directory not found: ${POWERPAK_DIR}`);
    process.exit(1);
  }

  const prefix = `contexts/${SLUG}/voice`;
  let uploaded = 0;
  let failed = 0;

  // 1. WRITING_ENGINE -- base file + transitions/flavor from TEMPLATE_COMPONENTS
  console.log('--- Step 1: WRITING_ENGINE (base + transitions/flavor) ---');
  const writingEngine = readLocalFile('01_WRITING_ENGINE.md');
  const templateComponents = readLocalFile('02_TEMPLATE_COMPONENTS.md');
  const split = splitTemplateComponents(templateComponents);

  // Ensure writing engine has role frontmatter
  let enrichedWritingEngine = writingEngine + split.writingEngineAppendix;
  if (!enrichedWritingEngine.startsWith('---')) {
    enrichedWritingEngine = `---\nstatus: "bespoke"\nrole: "writing_engine"\n---\n${enrichedWritingEngine}`;
  }
  if (await uploadFile(`${prefix}/01_WRITING_ENGINE.md`, enrichedWritingEngine)) {
    uploaded++;
  } else {
    failed++;
  }

  // 2. Split TEMPLATE_COMPONENTS into OPENINGS, MIDDLES, ENDINGS
  console.log('\n--- Step 2: Split TEMPLATE_COMPONENTS into O/M/E ---');
  if (await uploadFile(`${prefix}/06_OPENINGS.md`, split.openings)) uploaded++;
  else failed++;
  if (await uploadFile(`${prefix}/07_MIDDLES.md`, split.middles)) uploaded++;
  else failed++;
  if (await uploadFile(`${prefix}/08_ENDINGS.md`, split.endings)) uploaded++;
  else failed++;

  // 3. BLEND_RECIPES -> 09_BLENDS
  console.log('\n--- Step 3: BLEND_RECIPES ---');
  let blends = readLocalFile('04_BLEND_RECIPES.md');
  if (!blends.startsWith('---')) {
    blends = `---\nstatus: "bespoke"\nrole: "blends"\n---\n${blends}`;
  }
  if (await uploadFile(`${prefix}/09_BLENDS.md`, blends)) uploaded++;
  else failed++;

  // 4. TEST_EXAMPLE -> 10_EXAMPLES
  console.log('\n--- Step 4: TEST_EXAMPLE ---');
  let examples = readLocalFile('09_TEST_EXAMPLE.md');
  if (!examples.startsWith('---')) {
    examples = `---\nstatus: "bespoke"\nrole: "examples"\n---\n${examples}`;
  }
  if (await uploadFile(`${prefix}/10_EXAMPLES.md`, examples)) uploaded++;
  else failed++;

  // 5. START_HERE -> 00_START_HERE
  console.log('\n--- Step 5: START_HERE ---');
  let startHere = readLocalFile('00_JUSTIN_OS_V2_START_HERE.md');
  if (!startHere.startsWith('---')) {
    startHere = `---\nstatus: "bespoke"\nrole: "start_here"\n---\n${startHere}`;
  }
  if (await uploadFile(`${prefix}/00_START_HERE.md`, startHere)) uploaded++;
  else failed++;

  // Summary
  console.log('\n========================================');
  console.log(`Done! ${uploaded} uploaded, ${failed} failed`);
  console.log('========================================');

  // Verify by listing files
  console.log('\nVerifying uploaded files...');
  const { data: files, error } = await supabase.storage
    .from(BUCKET)
    .list(`contexts/${SLUG}/voice`);

  if (error) {
    console.error('Failed to list files:', error.message);
  } else if (files) {
    console.log(`\nFiles in contexts/${SLUG}/voice/:`);
    for (const f of files.sort((a, b) => a.name.localeCompare(b.name))) {
      console.log(`  ${f.name}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
