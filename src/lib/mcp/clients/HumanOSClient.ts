/**
 * Human-OS MCP Client
 *
 * Provides typed access to Human-OS enrichment and context tools.
 * Implements graceful degradation when Human-OS is unavailable.
 *
 * Features:
 * - Contact/company enrichment from GFT
 * - Relationship context (opinions)
 * - Skills files
 * - String-tie enrichment
 * - Parking lot expansion with progress
 * - External trigger checks
 */

import type { MCPServer, MCPQueryResponse, MCPError } from '../types/mcp.types';
import type {
  EnrichContactParams,
  EnrichCompanyParams,
  ContactEnrichmentResult,
  CompanyEnrichmentResult,
  FullEnrichmentResult,
  UpsertOpinionParams,
  Opinion,
  OpinionSummary,
  SkillsFileListResult,
  SkillsFileDetail,
  SkillsSearchResult,
  StringTieEnrichmentResult,
  ParkingLotExpansionResult,
  TriggerCheckResult,
  ProgressCallback,
} from '../types/humanOS.types';

/**
 * Human-OS MCP Client
 */
export class HumanOSClient {
  private server: MCPServer = 'human_os' as MCPServer;
  private enabled: boolean;
  private supabaseUrl: string;
  private supabaseKey: string;
  private tenantLayer: string;

  constructor() {
    this.enabled = process.env.MCP_ENABLE_HUMAN_OS === 'true';
    this.supabaseUrl = process.env.HUMAN_OS_SUPABASE_URL || '';
    this.supabaseKey = process.env.HUMAN_OS_SUPABASE_SERVICE_KEY || '';
    this.tenantLayer = process.env.RENUBU_TENANT_LAYER || 'renubu:tenant-default';

    if (this.enabled && (!this.supabaseUrl || !this.supabaseKey)) {
      console.warn(
        '[HumanOSClient] MCP_ENABLE_HUMAN_OS is true but HUMAN_OS_SUPABASE_URL or HUMAN_OS_SUPABASE_SERVICE_KEY is missing'
      );
    }
  }

  /**
   * Check if Human-OS integration is enabled
   */
  isEnabled(): boolean {
    return this.enabled && !!this.supabaseUrl && !!this.supabaseKey;
  }

  /**
   * Get the default tenant layer
   */
  getTenantLayer(): string {
    return this.tenantLayer;
  }

  // ============================================================================
  // ENRICHMENT TOOLS
  // ============================================================================

  /**
   * Enrich contact with LinkedIn data from GFT
   */
  async enrichContact(params: EnrichContactParams): Promise<ContactEnrichmentResult> {
    if (!this.isEnabled()) {
      return { found: false };
    }

    const response = await this.execute('enrich_contact', { ...params });
    if (!response.success || !response.data) {
      return { found: false };
    }

    return response.data as ContactEnrichmentResult;
  }

  /**
   * Enrich company with data from GFT
   */
  async enrichCompany(params: EnrichCompanyParams): Promise<CompanyEnrichmentResult> {
    if (!this.isEnabled()) {
      return { found: false };
    }

    const response = await this.execute('enrich_company', { ...params });
    if (!response.success || !response.data) {
      return { found: false };
    }

    return response.data as CompanyEnrichmentResult;
  }

  /**
   * Get full enrichment (contact + company + triangulation hints)
   */
  async getFullEnrichment(
    params: EnrichContactParams & EnrichCompanyParams
  ): Promise<FullEnrichmentResult> {
    if (!this.isEnabled()) {
      return {
        contact: { found: false },
        company: { found: false },
        triangulation_hints: {
          shared_connections: [],
          industry_context: '',
          relationship_signals: [],
        },
      };
    }

    const response = await this.execute('get_full_enrichment', { ...params });
    if (!response.success || !response.data) {
      return {
        contact: { found: false },
        company: { found: false },
        triangulation_hints: {
          shared_connections: [],
          industry_context: '',
          relationship_signals: [],
        },
      };
    }

    return response.data as FullEnrichmentResult;
  }

  // ============================================================================
  // RELATIONSHIP CONTEXT TOOLS
  // ============================================================================

