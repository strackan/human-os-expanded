/**
 * Regenerate Tier 1 Voice Files
 *
 * Re-generates OPENINGS, MIDDLES, ENDINGS, EXAMPLES for all users
 * with corpus data, using the upgraded powerpak-quality prompts.
 *
 * Does NOT touch:
 * - Tier 2 (THEMES, GUARDRAILS, STORIES, ANECDOTES) -- from sculptor
 * - Tier 3 (BLENDS, START_HERE) -- from voice calibration feedback
 * - WRITING_ENGINE -- only regenerated if missing
 *
 * Usage: npx tsx scripts/regenerate-tier1-voice.ts [slug1,slug2,...|all]
 */

import { createClient } from '@supabase/supabase-js';
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

// All known user slugs
const ALL_SLUGS = ['scott', 'justin', 'chris-szalaj', 'ryan-owens', 'amir-feizpour', 'hippie-bill'];

// Slug → display name
const DISPLAY_NAMES: Record<string, string> = {
  'scott': 'Scott Leese',
  'justin': 'Justin Strackany',
  'chris-szalaj': 'Chris Szalaj',
  'ryan-owens': 'Ryan Owens',
  'amir-feizpour': 'Amir Feizpour',
  'hippie-bill': 'Bill',
};

// =============================================================================
// STORAGE HELPERS
// =============================================================================

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
  console.log(`    OK: ${filePath} (${content.length} chars)`);
  return true;
}

// =============================================================================
// TIER 1 GENERATION (powerpak-quality prompts)
// =============================================================================

// =============================================================================
// INDIVIDUAL FILE GENERATORS (raw markdown, no JSON wrapping)
// =============================================================================

interface FileSpec {
  filename: string;
  label: string;
  prompt: (entityName: string) => string;
}

