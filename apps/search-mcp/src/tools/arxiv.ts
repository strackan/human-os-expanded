/**
 * arXiv search tools
 *
 * Search and retrieve academic papers from arXiv.org
 * API docs: https://info.arxiv.org/help/api/basics.html
 *
 * Tools:
 * - arxiv_search: Search for papers by query, category, date range
 * - arxiv_paper: Get details of a specific paper by ID
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { XMLParser } from 'fast-xml-parser';

const ARXIV_API_BASE = 'http://export.arxiv.org/api/query';

// Common arXiv categories
const ARXIV_CATEGORIES = {
  // Computer Science
  'cs.AI': 'Artificial Intelligence',
  'cs.CL': 'Computation and Language (NLP)',
  'cs.CV': 'Computer Vision',
  'cs.LG': 'Machine Learning',
  'cs.NE': 'Neural and Evolutionary Computing',
  'cs.RO': 'Robotics',
  'cs.SE': 'Software Engineering',
  // Math
  'math.ST': 'Statistics Theory',
  // Statistics
  'stat.ML': 'Machine Learning (Statistics)',
  // Physics
  'quant-ph': 'Quantum Physics',
  // Quantitative Biology
  'q-bio.NC': 'Neurons and Cognition',
};

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const arxivTools: Tool[] = [
  {
    name: 'search_arxiv',
    description: `Semantic search for academic papers on arXiv.

Returns paper titles, authors, abstracts, and arXiv IDs.
Use recall_arxiv to get full details of a specific paper by ID.

Categories include: cs.AI (AI), cs.CL (NLP), cs.CV (Computer Vision),
cs.LG (Machine Learning), stat.ML, quant-ph, etc.

Example: search_arxiv({ query: "transformer attention mechanism", categories: ["cs.LG", "cs.CL"], maxResults: 10 })`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (searches title, abstract, authors)',
        },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description: 'arXiv categories to filter by (e.g., ["cs.AI", "cs.LG"])',
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results (default: 10, max: 50)',
        },
        dateFrom: {
          type: 'string',
          description: 'Filter papers submitted after this date (YYYY-MM-DD)',
        },
        dateTo: {
          type: 'string',
          description: 'Filter papers submitted before this date (YYYY-MM-DD)',
        },
        sortBy: {
          type: 'string',
          enum: ['relevance', 'lastUpdatedDate', 'submittedDate'],
          description: 'Sort order (default: relevance)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'recall_arxiv',
    description: `Get details of a specific arXiv paper by ID.

Returns full paper metadata including title, authors, abstract,
categories, PDF link, and publication dates.

Example: recall_arxiv({ paperId: "2301.07041" })`,
    inputSchema: {
      type: 'object',
      properties: {
        paperId: {
          type: 'string',
          description: 'arXiv paper ID (e.g., "2301.07041" or "cs/0001001")',
        },
      },
      required: ['paperId'],
    },
  },
  {
    name: 'arxiv_categories',
    description: 'List common arXiv categories for filtering searches.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// =============================================================================
// TOOL HANDLER
// =============================================================================

export async function handleArxivTools(
  name: string,
  args: Record<string, unknown>
): Promise<unknown | null> {
  switch (name) {
    case 'search_arxiv': {
      const { query, categories, maxResults, dateFrom, dateTo, sortBy } = args as {
        query: string;
        categories?: string[];
        maxResults?: number;
        dateFrom?: string;
        dateTo?: string;
        sortBy?: 'relevance' | 'lastUpdatedDate' | 'submittedDate';
      };
      return arxivSearch(query, categories, maxResults, dateFrom, dateTo, sortBy);
    }

    case 'recall_arxiv': {
      const { paperId } = args as { paperId: string };
      return arxivPaper(paperId);
    }

    case 'arxiv_categories': {
      return {
        success: true,
        categories: ARXIV_CATEGORIES,
        message: 'Common arXiv categories. Use these with search_arxiv.',
      };
    }

    default:
      return null;
  }
}

// =============================================================================
// API HELPERS
// =============================================================================

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  updated: string;
  categories: string[];
  pdfLink?: string;
  absLink?: string;
}

interface ArxivResponse {
  feed: {
    entry?: ArxivEntry[] | ArxivEntry;
    'opensearch:totalResults'?: string;
  };
}

/**
 * Parse arXiv XML response
 */
