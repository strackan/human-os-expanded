/**
 * Context Sync Library
 *
 * Bi-directional sync between local files and Supabase Storage.
 * Syncs whichever is newer in each direction.
 */

import { readFileSync, writeFileSync, statSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { STORAGE_BUCKETS } from '@human-os/core';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface SyncResult {
  localToRemote: string[];
  remoteToLocal: string[];
  unchanged: string[];
  errors: string[];
}

// =============================================================================
// FILE HELPERS
// =============================================================================

const BUCKET_NAME = STORAGE_BUCKETS.CONTEXTS;

/**
 * Recursively get all syncable files from a local directory
 */
export function getAllLocalFiles(dir: string, files: string[] = []): string[] {
  if (!existsSync(dir)) return files;

  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    try {
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        getAllLocalFiles(fullPath, files);
      } else if (item.endsWith('.md') || item.endsWith('.txt') || item.endsWith('.json')) {
        files.push(fullPath);
      }
    } catch {
      // Skip files we can't stat
    }
  }
  return files;
}

/**
 * Get file metadata from Supabase Storage
 */
export async function getRemoteFileMetadata(
  supabase: SupabaseClient,
  slug: string
): Promise<Map<string, Date>> {
  const metadata = new Map<string, Date>();

  // List all files recursively under the slug
  const folders = ['', 'inputs', 'voice', 'founder', 'state', 'protocols', 'identity'];

  for (const folder of folders) {
    const path = folder ? `${slug}/${folder}` : slug;
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(path, { limit: 500 });

      if (!error && data) {
        for (const item of data) {
          if (item.name.endsWith('.md') || item.name.endsWith('.txt') || item.name.endsWith('.json')) {
            const fullPath = folder ? `${folder}/${item.name}` : item.name;
            // Parse the updated_at timestamp
            if (item.updated_at) {
              metadata.set(fullPath, new Date(item.updated_at));
            }
          }
        }
      }
    } catch {
      // Skip folders that don't exist
    }
  }

  return metadata;
}

// =============================================================================
// SYNC IMPLEMENTATION
// =============================================================================

/**
 * Perform bi-directional sync between local files and Supabase
 * Syncs whichever is newer in each direction
 */
export async function performBidirectionalSync(
  supabase: SupabaseClient,
  localPath: string,
  slug: string
): Promise<SyncResult> {
  const result: SyncResult = {
    localToRemote: [],
    remoteToLocal: [],
    unchanged: [],
    errors: [],
  };

  try {
    // Get all local files
    const localFiles = getAllLocalFiles(localPath);
    const localFileMap = new Map<string, { path: string; mtime: Date }>();

    for (const file of localFiles) {
      const relativePath = relative(localPath, file).replace(/\\/g, '/');
      try {
        const stat = statSync(file);
        localFileMap.set(relativePath, { path: file, mtime: stat.mtime });
      } catch {
        // Skip files we can't stat
      }
    }

    // Get remote file metadata
    const remoteMetadata = await getRemoteFileMetadata(supabase, slug);

    // Process each local file
    for (const [relativePath, localInfo] of localFileMap) {
      const remoteTime = remoteMetadata.get(relativePath);

      if (!remoteTime) {
        // File only exists locally - upload to remote
        try {
          const content = readFileSync(localInfo.path, 'utf-8');
          const remotePath = `${slug}/${relativePath}`;
          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(remotePath, content, {
              contentType: relativePath.endsWith('.json') ? 'application/json' : 'text/markdown',
              upsert: true,
            });

          if (error) {
            result.errors.push(`Upload ${relativePath}: ${error.message}`);
          } else {
            result.localToRemote.push(relativePath);
          }
        } catch (e) {
          result.errors.push(`Upload ${relativePath}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } else if (localInfo.mtime > remoteTime) {
        // Local is newer - upload to remote
        try {
          const content = readFileSync(localInfo.path, 'utf-8');
          const remotePath = `${slug}/${relativePath}`;
          const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(remotePath, content, {
              contentType: relativePath.endsWith('.json') ? 'application/json' : 'text/markdown',
              upsert: true,
            });

          if (error) {
            result.errors.push(`Upload ${relativePath}: ${error.message}`);
          } else {
            result.localToRemote.push(relativePath);
          }
        } catch (e) {
          result.errors.push(`Upload ${relativePath}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } else if (remoteTime > localInfo.mtime) {
        // Remote is newer - download to local
        try {
          const remotePath = `${slug}/${relativePath}`;
          const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .download(remotePath);

          if (error) {
            result.errors.push(`Download ${relativePath}: ${error.message}`);
          } else {
            const content = await data.text();
            // Ensure directory exists
            const dir = dirname(localInfo.path);
            if (!existsSync(dir)) {
              mkdirSync(dir, { recursive: true });
            }
            writeFileSync(localInfo.path, content, 'utf-8');
            result.remoteToLocal.push(relativePath);
          }
        } catch (e) {
          result.errors.push(`Download ${relativePath}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      } else {
        // Files are in sync
        result.unchanged.push(relativePath);
      }

      // Remove from remote metadata to track files only on remote
      remoteMetadata.delete(relativePath);
    }

    // Process files that only exist on remote
    for (const [relativePath, _remoteTime] of remoteMetadata) {
      try {
        const remotePath = `${slug}/${relativePath}`;
        const { data, error } = await supabase.storage
          .from(BUCKET_NAME)
          .download(remotePath);

        if (error) {
          result.errors.push(`Download ${relativePath}: ${error.message}`);
        } else {
          const content = await data.text();
          const localFilePath = join(localPath, relativePath);
          // Ensure directory exists
          const dir = dirname(localFilePath);
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          writeFileSync(localFilePath, content, 'utf-8');
          result.remoteToLocal.push(relativePath);
        }
      } catch (e) {
        result.errors.push(`Download ${relativePath}: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
    }
  } catch (e) {
    result.errors.push(`Sync failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  return result;
}
