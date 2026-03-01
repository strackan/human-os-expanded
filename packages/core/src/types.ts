/**
 * Human OS Core Types
 *
 * These types define the core abstractions for the context engine,
 * knowledge graph, and privacy model.
 */

// =============================================================================
// PRIVACY & LAYERS
// =============================================================================

/**
 * Privacy layers determine who can access content.
 * The path structure in storage encodes the privacy level.
 */
export type Layer =
  | 'public'                      // Anyone can read
  | 'powerpak-published'          // Subscribers can read
  | `renubu:tenant-${string}`     // Specific tenant can read/write
  | `founder:${string}`           // Specific user can read/write
  | `prompts:${string}`;          // System prompts layer (e.g., prompts:system, prompts:userId)

/**
 * Privacy scope for entities and files
 */
export type PrivacyScope =
  | 'public'
  | 'powerpak_published'
  | 'tenant'
  | 'user'
  | 'private';

/**
 * Viewer represents who is making a request.
 * Used to determine which layers they can access.
 */
export interface Viewer {
  userId?: string;
  tenantId?: string;
  powerpakSubscriptions?: string[];  // Expert slugs they subscribe to
  /** Context sharing: slug → owner user IDs who share that topic with this viewer */
  sharedContextSlugs?: Map<string, string[]>;
}

// =============================================================================
// OPERATION CONTEXT
// =============================================================================

/**
 * Context passed to service and tool handlers.
 * Transport-agnostic - works for MCP, REST, and direct invocation.
 *
 * @remarks
 * This is the unified context type used across:
 * - @human-os/services (ServiceContext)
 * - @human-os/tools (ToolContext)
 * - MCP tool handlers
 * - REST API handlers
 */
export interface OperationContext {
  /** Supabase client for database operations */
  supabase: import('@supabase/supabase-js').SupabaseClient;
  /** Authenticated user ID */
  userId: string;
  /** Privacy layer for the operation */
  layer: string;
}

// =============================================================================
// ENTITIES
// =============================================================================

/**
 * Entity types supported by the system
 */
export type EntityType =
  | 'person'
  | 'company'
  | 'project'
  | 'goal'
  | 'task'
  | 'relationship'
  | 'interaction'
  | 'expert';

/**
 * Source system that created the entity
 */
export type SourceSystem =
  | 'renubu'
  | 'founder_os'
  | 'voice_os'
  | 'guyforthat'
  | 'powerpak'
  | 'fancy_robot'
  | 'manual';

/**
 * An entity is any "thing" in the system - people, companies, projects, etc.
 */
export interface Entity {
  id: string;
  slug: string;
  entityType: EntityType;
  name: string;
  email?: string;
  metadata: Record<string, unknown>;

  // Ownership
  ownerId?: string;
  tenantId?: string;
  privacyScope: PrivacyScope;

