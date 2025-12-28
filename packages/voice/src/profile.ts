/**
 * Human OS VoiceOS - Voice Profile Operations
 *
 * CRUD operations for voice profiles and commandments.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  VoiceConfig,
  VoiceProfile,
  Commandment,
  CommandmentType,
  CreateVoiceProfileInput,
  UpsertCommandmentInput,
} from './types.js'
import { parseCommandmentFile } from './parser.js'

// =============================================================================
// VOICE PROFILE MANAGER
// =============================================================================

export class VoiceProfileManager {
  private supabase: SupabaseClient
  private config: VoiceConfig

  constructor(config: VoiceConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
  }

  // ===========================================================================
  // PROFILE OPERATIONS
  // ===========================================================================

  /**
   * Get a voice profile by entity slug
   */
  async getProfile(entitySlug: string): Promise<VoiceProfile | null> {
    const { data, error } = await this.supabase
      .from('voice_profiles')
      .select('*')
      .eq('entity_slug', entitySlug)
      .maybeSingle()

    if (error) {
      console.error('Error fetching voice profile:', error)
      return null
    }

    if (!data) return null

    return this.mapProfileFromDb(data)
  }

  /**
   * Get a voice profile by ID
   */
  async getProfileById(id: string): Promise<VoiceProfile | null> {
    const { data, error } = await this.supabase
      .from('voice_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching voice profile:', error)
      return null
    }

    if (!data) return null

    return this.mapProfileFromDb(data)
  }

  /**
   * List all voice profiles for a layer
   */
  async listProfiles(layer?: string): Promise<VoiceProfile[]> {
    let query = this.supabase
      .from('voice_profiles')
      .select('*')
      .order('display_name')

    if (layer) {
      query = query.or(`layer.eq.public,layer.eq.${layer}`)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error listing voice profiles:', error)
      return []
    }

    return (data || []).map(this.mapProfileFromDb)
  }

  /**
   * Create a new voice profile
   */
  async createProfile(input: CreateVoiceProfileInput): Promise<VoiceProfile> {
    const { data, error } = await this.supabase
      .from('voice_profiles')
      .insert({
        entity_slug: input.entitySlug,
        display_name: input.displayName,
        layer: input.layer || this.config.defaultLayer,
        description: input.description,
        completeness: 0,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create voice profile: ${error.message}`)
    }

    return this.mapProfileFromDb(data)
  }

  /**
   * Update profile completeness based on commandments present
   */
  async updateCompleteness(profileId: string): Promise<void> {
    // Count commandments for this profile
    const { count, error } = await this.supabase
      .from('voice_commandments')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)

    if (error) {
      console.error('Error counting commandments:', error)
      return
    }

    // 10 commandments = 100%
    const completeness = Math.min(100, Math.round(((count || 0) / 10) * 100))

    await this.supabase
      .from('voice_profiles')
      .update({ completeness, updated_at: new Date().toISOString() })
      .eq('id', profileId)
  }

  // ===========================================================================
  // COMMANDMENT OPERATIONS
  // ===========================================================================

  /**
   * Get all commandments for a profile
   */
  async getCommandments(profileId: string): Promise<Commandment[]> {
    const { data, error } = await this.supabase
      .from('voice_commandments')
      .select('*')
      .eq('profile_id', profileId)
      .order('commandment_type')

    if (error) {
      console.error('Error fetching commandments:', error)
      return []
    }

    return (data || []).map(this.mapCommandmentFromDb)
  }

  /**
   * Get a specific commandment by type
   */
  async getCommandment(
    profileId: string,
    type: CommandmentType
  ): Promise<Commandment | null> {
    const { data, error } = await this.supabase
      .from('voice_commandments')
      .select('*')
      .eq('profile_id', profileId)
      .eq('commandment_type', type)
      .maybeSingle()

    if (error) {
      console.error('Error fetching commandment:', error)
      return null
    }

    if (!data) return null

    return this.mapCommandmentFromDb(data)
  }

  /**
   * Create or update a commandment
   */
  async upsertCommandment(input: UpsertCommandmentInput): Promise<Commandment> {
    // Parse the content to extract frontmatter
    const parsed = parseCommandmentFile(input.content)

    const { data, error } = await this.supabase
      .from('voice_commandments')
      .upsert(
        {
          profile_id: input.profileId,
          commandment_type: input.type,
          frontmatter: parsed.frontmatter,
          content: parsed.content,
          version: input.version || parsed.frontmatter.version || '1.0',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'profile_id,commandment_type',
        }
      )
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert commandment: ${error.message}`)
    }

    // Update profile completeness
    await this.updateCompleteness(input.profileId)

    return this.mapCommandmentFromDb(data)
  }

  /**
   * Delete a commandment
   */
  async deleteCommandment(profileId: string, type: CommandmentType): Promise<void> {
    const { error } = await this.supabase
      .from('voice_commandments')
      .delete()
      .eq('profile_id', profileId)
      .eq('commandment_type', type)

    if (error) {
      throw new Error(`Failed to delete commandment: ${error.message}`)
    }

    // Update profile completeness
    await this.updateCompleteness(profileId)
  }

  /**
   * Load a complete voice profile with all commandments
   */
  async loadFullProfile(entitySlug: string): Promise<{
    profile: VoiceProfile
    commandments: Record<CommandmentType, Commandment>
  } | null> {
    const profile = await this.getProfile(entitySlug)
    if (!profile) return null

    const commandments = await this.getCommandments(profile.id)
    const commandmentMap = commandments.reduce((acc, cmd) => {
      acc[cmd.type] = cmd
      return acc
    }, {} as Record<CommandmentType, Commandment>)

    return { profile, commandments: commandmentMap }
  }

  // ===========================================================================
  // IMPORT/EXPORT
  // ===========================================================================

  /**
   * Import commandments from markdown files
   */
  async importFromMarkdown(
    profileId: string,
    files: Array<{ type: CommandmentType; content: string }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const file of files) {
      try {
        await this.upsertCommandment({
          profileId,
          type: file.type,
          content: file.content,
        })
        success++
      } catch (error) {
        console.error(`Failed to import ${file.type}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  /**
   * Export commandments to markdown format
   */
  async exportToMarkdown(profileId: string): Promise<Record<CommandmentType, string>> {
    const commandments = await this.getCommandments(profileId)
    const result: Record<string, string> = {}

    for (const cmd of commandments) {
      // Reconstruct the full markdown file with frontmatter
      const frontmatterYaml = [
        '---',
        `title: ${cmd.frontmatter.title}`,
        `entity: ${cmd.frontmatter.entity}`,
        `version: "${cmd.version}"`,
        `created: ${cmd.frontmatter.created}`,
        ...(cmd.frontmatter.revised ? [`revised: ${cmd.frontmatter.revised}`] : []),
        '---',
        '',
      ].join('\n')

      result[cmd.type] = frontmatterYaml + cmd.content
    }

    return result as Record<CommandmentType, string>
  }

  // ===========================================================================
  // MAPPERS
  // ===========================================================================

  private mapProfileFromDb(data: Record<string, unknown>): VoiceProfile {
    return {
      id: data.id as string,
      entitySlug: data.entity_slug as string,
      displayName: data.display_name as string,
      layer: data.layer as VoiceProfile['layer'],
      description: data.description as string | undefined,
      sourceHierarchy: data.source_hierarchy as VoiceProfile['sourceHierarchy'],
      completeness: data.completeness as number,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    }
  }

  private mapCommandmentFromDb(data: Record<string, unknown>): Commandment {
    return {
      id: data.id as string,
      profileId: data.profile_id as string,
      type: data.commandment_type as CommandmentType,
      frontmatter: data.frontmatter as Commandment['frontmatter'],
      content: data.content as string,
      version: data.version as string,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    }
  }
}
