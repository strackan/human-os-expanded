/**
 * Tool Discovery Service
 *
 * Provides semantic search over available MCP tools when alias matching fails.
 * Uses OpenAI embeddings to find tools by intent rather than exact pattern matching.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// =============================================================================
// TYPES
// =============================================================================

export interface ToolMatch {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Similarity score (0-1) */
  confidence: number;
  /** Why this tool might be relevant */
  reason: string;
}

export interface ToolDiscoveryResult {
  /** Matched tools sorted by confidence */
  matches: ToolMatch[];
  /** Whether semantic search was used */
  usedSemanticSearch: boolean;
  /** Number of tools searched */
  toolsSearched: number;
}

interface ToolIndex {
  name: string;
  description: string;
  keywords: string[];
  embedding?: number[];
}

// =============================================================================
// KEYWORD EXTRACTION
// =============================================================================

/**
 * Extract keywords from tool name and description for keyword-based matching
 */
function extractKeywords(tool: Tool): string[] {
  const keywords: Set<string> = new Set();

  // Extract from tool name (convert snake_case to words)
  const nameWords = tool.name.split('_').map((w) => w.toLowerCase());
  nameWords.forEach((w) => keywords.add(w));

  // Extract from description (if present)
  const description = tool.description || '';
  const descWords = description
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Filter out common words
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by',
    'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more',
    'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or',
    'because', 'until', 'while', 'this', 'that', 'these', 'those', 'what',
    'which', 'who', 'whom', 'use', 'using', 'example', 'examples',
  ]);

  descWords.forEach((w) => {
    if (!stopWords.has(w)) {
      keywords.add(w);
    }
  });

  return Array.from(keywords);
}

/**
 * Calculate keyword similarity between query and tool
 */
function keywordSimilarity(queryWords: string[], toolKeywords: string[]): number {
  if (queryWords.length === 0 || toolKeywords.length === 0) return 0;

  let matches = 0;
  const toolSet = new Set(toolKeywords);

  for (const word of queryWords) {
    if (toolSet.has(word)) {
      matches++;
    } else {
      // Partial match (word contains or is contained)
      for (const toolWord of toolKeywords) {
        if (toolWord.includes(word) || word.includes(toolWord)) {
          matches += 0.5;
          break;
        }
      }
    }
  }

  return matches / Math.max(queryWords.length, toolKeywords.length);
}

// =============================================================================
// TOOL DISCOVERY CLASS
// =============================================================================

export class ToolDiscoveryService {
  private tools: Tool[];
  private toolIndex: ToolIndex[];
  private generateEmbedding?: (text: string) => Promise<number[]>;

  constructor(
    tools: Tool[],
    options?: {
      generateEmbedding?: (text: string) => Promise<number[]>;
    }
  ) {
    this.tools = tools;
    this.generateEmbedding = options?.generateEmbedding;

    // Build keyword index
    this.toolIndex = tools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      keywords: extractKeywords(tool),
    }));
  }

  /**
   * Search for relevant tools given a natural language query
   */
  async search(query: string, limit: number = 5): Promise<ToolDiscoveryResult> {
    // Extract query keywords
    const queryWords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    // Score each tool
    const scored: Array<{ tool: ToolIndex; score: number; reason: string }> = [];

    for (const tool of this.toolIndex) {
      const keywordScore = keywordSimilarity(queryWords, tool.keywords);

      if (keywordScore > 0) {
        scored.push({
          tool,
          score: keywordScore,
          reason: this.generateReason(queryWords, tool.keywords),
        });
      }
    }

    // If keyword matching found results, use those
    if (scored.length > 0) {
      scored.sort((a, b) => b.score - a.score);
      const topMatches = scored.slice(0, limit);

      return {
        matches: topMatches.map((s) => ({
          name: s.tool.name,
          description: s.tool.description,
          confidence: Math.min(s.score, 1),
          reason: s.reason,
        })),
        usedSemanticSearch: false,
        toolsSearched: this.tools.length,
      };
    }

    // Fall back to semantic search if available and keyword matching failed
    if (this.generateEmbedding) {
      return this.semanticSearch(query, limit);
    }

    // No matches
    return {
      matches: [],
      usedSemanticSearch: false,
      toolsSearched: this.tools.length,
    };
  }

  /**
   * Semantic search using embeddings
   */
  private async semanticSearch(
    query: string,
    limit: number
  ): Promise<ToolDiscoveryResult> {
    if (!this.generateEmbedding) {
      return { matches: [], usedSemanticSearch: false, toolsSearched: 0 };
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Generate tool embeddings (or use cached)
      const toolEmbeddings = await Promise.all(
        this.toolIndex.map(async (tool) => {
          if (!tool.embedding && this.generateEmbedding) {
            const text = `${tool.name.replace(/_/g, ' ')}: ${tool.description}`;
            tool.embedding = await this.generateEmbedding(text);
          }
          return tool;
        })
      );

      // Calculate cosine similarity
      const scored = toolEmbeddings
        .filter((t) => t.embedding)
        .map((tool) => ({
          tool,
          score: cosineSimilarity(queryEmbedding, tool.embedding!),
        }))
        .filter((s) => s.score > 0.5) // Threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return {
        matches: scored.map((s) => ({
          name: s.tool.name,
          description: s.tool.description,
          confidence: s.score,
          reason: 'Semantic similarity match',
        })),
        usedSemanticSearch: true,
        toolsSearched: this.tools.length,
      };
    } catch (error) {
      console.error('Semantic search error:', error);
      return { matches: [], usedSemanticSearch: false, toolsSearched: 0 };
    }
  }

  /**
   * Generate a human-readable reason for the match
   */
  private generateReason(queryWords: string[], toolKeywords: string[]): string {
    const matchedWords = queryWords.filter(
      (w) =>
        toolKeywords.includes(w) ||
        toolKeywords.some((tk) => tk.includes(w) || w.includes(tk))
    );

    if (matchedWords.length > 0) {
      return `Matched keywords: ${matchedWords.slice(0, 3).join(', ')}`;
    }
    return 'Keyword similarity';
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.find((t) => t.name === name);
  }

  /**
   * Get all tool names
   */
  getToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Create a tool discovery service instance
 */
export function createToolDiscoveryService(
  tools: Tool[],
  generateEmbedding?: (text: string) => Promise<number[]>
): ToolDiscoveryService {
  return new ToolDiscoveryService(tools, { generateEmbedding });
}