  // Source tracking
  sourceSystem?: SourceSystem;
  sourceId?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new entity
 */
export interface CreateEntityInput {
  slug?: string;
  entityType: EntityType;
  name: string;
  email?: string;
  metadata?: Record<string, unknown>;
  ownerId?: string;
  tenantId?: string;
  privacyScope?: PrivacyScope;
  sourceSystem?: SourceSystem;
  sourceId?: string;
}

/**
 * Input for updating an entity
 */
export interface UpdateEntityInput {
  name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
  privacyScope?: PrivacyScope;
}

// =============================================================================
// CONTEXT FILES
// =============================================================================

/**
 * A context file is a markdown document stored in Supabase Storage.
 * The file path encodes both the content type and privacy level.
 */
export interface ContextFile {
  id: string;
  entityId?: string;
  layer: Layer;
  filePath: string;
  storageBucket: string;
  contentHash?: string;
  lastSyncedAt?: Date;
  createdAt: Date;
}

/**
 * Parsed content from a context file
 */
export interface ParsedContextFile {
  id: string;
  filePath: string;
  layer: Layer;
  frontmatter: Record<string, unknown>;
  content: string;
  entityId?: string;
  privacyScope: PrivacyScope;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Merged context from multiple layers for a single entity
 */
export interface MergedContext {
  entity: Entity;
  layers: Array<{
    layer: Layer;
    content: string;
    frontmatter: Record<string, unknown>;
  }>;
  connections: {
    incoming: EntityLink[];
    outgoing: EntityLink[];
  };
}

// =============================================================================
// KNOWLEDGE GRAPH
// =============================================================================

/**
 * Types of links between entities
 */
export type LinkType =
  | 'wiki_link'      // [[link]] in markdown
  | 'mentions'       // Entity mentions entity
  | 'child_of'       // Hierarchical relationship
  | 'related_to'     // Generic association
  | 'works_at'       // Person -> Company
  | 'contacts'       // Person -> Person
  | 'owns'           // User -> Entity
  | 'assigned_to'    // Task -> Person
  | 'part_of';       // Entity -> Project/Goal

/**
 * A link between two entities in the knowledge graph
 */
export interface EntityLink {
  id: string;
  layer: Layer;
  sourceSlug: string;
  targetSlug: string;
  linkType: LinkType;
  linkText?: string;
  contextSnippet?: string;
  strength: number;
  createdAt: Date;
}

/**
 * A node in the knowledge graph (entity with graph metadata)
 */
export interface GraphNode {
  id: string;
  entityType: EntityType;
  name: string;
  slug: string;
  metadata: Record<string, unknown>;
}

/**
 * An edge in the knowledge graph
 */
export interface GraphEdge {
  sourceId: string;
  targetId: string;
  sourceSlug: string;
  targetSlug: string;
  linkType: LinkType;
  strength: number;
}

/**
 * Query parameters for graph traversal
 */
export interface GraphQuery {
  startNodeId?: string;
  startSlug?: string;
  maxDepth?: number;
  linkTypes?: LinkType[];
  entityTypes?: EntityType[];
}

/**
 * Result of a graph traversal
 */
export interface GraphTraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths: string[][];
}

// =============================================================================
// INTERACTIONS
// =============================================================================

/**
 * Types of interactions
 */
export type InteractionType =
  | 'meeting'
  | 'email'
  | 'call'
  | 'message'
  | 'comment'
  | 'check_in'
  | 'workflow_step'
  | 'note'
  | 'engagement';

/**
 * Sentiment of an interaction
 */
export type Sentiment = 'positive' | 'neutral' | 'concerned' | 'urgent';

/**
 * An interaction is a temporal event (meeting, email, check-in, etc.)
 */
export interface Interaction {
  id: string;
  entityId?: string;
  layer: Layer;
  interactionType: InteractionType;
  title?: string;
  content?: string;
  sentiment?: Sentiment;
  metadata: Record<string, unknown>;
  occurredAt: Date;
  durationMinutes?: number;
  ownerId?: string;
  sourceSystem?: SourceSystem;
  sourceId?: string;
  createdAt: Date;
}

/**
 * Input for creating an interaction
 */
export interface CreateInteractionInput {
  entityId?: string;
  layer: Layer;
  interactionType: InteractionType;
  title?: string;
  content?: string;
  sentiment?: Sentiment;
  metadata?: Record<string, unknown>;
  occurredAt?: Date;
  durationMinutes?: number;
  sourceSystem?: SourceSystem;
  sourceId?: string;
}

// =============================================================================
// API KEYS
// =============================================================================

/**
 * API key scopes define what operations are allowed
 */
export type ApiKeyScope =
  | 'context:public:read'
  | `context:tenant:${string}:read`
  | `context:tenant:${string}:write`
  | `context:user:${string}:read`
  | `context:user:${string}:write`
  | `context:user:${string}:*`
  | `voice:${string}:generate`
  | 'voice:*:generate'
  | `experts:${string}:query`
  | 'experts:*:query'
  | 'graph:read'
  | 'entities:read'
  | 'entities:write';

/**
 * An API key for accessing Human OS
 */
export interface ApiKey {
  id: string;
  ownerId?: string;
  name: string;
  scopes: ApiKeyScope[];
  rateLimitPerMinute: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Configuration for Human OS client
 */
export interface HumanOSConfig {
  supabaseUrl: string;
  supabaseKey: string;
  storageBucket?: string;
}

/**
 * Configuration for context engine
 */
export interface ContextEngineConfig extends HumanOSConfig {
  viewer: Viewer;
}

/**
 * Configuration for knowledge graph
 */
export interface KnowledgeGraphConfig extends HumanOSConfig {
  defaultLayers?: Layer[];
}

// =============================================================================
// CRM TYPES
// =============================================================================

/**
 * Deal sources indicating how the opportunity originated
 */
export type OpportunitySource =
  | 'linkedin'
  | 'referral'
  | 'inbound'
  | 'cold_outreach'
  | 'event'
  | 'website'
  | 'partner'
  | 'other';

/**
 * Activity types for opportunity activities
 */
export type OpportunityActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'note'
  | 'linkedin_message'
  | 'demo'
  | 'proposal_sent'
  | 'contract_sent'
  | 'follow_up'
  | 'other';

/**
 * Account types for CRM account context
 */
export type AccountType = 'prospect' | 'customer' | 'partner' | 'competitor' | 'other';

/**
 * Account tiers for segmentation
 */
export type AccountTier = 'enterprise' | 'mid_market' | 'smb' | 'startup';

/**
 * Billing periods for recurring products
 */
export type BillingPeriod = 'monthly' | 'quarterly' | 'annually' | 'one_time';

/**
 * Pipeline stage in a CRM workflow
 */
export interface PipelineStage {
  id: string;
  ownerId?: string;
  tenantId?: string;
  name: string;
  position: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a pipeline stage
 */
export interface CreatePipelineStageInput {
  name: string;
  position: number;
  probability?: number;
  isWon?: boolean;
  isLost?: boolean;
  color?: string;
}

/**
 * A CRM opportunity (deal)
 */
export interface Opportunity {
  id: string;
  ownerId?: string;
  tenantId?: string;

