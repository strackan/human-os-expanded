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
} from './types';

export class SculptorService {
  private client: SupabaseClient;

  constructor(supabase?: SupabaseClient) {
    this.client = supabase || createClient();
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
   */
  async createSession(params: CreateSessionParams): Promise<SculptorSession | null> {
    // Get template
    const template = await this.getTemplate(params.template_slug);
    if (!template) {
      console.error('Template not found:', params.template_slug);
      return null;
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
        output_path: params.output_path,
        metadata: params.metadata || {},
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
   * Build the system prompt with entity name substitution
   */
  buildSystemPrompt(template: SculptorTemplate, entityName: string): string {
    const placeholder = template.metadata?.entity_placeholder as string || '[ENTITY_NAME]';
    return template.system_prompt.replace(new RegExp(placeholder, 'g'), entityName);
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
