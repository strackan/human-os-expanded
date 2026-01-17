#!/usr/bin/env node

/**
 * Fireflies.ai MCP Server
 *
 * MCP server wrapper for Fireflies.ai meeting transcription service.
 * Provides tools and resources for querying meeting transcripts.
 *
 * Tools:
 * - fireflies_list_transcripts: List recent transcripts
 * - fireflies_get_transcript: Get full transcript by ID
 * - fireflies_search: Search across transcripts
 *
 * Resources:
 * - fireflies://transcripts/{id}: Individual transcript
 * - fireflies://recent: Recent transcripts list
 *
 * Configuration:
 * - FIREFLIES_API_KEY: Fireflies API key
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { GraphQLClient, gql } from 'graphql-request';

// =============================================================================
// CONFIGURATION
// =============================================================================

const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';
const FIREFLIES_API_KEY = process.env.FIREFLIES_API_KEY;

if (!FIREFLIES_API_KEY) {
  console.error('Error: FIREFLIES_API_KEY environment variable is required');
  process.exit(1);
}

// =============================================================================
// GRAPHQL CLIENT
// =============================================================================

const client = new GraphQLClient(FIREFLIES_API_URL, {
  headers: {
    Authorization: `Bearer ${FIREFLIES_API_KEY}`,
  },
});

// =============================================================================
// GRAPHQL QUERIES
// =============================================================================

const LIST_TRANSCRIPTS_QUERY = gql`
  query ListTranscripts($limit: Int, $skip: Int) {
    transcripts(limit: $limit, skip: $skip) {
      id
      title
      date
      duration
      organizer_email
      participants
      transcript_url
    }
  }
`;

const GET_TRANSCRIPT_QUERY = gql`
  query GetTranscript($id: String!) {
    transcript(id: $id) {
      id
      title
      date
      duration
      organizer_email
      participants
      transcript_url
      sentences {
        speaker_name
        text
        start_time
        end_time
      }
      summary {
        keywords
        action_items
        outline
        shorthand_bullet
        overview
      }
    }
  }
`;

const SEARCH_TRANSCRIPTS_QUERY = gql`
  query SearchTranscripts($query: String!, $limit: Int) {
    transcripts(search: $query, limit: $limit) {
      id
      title
      date
      duration
      organizer_email
      participants
    }
  }
`;

// =============================================================================
// TYPES
// =============================================================================

interface Transcript {
  id: string;
  title: string;
  date: string;
  duration: number;
  organizer_email: string;
  participants: string[];
  transcript_url?: string;
  sentences?: Array<{
    speaker_name: string;
    text: string;
    start_time: number;
    end_time: number;
  }>;
  summary?: {
    keywords: string[];
    action_items: string[];
    outline: string;
    shorthand_bullet: string;
    overview: string;
  };
}

// =============================================================================
// MCP SERVER
// =============================================================================

const server = new Server(
  {
    name: 'fireflies',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// =============================================================================
// TOOL HANDLERS
// =============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'fireflies_list_transcripts',
        description:
          'List recent meeting transcripts from Fireflies.ai. Returns transcript metadata including title, date, duration, and participants.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of transcripts to return (default: 10, max: 50)',
            },
            skip: {
              type: 'number',
              description: 'Number of transcripts to skip for pagination',
            },
          },
        },
      },
      {
        name: 'fireflies_get_transcript',
        description:
          'Get the full transcript of a meeting by ID, including all sentences, speakers, and AI-generated summary.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'The transcript ID',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'fireflies_search',
        description:
          'Search across all meeting transcripts. Returns matching transcripts based on the query.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query string',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'fireflies_list_transcripts': {
        const limit = Math.min((args?.limit as number) || 10, 50);
        const skip = (args?.skip as number) || 0;

        const data = await client.request<{ transcripts: Transcript[] }>(
          LIST_TRANSCRIPTS_QUERY,
          { limit, skip }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data.transcripts, null, 2),
            },
          ],
        };
      }

      case 'fireflies_get_transcript': {
        const id = args?.id as string;
        if (!id) {
          throw new Error('Transcript ID is required');
        }

        const data = await client.request<{ transcript: Transcript }>(
          GET_TRANSCRIPT_QUERY,
          { id }
        );

        // Format transcript for readability
        const transcript = data.transcript;
        let formattedContent = `# ${transcript.title}\n\n`;
        formattedContent += `**Date:** ${transcript.date}\n`;
        formattedContent += `**Duration:** ${Math.round(transcript.duration / 60)} minutes\n`;
        formattedContent += `**Organizer:** ${transcript.organizer_email}\n`;
        formattedContent += `**Participants:** ${transcript.participants.join(', ')}\n\n`;

        if (transcript.summary) {
          formattedContent += `## Summary\n\n${transcript.summary.overview}\n\n`;

          if (transcript.summary.action_items?.length) {
            formattedContent += `### Action Items\n`;
            transcript.summary.action_items.forEach((item) => {
              formattedContent += `- ${item}\n`;
            });
            formattedContent += '\n';
          }

          if (transcript.summary.keywords?.length) {
            formattedContent += `### Keywords\n${transcript.summary.keywords.join(', ')}\n\n`;
          }
        }

        if (transcript.sentences?.length) {
          formattedContent += `## Transcript\n\n`;
          let currentSpeaker = '';
          for (const sentence of transcript.sentences) {
            if (sentence.speaker_name !== currentSpeaker) {
              currentSpeaker = sentence.speaker_name;
              formattedContent += `\n**${currentSpeaker}:**\n`;
            }
            formattedContent += `${sentence.text} `;
          }
        }

        return {
          content: [
            {
              type: 'text',
              text: formattedContent,
            },
          ],
        };
      }

      case 'fireflies_search': {
        const query = args?.query as string;
        if (!query) {
          throw new Error('Search query is required');
        }
        const limit = Math.min((args?.limit as number) || 10, 50);

        const data = await client.request<{ transcripts: Transcript[] }>(
          SEARCH_TRANSCRIPTS_QUERY,
          { query, limit }
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data.transcripts, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

// =============================================================================
// RESOURCE HANDLERS
// =============================================================================

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  // List recent transcripts as resources
  try {
    const data = await client.request<{ transcripts: Transcript[] }>(
      LIST_TRANSCRIPTS_QUERY,
      { limit: 20, skip: 0 }
    );

    const resources = data.transcripts.map((t) => ({
      uri: `fireflies://transcripts/${t.id}`,
      name: t.title,
      description: `Meeting on ${t.date} (${Math.round(t.duration / 60)} min) with ${t.participants.join(', ')}`,
      mimeType: 'text/markdown',
    }));

    // Add recent list resource
    resources.unshift({
      uri: 'fireflies://recent',
      name: 'Recent Transcripts',
      description: 'List of recent meeting transcripts',
      mimeType: 'application/json',
    });

    return { resources };
  } catch {
    return { resources: [] };
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    if (uri === 'fireflies://recent') {
      const data = await client.request<{ transcripts: Transcript[] }>(
        LIST_TRANSCRIPTS_QUERY,
        { limit: 20, skip: 0 }
      );

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(data.transcripts, null, 2),
          },
        ],
      };
    }

    // Handle fireflies://transcripts/{id}
    const match = uri.match(/^fireflies:\/\/transcripts\/(.+)$/);
    if (match) {
      const id = match[1];
      const data = await client.request<{ transcript: Transcript }>(
        GET_TRANSCRIPT_QUERY,
        { id }
      );

      const transcript = data.transcript;
      let formattedContent = `# ${transcript.title}\n\n`;
      formattedContent += `**Date:** ${transcript.date}\n`;
      formattedContent += `**Duration:** ${Math.round(transcript.duration / 60)} minutes\n`;
      formattedContent += `**Participants:** ${transcript.participants.join(', ')}\n\n`;

      if (transcript.summary?.overview) {
        formattedContent += `## Summary\n\n${transcript.summary.overview}\n\n`;
      }

      if (transcript.sentences?.length) {
        formattedContent += `## Transcript\n\n`;
        let currentSpeaker = '';
        for (const sentence of transcript.sentences) {
          if (sentence.speaker_name !== currentSpeaker) {
            currentSpeaker = sentence.speaker_name;
            formattedContent += `\n**${currentSpeaker}:**\n`;
          }
          formattedContent += `${sentence.text} `;
        }
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: formattedContent,
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read resource: ${message}`);
  }
});

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Fireflies MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