  // Links
  entityId?: string;
  gftContactId?: string;
  companyEntityId?: string;
  gftCompanyId?: string;

  // Deal info
  name: string;
  stageId?: string;
  stage?: PipelineStage;
  expectedValue?: number;
  currency: string;
  expectedCloseDate?: Date;
  probability?: number;

  // Context
  source?: OpportunitySource;
  description?: string;
  nextStep?: string;
  nextStepDate?: Date;

  // Tracking
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  wonAt?: Date;
  lostAt?: Date;
  lostReason?: string;

  // Assignment
  assignedTo?: string;
}

/**
 * Input for creating an opportunity
 */
export interface CreateOpportunityInput {
  name: string;
  entityId?: string;
  gftContactId?: string;
  companyEntityId?: string;
  gftCompanyId?: string;
  stageId?: string;
  expectedValue?: number;
  currency?: string;
  expectedCloseDate?: Date;
  probability?: number;
  source?: OpportunitySource;
  description?: string;
  nextStep?: string;
  nextStepDate?: Date;
  assignedTo?: string;
}

/**
 * Input for updating an opportunity
 */
export interface UpdateOpportunityInput {
  name?: string;
  stageId?: string;
  expectedValue?: number;
  expectedCloseDate?: Date;
  probability?: number;
  source?: OpportunitySource;
  description?: string;
  nextStep?: string;
  nextStepDate?: Date;
  assignedTo?: string;
  lostReason?: string;
}

/**
 * Activity recorded for an opportunity
 */
export interface OpportunityActivity {
  id: string;
  opportunityId: string;
  activityType: OpportunityActivityType;
  occurredAt: Date;
  notes?: string;
  outcome?: string;
  durationMinutes?: number;
  createdBy?: string;
  createdAt: Date;
}

/**
 * Input for creating an opportunity activity
 */
export interface CreateOpportunityActivityInput {
  opportunityId: string;
  activityType: OpportunityActivityType;
  occurredAt?: Date;
  notes?: string;
  outcome?: string;
  durationMinutes?: number;
}

/**
 * A product or service in the CRM catalog
 */
export interface Product {
  id: string;
  ownerId?: string;
  tenantId?: string;
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  unitPrice?: number;
  isRecurring: boolean;
  billingPeriod?: BillingPeriod;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a product
 */
export interface CreateProductInput {
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  unitPrice?: number;
  isRecurring?: boolean;
  billingPeriod?: BillingPeriod;
  isActive?: boolean;
}

/**
 * Line item in an opportunity
 */
export interface OpportunityLineItem {
  id: string;
  opportunityId: string;
  productId?: string;
  product?: Product;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  totalPrice: number;
  createdAt: Date;
}

/**
 * Input for creating a line item
 */
export interface CreateOpportunityLineItemInput {
  opportunityId: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unitPrice: number;
  discountPercent?: number;
}

/**
 * Account context for company intelligence
 */
export interface AccountContext {
  id: string;
  ownerId?: string;
  tenantId?: string;
  companyEntityId?: string;
  gftCompanyId?: string;
  accountType?: AccountType;
  tier?: AccountTier;
  industryVertical?: string;
  techStack: string[];
  budgetInfo?: string;
  decisionProcess?: string;
  fiscalYearEnd?: string;
  relationshipOwner?: string;
  lastEngagementDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating or updating account context
 */
export interface UpsertAccountContextInput {
  companyEntityId?: string;
  gftCompanyId?: string;
  accountType?: AccountType;
  tier?: AccountTier;
  industryVertical?: string;
  techStack?: string[];
  budgetInfo?: string;
  decisionProcess?: string;
  fiscalYearEnd?: string;
  relationshipOwner?: string;
  lastEngagementDate?: Date;
  notes?: string;
}

/**
 * Pipeline summary with aggregated metrics
 */
export interface PipelineSummary {
  stageId: string;
  stageName: string;
  position: number;
  opportunityCount: number;
  totalValue: number;
  weightedValue: number;
}

// =============================================================================
// CAMPAIGN TYPES
// =============================================================================

/**
 * Campaign types for organizing outbound efforts
 */
export type CampaignType = 'outbound' | 'nurture' | 'event' | 're_engagement';

/**
 * Campaign status
 */
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';

/**
 * Goal types for campaign success metrics
 */
export type CampaignGoalType = 'discovery_calls' | 'responses' | 'meetings' | 'demos' | 'conversions';

/**
 * Campaign member status in the outreach funnel
 */
export type CampaignMemberStatus =
  | 'pending'
  | 'contacted'
  | 'responded'
  | 'interested'
  | 'converted'
  | 'not_interested'
  | 'opted_out'
  | 'bounced';

/**
 * Campaign activity types
 */
export type CampaignActivityType =
  | 'linkedin_connect'
  | 'linkedin_message'
  | 'email'
  | 'call'
  | 'voicemail'
  | 'other';

/**
 * Campaign activity outcome
 */
export type CampaignActivityOutcome =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'replied'
  | 'accepted'
  | 'declined'
  | 'bounced'
  | 'no_answer';

/**
 * A campaign for organized outbound efforts
 */
export interface Campaign {
  id: string;
  ownerId?: string;
  tenantId?: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  goalType?: CampaignGoalType;
  goalTarget?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a campaign
 */
export interface CreateCampaignInput {
  name: string;
  description?: string;
  campaignType?: CampaignType;
  goalType?: CampaignGoalType;
  goalTarget?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Input for updating a campaign
 */
export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  goalType?: CampaignGoalType;
  goalTarget?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * A contact enrolled in a campaign
 */
export interface CampaignMember {
  id: string;
  campaignId: string;
  entityId?: string;
  gftContactId?: string;
  status: CampaignMemberStatus;
  addedAt: Date;
  firstContactedAt?: Date;
  lastContactedAt?: Date;
  respondedAt?: Date;
  convertedAt?: Date;
  convertedToOpportunityId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for adding members to a campaign
 */
export interface AddCampaignMemberInput {
  gftContactId?: string;
  entityId?: string;
  notes?: string;
}

/**
 * An outreach activity in a campaign
 */
export interface CampaignActivity {
  id: string;
  campaignId: string;
  memberId: string;
  activityType: CampaignActivityType;
  messageContent?: string;
  outcome?: CampaignActivityOutcome;
  responseReceivedAt?: Date;
  responseContent?: string;
  performedAt: Date;
  performedBy?: string;
  createdAt: Date;
}

/**
 * Input for logging a campaign activity
 */
export interface LogCampaignActivityInput {
  campaignId: string;
  memberId: string;
  activityType: CampaignActivityType;
  messageContent?: string;
  outcome?: CampaignActivityOutcome;
}

/**
 * Campaign stats summary
 */
export interface CampaignStats {
  totalMembers: number;
  pending: number;
  contacted: number;
  responded: number;
  interested: number;
  converted: number;
  notInterested: number;
  optedOut: number;
  bounced: number;
  responseRate: number;
  conversionRate: number;
}
