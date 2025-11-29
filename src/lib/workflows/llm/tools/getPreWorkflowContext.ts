/**
 * Get Pre-Workflow Context Tool
 *
 * Provides curated customer context for workflow initialization.
 * Returns only "Key Context" and "Recent Events" sections from INTEL,
 * plus frontmatter metrics - not the full file.
 */

import { getINTELContext } from '@/lib/skills/INTELService';

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface INTELTool {
  definition: ToolDefinition;
  execute: (input: Record<string, any>) => Promise<string>;
}

/**
 * Extract a specific section from markdown content
 */
function extractSection(content: string, sectionHeader: string): string | null {
  const lines = content.split('\n');
  let inSection = false;
  const sectionLines: string[] = [];

  for (const line of lines) {
    // Check if we're entering the target section
    if (line.startsWith(sectionHeader)) {
      inSection = true;
      continue;
    }

    // Check if we've hit the next section (any ## header)
    if (inSection && line.startsWith('## ')) {
      break;
    }

    // Collect lines while in section (skip HTML comments)
    if (inSection && !line.startsWith('<!--') && !line.endsWith('-->')) {
      sectionLines.push(line);
    }
  }

  const result = sectionLines.join('\n').trim();
  return result || null;
}

export const getPreWorkflowContextTool: INTELTool = {
  definition: {
    name: 'get_pre_workflow_context',
    description:
      'Get key context and recent events for a customer before starting a workflow. ' +
      'Returns curated summary including current status, key concerns, recent interactions, ' +
      'and important metrics. Call this at workflow start to understand the current situation.',
    input_schema: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'Customer name to look up (e.g., "GrowthStack", "TechCorp Solutions")',
        },
      },
      required: ['customer_name'],
    },
  },

  execute: async (input: Record<string, any>): Promise<string> => {
    try {
      const intel = await getINTELContext(input.customer_name);

      if (!intel.customer) {
        return `No INTEL file found for customer "${input.customer_name}". You may proceed with available database information.`;
      }

      const content = intel.customer.content;

      // Extract Key Context and Recent Events sections
      const keyContext = extractSection(content, '## Key Context');
      const recentEvents = extractSection(content, '## Recent Events');

      // Build response
      const parts: string[] = [
        `# ${input.customer_name} - Pre-Workflow Context`,
        '',
        '## Key Context',
        keyContext || '(No key context available)',
        '',
        '## Recent Events',
        recentEvents || '(No recent events recorded)',
        '',
        '## Metrics',
        `- Health Score: ${intel.customer.health_score}/100`,
        `- Risk Score: ${intel.customer.risk_score}/100`,
        `- Opportunity Score: ${intel.customer.opportunity_score}/100`,
        `- ARR: $${intel.customer.arr?.toLocaleString() || 'Unknown'}`,
        `- Renewal Date: ${intel.customer.renewal_date || 'Unknown'}`,
        `- Tier: ${intel.customer.tier || 'Unknown'}`,
      ];

      return parts.join('\n');
    } catch (error) {
      console.error('[getPreWorkflowContext] Error:', error);
      return `Error retrieving context for "${input.customer_name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
