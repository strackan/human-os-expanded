/**
 * Embedding generation using Voyage AI (via Anthropic partner)
 * Falls back to text summarization for semantic indexing
 */

import Anthropic from '@anthropic-ai/sdk';

const EMBEDDING_MODEL = 'voyage-3'; // Voyage AI model
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokens: number;
}

/**
 * Generate embedding for text using Voyage AI
 * Note: Requires VOYAGE_API_KEY or falls back to Claude summary
 */
export async function generateEmbedding(
  text: string,
  voyageApiKey?: string
): Promise<EmbeddingResult | null> {
  // Try Voyage AI first (better for semantic search)
  if (voyageApiKey) {
    try {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${voyageApiKey}`,
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: text,
          input_type: 'document',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          embedding: data.data[0].embedding,
          model: EMBEDDING_MODEL,
          tokens: data.usage?.total_tokens || 0,
        };
      }
    } catch (err) {
      console.warn('[embeddings] Voyage AI failed, will skip embedding:', err);
    }
  }

  // No embedding available without Voyage API key
  // Could add OpenAI fallback here if needed
  return null;
}

/**
 * Generate a semantic summary for indexing (alternative to embeddings)
 * Uses Claude to extract key themes and concepts
 */
export async function generateSemanticSummary(
  text: string,
  anthropicApiKey: string
): Promise<string> {
  const client = new Anthropic({ apiKey: anthropicApiKey });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20241022',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Extract key themes, topics, and concepts from this conversation turn. Output as a comma-separated list of keywords/phrases (max 10):

${text}

Keywords:`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }
  return '';
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function batchGenerateEmbeddings(
  texts: string[],
  voyageApiKey?: string
): Promise<(EmbeddingResult | null)[]> {
  if (!voyageApiKey) {
    return texts.map(() => null);
  }

  try {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${voyageApiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
        input_type: 'document',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.data.map((item: { embedding: number[] }, i: number) => ({
        embedding: item.embedding,
        model: EMBEDDING_MODEL,
        tokens: Math.floor((data.usage?.total_tokens || 0) / texts.length),
      }));
    }
  } catch (err) {
    console.warn('[embeddings] Batch embedding failed:', err);
  }

  return texts.map(() => null);
}
