/**
 * Voice Pack: Discovery-Based Voice File Loading
 *
 * Replaces hardcoded filename loading across all voice API routes.
 * Discovers all .md files in a user's voice directory, parses YAML
 * frontmatter for `status` and `role`, and provides a unified VoicePack
 * interface for consumers.
 *
 * The files themselves ARE the manifest. No separate manifest.json needed.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================================================
// TYPES
// =============================================================================

export interface VoiceFile {
  path: string;        // e.g. "contexts/justin/voice/01_WRITING_ENGINE.md"
  filename: string;    // e.g. "01_WRITING_ENGINE.md"
  content: string;
  frontmatter: {
    status?: string;
    role?: string;
    [key: string]: unknown;
  };
}

export interface VoicePack {
  entitySlug: string;
  digest: string | null;
  files: VoiceFile[];
  byRole: Record<string, VoiceFile>;
}

// =============================================================================
// FRONTMATTER PARSING
// =============================================================================

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;

export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const match = content.match(FRONTMATTER_RE);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const raw = match[1]!;
  const frontmatter: Record<string, unknown> = {};

  for (const line of raw.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: string | unknown = line.slice(colonIdx + 1).trim();

    // Strip surrounding quotes
    if (typeof value === 'string' && value.length >= 2) {
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
    }

    if (key) {
      frontmatter[key] = value;
    }
  }

  const body = content.slice(match[0].length).trimStart();
  return { frontmatter, body };
}

export function buildFrontmatter(status: string, role?: string): string {
  let fm = '---\n';
  fm += `status: "${status}"\n`;
  if (role) {
    fm += `role: "${role}"\n`;
  }
  fm += '---\n';
  return fm;
}

// =============================================================================
// FILENAME → ROLE MAP (for discovery fallback)
// =============================================================================

const FILENAME_ROLE_MAP: Record<string, string> = {
  '00_START_HERE.md': 'start_here',
  '01_WRITING_ENGINE.md': 'writing_engine',
  '02_THEMES.md': 'themes',
  '03_GUARDRAILS.md': 'guardrails',
  '04_STORIES.md': 'stories',
  '05_ANECDOTES.md': 'anecdotes',
  '06_OPENINGS.md': 'openings',
  '07_MIDDLES.md': 'middles',
  '08_ENDINGS.md': 'endings',
  '09_BLENDS.md': 'blends',
  '10_EXAMPLES.md': 'examples',
  'CONTEXT.md': 'context',
};

export function inferRole(filename: string): string | undefined {
  return FILENAME_ROLE_MAP[filename];
}

// =============================================================================
// STORAGE HELPERS (shared — replaces duplicated helpers in 3+ routes)
// =============================================================================

export async function loadStorageFile(
  supabase: SupabaseClient,
  filePath: string,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('human-os')
      .download(filePath);

    if (error || !data) return null;
    return await data.text();
  } catch {
    return null;
  }
}

export async function uploadStorageFile(
  supabase: SupabaseClient,
  filePath: string,
  content: string,
): Promise<boolean> {
  try {
    const blob = new Blob([content], { type: 'text/markdown' });
    const { error } = await supabase.storage
      .from('human-os')
      .upload(filePath, blob, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (error) {
      console.error(`[voice-pack] Upload error for ${filePath}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[voice-pack] Upload exception for ${filePath}:`, err);
    return false;
  }
}

// =============================================================================
// CORE: loadVoicePack
// =============================================================================

export async function loadVoicePack(
  supabase: SupabaseClient,
  entitySlug: string,
): Promise<VoicePack> {
  const voiceDir = `contexts/${entitySlug}/voice`;

  // Load digest (always at root level) and list voice directory in parallel
  const [digest, listing] = await Promise.all([
    loadStorageFile(supabase, `contexts/${entitySlug}/DIGEST.md`),
    supabase.storage.from('human-os').list(voiceDir),
  ]);

  const files: VoiceFile[] = [];
  const byRole: Record<string, VoiceFile> = {};

  if (listing.error || !listing.data) {
    console.warn(`[voice-pack] Could not list ${voiceDir}:`, listing.error?.message);
    return { entitySlug, digest, files, byRole };
  }

  // Filter to .md files only
  const mdFiles = listing.data.filter(f => f.name.endsWith('.md'));

  if (mdFiles.length === 0) {
    return { entitySlug, digest, files, byRole };
  }

  // Download all .md files in parallel
  const downloads = await Promise.all(
    mdFiles.map(async (f) => {
      const path = `${voiceDir}/${f.name}`;
      const content = await loadStorageFile(supabase, path);
      return { name: f.name, path, content };
    }),
  );

  for (const dl of downloads) {
    if (!dl.content) continue;

    const { frontmatter } = parseFrontmatter(dl.content);

    // Determine role: frontmatter > filename inference
    const role = (frontmatter.role as string | undefined) ?? inferRole(dl.name);

    const voiceFile: VoiceFile = {
      path: dl.path,
      filename: dl.name,
      content: dl.content,
      frontmatter: {
        ...frontmatter,
        ...(role ? { role } : {}),
      },
    };

    files.push(voiceFile);

    if (role) {
      byRole[role] = voiceFile;
    }
  }

  // Sort files by filename for consistent ordering
  files.sort((a, b) => a.filename.localeCompare(b.filename));

  return { entitySlug, digest, files, byRole };
}
