/**
 * Debug: Show the FULL generated prompt for a session
 * Simulates exactly what the deployed SculptorService does
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

// Exactly matches the deployed code
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface EntityContext {
  groundRules: string;
  character: string;
  corpus: string;
  gaps: string;
}

async function fetchContextFile(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('contexts').download(path);
  if (error) return null;
  return await data.text();
}

async function getEntityContext(entitySlug: string): Promise<EntityContext | null> {
  const [groundRules, character, corpus, gaps] = await Promise.all([
    fetchContextFile('_shared/NPC_GROUND_RULES.md'),
    fetchContextFile(`${entitySlug}/CHARACTER.md`),
    fetchContextFile(`${entitySlug}/CORPUS_SUMMARY.md`),
    fetchContextFile(`${entitySlug}/GAP_ANALYSIS.md`),
  ]);

  if (!character) return null;

  return {
    groundRules: groundRules || '',
    character,
    corpus: corpus || '',
    gaps: gaps || '',
  };
}

function composeContextPrompt(context: EntityContext, entityName: string): string {
  const sections: string[] = [];

  if (context.groundRules) {
    sections.push('# Ground Rules\n\n' + context.groundRules);
  }

  if (context.character) {
    sections.push(context.character.replace(/\[ENTITY_NAME\]/g, entityName));
  }

  if (context.corpus) {
    sections.push('# What We Know\n\n' + context.corpus);
  }

  if (context.gaps) {
    sections.push('# Extraction Targets\n\n' + context.gaps);
  }

  return sections.join('\n\n---\n\n');
}

async function debugPrompt(accessCode: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`DEBUGGING: ${accessCode}`);
  console.log('='.repeat(60));

  // Get session with template
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('*, template:sculptor_templates(*)')
    .eq('access_code', accessCode)
    .single();

  if (!session) {
    console.error('Session not found');
    return;
  }

  console.log('\nSession Config:');
  console.log('  entity_name:', session.entity_name);
  console.log('  entity_slug:', session.entity_slug);
  console.log('  template_slug:', session.template?.slug);
  console.log('  has scene_prompt:', !!session.scene_prompt);

  const entityName = session.entity_name || 'the subject';

  // If entity_slug is set, use storage-based context
  if (session.entity_slug) {
    console.log('\n>>> Using STORAGE-BASED context');

    const context = await getEntityContext(session.entity_slug);
    if (!context) {
      console.error('Failed to fetch context from storage');
      return;
    }

    // Get template - check if we need to swap to premier
    let template = session.template;
    if (session.template?.slug === 'sculptor') {
      const { data: premierTemplate } = await supabase
        .from('sculptor_templates')
        .select('*')
        .eq('slug', 'premier')
        .single();
      if (premierTemplate) {
        template = premierTemplate;
        console.log('>>> Swapped to PREMIER template');
      }
    }

    // Build prompt exactly as deployed code does
    const placeholder = (template?.metadata?.entity_placeholder as string) || '[ENTITY_NAME]';
    const escapedPlaceholder = escapeRegex(placeholder);
    const basePrompt = template?.system_prompt.replace(new RegExp(escapedPlaceholder, 'g'), entityName);
    const contextPrompt = composeContextPrompt(context, entityName);
    const fullPrompt = `${basePrompt}\n\n---\n\n${contextPrompt}`;

    console.log('\n' + '='.repeat(60));
    console.log('FULL SYSTEM PROMPT');
    console.log('='.repeat(60));
    console.log(fullPrompt);
    console.log('='.repeat(60));
    console.log(`TOTAL LENGTH: ${fullPrompt.length} chars`);

  } else {
    console.log('\n>>> Using LEGACY scene_prompt');
    console.log('scene_prompt:', session.scene_prompt?.substring(0, 500));
  }
}

// Debug both sessions
async function main() {
  await debugPrompt('sc_ryan-owens');
  await debugPrompt('sc_chris-szalaj');
}

main().catch(console.error);
