/**
 * Backfill Voice Pipeline
 *
 * Migrates existing voice files to the new 3-tier numbered naming convention.
 *
 * For Scott:  Copy old-format files (OPENINGS.md) → new-format (06_OPENINGS.md)
 * For Justin: Upload local files to human-os bucket + generate missing Tier 1 files
 *
 * Usage: npx tsx scripts/backfill-voice-pipeline.ts [scott|justin|both]
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anthropicKey = process.env.ANTHROPIC_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

const BUCKET = 'human-os';

// =============================================================================
// STORAGE HELPERS
// =============================================================================

async function downloadFile(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error || !data) return null;
  return await data.text();
}

async function downloadFromContextsBucket(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('contexts').download(filePath);
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
    console.error(`  ❌ Upload failed: ${filePath} — ${error.message}`);
    return false;
  }
  console.log(`  ✅ Uploaded: ${filePath}`);
  return true;
}

function readLocalFile(localPath: string): string | null {
  try {
    return fs.readFileSync(localPath, 'utf-8');
  } catch {
    return null;
  }
}

// =============================================================================
// SCOTT: Rename existing files to new format
// =============================================================================

async function backfillScott() {
  console.log('\n========================================');
  console.log('SCOTT — Renaming old-format voice files');
  console.log('========================================\n');

  const slug = 'scott';
  const basePath = `contexts/${slug}/voice`;

  // Mapping: old name → new name
  const renames: Array<{ old: string; new: string }> = [
    { old: `${basePath}/OPENINGS.md`, new: `${basePath}/06_OPENINGS.md` },
    { old: `${basePath}/MIDDLES.md`, new: `${basePath}/07_MIDDLES.md` },
    { old: `${basePath}/ENDINGS.md`, new: `${basePath}/08_ENDINGS.md` },
    { old: `${basePath}/EXAMPLES.md`, new: `${basePath}/10_EXAMPLES.md` },
    { old: `${basePath}/THEMES.md`, new: `${basePath}/02_THEMES.md` },
    { old: `${basePath}/GUARDRAILS.md`, new: `${basePath}/03_GUARDRAILS.md` },
    { old: `${basePath}/STORIES.md`, new: `${basePath}/04_STORIES.md` },
    { old: `${basePath}/ANECDOTES.md`, new: `${basePath}/05_ANECDOTES.md` },
    { old: `${basePath}/BLENDS.md`, new: `${basePath}/09_BLENDS.md` },
  ];

  let copied = 0;

  for (const r of renames) {
    // Check if new file already exists
    const existing = await downloadFile(r.new);
    if (existing) {
      console.log(`  ⏭️  ${r.new} already exists (${existing.length} chars)`);
      copied++;
      continue;
    }

    // Download old file
    const content = await downloadFile(r.old);
    if (!content) {
      console.log(`  ⚠️  ${r.old} not found, skipping`);
      continue;
    }

    // Upload with new name
    const ok = await uploadFile(r.new, content);
    if (ok) copied++;
  }

  // VOICE.md → 01_WRITING_ENGINE.md (Scott's VOICE.md is the closest equivalent)
  // Actually need to check if Scott has a separate writing engine file
  const writingEngine = await downloadFile(`${basePath}/01_WRITING_ENGINE.md`);
  if (!writingEngine) {
    // Scott's VOICE.md contains voice patterns which overlaps with WRITING_ENGINE
    const voiceMd = await downloadFile(`${basePath}/VOICE.md`);
    if (voiceMd) {
      const ok = await uploadFile(`${basePath}/01_WRITING_ENGINE.md`, voiceMd);
      if (ok) copied++;
    } else {
      console.log('  ⚠️  No VOICE.md to use as WRITING_ENGINE fallback');
    }
  } else {
    console.log(`  ⏭️  01_WRITING_ENGINE.md already exists`);
    copied++;
  }

  // CONTEXT.md — generate from DIGEST if missing
  const contextMd = await downloadFile(`contexts/${slug}/voice/CONTEXT.md`);
  if (!contextMd) {
    const digest = await downloadFile(`contexts/${slug}/DIGEST.md`);
    if (digest) {
      console.log('  Generating CONTEXT.md from DIGEST...');
      const context = await generateContextFromDigest('Scott Leese', digest);
      await uploadFile(`contexts/${slug}/voice/CONTEXT.md`, context);
    }
  } else {
    console.log(`  ⏭️  CONTEXT.md already exists`);
  }

  // 00_START_HERE.md — copy from root if it exists there
  const startHere = await downloadFile(`contexts/${slug}/voice/00_START_HERE.md`);
  if (!startHere) {
    const rootStartHere = await downloadFile(`contexts/${slug}/START_HERE.md`);
    if (rootStartHere) {
      await uploadFile(`contexts/${slug}/voice/00_START_HERE.md`, rootStartHere);
    } else {
      console.log('  ⚠️  No START_HERE.md found');
    }
  }

  console.log(`\nScott: ${copied} files in new format`);
}

// =============================================================================
// JUSTIN: Upload from local + contexts bucket, generate missing Tier 1
// =============================================================================

async function backfillJustin() {
  console.log('\n========================================');
  console.log('JUSTIN — Upload + generate missing files');
  console.log('========================================\n');

  const slug = 'justin';
  const localBase = path.join(__dirname, '..', 'contexts', 'justin');

  // Step 1: Upload local files to human-os bucket
  console.log('--- Step 1: Uploading local files to human-os bucket ---\n');

  const localUploads: Array<{ local: string; remote: string }> = [
    { local: 'DIGEST.md', remote: `contexts/${slug}/DIGEST.md` },
    { local: 'CORPUS_SUMMARY.md', remote: `contexts/${slug}/CORPUS_SUMMARY.md` },
    { local: 'CHARACTER.md', remote: `contexts/${slug}/CHARACTER.md` },
    { local: 'CONTEXT.md', remote: `contexts/${slug}/CONTEXT.md` },
    { local: 'voice/01_WRITING_ENGINE.md', remote: `contexts/${slug}/voice/01_WRITING_ENGINE.md` },
  ];

  for (const u of localUploads) {
    const existing = await downloadFile(u.remote);
    if (existing) {
      console.log(`  ⏭️  ${u.remote} already exists (${existing.length} chars)`);
      continue;
    }

    const content = readLocalFile(path.join(localBase, u.local));
    if (content) {
      await uploadFile(u.remote, content);
    } else {
      // Try contexts bucket
      const fromCtx = await downloadFromContextsBucket(`${slug}/${u.local}`);
      if (fromCtx) {
        await uploadFile(u.remote, fromCtx);
      } else {
        console.log(`  ⚠️  ${u.local} not found locally or in contexts bucket`);
      }
    }
  }

  // Step 2: Check if we need to generate Tier 1 files
  console.log('\n--- Step 2: Check/Generate Tier 1 voice files ---\n');

  const tier1Check = await Promise.all([
    downloadFile(`contexts/${slug}/voice/06_OPENINGS.md`),
    downloadFile(`contexts/${slug}/voice/07_MIDDLES.md`),
    downloadFile(`contexts/${slug}/voice/08_ENDINGS.md`),
    downloadFile(`contexts/${slug}/voice/10_EXAMPLES.md`),
  ]);

  const hasTier1 = tier1Check.every(f => f !== null);

  if (hasTier1) {
    console.log('  ⏭️  All Tier 1 structural files already exist');
  } else {
    // Need corpus to generate
    let corpus = readLocalFile(path.join(localBase, 'src', 'corpus_raw.md'));
    if (!corpus) {
      // Try to build corpus from local source files
      const srcDir = path.join(localBase, 'src');
      if (fs.existsSync(srcDir)) {
        const srcFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.md'));
        if (srcFiles.length > 0) {
          corpus = srcFiles.map(f => {
            const content = fs.readFileSync(path.join(srcDir, f), 'utf-8');
            return `## ${f}\n\n${content}`;
          }).join('\n\n---\n\n');
          console.log(`  Built corpus from ${srcFiles.length} source files (${corpus.length} chars)`);
        }
      }
    }

    if (!corpus) {
      // Try contexts bucket
      corpus = await downloadFromContextsBucket(`${slug}/corpus_raw.md`);
    }

    if (!corpus) {
      // Fall back to DIGEST + CORPUS_SUMMARY as source
      const digest = readLocalFile(path.join(localBase, 'DIGEST.md'));
      const summary = readLocalFile(path.join(localBase, 'CORPUS_SUMMARY.md'));
      if (digest || summary) {
        corpus = [digest, summary].filter(Boolean).join('\n\n---\n\n');
        console.log(`  Using DIGEST + CORPUS_SUMMARY as corpus fallback (${corpus!.length} chars)`);
      }
    }

    if (corpus) {
      console.log(`  Generating Tier 1 files from corpus (${corpus.length} chars)...`);
      await generateAndUploadTier1('Justin Strackany', slug, corpus);
    } else {
      console.log('  ❌ No corpus data found — cannot generate Tier 1 files');
    }
  }

  // Step 3: Check Tier 2 files — Justin doesn't have sculptor transcript yet
  // so we can't generate these. Just report status.
  console.log('\n--- Step 3: Tier 2 status ---\n');

  const tier2Files = [
    `contexts/${slug}/voice/02_THEMES.md`,
    `contexts/${slug}/voice/03_GUARDRAILS.md`,
    `contexts/${slug}/voice/04_STORIES.md`,
    `contexts/${slug}/voice/05_ANECDOTES.md`,
    `contexts/${slug}/voice/CONTEXT.md`,
  ];

  for (const f of tier2Files) {
    const content = await downloadFile(f);
    if (content) {
      console.log(`  ✅ ${f.split('/').pop()} (${content.length} chars)`);
    } else {
      console.log(`  ❌ ${f.split('/').pop()} — needs sculptor session to generate`);
    }
  }
}

// =============================================================================
// GENERATION FUNCTIONS
// =============================================================================

async function generateContextFromDigest(entityName: string, digest: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: 'You generate a condensed CONTEXT.md — a day-to-day quick reference for an AI writing as this person. Output ONLY the markdown.',
    messages: [{
      role: 'user',
      content: `Generate a CONTEXT.md for ${entityName} from this DIGEST:

${digest.substring(0, 8000)}

---

Format:
---
status: "dev"
---
# CONTEXT: ${entityName}

## Key Identity
[2-3 sentences]

## Current Priorities
[What they're focused on]

## Communication Style
[Quick reference for tone, vocabulary, rhythm]

## Decision Framework
[How they make decisions]

## Relationship Approach
[How they connect with people]

## Content Strategy
[What they want to be known for]`,
    }],
  });

  const block = response.content[0];
  return block && block.type === 'text' ? block.text : '';
}

async function generateAndUploadTier1(
  entityName: string,
  slug: string,
  corpus: string,
): Promise<void> {
  console.log('  Calling Claude to generate Tier 1 structural files...');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    system: `You are a voice pattern analyst building an operational writing playbook from raw corpus data. Your output must be production-quality -- rich with concrete examples, pairing logic, energy matches, and structural templates that an AI writing system can actually use.

Output a JSON object with 4 keys: openings, middles, endings, examples.
Each value is a complete markdown document.`,
    messages: [{
      role: 'user',
      content: `Analyze this corpus for ${entityName} and generate 4 structural voice files.

CORPUS:
${corpus.substring(0, 50000)}

---

Generate JSON with these 4 files:

1. "openings" — 06_OPENINGS.md:
\`\`\`
---
status: "tier1"
---
# OPENINGS: ${entityName}

**Pick one opener per piece. Match energy to content type.**
\`\`\`

Find 4-6 distinct opening patterns from the corpus. For EACH pattern, provide ALL of these fields:

### O1: [PATTERN NAME IN CAPS]
[1-2 sentence description of the pattern]
**Example:** "[Actual opening line(s) from the corpus]"
**Energy match:** [melancholy/playful/punchy/reflective/observational/philosophical/energized/analytical]
**Use for:** [Content types this works with -- product launches, personal stories, hot takes, etc.]

The patterns should be concrete structural categories like VULNERABILITY (start with personal moment of failure/fear), ABSURDIST OBSERVATION (mundane → cosmic observation), SCENE-SETTING (present tense, vivid sensory details), PATTERN RECOGNITION ("Three things happened..."), PROVOCATIVE QUESTION (challenge assumption immediately), SPECIFIC DETAIL (lead with surprising fact).

2. "middles" — 07_MIDDLES.md:
\`\`\`
---
status: "tier1"
---
# MIDDLES: ${entityName}

**Pick 1-2 middles. Can combine. Check pairing suggestions.**
\`\`\`

Find 4-7 middle/body patterns. For EACH:

### M1: [PATTERN NAME]
[Description]
**Use for:** [content types]
**Pairs with:** [Which openers work well with this -- e.g. "O1, O3, O5"]
**Structural template:** [Brief description of the structure -- e.g. "Setup → Conflict → Turn → Resolution" or "specific → zoom out to pattern → universal truth"]

3. "endings" — 08_ENDINGS.md:
\`\`\`
---
status: "tier1"
---
# ENDINGS: ${entityName}

**Pick one ending. Check pairing suggestions.**
\`\`\`

Find 4-6 ending patterns. For EACH:

### E1: [PATTERN NAME]
[Description]
**Example:** "[Actual closing line from corpus if available]"
**Pairs with:** [Which O+M combinations -- e.g. "O1+M1, O3+M6"]
**Use for:** [engagement, depth, action, etc.]

4. "examples" — 10_EXAMPLES.md:
\`\`\`
---
status: "tier1"
---
# EXAMPLES: ${entityName}
\`\`\`

3-5 representative corpus samples, each with FULL annotation:

### EXAMPLE #N: [TITLE]
**Blend:** [O? + M? + E?]
**Flavor elements used:** [List any signature moves -- self-deprecation, parenthetical asides, vocabulary whiplash, strategic profanity, spacing as pacing, rabbit hole tangents, etc.]

\`\`\`
[The actual content]
\`\`\`

#### COMPONENT BREAKDOWN
- **Opening ([O?]):** [Why this opening pattern]
- **Middle ([M?]):** [Why this middle pattern]
- **Ending ([E?]):** [Why this ending pattern]
- **Why it works:** [1-2 sentences on what makes this piece effective]

Return valid JSON.`,
    }],
  });

  const block = response.content[0];
  const text = block && block.type === 'text' ? block.text : '';

  // Parse JSON
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) cleaned = cleaned.substring(startIdx, endIdx + 1);

  const parsed = JSON.parse(cleaned);

  // Upload
  const prefix = `contexts/${slug}/voice`;
  await Promise.all([
    parsed.openings ? uploadFile(`${prefix}/06_OPENINGS.md`, parsed.openings) : null,
    parsed.middles ? uploadFile(`${prefix}/07_MIDDLES.md`, parsed.middles) : null,
    parsed.endings ? uploadFile(`${prefix}/08_ENDINGS.md`, parsed.endings) : null,
    parsed.examples ? uploadFile(`${prefix}/10_EXAMPLES.md`, parsed.examples) : null,
  ]);

  console.log('  Tier 1 generation complete');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const target = process.argv[2] || 'both';

  console.log('Voice Pipeline Backfill');
  console.log(`Target: ${target}`);
  console.log(`Bucket: ${BUCKET}`);

  if (target === 'scott' || target === 'both') {
    await backfillScott();
  }

  if (target === 'justin' || target === 'both') {
    await backfillJustin();
  }

  console.log('\n========================================');
  console.log('Done!');
  console.log('========================================');
}

main().catch(console.error);
