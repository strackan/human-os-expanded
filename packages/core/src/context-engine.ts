/**
 * Context Engine
 *
 * Manages markdown context files stored in Supabase Storage.
 * Handles CRUD operations with privacy enforcement and wiki link parsing.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Layer,
  Viewer,
  Entity,
  ContextFile,
  ParsedContextFile,
  MergedContext,
  EntityLink,
  ContextEngineConfig,
  CreateEntityInput,
} from './types.js';
import { PrivacyModel } from './privacy-model.js';
import {
  createSupabaseClient,
  DEFAULT_STORAGE_BUCKET,
  TABLES,
  type DatabaseEntity,
  type DatabaseContextFile,
  type DatabaseEntityLink,
} from './supabase-client.js';

/**
 * Extract wiki links [[like this]] from markdown content
 */
function extractWikiLinks(content: string): Array<{ target: string; context: string }> {
  const linkPattern = /\[\[([^\]]+)\]\]/g;
  const links: Array<{ target: string; context: string }> = [];

  let match;
  while ((match = linkPattern.exec(content)) !== null) {
    const target = match[1];
    if (!target) continue;
    const start = Math.max(0, match.index - 50);
    const end = Math.min(content.length, match.index + match[0].length + 50);
    const context = content.slice(start, end);
    links.push({ target, context });
  }

  return links;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const yaml = match[1] ?? '';
  const body = match[2] ?? '';
  const frontmatter: Record<string, unknown> = {};

  yaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      // Remove quotes if present
      frontmatter[key] = value.replace(/^["']|["']$/g, '');
    }
  });

  return { frontmatter, body };
}

/**
 * Extract name from markdown content (frontmatter or first heading)
 */
function extractNameFromContent(content: string): string | null {
  // Try frontmatter
  const frontmatterMatch = content.match(/^---\n[\s\S]*?name:\s*(.+)\n[\s\S]*?---/);
  if (frontmatterMatch?.[1]) return frontmatterMatch[1].trim();

  // Try first H1
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match?.[1]) return h1Match[1].trim();

  return null;
}

/**
 * Convert string to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Hash content for change detection
 */
