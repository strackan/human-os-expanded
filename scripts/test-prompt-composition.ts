/**
 * Test prompt composition for ryan-owens session
 * Simulates what the API does to build the system prompt
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

const CONTEXTS_BUCKET = 'contexts';
const CONTEXT_FILES = {
  groundRules: '_shared/NPC_GROUND_RULES.md',
  character: 'CHARACTER.md',
  corpus: 'CORPUS_SUMMARY.md',
  gaps: 'GAP_ANALYSIS.md',
};

interface EntityContext {
  groundRules: string;
  character: string;
  corpus: string;
  gaps: string;
}

interface SculptorTemplate {
  id: string;
  slug: string;
  name: string;
  system_prompt: string;
  metadata: Record<string, any>;
}

async function fetchContextFile(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CONTEXTS_BUCKET)
    .download(path);

  if (error) {
    console.error(`Error fetching ${path}:`, error);
    return null;
  }

  return await data.text();
}

async function getEntityContext(entitySlug: string): Promise<EntityContext | null> {
  console.log(`Fetching context for entity: ${entitySlug}`);

  const [groundRules, character, corpus, gaps] = await Promise.all([
    fetchContextFile(CONTEXT_FILES.groundRules),
    fetchContextFile(`${entitySlug}/${CONTEXT_FILES.character}`),
    fetchContextFile(`${entitySlug}/${CONTEXT_FILES.corpus}`),
    fetchContextFile(`${entitySlug}/${CONTEXT_FILES.gaps}`),
  ]);

  if (!character) {
    console.error(`CHARACTER.md not found for entity: ${entitySlug}`);
    return null;
  }

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

async function testPromptComposition() {
  // Get the session
  const { data: session, error: sessionError } = await supabase
    .from('sculptor_sessions')
    .select('*, template:sculptor_templates(*)')
    .eq('access_code', 'sc_ryan-owens')
    .single();

  if (sessionError || !session) {
    console.error('Session error:', sessionError);
    return;
  }

  console.log('Session found:');
  console.log('  entity_name:', session.entity_name);
  console.log('  entity_slug:', session.entity_slug);
  console.log('  template:', session.template?.slug);

  const entityName = session.entity_name || 'the subject';

  // Check if entity_slug is set
  if (session.entity_slug) {
    console.log('\n=== Using storage-based context ===\n');

    // Fetch context from storage
    const context = await getEntityContext(session.entity_slug);
    if (!context) {
      console.error('Failed to get context');
      return;
    }

    console.log('Context loaded:');
    console.log('  groundRules length:', context.groundRules.length);
    console.log('  character length:', context.character.length);
    console.log('  corpus length:', context.corpus.length);
    console.log('  gaps length:', context.gaps.length);

    // Get the premier template (since we'd switch to it)
    const { data: premierTemplate } = await supabase
      .from('sculptor_templates')
      .select('*')
      .eq('slug', 'premier')
      .single();

    if (!premierTemplate) {
      console.error('Premier template not found');
      return;
    }

    const template = session.template?.slug === 'sculptor' ? premierTemplate : session.template;
    console.log('  Using template:', template?.slug);

    // Build the full prompt
    const placeholder = (template?.metadata?.entity_placeholder as string) || '[ENTITY_NAME]';
    const basePrompt = template?.system_prompt.replace(new RegExp(placeholder, 'g'), entityName);
    const contextPrompt = composeContextPrompt(context, entityName);
    const fullPrompt = `${basePrompt}\n\n---\n\n${contextPrompt}`;

    console.log('\n=== FULL SYSTEM PROMPT ===\n');
    console.log(fullPrompt.substring(0, 3000));
    console.log('\n... [truncated]');
    console.log('\n=== PROMPT LENGTH:', fullPrompt.length, 'chars ===');

    // Check for key phrases
    console.log('\n=== KEY PHRASE CHECKS ===');
    console.log('Contains "YOU ARE MARCUS WEBB":', fullPrompt.includes('YOU ARE MARCUS WEBB'));
    console.log('Contains "THE HUMAN YOU\'RE TALKING TO IS RYAN OWENS":', fullPrompt.includes("THE HUMAN YOU'RE TALKING TO IS RYAN OWENS"));
    console.log('Contains "DO NOT act as Ryan":', fullPrompt.includes('DO NOT act as Ryan'));
    console.log('Contains "Main Street Diner":', fullPrompt.includes('Main Street Diner'));
    console.log('Contains "fishing boat":', fullPrompt.includes('fishing boat'));
    console.log('Contains "red ball cap":', fullPrompt.includes('red ball cap'));

  } else {
    console.log('\n=== Using legacy scene_prompt ===');
    console.log('scene_prompt:', session.scene_prompt?.substring(0, 200));
  }
}

testPromptComposition().catch(console.error);