function getFileSpecs(entityName: string): FileSpec[] {
  return [
    {
      filename: '06_OPENINGS.md',
      label: 'OPENINGS',
      prompt: () => `Generate 06_OPENINGS.md for ${entityName}.

Output ONLY the markdown file content. No JSON wrapping, no code fences around the whole thing.

---
status: "tier1"
role: "openings"
---
# OPENINGS: ${entityName}

**Pick one opener per piece. Match energy to content type.**

Find 4-6 distinct opening patterns from the corpus. For EACH pattern use this exact format:

### O1: [PATTERN NAME IN CAPS]
[1-2 sentence description of the pattern]
**Example:** "[Actual opening line(s) from the corpus]"
**Energy match:** [melancholy/playful/punchy/reflective/observational/philosophical/energized/analytical]
**Use for:** [Content types -- product launches, personal stories, hot takes, etc.]

Pattern types to look for: VULNERABILITY (personal moment of failure/fear), SCENE-SETTING (present tense sensory details), PATTERN RECOGNITION ("Three things happened..."), PROVOCATIVE QUESTION (challenge assumption), SPECIFIC DETAIL (lead with surprising fact), ABSURDIST OBSERVATION (mundane to cosmic).`,
    },
    {
      filename: '07_MIDDLES.md',
      label: 'MIDDLES',
      prompt: () => `Generate 07_MIDDLES.md for ${entityName}.

Output ONLY the markdown file content. No JSON wrapping, no code fences around the whole thing.

---
status: "tier1"
role: "middles"
---
# MIDDLES: ${entityName}

**Pick 1-2 middles. Can combine. Check pairing suggestions.**

Find 4-7 middle/body patterns. For EACH use this exact format:

### M1: [PATTERN NAME]
[Description]
**Use for:** [content types]
**Pairs with:** [Which openers -- e.g. "O1, O3, O5"]
**Structural template:** [e.g. "Setup > Conflict > Turn > Resolution" or "specific > zoom out to pattern > universal truth"]

Pattern types to look for: STORY ARC, PHILOSOPHICAL ESCALATION, TECHNICAL DEEP DIVE, ANALOGY GAME, LIST-THAT-ISN'T-A-LIST, DIALOGUE-DRIVEN, EVIDENCE + VULNERABILITY.`,
    },
    {
      filename: '08_ENDINGS.md',
      label: 'ENDINGS',
      prompt: () => `Generate 08_ENDINGS.md for ${entityName}.

Output ONLY the markdown file content. No JSON wrapping, no code fences around the whole thing.

---
status: "tier1"
role: "endings"
---
# ENDINGS: ${entityName}

**Pick one ending. Check pairing suggestions.**

Find 4-6 ending patterns. For EACH use this exact format:

### E1: [PATTERN NAME]
[Description]
**Example:** "[Actual closing line from corpus if available]"
**Pairs with:** [Which O+M combos -- e.g. "O1+M1, O3+M6"]
**Use for:** [engagement, depth, action, etc.]

Pattern types to look for: OPEN QUESTION, INVITATION, CALLBACK, UNEXPECTED TWIST, PRACTICAL APPLICATION, PHILOSOPHICAL BUTTON.`,
    },
    {
      filename: '10_EXAMPLES.md',
      label: 'EXAMPLES',
      prompt: () => `Generate 10_EXAMPLES.md for ${entityName}.

Output ONLY the markdown file content. No JSON wrapping, no code fences around the whole thing.

---
status: "tier1"
role: "examples"
---
# EXAMPLES: ${entityName}

Select 3-5 representative pieces from the corpus. For EACH use this exact format:

### EXAMPLE #1: [TITLE]
**Blend:** [O? + M? + E?]
**Flavor elements used:** [signature moves found -- self-deprecation, parenthetical asides, vocabulary whiplash, strategic profanity, spacing as pacing, rabbit hole tangents, etc.]

[The actual content from the corpus]

#### COMPONENT BREAKDOWN
- **Opening (O?):** [Why this opening pattern]
- **Middle (M?):** [Why this middle pattern]
- **Ending (E?):** [Why this ending pattern]
- **Why it works:** [1-2 sentences]

Include the actual corpus content, not summaries.`,
    },
  ];
}

async function generateSingleFile(
  entityName: string,
  slug: string,
  corpus: string,
  spec: FileSpec,
): Promise<boolean> {
  console.log(`    Generating ${spec.label}...`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    system: `You are a voice pattern analyst building an operational writing playbook from raw corpus data. Your output must be production-quality -- rich with concrete examples, pairing logic, energy matches, and structural templates.

Output ONLY the raw markdown content of the file. Do NOT wrap in JSON. Do NOT wrap in code fences. Just output the markdown directly starting with the --- frontmatter.`,
    messages: [{
      role: 'user',
      content: `CORPUS for ${entityName}:

${corpus.substring(0, 40000)}

---

${spec.prompt(entityName)}`,
    }],
  });

  const block = response.content[0];
  let text = block && block.type === 'text' ? block.text : '';

  // Strip outer code fences if Claude wrapped it anyway
  const fenceMatch = text.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fenceMatch) text = fenceMatch[1]!;

  if (!text.trim()) {
    console.log(`    FAIL: Empty response for ${spec.label}`);
    return false;
  }

  return await uploadFile(`contexts/${slug}/voice/${spec.filename}`, text.trim());
}

async function generateTier1(
  entityName: string,
  slug: string,
  corpus: string,
): Promise<void> {
  console.log(`  Generating Tier 1 files for ${entityName}...`);
  console.log(`  Corpus size: ${corpus.length} chars`);

  const specs = getFileSpecs(entityName);

  // Generate all 4 files in parallel
  const results = await Promise.all(
    specs.map(spec => generateSingleFile(entityName, slug, corpus, spec))
  );

  const succeeded = results.filter(Boolean).length;
  console.log(`  Tier 1: ${succeeded}/${specs.length} files generated`);

  // Invalidate cached voice samples
  await supabase.storage.from(BUCKET).remove([`contexts/${slug}/VOICE_SAMPLES.json`]);

  console.log(`  Tier 1 regeneration complete for ${entityName}`);
}

