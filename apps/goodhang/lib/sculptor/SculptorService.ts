/**
 * Sculptor Service
 *
 * Manages Sculptor interview sessions, access code validation,
 * and response capture for Voice-OS Premier pages.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type {
  SculptorTemplate,
  SculptorSession,
  SculptorResponse,
  CreateSessionParams,
  ValidateCodeResult,
  CaptureResponseParams,
  EntityContext,
} from './types';

const CONTEXTS_BUCKET = 'contexts';
const CONTEXT_FILES = {
  groundRules: '_shared/NPC_GROUND_RULES.md',
  character: 'CHARACTER.md',
  corpus: 'CORPUS_SUMMARY.md',
  gaps: 'GAP_ANALYSIS.md',
} as const;

export class SculptorService {
  private client: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.client = supabase || createClient();
  }

  // =========================================================================
  // Context Storage Operations
  // =========================================================================

  /**
   * Fetch a single context file from Supabase Storage
   */
  private async fetchContextFile(path: string): Promise<string | null> {
    const { data, error } = await this.client.storage
      .from(CONTEXTS_BUCKET)
      .download(path);

    if (error) {
      console.error(`Error fetching context file ${path}:`, error);
      return null;
    }

    return await data.text();
  }

  /**
   * Fetch all context files for an entity from Supabase Storage
   */
  async getEntityContext(entitySlug: string): Promise<EntityContext | null> {
    console.log(`[SculptorService] Fetching context for entity: ${entitySlug}`);

    const [groundRules, character, corpus, gaps] = await Promise.all([
      this.fetchContextFile(CONTEXT_FILES.groundRules),
      this.fetchContextFile(`${entitySlug}/${CONTEXT_FILES.character}`),
      this.fetchContextFile(`${entitySlug}/${CONTEXT_FILES.corpus}`),
      this.fetchContextFile(`${entitySlug}/${CONTEXT_FILES.gaps}`),
    ]);

    // Character is required, others are optional
    if (!character) {
      console.error(`[SculptorService] CHARACTER.md not found for entity: ${entitySlug}`);
      return null;
    }

    return {
      groundRules: groundRules || '',
      character,
      corpus: corpus || '',
      gaps: gaps || '',
    };
  }

  /**
   * Compose a full context prompt from entity context files
   */
  composeContextPrompt(context: EntityContext, entityName: string): string {
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

  // =========================================================================
  // Template Operations
  // =========================================================================

  /**
   * Get a template by slug
   */
  async getTemplate(slug: string): Promise<SculptorTemplate | null> {
    const { data, error } = await this.client
      .from('sculptor_templates')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string): Promise<SculptorTemplate | null> {
    const { data, error } = await this.client
      .from('sculptor_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  // =========================================================================
  // Session Operations
  // =========================================================================

  /**
   * Validate an access code and return session details
   */
  async validateAccessCode(code: string): Promise<ValidateCodeResult> {
    const { data, error } = await this.client
      .from('sculptor_sessions')
      .select(`
        *,
        template:sculptor_templates(*)
      `)
      .eq('access_code', code)
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid access code' };
    }

    if (data.status === 'revoked') {
      return { valid: false, error: 'This session has been revoked' };
    }

    // Update last accessed timestamp
    await this.client
      .from('sculptor_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('id', data.id);

    return { valid: true, session: data };
  }

  /**
   * Get a session by ID
   */
  async getSession(sessionId: string): Promise<SculptorSession | null> {
    const { data, error } = await this.client
      .from('sculptor_sessions')
      .select(`
        *,
        template:sculptor_templates(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  }

  /**
   * Get a session by access code
   */
  async getSessionByCode(code: string): Promise<SculptorSession | null> {
    const { data, error } = await this.client
      .from('sculptor_sessions')
      .select(`
        *,
        template:sculptor_templates(*)
      `)
      .eq('access_code', code)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a new session with an auto-generated access code
   *
   * Supports two modes:
   * 1. Storage-based (preferred): Set entity_slug to read context from Supabase Storage
   *    - Automatically uses "premier" template unless overridden
   * 2. Legacy: Set scene_prompt to include context directly in the session
   */
  async createSession(params: CreateSessionParams): Promise<SculptorSession | null> {
    // Determine template slug - default to "premier" for storage-based contexts
    // The "premier" template is generic and lets CHARACTER.md define the scene
    // The "sculptor" template is the fishing boat scene (only for Scott Leese)
    let templateSlug = params.template_slug;
    if (params.entity_slug && params.template_slug === 'sculptor') {
      console.log('[SculptorService] Storage-based context detected, using "premier" template instead of "sculptor"');
      templateSlug = 'premier';
    }

    // Get template
    const template = await this.getTemplate(templateSlug);
    if (!template) {
      console.error('Template not found:', templateSlug);
      return null;
    }

    // Validate entity_slug context exists if provided
    if (params.entity_slug) {
      const context = await this.getEntityContext(params.entity_slug);
      if (!context) {
        console.error('Entity context not found in storage:', params.entity_slug);
        return null;
      }
      console.log(`[SculptorService] Entity context validated for: ${params.entity_slug}`);
    }

    // Generate access code
    const { data: codeResult, error: codeError } = await this.client
      .rpc('generate_sculptor_access_code');

    if (codeError) {
      console.error('Error generating access code:', codeError);
      return null;
    }

    // Create session
    const { data, error } = await this.client
      .from('sculptor_sessions')
      .insert({
        access_code: codeResult,
        template_id: template.id,
        entity_name: params.entity_name,
        entity_slug: params.entity_slug || null, // New: storage-based context
        output_path: params.output_path,
        metadata: params.metadata || {},
        scene_prompt: params.scene_prompt || null, // Legacy: direct prompt
        status: 'active',
      })
      .select(`
        *,
        template:sculptor_templates(*)
      `)
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  }

  /**
   * Update session status
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'active' | 'revoked' | 'completed'
  ): Promise<boolean> {
    const { error } = await this.client
      .from('sculptor_sessions')
      .update({ status })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session status:', error);
      return false;
    }

    return true;
  }

  /**
   * Link a chat thread to a session
   */
  async linkThread(sessionId: string, threadId: string): Promise<boolean> {
    const { error } = await this.client
      .from('sculptor_sessions')
      .update({ thread_id: threadId })
      .eq('id', sessionId);

    if (error) {
      console.error('Error linking thread:', error);
      return false;
    }

    return true;
  }

  // =========================================================================
  // Response Capture
  // =========================================================================

  /**
   * Capture a response from the interview
   */
  async captureResponse(params: CaptureResponseParams): Promise<SculptorResponse | null> {
    // Get current sequence number
    const { count } = await this.client
      .from('sculptor_responses')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', params.session_id);

    const sequence = (count || 0) + 1;

    const { data, error } = await this.client
      .from('sculptor_responses')
      .insert({
        session_id: params.session_id,
        scene: params.scene,
        question_key: params.question_key,
        question_text: params.question_text,
        response_text: params.response_text,
        routing_target: params.routing_target,
        sequence,
      })
      .select()
      .single();

    if (error) {
      console.error('Error capturing response:', error);
      return null;
    }

    return data;
  }

  /**
   * Get all responses for a session
   */
  async getResponses(sessionId: string): Promise<SculptorResponse[]> {
    const { data, error } = await this.client
      .from('sculptor_responses')
      .select('*')
      .eq('session_id', sessionId)
      .order('sequence', { ascending: true });

    if (error) {
      console.error('Error fetching responses:', error);
      return [];
    }

    return data || [];
  }

  // =========================================================================
  // Export
  // =========================================================================

  /**
   * Export session responses to markdown format
   */
  async exportToMarkdown(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const responses = await this.getResponses(sessionId);

    const lines: string[] = [
      '---',
      `title: ${session.template?.name || 'Sculptor'} Interview Responses`,
      `entity: ${session.entity_name || 'unknown'}`,
      `session_id: ${session.id}`,
      `access_code: ${session.access_code}`,
      `created: ${session.created_at.split('T')[0]}`,
      `status: ${session.status}`,
      '---',
      '',
      `# ${session.template?.name || 'Sculptor'} Interview Responses`,
      '',
    ];

    // Group responses by scene
    const byScene = new Map<string, SculptorResponse[]>();
    for (const response of responses) {
      const scene = response.scene || 'General';
      if (!byScene.has(scene)) {
        byScene.set(scene, []);
      }
      byScene.get(scene)!.push(response);
    }

    for (const [scene, sceneResponses] of byScene) {
      lines.push(`## ${scene}`, '');

      for (const response of sceneResponses) {
        if (response.question_key) {
          lines.push(`### ${response.question_key}`);
        }
        if (response.question_text) {
          lines.push(`**Question:** ${response.question_text}`);
        }
        lines.push(`**Response:** ${response.response_text || '(no response)'}`);
        if (response.routing_target) {
          lines.push(`**Route to:** ${response.routing_target}`);
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Build the system prompt with entity name substitution and scene composition
   *
   * Supports two modes:
   * 1. Storage-based (preferred): Uses pre-fetched EntityContext
   * 2. Legacy: Uses scene_prompt from session
   *
   * Composition order:
   * - Base template (objectives, D-series, output routing)
   * - Entity context OR scene_prompt (character/scene-specific content)
   */
  buildSystemPrompt(
    template: SculptorTemplate,
    entityName: string,
    scenePrompt?: string | null
  ): string {
    const placeholder = template.metadata?.entity_placeholder as string || '[ENTITY_NAME]';
    const escapedPlaceholder = this.escapeRegex(placeholder);
    let prompt = template.system_prompt.replace(new RegExp(escapedPlaceholder, 'g'), entityName);

    // Compose with scene prompt if provided (legacy mode)
    if (scenePrompt) {
      prompt = `${prompt}\n\n---\n\n${scenePrompt.replace(new RegExp(escapedPlaceholder, 'g'), entityName)}`;
    }

    return prompt;
  }

  /**
   * Build the system prompt using storage-based context (preferred)
   *
   * Composition order:
   * 1. Base template (objectives, D-series, output routing)
   * 2. Entity context from storage (ground rules, character, corpus, gaps)
   */
  buildSystemPromptWithContext(
    template: SculptorTemplate,
    entityName: string,
    context: EntityContext
  ): string {
    const placeholder = template.metadata?.entity_placeholder as string || '[ENTITY_NAME]';
    const escapedPlaceholder = this.escapeRegex(placeholder);
    const basePrompt = template.system_prompt.replace(new RegExp(escapedPlaceholder, 'g'), entityName);

    // Compose context from storage files
    const contextPrompt = this.composeContextPrompt(context, entityName);

    return `${basePrompt}\n\n---\n\n${contextPrompt}`;
  }

  /**
   * Get the full system prompt for a session
   *
   * Automatically chooses between storage-based and legacy modes:
   * - If session.entity_slug is set, fetches context from storage
   * - Otherwise, falls back to session.scene_prompt
   *
   * For storage-based sessions, uses the "premier" template logic even if
   * the session was created with "sculptor" template (handles legacy sessions).
   */
  async getSessionSystemPrompt(session: SculptorSession): Promise<string | null> {
    if (!session.template) {
      console.error('[SculptorService] Session has no template');
      return null;
    }

    const entityName = session.entity_name || 'the subject';

    // Prefer storage-based context if entity_slug is set
    if (session.entity_slug) {
      const context = await this.getEntityContext(session.entity_slug);
      if (context) {
        console.log(`[SculptorService] Using storage-based context for: ${session.entity_slug}`);

        // For storage-based contexts, use "premier" template logic to avoid
        // conflicting character instructions from "sculptor" template
        let template = session.template;
        if (session.template.slug === 'sculptor') {
          console.log('[SculptorService] Session has "sculptor" template with entity_slug, fetching "premier" template');
          const premierTemplate = await this.getTemplate('premier');
          if (premierTemplate) {
            template = premierTemplate;
          } else {
            console.warn('[SculptorService] "premier" template not found, using "sculptor" template (may have role conflicts)');
          }
        }

        return this.buildSystemPromptWithContext(template, entityName, context);
      }
      console.warn(`[SculptorService] entity_slug set but context not found, falling back to scene_prompt`);
    }

    // Fall back to legacy scene_prompt
    console.log(`[SculptorService] Using legacy scene_prompt for session: ${session.id}`);
    return this.buildSystemPrompt(session.template, entityName, session.scene_prompt);
  }
}

// Singleton instance for convenience
let instance: SculptorService | null = null;

export function getSculptorService(supabase?: SupabaseClient): SculptorService {
  if (!instance || supabase) {
    instance = new SculptorService(supabase);
  }
  return instance;
}
