/**
 * Test sculptor session by sending an initial message
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

// Test which session
const ACCESS_CODE = process.argv[2] || 'sc_ryan-owens';

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

async function testSession() {
  console.log(`Testing session: ${ACCESS_CODE}\n`);

  // Get session
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('*, template:sculptor_templates(*)')
    .eq('access_code', ACCESS_CODE)
    .single();

  if (!session) {
    console.error('Session not found');
    return;
  }

  // Get premier template if needed
  let template = session.template;
  if (session.template?.slug === 'sculptor') {
    const { data: premierTemplate } = await supabase
      .from('sculptor_templates')
      .select('*')
      .eq('slug', 'premier')
      .single();
    if (premierTemplate) template = premierTemplate;
  }

  const entityName = session.entity_name || 'the subject';

  // Build system prompt
  const context = await getEntityContext(session.entity_slug);
  if (!context) {
    console.error('Context not found');
    return;
  }

  const placeholder = (template?.metadata?.entity_placeholder as string) || '[ENTITY_NAME]';
  const escapedPlaceholder = escapeRegex(placeholder);
  const basePrompt = template?.system_prompt.replace(new RegExp(escapedPlaceholder, 'g'), entityName);
  const contextPrompt = composeContextPrompt(context, entityName);
  const systemPrompt = `${basePrompt}\n\n---\n\n${contextPrompt}`;

  console.log('System prompt length:', systemPrompt.length, 'chars\n');

  // Call Anthropic API
  const anthropic = new Anthropic();

  console.log('Sending initial message to get opening...\n');
  console.log('=' .repeat(60));

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: '[Begin the scene]'
      }
    ]
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log(text);
  console.log('=' .repeat(60));
}

testSession().catch(console.error);