// =============================================================================
// PER-USER PROCESSING
// =============================================================================

async function processUser(slug: string): Promise<void> {
  const entityName = DISPLAY_NAMES[slug] || slug;
  console.log(`\n========================================`);
  console.log(`${entityName} (${slug})`);
  console.log(`========================================`);

  // Check what exists
  const [digest, corpusSummary, writingEngine] = await Promise.all([
    downloadFile(`contexts/${slug}/DIGEST.md`),
    downloadFile(`contexts/${slug}/CORPUS_SUMMARY.md`),
    downloadFile(`contexts/${slug}/voice/01_WRITING_ENGINE.md`),
  ]);

  // Report current state
  const tier1Files = ['06_OPENINGS.md', '07_MIDDLES.md', '08_ENDINGS.md', '10_EXAMPLES.md'];
  const tier2Files = ['02_THEMES.md', '03_GUARDRAILS.md', '04_STORIES.md', '05_ANECDOTES.md'];
  const tier3Files = ['09_BLENDS.md', '00_START_HERE.md'];

  console.log(`\n  Current state:`);
  console.log(`  DIGEST: ${digest ? `${digest.length} chars` : 'MISSING'}`);
  console.log(`  CORPUS_SUMMARY: ${corpusSummary ? `${corpusSummary.length} chars` : 'MISSING'}`);
  console.log(`  WRITING_ENGINE: ${writingEngine ? `${writingEngine.length} chars` : 'MISSING'}`);

  for (const group of [
    { label: 'Tier 1', files: tier1Files },
    { label: 'Tier 2', files: tier2Files },
    { label: 'Tier 3', files: tier3Files },
  ]) {
    for (const f of group.files) {
      const content = await downloadFile(`contexts/${slug}/voice/${f}`);
      console.log(`  ${group.label} ${f}: ${content ? `${content.length} chars` : 'MISSING'}`);
    }
  }

  // Build corpus for generation
  const corpusParts: string[] = [];
  if (digest) corpusParts.push(digest);
  if (corpusSummary) corpusParts.push(corpusSummary);

  // Also try to load corpus_raw from contexts bucket
  try {
    const { data, error } = await supabase.storage.from('contexts').download(`${slug}/corpus_raw.md`);
    if (!error && data) {
      const raw = await data.text();
      if (raw) corpusParts.push(raw);
    }
  } catch { /* ignore */ }

  if (corpusParts.length === 0) {
    console.log(`\n  SKIP: No corpus data found for ${entityName}`);
    return;
  }

  const corpus = corpusParts.join('\n\n---\n\n');
  console.log(`\n  Combined corpus: ${corpus.length} chars`);

  // Generate Tier 1
  console.log(`\n  Regenerating Tier 1 files (overwriting existing)...`);
  await generateTier1(entityName, slug, corpus);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const arg = process.argv[2] || 'all';
  const slugs = arg === 'all' ? ALL_SLUGS : arg.split(',').map(s => s.trim());

  console.log('Regenerate Tier 1 Voice Files (Powerpak Quality)');
  console.log(`Targets: ${slugs.join(', ')}`);
  console.log('');
  console.log('This will OVERWRITE existing Tier 1 files (OPENINGS, MIDDLES, ENDINGS, EXAMPLES).');
  console.log('Tier 2 (sculptor) and Tier 3 (voice calibration) files are NOT touched.');

  for (const slug of slugs) {
    try {
      await processUser(slug);
    } catch (err) {
      console.error(`\n  ERROR processing ${slug}:`, err);
    }
  }

  console.log('\n========================================');
  console.log('Done!');
  console.log('========================================');
}

main().catch(console.error);
