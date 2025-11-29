/**
 * Read Full INTEL Tool
 *
 * Reads the complete INTEL file for a customer when deeper context is needed.
 * Use sparingly - prefer getPreWorkflowContext for routine operations.
 */

import { getINTELContext } from '@/lib/skills/INTELService';
import type { INTELTool } from './getPreWorkflowContext';

export const readFullINTELTool: INTELTool = {
  definition: {
    name: 'read_full_intel',
    description:
      'Read the complete INTEL file for a customer including full strategic context, ' +
      'relationship history, stakeholder details, and CSM notes. Use when you need ' +
      'comprehensive background beyond key context and recent events.',
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
        return `No INTEL file found for customer "${input.customer_name}".`;
      }

      // Return full content with frontmatter summary
      const parts: string[] = [
        `# ${input.customer_name} - Full INTEL`,
        '',
        '## Frontmatter Metrics',
        `- Health Score: ${intel.customer.health_score}/100`,
        `- Risk Score: ${intel.customer.risk_score}/100`,
        `- Opportunity Score: ${intel.customer.opportunity_score}/100`,
        `- ARR: $${intel.customer.arr?.toLocaleString() || 'Unknown'}`,
        `- Renewal Date: ${intel.customer.renewal_date || 'Unknown'}`,
        `- Tier: ${intel.customer.tier || 'Unknown'}`,
        `- Industry: ${intel.customer.industry || 'Unknown'}`,
        '',
        '---',
        '',
        intel.customer.content,
      ];

      return parts.join('\n');
    } catch (error) {
      console.error('[readFullINTEL] Error:', error);
      return `Error retrieving INTEL for "${input.customer_name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
