/**
 * Read Contact Profile Tool
 *
 * Reads individual contact/stakeholder profiles from INTEL.
 */

import { getINTELContext } from '@/lib/skills/INTELService';
import type { INTELTool } from './getPreWorkflowContext';

export const readContactProfileTool: INTELTool = {
  definition: {
    name: 'read_contact_profile',
    description:
      'Read the profile for a specific contact at a customer organization. ' +
      'Returns relationship strength, communication preferences, role, and history.',
    input_schema: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'Customer name (e.g., "GrowthStack")',
        },
        contact_name: {
          type: 'string',
          description: 'Contact name to look up (e.g., "Sarah Johnson")',
        },
      },
      required: ['customer_name', 'contact_name'],
    },
  },

  execute: async (input: { customer_name: string; contact_name: string }): Promise<string> => {
    try {
      const intel = await getINTELContext(input.customer_name);

      if (!intel.contacts || intel.contacts.length === 0) {
        return `No contact profiles found for "${input.customer_name}".`;
      }

      // Find matching contact (case-insensitive partial match)
      const searchName = input.contact_name.toLowerCase();
      const contact = intel.contacts.find(
        (c) =>
          c.name.toLowerCase().includes(searchName) ||
          searchName.includes(c.name.toLowerCase().split(' ')[0])
      );

      if (!contact) {
        const availableContacts = intel.contacts.map((c) => c.name).join(', ');
        return `Contact "${input.contact_name}" not found. Available contacts: ${availableContacts}`;
      }

      // Build response
      const parts: string[] = [
        `# ${contact.name} - Contact Profile`,
        '',
        '## Overview',
        `- **Role:** ${contact.role}`,
        `- **Email:** ${contact.email || 'Not available'}`,
        `- **Relationship Strength:** ${contact.relationship_strength}`,
        `- **Primary Contact:** ${contact.is_primary ? 'Yes' : 'No'}`,
        '',
        '## Profile',
        contact.content,
      ];

      return parts.join('\n');
    } catch (error) {
      console.error('[readContactProfile] Error:', error);
      return `Error retrieving contact "${input.contact_name}": ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  },
};
