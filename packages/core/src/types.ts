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
