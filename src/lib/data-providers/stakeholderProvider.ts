/**
 * Stakeholder Provider
 * Fetches contact and relationship data for executive engagement workflows
 * Phase: 2B.2 (Data Extraction)
 */

import { createClient } from '@/lib/supabase/client';

export interface Stakeholder {
  name: string;
  role: string;
  email: string;
  relationshipStrength: 'weak' | 'moderate' | 'strong';
  communicationStyle: string;
  keyConcerns: string[];
  leveragePoints: string[];
  recentInteractions: string;
  notes: string;
}

export interface StakeholderData {
  stakeholders: Stakeholder[];
  primaryContact: Stakeholder | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Fetch stakeholders for a customer
 * Returns contacts with relationship metadata
 */
export async function fetchStakeholders(customerId: string): Promise<Stakeholder[]> {
  try {
    const supabase = createClient();

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        first_name,
        last_name,
        title,
        email,
        relationship_strength,
        communication_style,
        key_concerns,
        leverage_points,
        recent_interactions,
        relationship_notes,
        is_primary
      `)
      .eq('customer_id', customerId)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('[StakeholderProvider] Error fetching contacts:', error);
      throw new Error(`Failed to fetch stakeholders: ${error.message}`);
    }

    if (!contacts || contacts.length === 0) {
      console.warn(`[StakeholderProvider] No contacts found for customer ${customerId}`);
      return [];
    }

    // Transform database contacts to Stakeholder interface
    const stakeholders: Stakeholder[] = contacts.map(contact => ({
      name: `${contact.first_name} ${contact.last_name}`,
      role: contact.title || 'Unknown Role',
      email: contact.email || '',
      relationshipStrength: (contact.relationship_strength as 'weak' | 'moderate' | 'strong') || 'moderate',
      communicationStyle: contact.communication_style || '',
      keyConcerns: Array.isArray(contact.key_concerns) ? contact.key_concerns : [],
      leveragePoints: Array.isArray(contact.leverage_points) ? contact.leverage_points : [],
      recentInteractions: contact.recent_interactions || '',
      notes: contact.relationship_notes || ''
    }));

    console.log(`[StakeholderProvider] Fetched ${stakeholders.length} stakeholders for customer ${customerId}`);
    return stakeholders;

  } catch (error) {
    console.error('[StakeholderProvider] Unexpected error:', error);
    throw error;
  }
}

/**
 * Get primary contact for a customer
 */
export async function fetchPrimaryContact(customerId: string): Promise<Stakeholder | null> {
  const stakeholders = await fetchStakeholders(customerId);
  return stakeholders.length > 0 ? stakeholders[0] : null;
}
