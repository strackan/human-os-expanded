/**
 * Documentation search tools via Context7
 *
 * Provides up-to-date library documentation search using Context7's API.
 * https://github.com/upstash/context7
 *
 * Tools:
 * - doc_resolve: Resolve a library name to Context7 library ID
 * - doc_search: Search documentation for a library
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const CONTEXT7_API_BASE = 'https://api.context7.com';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const docTools: Tool[] = [
  {
    name: 'doc_resolve',
    description: `Resolve a library/package name to a Context7-compatible library ID.

Use this to find the correct library ID before calling doc_search.
Returns a list of matching libraries with their IDs.

Example: doc_resolve({ libraryName: "react", query: "hooks" })`,
    inputSchema: {
      type: 'object',
      properties: {
        libraryName: {
          type: 'string',
          description: 'The library/package name to search for (e.g., "react", "nextjs", "prisma")',
        },
        query: {
          type: 'string',
          description: 'Optional context about what you\'re looking for, helps rank results',
        },
      },
      required: ['libraryName'],
    },
  },
  {
    name: 'doc_search',
    description: `Search documentation for a library using Context7.

Returns up-to-date, version-specific documentation and code examples.
If you don't know the library ID, use doc_resolve first.

Example: doc_search({ libraryId: "/vercel/next.js", query: "app router server components" })`,
    inputSchema: {
      type: 'object',
      properties: {
        libraryId: {
          type: 'string',
          description: 'Context7 library ID in format "/org/project" (e.g., "/vercel/next.js", "/mongodb/docs")',
        },
        query: {
          type: 'string',
          description: 'What you want to learn about (e.g., "authentication", "hooks", "routing")',
        },
        tokens: {
          type: 'number',
          description: 'Max tokens of documentation to retrieve (default: 5000)',
        },
      },
      required: ['libraryId', 'query'],
    },
  },
  {
    name: 'doc_quick',
    description: `Quick documentation search - resolves library name and fetches docs in one call.

Combines doc_resolve and doc_search for convenience.
Use when you know the library name but not the exact Context7 ID.

Example: doc_quick({ library: "prisma", query: "relations and joins" })`,
    inputSchema: {
      type: 'object',
      properties: {
        library: {
          type: 'string',
          description: 'Library name (e.g., "react", "nextjs", "prisma")',
        },
        query: {
          type: 'string',
          description: 'What you want to learn about',
        },
        tokens: {
          type: 'number',
          description: 'Max tokens of documentation to retrieve (default: 5000)',
        },
      },
      required: ['library', 'query'],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleDocTools(
  name: string,
  args: Record<string, unknown>,
  apiKey: string
): Promise<unknown | null> {
  switch (name) {
    case 'doc_resolve': {
      const { libraryName, query } = args as { libraryName: string; query?: string };
      return docResolve(apiKey, libraryName, query);
    }

    case 'doc_search': {
      const { libraryId, query, tokens } = args as { libraryId: string; query: string; tokens?: number };
      return docSearch(apiKey, libraryId, query, tokens);
    }

    case 'doc_quick': {
      const { library, query, tokens } = args as { library: string; query: string; tokens?: number };
      return docQuick(apiKey, library, query, tokens);
    }

    default:
      return null;
  }
}

// =============================================================================
// API HELPERS
// =============================================================================

interface LibraryResult {
  id: string;
  name: string;
  description?: string;
  version?: string;
}

interface ResolveResponse {
  libraries?: LibraryResult[];
  error?: string;
}

interface DocsResponse {
  content?: string;
  source?: string;
  error?: string;
}

/**
 * Resolve a library name to Context7 library IDs
 */
async function docResolve(
  apiKey: string,
  libraryName: string,
  query?: string
): Promise<{
  success: boolean;
  libraries?: LibraryResult[];
  message: string;
  error?: string;
}> {
  try {
    const params = new URLSearchParams({
      q: libraryName,
    });
    if (query) {
      params.append('context', query);
    }

    const response = await fetch(`${CONTEXT7_API_BASE}/v2/libs/search?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Context7 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as ResolveResponse;

    if (data.error) {
      throw new Error(data.error);
    }

    const libraries = data.libraries || [];

    return {
      success: true,
      libraries,
      message: libraries.length > 0
        ? `Found ${libraries.length} matching libraries. Use the 'id' field with doc_search.`
        : `No libraries found for "${libraryName}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Search documentation for a library
 */
async function docSearch(
  apiKey: string,
  libraryId: string,
  query: string,
  tokens: number = 5000
): Promise<{
  success: boolean;
  content?: string;
  source?: string;
  message: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${CONTEXT7_API_BASE}/v2/context`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        libraryId,
        query,
        tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Context7 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as DocsResponse;

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      success: true,
      content: data.content,
      source: data.source,
      message: data.content
        ? `Retrieved documentation for ${libraryId}`
        : `No documentation found for query "${query}"`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Quick search - resolve and fetch in one call
 */
async function docQuick(
  apiKey: string,
  library: string,
  query: string,
  tokens: number = 5000
): Promise<{
  success: boolean;
  libraryId?: string;
  content?: string;
  source?: string;
  message: string;
  error?: string;
}> {
  try {
    // First resolve the library name
    const resolveResult = await docResolve(apiKey, library, query);

    if (!resolveResult.success || !resolveResult.libraries?.length) {
      return {
        success: false,
        message: '',
        error: resolveResult.error || `No libraries found for "${library}"`,
      };
    }

    // Use the first matching library
    const libraryId = resolveResult.libraries[0].id;

    // Now fetch documentation
    const searchResult = await docSearch(apiKey, libraryId, query, tokens);

    return {
      success: searchResult.success,
      libraryId,
      content: searchResult.content,
      source: searchResult.source,
      message: searchResult.message,
      error: searchResult.error,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