  /**
   * Get all opinions for a contact
   */
  async getContactOpinions(contactEntityId: string, layer?: string): Promise<Opinion[]> {
    if (!this.isEnabled()) return [];

    const response = await this.execute('get_contact_opinions', {
      contact_entity_id: contactEntityId,
      layer: layer || this.tenantLayer,
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data as Opinion[];
  }

  /**
   * Create or update an opinion
   */
  async upsertOpinion(params: UpsertOpinionParams): Promise<{ success: boolean; id?: string }> {
    if (!this.isEnabled()) return { success: false };

    const response = await this.execute('upsert_opinion', {
      ...params,
      layer: params.layer || this.tenantLayer,
    });

    if (!response.success) {
      return { success: false };
    }

    return { success: true, id: response.data?.id };
  }

  /**
   * Search opinions by query
   */
  async searchOpinions(query: string, layer?: string, limit?: number): Promise<Opinion[]> {
    if (!this.isEnabled()) return [];

    const response = await this.execute('search_opinions', {
      query,
      layer: layer || this.tenantLayer,
      limit,
    });

    if (!response.success || !response.data) {
      return [];
    }

    return response.data as Opinion[];
  }

  /**
   * Get opinion summary for a contact
   */
  async getOpinionSummary(contactEntityId: string, layer?: string): Promise<OpinionSummary> {
    if (!this.isEnabled()) {
      return { has_opinions: false, opinion_types: [], key_points: [] };
    }

    const response = await this.execute('get_opinion_summary', {
      contact_entity_id: contactEntityId,
      layer: layer || this.tenantLayer,
    });

    if (!response.success || !response.data) {
      return { has_opinions: false, opinion_types: [], key_points: [] };
    }

    return response.data as OpinionSummary;
  }

  /**
   * Delete an opinion
   */
  async deleteOpinion(opinionId: string, layer?: string): Promise<{ success: boolean }> {
    if (!this.isEnabled()) return { success: false };

    const response = await this.execute('delete_opinion', {
      opinion_id: opinionId,
      layer: layer || this.tenantLayer,
    });

    return { success: response.success };
  }

  // ============================================================================
  // SKILLS TOOLS
  // ============================================================================

  /**
   * List available skills files
   */
  async listSkillsFiles(layer?: string, sourceSystem?: string): Promise<SkillsFileListResult> {
    if (!this.isEnabled()) return { files: [], total: 0 };

    const response = await this.execute('list_skills_files', {
      layer,
      source_system: sourceSystem,
    });

    if (!response.success || !response.data) {
      return { files: [], total: 0 };
    }

    return response.data as SkillsFileListResult;
  }

  /**
   * Get a specific skills file with full content
   */
  async getSkillsFile(fileId: string): Promise<SkillsFileDetail | null> {
    if (!this.isEnabled()) return null;

    const response = await this.execute('get_skills_file', { file_id: fileId });

    if (!response.success || !response.data) {
      return null;
    }

    return response.data as SkillsFileDetail;
  }

  /**
   * Search skills files by tool name
   */
  async searchSkillsByTool(toolName: string, layer?: string): Promise<SkillsSearchResult> {
    if (!this.isEnabled()) return { results: [] };

    const response = await this.execute('search_skills_by_tool', {
      tool_name: toolName,
      layer,
    });

    if (!response.success || !response.data) {
      return { results: [] };
    }

    return response.data as SkillsSearchResult;
  }

  // ============================================================================
  // STRING-TIE ENRICHMENT (FastMCP 2.0)
  // ============================================================================

  /**
   * Enrich a string-tie reminder with contact context
   * Uses mid-workflow LLM sampling via ctx.sample()
   */
  async enrichStringTie(reminderText: string): Promise<StringTieEnrichmentResult> {
    // Check feature flag
    if (!this.isEnabled() || process.env.FEATURE_STRING_TIE_ENRICHMENT !== 'true') {
      return { enriched: false, reason: 'Feature not enabled' };
    }

    const response = await this.execute('enrich_string_tie_reminder', {
      reminder_text: reminderText,
    });

    if (!response.success || !response.data) {
      return { enriched: false, reason: 'Enrichment failed' };
    }

    return response.data as StringTieEnrichmentResult;
  }

  // ============================================================================
  // PARKING LOT EXPANSION (FastMCP 2.0 with progress)
  // ============================================================================

  /**
   * Expand a parking lot idea with Human-OS context
   * Uses progress reporting via ctx.report_progress()
   */
  async expandParkingLotIdea(
    ideaText: string,
    customerContext?: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _onProgress?: ProgressCallback
  ): Promise<ParkingLotExpansionResult> {
    // Check feature flag
    if (!this.isEnabled() || process.env.FEATURE_PARKING_LOT_HUMAN_OS !== 'true') {
      throw new Error('Human-OS parking lot expansion not enabled');
    }

    // Note: Progress reporting would be handled via SSE/WebSocket in production
    // For now, we execute without progress callbacks
    const response = await this.execute('expand_parking_lot_idea', {
      idea_text: ideaText,
      customer_context: customerContext,
    });

    if (!response.success || !response.data) {
      throw new Error('Parking lot expansion failed');
    }

    return response.data as ParkingLotExpansionResult;
  }

  // ============================================================================
  // EXTERNAL TRIGGER CHECKS
  // ============================================================================

  /**
   * Check if a company has announced funding
   */
  async checkFundingEvent(
    companyIdOrName: string,
    minAmount?: number
  ): Promise<TriggerCheckResult> {
    if (!this.isEnabled() || process.env.FEATURE_EXTERNAL_WAKE_TRIGGERS !== 'true') {
      return { triggered: false, reason: 'Feature not enabled' };
    }

    const response = await this.execute('check_funding_event', {
      company: companyIdOrName,
      min_amount: minAmount,
    });

    if (!response.success) {
      return { triggered: false, reason: 'Check failed' };
    }

    return response.data as TriggerCheckResult;
  }

  /**
   * Check if a contact has changed jobs
   */
  async checkJobChange(contactIdOrName: string): Promise<TriggerCheckResult> {
    if (!this.isEnabled() || process.env.FEATURE_EXTERNAL_WAKE_TRIGGERS !== 'true') {
      return { triggered: false, reason: 'Feature not enabled' };
    }

    const response = await this.execute('check_job_change', {
      contact: contactIdOrName,
    });

    if (!response.success) {
      return { triggered: false, reason: 'Check failed' };
    }

    return response.data as TriggerCheckResult;
  }

  /**
   * Check if a contact has unusual LinkedIn activity
   */
  async checkActivitySpike(
    contactIdOrName: string,
    threshold?: number
  ): Promise<TriggerCheckResult> {
    if (!this.isEnabled() || process.env.FEATURE_EXTERNAL_WAKE_TRIGGERS !== 'true') {
      return { triggered: false, reason: 'Feature not enabled' };
    }

    const response = await this.execute('check_activity_spike', {
      contact: contactIdOrName,
      threshold: threshold || 3, // Default: 3x normal activity
    });

    if (!response.success) {
      return { triggered: false, reason: 'Check failed' };
    }

    return response.data as TriggerCheckResult;
  }

  /**
   * Check if a company is in the news
   */
  async checkCompanyNews(companyIdOrName: string): Promise<TriggerCheckResult> {
    if (!this.isEnabled() || process.env.FEATURE_EXTERNAL_WAKE_TRIGGERS !== 'true') {
      return { triggered: false, reason: 'Feature not enabled' };
    }

    const response = await this.execute('check_company_news', {
      company: companyIdOrName,
    });

    if (!response.success) {
      return { triggered: false, reason: 'Check failed' };
    }

    return response.data as TriggerCheckResult;
  }

  /**
   * Check if a new opinion was added about a contact
   */
  async checkNewOpinion(contactEntityId: string, layer?: string): Promise<TriggerCheckResult> {
    if (!this.isEnabled() || process.env.FEATURE_EXTERNAL_WAKE_TRIGGERS !== 'true') {
      return { triggered: false, reason: 'Feature not enabled' };
    }

    const response = await this.execute('check_new_opinion', {
      contact_entity_id: contactEntityId,
      layer: layer || this.tenantLayer,
    });

    if (!response.success) {
      return { triggered: false, reason: 'Check failed' };
    }

    return response.data as TriggerCheckResult;
  }

  // ============================================================================
  // CORE EXECUTION
  // ============================================================================

  /**
   * Execute a generic action on Human-OS
   */
  async execute(action: string, parameters: Record<string, unknown>): Promise<MCPQueryResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // In production, this would call the Human-OS MCP server
      // For now, we'll make a direct API call or return a placeholder
      const result = await this.callHumanOS(action, parameters);

      return {
        success: true,
        data: result,
        metadata: {
          duration: Date.now() - startTime,
          requestId,
        },
      };
    } catch (error) {
      return this.createErrorResponse(error as Error, requestId, startTime);
    }
  }

