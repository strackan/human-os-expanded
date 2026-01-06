/**
 * Setup Sculptor Session for Scott Leese
 *
 * Run with: npx tsx scripts/setup-sculptor-session.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the prompt from the SQL file (extract between $PROMPT$ markers)
const sqlPath = path.join(__dirname, 'setup-sculptor-scott-leese.sql');
const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
const promptMatch = sqlContent.match(/\$PROMPT\$([\s\S]*?)\$PROMPT\$/);

if (!promptMatch) {
  console.error('Could not extract prompt from SQL file');
  process.exit(1);
}

const FULL_PROMPT = promptMatch[1];

async function main() {
  console.log('Setting up Sculptor session for Scott Leese...\n');

  // 1. Create or update the Sculptor template
  console.log('1. Creating/updating Sculptor template...');

  const { data: existingTemplate } = await supabase
    .from('sculptor_templates')
    .select('id')
    .eq('slug', 'sculptor')
    .single();

  if (existingTemplate) {
    // Update existing template
    const { error: templateError } = await supabase
      .from('sculptor_templates')
      .update({
        name: 'The Sculptor',
        description: 'Guided interview session for Voice-OS - theatrical fishing boat narrative',
        system_prompt: FULL_PROMPT,
        metadata: { version: '1.0', entity: 'scott-leese', entity_placeholder: '[ENTITY_NAME]' },
        updated_at: new Date().toISOString(),
      })
      .eq('slug', 'sculptor');

    if (templateError) {
      console.error('Error updating template:', templateError);
      process.exit(1);
    }
    console.log('   ✓ Template updated\n');
  } else {
    // Create new template
    const { error: templateError } = await supabase
      .from('sculptor_templates')
      .insert({
        slug: 'sculptor',
        name: 'The Sculptor',
        description: 'Guided interview session for Voice-OS - theatrical fishing boat narrative',
        system_prompt: FULL_PROMPT,
        metadata: { version: '1.0', entity: 'scott-leese', entity_placeholder: '[ENTITY_NAME]' },
      });

    if (templateError) {
      console.error('Error creating template:', templateError);
      process.exit(1);
    }
    console.log('   ✓ Template created\n');
  }

  // 2. Get template ID
  const { data: template } = await supabase
    .from('sculptor_templates')
    .select('id')
    .eq('slug', 'sculptor')
    .single();

  if (!template) {
    console.error('Template not found');
    process.exit(1);
  }

  // 3. Create or update session
  console.log('2. Creating session for Scott Leese...');
  const { data: existingSession } = await supabase
    .from('sculptor_sessions')
    .select('*')
    .eq('access_code', 'sc_scottleese')
    .single();

  if (existingSession) {
    // Update existing
    const { error: updateError } = await supabase
      .from('sculptor_sessions')
      .update({
        entity_name: 'Scott Leese',
        status: 'active',
        template_id: template.id,
        metadata: {
          created_by: 'setup-script',
        },
      })
      .eq('access_code', 'sc_scottleese');

    if (updateError) {
      console.error('Error updating session:', updateError);
      process.exit(1);
    }
    console.log('   ✓ Session updated (was existing)\n');
  } else {
    // Create new
    const { error: insertError } = await supabase.from('sculptor_sessions').insert({
      access_code: 'sc_scottleese',
      template_id: template.id,
      entity_name: 'Scott Leese',
      status: 'active',
      metadata: {
        created_by: 'setup-script',
      },
    });

    if (insertError) {
      console.error('Error creating session:', insertError);
      process.exit(1);
    }
    console.log('   ✓ Session created\n');
  }

  // 4. Output results
  const { data: session } = await supabase
    .from('sculptor_sessions')
    .select('*')
    .eq('access_code', 'sc_scottleese')
    .single();

  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCULPTOR SESSION READY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`Access Code:  ${session?.access_code}`);
  console.log(`Entity:       ${session?.entity_name}`);
  console.log(`Status:       ${session?.status}`);
  console.log('');
  console.log('TEST URL:');
  console.log(`  http://localhost:3000/sculptor/${session?.access_code}`);
  console.log('');
  console.log('STAGING URL:');
  console.log(`  https://renubu-staging.vercel.app/sculptor/${session?.access_code}`);
  console.log('');
  console.log('PRODUCTION URL:');
  console.log(`  https://renubu.com/sculptor/${session?.access_code}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
}

main().catch(console.error);