async function hashContent(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class ContextEngine {
  private supabase: SupabaseClient;
  private privacyModel: PrivacyModel;
  private storageBucket: string;
  private viewer: Viewer;

  constructor(config: ContextEngineConfig) {
    this.supabase = createSupabaseClient(config);
    this.viewer = config.viewer;
    this.privacyModel = new PrivacyModel(config.viewer);
    this.storageBucket = config.storageBucket || DEFAULT_STORAGE_BUCKET;
  }

  /**
   * Save context to a specific layer
   * Automatically parses wiki links and updates the knowledge graph
   */
  async saveContext(
    layer: Layer,
    folder: string,
    slug: string,
    content: string
  ): Promise<ParsedContextFile> {
    const filePath = this.privacyModel.buildStoragePath(layer, folder, slug);

    // Validate write access
    if (!this.privacyModel.canWrite(filePath)) {
      throw new Error(`Access denied: Cannot write to ${filePath}`);
    }

    // Parse content
    const { frontmatter, body } = parseFrontmatter(content);
    const contentHash = await hashContent(content);

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from(this.storageBucket)
      .upload(filePath, content, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // Ensure entity exists
    const entityName = extractNameFromContent(content) || slug;
    const entityType = folder.replace(/s$/, '') as Entity['entityType']; // 'people' -> 'person'

    const { data: entityData } = await this.supabase
      .from(TABLES.ENTITIES)
      .upsert(
        {
          slug,
          entity_type: entityType,
          name: entityName,
          metadata: frontmatter,
          owner_id: this.viewer.userId,
          tenant_id: this.viewer.tenantId,
          privacy_scope: this.privacyModel.getScopeFromPath(filePath),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    // Register context file
    const { data: fileData, error: fileError } = await this.supabase
      .from(TABLES.CONTEXT_FILES)
      .upsert(
        {
          entity_id: entityData?.id,
          layer,
          file_path: filePath,
          storage_bucket: this.storageBucket,
          content_hash: contentHash,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'layer,file_path' }
      )
      .select()
      .single();

    if (fileError) {
      throw new Error(`Failed to register context file: ${fileError.message}`);
    }

    // Sync wiki links to knowledge graph
    if (entityData?.id) {
      await this.syncLinks(layer, slug, body);
    }

    return {
      id: fileData.id,
      filePath,
      layer,
      frontmatter,
      content,
      entityId: entityData?.id,
      privacyScope: this.privacyModel.getScopeFromPath(filePath),
      createdAt: new Date(fileData.created_at),
      updatedAt: new Date(),
    };
  }

  /**
   * Get context from a specific layer
   */
  async getContext(
    layer: Layer,
    folder: string,
    slug: string
  ): Promise<ParsedContextFile | null> {
    const filePath = this.privacyModel.buildStoragePath(layer, folder, slug);

    // Check read access
    if (!this.privacyModel.canRead(filePath)) {
      throw new Error(`Access denied: Cannot read ${filePath}`);
    }

    // Download from storage
    const { data, error } = await this.supabase.storage
      .from(this.storageBucket)
      .download(filePath);

    if (error) {
      if (error.message.includes('not found')) return null;
      throw new Error(`Failed to download file: ${error.message}`);
    }

    const content = await data.text();
    const { frontmatter } = parseFrontmatter(content);

    // Get file metadata
    const { data: fileData } = await this.supabase
      .from(TABLES.CONTEXT_FILES)
      .select('*')
      .eq('file_path', filePath)
      .single();

    return {
      id: fileData?.id || '',
      filePath,
      layer,
      frontmatter,
      content,
      entityId: fileData?.entity_id,
      privacyScope: this.privacyModel.getScopeFromPath(filePath),
      createdAt: fileData ? new Date(fileData.created_at) : new Date(),
      updatedAt: fileData?.last_synced_at ? new Date(fileData.last_synced_at) : new Date(),
    };
  }

  /**
   * Get merged context across all accessible layers for an entity.
   *
   * For shared layers (other users' founder layers), only includes
   * content when the entity slug matches a shared context topic.
   */
  async getMergedContext(slug: string): Promise<MergedContext | null> {
    // Get entity
    const { data: entityData } = await this.supabase
      .from(TABLES.ENTITIES)
      .select('*')
      .eq('slug', slug)
      .single();

    if (!entityData) return null;

    const entity = this.mapDatabaseEntity(entityData as DatabaseEntity);

    // Get accessible layers
    const accessibleLayers = this.privacyModel.getAccessibleLayers();

    // Fetch content from each accessible layer
    const layers: MergedContext['layers'] = [];

    for (const layer of accessibleLayers) {
      // For shared layers, enforce topic-scoped access
      if (!this.privacyModel.canReadSharedContext(slug, layer)) {
        continue;
      }

      // Try common folders
      for (const folder of ['people', 'companies', 'experts', 'topics', 'goals', 'tasks']) {
        try {
          const context = await this.getContext(layer, folder, slug);
          if (context) {
            layers.push({
              layer,
              content: context.content,
              frontmatter: context.frontmatter,
            });
            break; // Found it in this layer
          }
        } catch {
          // Skip inaccessible or missing files
        }
      }
    }

    // Get connections from accessible layers
    const { data: incomingLinks } = await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .select('*')
      .eq('target_slug', slug)
      .in('layer', accessibleLayers);

    const { data: outgoingLinks } = await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .select('*')
      .eq('source_slug', slug)
      .in('layer', accessibleLayers);

    return {
      entity,
      layers,
      connections: {
        incoming: (incomingLinks || []).map(this.mapDatabaseLink),
        outgoing: (outgoingLinks || []).map(this.mapDatabaseLink),
      },
    };
  }

  /**
   * Search context files by content
   */
  async searchContext(
    query: string,
    options?: { limit?: number; folders?: string[] }
  ): Promise<ParsedContextFile[]> {
    const limit = options?.limit || 20;
    const accessibleLayers = this.privacyModel.getAccessibleLayers();

    // Use full-text search on context_files
    // Note: This requires the content_tsv column and GIN index
    const { data: files } = await this.supabase
      .from(TABLES.CONTEXT_FILES)
      .select('*')
      .in('layer', accessibleLayers)
      .textSearch('content_tsv', query)
      .limit(limit);

    if (!files || files.length === 0) return [];

    // Fetch actual content for each file
    const results: ParsedContextFile[] = [];

    for (const file of files) {
      try {
        const { data } = await this.supabase.storage
          .from(this.storageBucket)
          .download(file.file_path);

        if (data) {
          const content = await data.text();
          const { frontmatter } = parseFrontmatter(content);

          results.push({
            id: file.id,
            filePath: file.file_path,
            layer: file.layer as Layer,
            frontmatter,
            content,
            entityId: file.entity_id,
            privacyScope: this.privacyModel.getScopeFromPath(file.file_path),
            createdAt: new Date(file.created_at),
            updatedAt: file.last_synced_at ? new Date(file.last_synced_at) : new Date(),
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * List files in a directory path
   */
  async listFiles(
    layer: Layer,
    folder: string,
    options?: { limit?: number; offset?: number }
  ): Promise<ParsedContextFile[]> {
    const bucketPath = this.privacyModel.getBucketPath(layer);
    const dirPath = `${bucketPath}/${folder}`;

    const { data: files, error } = await this.supabase.storage
      .from(this.storageBucket)
      .list(dirPath, {
        limit: options?.limit || 100,
        offset: options?.offset || 0,
      });

    if (error || !files) return [];

    const results: ParsedContextFile[] = [];

    for (const file of files) {
      if (!file.name.endsWith('.md')) continue;

      const filePath = `${dirPath}/${file.name}`;

      if (!this.privacyModel.canRead(filePath)) continue;

      try {
        const { data } = await this.supabase.storage
          .from(this.storageBucket)
          .download(filePath);

        if (data) {
          const content = await data.text();
          const { frontmatter } = parseFrontmatter(content);

          results.push({
            id: file.id || '',
            filePath,
            layer,
            frontmatter,
            content,
            privacyScope: this.privacyModel.getScopeFromPath(filePath),
            createdAt: new Date(file.created_at || Date.now()),
            updatedAt: new Date(file.updated_at || Date.now()),
          });
        }
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * Delete a context file
   */
  async deleteContext(layer: Layer, folder: string, slug: string): Promise<void> {
    const filePath = this.privacyModel.buildStoragePath(layer, folder, slug);

    if (!this.privacyModel.canWrite(filePath)) {
      throw new Error(`Access denied: Cannot delete ${filePath}`);
    }

    // Delete from storage
    const { error: deleteError } = await this.supabase.storage
      .from(this.storageBucket)
      .remove([filePath]);

    if (deleteError) {
      throw new Error(`Failed to delete file: ${deleteError.message}`);
    }

    // Delete context file record
    await this.supabase
      .from(TABLES.CONTEXT_FILES)
      .delete()
      .eq('file_path', filePath);

    // Delete associated links
    await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .delete()
      .eq('layer', layer)
      .eq('source_slug', slug);
  }

  /**
   * Parse and sync wiki links to entity_links table
   */
  private async syncLinks(layer: Layer, sourceSlug: string, content: string): Promise<void> {
    const wikiLinks = extractWikiLinks(content);

    // Clear old links from this source in this layer
    await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .delete()
      .eq('layer', layer)
      .eq('source_slug', sourceSlug)
      .eq('link_type', 'wiki_link');

    // Insert new links
    if (wikiLinks.length > 0) {
      const links = wikiLinks.map(link => ({
        layer,
        source_slug: sourceSlug,
        target_slug: slugify(link.target),
        link_type: 'wiki_link',
        link_text: link.target,
        context_snippet: link.context,
        strength: 1.0,
      }));

      await this.supabase.from(TABLES.ENTITY_LINKS).insert(links);
    }
  }

  /**
   * Get backlinks to a file (what links TO this)
   */
  async getBacklinks(slug: string): Promise<EntityLink[]> {
    const accessibleLayers = this.privacyModel.getAccessibleLayers();

    const { data } = await this.supabase
      .from(TABLES.ENTITY_LINKS)
      .select('*')
      .eq('target_slug', slug)
      .in('layer', accessibleLayers);

    return (data || []).map(this.mapDatabaseLink);
  }

  /**
   * Map database entity to domain entity
   */
  private mapDatabaseEntity(data: DatabaseEntity): Entity {
    return {
      id: data.id,
      slug: data.slug || '',
      entityType: data.entity_type as Entity['entityType'],
      name: data.name,
      email: data.email || undefined,
      metadata: data.metadata,
      ownerId: data.owner_id || undefined,
      tenantId: data.tenant_id || undefined,
      privacyScope: data.privacy_scope as Entity['privacyScope'],
      sourceSystem: data.source_system as Entity['sourceSystem'],
      sourceId: data.source_id || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Map database link to domain link
   */
  private mapDatabaseLink(data: DatabaseEntityLink): EntityLink {
    return {
      id: data.id,
      layer: data.layer as Layer,
      sourceSlug: data.source_slug,
      targetSlug: data.target_slug,
      linkType: data.link_type as EntityLink['linkType'],
      linkText: data.link_text || undefined,
      contextSnippet: data.context_snippet || undefined,
      strength: data.strength,
      createdAt: new Date(data.created_at),
    };
  }
}
