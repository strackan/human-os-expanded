/**
 * Voice Files Migration Script
 *
 * Migrates voice commandment files from GFT to human-os Supabase database.
 * One-time migration script.
 *
 * Usage: npx tsx scripts/migrate-voice-files.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const VOICE_DIR = 'C:/Users/strac/dev/guyforthat/linkedin-extension-v2/mcp-server/supabase-storage/justin-inputs/voice'

// Map filenames to commandment types
const COMMANDMENT_MAP: Record<string, string> = {
  'THEMES.md': 'THEMES',
  'VOICE.md': 'VOICE',
  'GUARDRAILS.md': 'GUARDRAILS',
  'STORIES.md': 'STORIES',
  'ANECDOTES.md': 'ANECDOTES',
  'OPENINGS.md': 'OPENINGS',
  'MIDDLES.md': 'MIDDLES',
  'ENDINGS.md': 'ENDINGS',
  'BLENDS.md': 'BLENDS',
  'EXAMPLES.md': 'EXAMPLES',
}

// Parse frontmatter from markdown file
function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)

  if (!match) {
    return { frontmatter: {}, body: content }
  }

  const yamlContent = match[1] || ''
  const body = match[2] || ''

  const frontmatter: Record<string, string> = {}
  for (const line of yamlContent.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      frontmatter[key] = value
    }
  }

  return { frontmatter, body: body.trim() }
}

async function migrate() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'human_os' }
  })

  console.log('Creating/updating justin voice profile...')

  // Create or update justin profile
  const { data: profile, error: profileError } = await supabase
    .from('voice_profiles')
    .upsert({
      entity_slug: 'justin',
      display_name: 'Justin',
      description: 'Justin\'s authentic voice for LinkedIn content',
      layer: 'founder:justin',
      completeness: 0,
    }, {
      onConflict: 'entity_slug,layer'
    })
    .select()
    .single()

  if (profileError) {
    console.error('Failed to create profile:', profileError)
    process.exit(1)
  }

  console.log(`Profile created/updated: ${profile.id}`)

  // List available files
  const files = readdirSync(VOICE_DIR)
  console.log(`\nFound ${files.length} files in voice directory`)

  let imported = 0
  let skipped = 0

  // Import each commandment file
  for (const [filename, commandmentType] of Object.entries(COMMANDMENT_MAP)) {
    const filepath = join(VOICE_DIR, filename)

    try {
      const rawContent = readFileSync(filepath, 'utf-8')
      const { frontmatter, body } = parseFrontmatter(rawContent)

      console.log(`\nImporting ${filename} as ${commandmentType}...`)
      console.log(`  Frontmatter keys: ${Object.keys(frontmatter).join(', ') || '(none)'}`)
      console.log(`  Content length: ${body.length} chars`)

      const { error } = await supabase
        .from('voice_commandments')
        .upsert({
          profile_id: profile.id,
          commandment_type: commandmentType,
          frontmatter: {
            title: frontmatter.title || `${commandmentType} Commandment`,
            entity: frontmatter.entity || 'justin',
            version: frontmatter.version || '1.0',
            created: frontmatter.created || new Date().toISOString().slice(0, 10),
            revised: frontmatter.revised,
          },
          content: body,
          version: frontmatter.version || '1.0',
        }, {
          onConflict: 'profile_id,commandment_type'
        })

      if (error) {
        console.error(`  Failed: ${error.message}`)
        skipped++
      } else {
        console.log(`  Success!`)
        imported++
      }
    } catch (err) {
      console.error(`  File not found: ${filename}`)
      skipped++
    }
  }

  // Update profile completeness
  const completeness = Math.min(100, Math.round((imported / 10) * 100))
  await supabase
    .from('voice_profiles')
    .update({ completeness, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  console.log(`\n========================================`)
  console.log(`Migration complete!`)
  console.log(`  Imported: ${imported}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Profile completeness: ${completeness}%`)
  console.log(`========================================`)
}

migrate().catch(console.error)
