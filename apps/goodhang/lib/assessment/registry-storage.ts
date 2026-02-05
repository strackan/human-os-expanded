/**
 * Registry Storage Helpers
 *
 * Supabase storage operations for registry files.
 * Downloads existing registries and uploads merged results.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_BUCKET = 'human-os';

/** Registry file names we manage */
const REGISTRY_FILES = [
  'STORIES.registry.md',
  'ANECDOTES.registry.md',
  'EVENTS.registry.md',
  'PEOPLE.registry.md',
  'CORRECTIONS.registry.md',
  'PARKING_LOT.md',
] as const;

// =============================================================================
// LOAD EXISTING REGISTRIES
// =============================================================================

/**
 * Download and return all existing registry files from storage.
 * Returns a Record<filename, content> — missing files are simply omitted.
 */
export async function loadExistingRegistries(
  supabase: SupabaseClient,
  entitySlug: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};

  // Download all registry files in parallel
  const downloads = REGISTRY_FILES.map(async (filename) => {
    const path = `contexts/${entitySlug}/registry/${filename}`;
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .download(path);

      if (error || !data) return;

      const text = await data.text();
      if (text) {
        results[filename] = text;
      }
    } catch {
      // File doesn't exist — that's fine
    }
  });

  await Promise.all(downloads);
  return results;
}

// =============================================================================
// UPLOAD REGISTRIES
// =============================================================================

/**
 * Upload merged registry markdown files to storage with upsert.
 */
export async function uploadRegistries(
  supabase: SupabaseClient,
  _entitySlug: string,
  files: Array<{ name: string; path: string; content: string }>
): Promise<void> {
  const uploads = files.map(async (file) => {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(
          file.path,
          new Blob([file.content], { type: 'text/markdown' }),
          { contentType: 'text/markdown', upsert: true }
        );

      if (error) {
        console.error(
          `[registry-storage] Failed to upload ${file.name}:`,
          error
        );
      }
    } catch (err) {
      console.error(
        `[registry-storage] Error uploading ${file.name}:`,
        err
      );
    }
  });

  await Promise.all(uploads);
}
