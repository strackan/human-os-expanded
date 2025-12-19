/**
 * Privacy Model
 *
 * Implements path-based permissions where the storage path encodes
 * who can access the content.
 *
 * Path patterns:
 * - public/...                  -> Anyone can read
 * - powerpak-published/...      -> Subscribers can read
 * - renubu/tenant-{id}/...      -> Specific tenant can read/write
 * - founder-os/{userId}/...     -> Specific user can read/write
 */

import type { Layer, PrivacyScope, Viewer, ParsedContextFile } from './types.js';
import {
  PATH_PREFIXES,
  PATH_PATTERNS,
  LAYER_PREFIXES,
  buildFounderLayer,
  buildRenubuTenantLayer,
  extractUserIdFromLayer,
  extractTenantIdFromLayer,
} from './config.js';

export class PrivacyModel {
  private userId?: string;
  private tenantId?: string;
  private subscriptions: string[];

  constructor(viewer: Viewer) {
    this.userId = viewer.userId;
    this.tenantId = viewer.tenantId;
    this.subscriptions = viewer.powerpakSubscriptions || [];
  }

  /**
   * Extract privacy scope from file path
   */
  getScopeFromPath(filePath: string): PrivacyScope {
    if (filePath.startsWith(PATH_PREFIXES.PUBLIC)) return 'public';
    if (filePath.startsWith(PATH_PREFIXES.POWERPAK_PUBLISHED)) return 'powerpak_published';
    if (PATH_PATTERNS.RENUBU_TENANT.test(filePath)) return 'tenant';
    if (filePath.startsWith(PATH_PREFIXES.FOUNDER_OS)) return 'user';
    if (filePath.startsWith(PATH_PREFIXES.VOICE_OS)) return 'user';
    return 'private';
  }

  /**
   * Convert file path to Layer type
   */
  getLayerFromPath(filePath: string): Layer {
    if (filePath.startsWith(PATH_PREFIXES.PUBLIC)) return LAYER_PREFIXES.PUBLIC as Layer;
    if (filePath.startsWith(PATH_PREFIXES.POWERPAK_PUBLISHED)) return LAYER_PREFIXES.POWERPAK_PUBLISHED as Layer;

    const tenantMatch = filePath.match(PATH_PATTERNS.RENUBU_TENANT);
    if (tenantMatch?.[1]) {
      return buildRenubuTenantLayer(tenantMatch[1]);
    }

    const founderMatch = filePath.match(PATH_PATTERNS.FOUNDER_OS);
    if (founderMatch?.[1]) {
      return buildFounderLayer(founderMatch[1]);
    }

    // Default to private user layer
    return this.userId ? buildFounderLayer(this.userId) : (LAYER_PREFIXES.PUBLIC as Layer);
  }

  /**
   * Convert Layer to storage bucket path
   */
  getBucketPath(layer: Layer): string {
    if (layer === LAYER_PREFIXES.PUBLIC) return PATH_PREFIXES.PUBLIC.slice(0, -1); // Remove trailing slash
    if (layer === LAYER_PREFIXES.POWERPAK_PUBLISHED) return PATH_PREFIXES.POWERPAK_PUBLISHED.slice(0, -1);

    const tenantId = extractTenantIdFromLayer(layer);
    if (tenantId) {
      return `${PATH_PREFIXES.RENUBU}tenant-${tenantId}`;
    }

    const userId = extractUserIdFromLayer(layer);
    if (userId) {
      return `${PATH_PREFIXES.FOUNDER_OS.slice(0, -1)}/${userId}`;
    }

    throw new Error(`Unknown layer: ${layer}`);
  }

  /**
   * Extract owner/tenant from path
   */
  getOwnerFromPath(filePath: string): { userId?: string; tenantId?: string } {
    // founder-os/{user_id}/...
    const founderMatch = filePath.match(PATH_PATTERNS.FOUNDER_OS);
    if (founderMatch?.[1]) {
      return { userId: founderMatch[1] };
    }

    // voice-os/{user_id}/...
    const voiceMatch = filePath.match(PATH_PATTERNS.VOICE_OS);
    if (voiceMatch?.[1]) {
      return { userId: voiceMatch[1] };
    }

    // renubu/tenant-{tenant_id}/...
    const tenantMatch = filePath.match(PATH_PATTERNS.RENUBU_TENANT);
    if (tenantMatch?.[1]) {
      return { tenantId: tenantMatch[1] };
    }

    return {};
  }

