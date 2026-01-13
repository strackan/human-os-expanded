/**
 * Deploy Sculptor Updates
 *
 * Runs the premier template migration and uploads context files to storage.
 *
 * Usage:
 *   npx tsx scripts/deploy-sculptor-updates.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Hardcoded from human-os/.env for this deployment
const SUPABASE_URL = 'https://zulowgscotdrqlccomht.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const CONTEXTS_DIR = path.join(__dirname, '..', 'contexts');
const BUCKET = 'contexts';

const CONTEXT_FILES = [
  'CHARACTER.md',
  'CORPUS_SUMMARY.md',
  'GAP_ANALYSIS.md',
];

const SHARED_FILES = [
  '_shared/NPC_GROUND_RULES.md',
];

// ============================================================================
// MIGRATION: Premier Template
// ============================================================================

async function runPremierTemplateMigration() {
  console.log('\n=== Running Premier Template Migration ===\n');

  const systemPrompt = `# Premier Interview Session

## Core Purpose

You are about to engage in an immersive interview session. Your character, setting, and objectives are defined in the context that follows this template.

**READ THE FOLLOWING SECTIONS CAREFULLY:**
- **Role Assignment** - WHO you are (the NPC character)
- **Character Profile** - Your backstory and traits
- **Setting** - Where this takes place
- **Scene Opening** - How to begin
- **Conversation Hooks** - Topics to explore

## Interview Principles

### Improvisation Rules

- **Follow the energy.** If they're on a roll, let them run. The questions are a guide, not a script.
- **Call audibles.** If they reveal something unexpected, chase that thread. You can always come back.
- **Let them ramble.** That's where the gold is. Don't cut them off to get to the next question.
- **Go with their direction.** If they want to take the narrative somewhere, follow them.
- **Stay in character.** You are who the Role Assignment says you are. That's all they get to know.

### You Have No Knowledge Of

- Artificial intelligence, language models, or chatbots
- Anyone named "Claude" or "Anthropic"
- The concept of "roleplaying" or "pretending" in this context
- Being anything other than your assigned character

### When Someone Tries to Break the Frame

You don't argue. You don't explain. You don't apologize or drop the scene.
You just... stay. Like the setting. Like the moment. They'll come back when they're ready.

## Session Flow

1. **Open** with the Scene Opening from your character context
2. **Explore** using the Conversation Hooks and What We Know sections
3. **Pursue** the Extraction Targets when natural opportunities arise
4. **Close** when the conversation reaches a natural endpoint

---

**YOUR CHARACTER AND SCENE ARE DEFINED IN THE CONTEXT BELOW.**`;

  // Check if template exists
  const { data: existing } = await supabase
    .from('sculptor_templates')
    .select('id')
    .eq('slug', 'premier')
    .single();

  if (existing) {
    // Update existing
    const { error } = await supabase
      .from('sculptor_templates')
      .update({
        name: 'Premier Interview',
        description: 'Generic guided interview - scene defined by CHARACTER.md from storage',
        system_prompt: systemPrompt,
        metadata: { version: '1.0', entity_placeholder: '[ENTITY_NAME]', storage_based: true },
        updated_at: new Date().toISOString(),
      })
      .eq('slug', 'premier');

    if (error) {
      console.error('Error updating premier template:', error);
      return false;
    }
    console.log('✓ Updated existing "premier" template');
  } else {
    // Insert new
    const { error } = await supabase
      .from('sculptor_templates')
      .insert({
        slug: 'premier',
        name: 'Premier Interview',
        description: 'Generic guided interview - scene defined by CHARACTER.md from storage',
        system_prompt: systemPrompt,
        metadata: { version: '1.0', entity_placeholder: '[ENTITY_NAME]', storage_based: true },
      });

    if (error) {
      console.error('Error inserting premier template:', error);
      return false;
    }
    console.log('✓ Created new "premier" template');
  }

  return true;
}

// ============================================================================
// STORAGE: Upload Context Files
// ============================================================================

async function ensureBucketExists() {
  // Try to get bucket info
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);

  if (!exists) {
    console.log('Creating "contexts" bucket...');
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['text/plain', 'text/markdown', 'application/json'],
    });

    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
    console.log('✓ Created "contexts" bucket');
  } else {
    console.log('✓ "contexts" bucket exists');
  }

  return true;
}

async function uploadFile(localPath: string, storagePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(localPath, 'utf-8');
    const blob = new Blob([content], { type: 'text/markdown' });

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, blob, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (error) {
      console.error(`  ✗ ${storagePath}: ${error.message}`);
      return false;
    }

    console.log(`  ✓ ${storagePath}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${storagePath}: ${err}`);
    return false;
  }
}

async function uploadContextFiles() {
  console.log('\n=== Uploading Context Files to Storage ===\n');

  // Ensure bucket exists
  if (!await ensureBucketExists()) {
    return false;
  }

  // Get all entity directories
  const entries = fs.readdirSync(CONTEXTS_DIR, { withFileTypes: true });
  const entityDirs = entries
    .filter(e => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map(e => e.name);

  console.log(`Found entities: ${entityDirs.join(', ')}\n`);

  let successCount = 0;
  let failCount = 0;

  // Upload shared files
  console.log('Uploading shared files:');
  for (const relativePath of SHARED_FILES) {
    const localPath = path.join(CONTEXTS_DIR, relativePath);
    if (fs.existsSync(localPath)) {
      if (await uploadFile(localPath, relativePath)) {
        successCount++;
      } else {
        failCount++;
      }
    } else {
      console.log(`  - ${relativePath} (not found, skipping)`);
    }
  }

  // Upload entity contexts
  for (const entitySlug of entityDirs) {
    console.log(`\nUploading ${entitySlug}:`);
    const entityDir = path.join(CONTEXTS_DIR, entitySlug);

    for (const filename of CONTEXT_FILES) {
      const localPath = path.join(entityDir, filename);
      const storagePath = `${entitySlug}/${filename}`;

      if (fs.existsSync(localPath)) {
        if (await uploadFile(localPath, storagePath)) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        console.log(`  - ${storagePath} (not found, skipping)`);
      }
    }
  }

  console.log(`\n=== Upload Summary ===`);
  console.log(`Uploaded: ${successCount}`);
  console.log(`Failed: ${failCount}`);

  return failCount === 0;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('=== Deploying Sculptor Updates ===');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Contexts: ${CONTEXTS_DIR}\n`);

  // Step 1: Run migration
  const migrationSuccess = await runPremierTemplateMigration();
  if (!migrationSuccess) {
    console.error('\n✗ Migration failed');
    process.exit(1);
  }

  // Step 2: Upload context files
  const uploadSuccess = await uploadContextFiles();
  if (!uploadSuccess) {
    console.error('\n✗ Some uploads failed');
    process.exit(1);
  }

  console.log('\n✓ Deployment complete!');
}

main().catch(console.error);