  /**
   * Call Human-OS MCP server
   * This is the integration point with the fastMCP server
   */
  private async callHumanOS(
    action: string,
    parameters: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Implement actual MCP call to Human-OS
    // Options:
    // 1. HTTP/SSE to Human-OS MCP server
    // 2. Direct Supabase RPC calls
    // 3. MCP SDK client

    // For now, log and return placeholder
    console.log(`[HumanOSClient] Calling Human-OS: ${action}`, parameters);

    // Placeholder implementation - will be replaced with actual MCP calls
    // This allows the rest of the system to be built and tested
    throw new Error(
      `Human-OS MCP call not implemented: ${action}. ` +
        'Set MCP_ENABLE_HUMAN_OS=false to use graceful degradation.'
    );
  }

  /**
   * Get tool definitions for LLM
   */
  getToolDefinitions() {
    if (!this.isEnabled()) return [];

    return [
      {
        name: 'mcp_human_os_enrich_contact',
        description: 'Get LinkedIn profile data for a contact from Human-OS',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            contact_name: {
              type: 'string' as const,
              description: 'Name of the contact',
            },
            contact_email: {
              type: 'string' as const,
              description: 'Email of the contact',
            },
            contact_linkedin_url: {
              type: 'string' as const,
              description: 'LinkedIn URL of the contact',
            },
            company_name: {
              type: 'string' as const,
              description: 'Company name for context',
            },
          },
        },
      },
      {
        name: 'mcp_human_os_enrich_company',
        description: 'Get company data including funding and news from Human-OS',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            company_name: {
              type: 'string' as const,
              description: 'Name of the company',
            },
            company_domain: {
              type: 'string' as const,
              description: 'Domain of the company',
            },
          },
        },
      },
      {
        name: 'mcp_human_os_get_opinion_summary',
        description: 'Get a summary of opinions about a contact',
        server: this.server,
        parameters: {
          type: 'object' as const,
          properties: {
            contact_entity_id: {
              type: 'string' as const,
              description: 'Entity ID of the contact',
            },
            layer: {
              type: 'string' as const,
              description: 'Layer for scoping (default: renubu tenant layer)',
            },
          },
          required: ['contact_entity_id'],
        },
      },
    ];
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    if (!this.isEnabled()) {
      return { healthy: false };
    }

    const startTime = Date.now();

    try {
      // Simple connectivity check
      // In production, this would ping the Human-OS MCP server
      const response = await this.execute('health', {});
      return {
        healthy: response.success,
        latency: Date.now() - startTime,
      };
    } catch {
      return {
        healthy: false,
        latency: Date.now() - startTime,
      };
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  /**
   * Create error response
   */
  private createErrorResponse(
    error: Error,
    requestId: string,
    startTime: number
  ): MCPQueryResponse {
    const mcpError: MCPError = {
      code: 'HUMAN_OS_ERROR',
      message: error.message || 'Human-OS operation failed',
      details: { error: error.toString() },
      server: this.server,
      timestamp: new Date().toISOString(),
    };

    return {
      success: false,
      error: mcpError,
      metadata: {
        duration: Date.now() - startTime,
        requestId,
      },
    };
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `human_os-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