function parseArxivResponse(xml: string): ArxivEntry[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const result = parser.parse(xml);
  const feed = result.feed;

  if (!feed?.entry) {
    return [];
  }

  // Handle single entry vs array
  const entries = Array.isArray(feed.entry) ? feed.entry : [feed.entry];

  return entries.map((entry: Record<string, unknown>) => {
    // Extract authors
    let authors: string[] = [];
    if (entry.author) {
      const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
      authors = authorList.map((a: Record<string, string>) => a.name || '').filter(Boolean);
    }

    // Extract categories
    let categories: string[] = [];
    if (entry.category) {
      const catList = Array.isArray(entry.category) ? entry.category : [entry.category];
      categories = catList.map((c: Record<string, string>) => c['@_term'] || '').filter(Boolean);
    }

    // Extract links
    let pdfLink: string | undefined;
    let absLink: string | undefined;
    if (entry.link) {
      const links = Array.isArray(entry.link) ? entry.link : [entry.link];
      for (const link of links) {
        const l = link as Record<string, string>;
        if (l['@_title'] === 'pdf') {
          pdfLink = l['@_href'];
        } else if (l['@_type'] === 'text/html') {
          absLink = l['@_href'];
        }
      }
    }

    // Extract ID from URL
    const idUrl = entry.id as string;
    const idMatch = idUrl?.match(/abs\/(.+)$/);
    const id = idMatch ? idMatch[1] : idUrl;

    return {
      id,
      title: (entry.title as string || '').replace(/\s+/g, ' ').trim(),
      summary: (entry.summary as string || '').replace(/\s+/g, ' ').trim(),
      authors,
      published: entry.published as string,
      updated: entry.updated as string,
      categories,
      pdfLink,
      absLink: absLink || `https://arxiv.org/abs/${id}`,
    };
  });
}

/**
 * Build arXiv API query string
 */
function buildQuery(
  query: string,
  categories?: string[],
  dateFrom?: string,
  dateTo?: string
): string {
  const parts: string[] = [];

  // Main search query (search all fields)
  if (query) {
    parts.push(`all:${query}`);
  }

  // Category filter
  if (categories && categories.length > 0) {
    const catQuery = categories.map(c => `cat:${c}`).join(' OR ');
    parts.push(`(${catQuery})`);
  }

  // Date range filter (arXiv uses submittedDate)
  if (dateFrom || dateTo) {
    const from = dateFrom?.replace(/-/g, '') || '*';
    const to = dateTo?.replace(/-/g, '') || '*';
    parts.push(`submittedDate:[${from} TO ${to}]`);
  }

  return parts.join(' AND ');
}

/**
 * Search arXiv papers
 */
async function arxivSearch(
  query: string,
  categories?: string[],
  maxResults: number = 10,
  dateFrom?: string,
  dateTo?: string,
  sortBy: 'relevance' | 'lastUpdatedDate' | 'submittedDate' = 'relevance'
): Promise<{
  success: boolean;
  count?: number;
  papers?: Array<{
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    published: string;
    categories: string[];
    pdfLink?: string;
    arxivUrl: string;
  }>;
  message: string;
  error?: string;
}> {
  try {
    // Clamp maxResults
    const limit = Math.min(Math.max(1, maxResults), 50);

    // Build query
    const searchQuery = buildQuery(query, categories, dateFrom, dateTo);

    // Build URL
    const params = new URLSearchParams({
      search_query: searchQuery,
      start: '0',
      max_results: limit.toString(),
      sortBy,
      sortOrder: 'descending',
    });

    const url = `${ARXIV_API_BASE}?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const entries = parseArxivResponse(xml);

    const papers = entries.map(entry => ({
      id: entry.id,
      title: entry.title,
      authors: entry.authors,
      abstract: entry.summary.slice(0, 500) + (entry.summary.length > 500 ? '...' : ''),
      published: entry.published,
      categories: entry.categories,
      pdfLink: entry.pdfLink,
      arxivUrl: entry.absLink || `https://arxiv.org/abs/${entry.id}`,
    }));

    return {
      success: true,
      count: papers.length,
      papers,
      message: papers.length > 0
        ? `Found ${papers.length} papers matching "${query}"`
        : `No papers found for "${query}"`,
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
 * Get a specific paper by ID
 */
async function arxivPaper(paperId: string): Promise<{
  success: boolean;
  paper?: {
    id: string;
    title: string;
    authors: string[];
    abstract: string;
    published: string;
    updated: string;
    categories: string[];
    pdfLink?: string;
    arxivUrl: string;
  };
  message: string;
  error?: string;
}> {
  try {
    // Clean the paper ID
    const cleanId = paperId.replace('arXiv:', '').trim();

    const params = new URLSearchParams({
      id_list: cleanId,
    });

    const url = `${ARXIV_API_BASE}?${params}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`arXiv API error: ${response.status}`);
    }

    const xml = await response.text();
    const entries = parseArxivResponse(xml);

    if (entries.length === 0) {
      return {
        success: false,
        message: '',
        error: `Paper not found: ${paperId}`,
      };
    }

    const entry = entries[0];

    return {
      success: true,
      paper: {
        id: entry.id,
        title: entry.title,
        authors: entry.authors,
        abstract: entry.summary,
        published: entry.published,
        updated: entry.updated,
        categories: entry.categories,
        pdfLink: entry.pdfLink,
        arxivUrl: entry.absLink || `https://arxiv.org/abs/${entry.id}`,
      },
      message: `Retrieved paper: ${entry.title}`,
    };
  } catch (error) {
    return {
      success: false,
      message: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