  /**
   * Check if current viewer can read a file/path
   */
  canRead(fileOrPath: ParsedContextFile | string): boolean {
    const filePath = typeof fileOrPath === 'string' ? fileOrPath : fileOrPath.filePath;
    const scope = typeof fileOrPath === 'string'
      ? this.getScopeFromPath(fileOrPath)
      : fileOrPath.privacyScope;

    const owner = this.getOwnerFromPath(filePath);

    switch (scope) {
      case 'public':
        return true;

      case 'powerpak_published':
        // Check if user has any PowerPak subscription
        // In future, could check specific expert subscriptions
        return this.subscriptions.length > 0;

      case 'tenant':
        // Check if user belongs to the tenant
        return owner.tenantId !== undefined && owner.tenantId === this.tenantId;

      case 'user':
      case 'private':
        // Check if user owns the file
        return owner.userId !== undefined && owner.userId === this.userId;

      default:
        return false;
    }
  }

  /**
   * Check if current viewer can write to a path
   */
  canWrite(filePath: string): boolean {
    const scope = this.getScopeFromPath(filePath);
    const owner = this.getOwnerFromPath(filePath);

    switch (scope) {
      case 'public':
        // Only admins can write to public (not implemented yet)
        return false;

      case 'powerpak_published':
        // Only content owners (experts) can write
        // Would need to check if user is the expert
        return false;

      case 'tenant':
        // Tenant members can write to their tenant's files
        return owner.tenantId !== undefined && owner.tenantId === this.tenantId;

      case 'user':
      case 'private':
        // Users can only write to their own files
        return owner.userId !== undefined && owner.userId === this.userId;

      default:
        return false;
    }
  }

  /**
   * Get all layers the current viewer can access
   */
  getAccessibleLayers(): Layer[] {
    const layers: Layer[] = [LAYER_PREFIXES.PUBLIC as Layer]; // Everyone gets public

    // PowerPak subscriptions
    if (this.subscriptions.length > 0) {
      layers.push(LAYER_PREFIXES.POWERPAK_PUBLISHED as Layer);
    }

    // Tenant layer
    if (this.tenantId) {
      layers.push(buildRenubuTenantLayer(this.tenantId));
    }

    // Personal layer
    if (this.userId) {
      layers.push(buildFounderLayer(this.userId));
    }

    return layers;
  }

  /**
   * Build a storage path for a given layer, folder, and slug
   */
  buildStoragePath(layer: Layer, folder: string, slug: string): string {
    const bucketPath = this.getBucketPath(layer);
    return `${bucketPath}/${folder}/${slug}.md`;
  }

  /**
   * Parse a storage path into its components
   */
  parseStoragePath(storagePath: string): {
    layer: Layer;
    folder: string;
    slug: string;
  } | null {
    const layer = this.getLayerFromPath(storagePath);
    const bucketPath = this.getBucketPath(layer);

    // Remove bucket path prefix
    const relativePath = storagePath.startsWith(bucketPath + '/')
      ? storagePath.slice(bucketPath.length + 1)
      : storagePath;

    // Split into folder and filename
    const parts = relativePath.split('/');
    if (parts.length < 2) return null;

    const filename = parts.pop()!;
    const folder = parts.join('/');
    const slug = filename.replace(/\.md$/, '');

    return { layer, folder, slug };
  }

  /**
   * Check if a scope string allows a specific operation
   */
  static scopeAllows(scopes: string[], operation: string): boolean {
    // Direct match
    if (scopes.includes(operation)) return true;

    // Wildcard matches
    for (const scope of scopes) {
      // context:user:*:* matches context:user:123:read
      if (scope.includes('*')) {
        const pattern = scope.replace(/\*/g, '[^:]+');
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(operation)) return true;
      }
    }

    return false;
  }
}
