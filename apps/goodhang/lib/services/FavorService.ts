// FavorService - Favor request flow logic

import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Favor,
  FavorWithParties,
  FavorWithDetails,
  FavorStatus,
  FavorProposal,
  FavorProposalWithProposer,
} from '../types/database';
import { FavorTokenService } from './FavorTokenService';

interface RequestFavorParams {
  tokenId: string;
  requesterId: string;
  recipientId: string;
  description: string;
}

interface FavorActionResult {
  success: boolean;
  favor?: Favor;
  error?: string;
}

interface ProposalActionResult {
  success: boolean;
  proposal?: FavorProposal;
  favor?: Favor;
  error?: string;
}

// Valid state transitions
const VALID_TRANSITIONS: Record<FavorStatus, FavorStatus[]> = {
  asked: ['accepted', 'declined', 'withdrawn', 'negotiating'],
  negotiating: ['accepted', 'declined', 'withdrawn', 'negotiating'],
  accepted: ['pending_confirmation', 'withdrawn', 'disputed'],
  pending_confirmation: ['completed', 'accepted', 'disputed'], // accepted = revision
  completed: [], // Terminal state
  declined: [], // Terminal state
  withdrawn: [], // Terminal state
  disputed: ['completed', 'declined'], // Admin resolves
};

export class FavorService {
  private supabase: SupabaseClient;
  private tokenService: FavorTokenService;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.tokenService = new FavorTokenService(supabase);
  }

  /**
   * Request a favor from another member
   */
  async requestFavor(params: RequestFavorParams): Promise<FavorActionResult> {
    const { tokenId, requesterId, recipientId, description } = params;

    // Verify token is available
    const isAvailable = await this.tokenService.isTokenAvailable(tokenId, requesterId);
    if (!isAvailable) {
      return {
        success: false,
        error: 'Token is not available for use',
      };
    }

    // Check for blocks (recipient blocked requester)
    const { data: block } = await this.supabase
      .from('favor_blocks')
      .select('id')
      .eq('blocker_id', recipientId)
      .eq('blocked_id', requesterId)
      .maybeSingle();

    if (block) {
      // Silently "succeed" - the request is created but never delivered
      // This maintains the illusion that the request was sent
      const { data } = await this.supabase
        .from('favors')
        .insert({
          token_id: tokenId,
          requester_id: requesterId,
          recipient_id: recipientId,
          description,
          status: 'asked',
        })
        .select()
        .single();

      // Mark as "blocked" internally (won't show to recipient)
      // The requester sees it as "asked" indefinitely
      return {
        success: true,
        favor: data as Favor,
      };
    }

    // Create the favor request
    const { data, error } = await this.supabase
      .from('favors')
      .insert({
        token_id: tokenId,
        requester_id: requesterId,
        recipient_id: recipientId,
        description,
        status: 'asked',
      })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: `Failed to create favor request: ${error.message}`,
      };
    }

    return {
      success: true,
      favor: data as Favor,
    };
  }

  /**
   * Accept a favor request
   */
  async acceptFavor(favorId: string, userId: string): Promise<FavorActionResult> {
    const favor = await this.getFavorForRecipient(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (!this.canTransition(favor.status, 'accepted')) {
      return { success: false, error: `Cannot accept a favor with status: ${favor.status}` };
    }

    const { data, error } = await this.supabase
      .from('favors')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', favorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, favor: data as Favor };
  }

  /**
   * Decline a favor request
   */
  async declineFavor(favorId: string, userId: string): Promise<FavorActionResult> {
    const favor = await this.getFavorForRecipient(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (!this.canTransition(favor.status, 'declined')) {
      return { success: false, error: `Cannot decline a favor with status: ${favor.status}` };
    }

    const { data, error } = await this.supabase
      .from('favors')
      .update({ status: 'declined' })
      .eq('id', favorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, favor: data as Favor };
  }

  /**
   * Withdraw a favor request (requester only)
   */
  async withdrawFavor(favorId: string, userId: string): Promise<FavorActionResult> {
    const favor = await this.getFavorForRequester(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (!this.canTransition(favor.status, 'withdrawn')) {
      return { success: false, error: `Cannot withdraw a favor with status: ${favor.status}` };
    }

    const { data, error } = await this.supabase
      .from('favors')
      .update({ status: 'withdrawn' })
      .eq('id', favorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, favor: data as Favor };
  }

  /**
   * Mark a favor as complete (recipient only)
   */
  async markComplete(
    favorId: string,
    userId: string,
    completionNote?: string
  ): Promise<FavorActionResult> {
    const favor = await this.getFavorForRecipient(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (!this.canTransition(favor.status, 'pending_confirmation')) {
      return {
        success: false,
        error: `Cannot mark complete a favor with status: ${favor.status}`,
      };
    }

    const { data, error } = await this.supabase
      .from('favors')
      .update({
        status: 'pending_confirmation',
        completion_note: completionNote || null,
      })
      .eq('id', favorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, favor: data as Favor };
  }

  /**
   * Confirm favor completion (requester only) - transfers token
   */
  async confirmComplete(favorId: string, userId: string): Promise<FavorActionResult> {
    const favor = await this.getFavorForRequester(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (!this.canTransition(favor.status, 'completed')) {
      return {
        success: false,
        error: `Cannot confirm a favor with status: ${favor.status}`,
      };
    }

    // Update favor status - trigger will handle token transfer
    const { data, error } = await this.supabase
      .from('favors')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', favorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, favor: data as Favor };
  }

  /**
   * Request revision on a pending confirmation (requester only)
   */
  async requestRevision(
    favorId: string,
    userId: string,
    revisionNote: string
  ): Promise<FavorActionResult> {
    const favor = await this.getFavorForRequester(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (favor.status !== 'pending_confirmation') {
      return {
        success: false,
        error: 'Can only request revision on pending confirmation',
      };
    }

    const { data, error } = await this.supabase
      .from('favors')
      .update({
        status: 'accepted', // Back to accepted for recipient to work on
        revision_request: revisionNote,
      })
      .eq('id', favorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, favor: data as Favor };
  }

  /**
   * Get incoming favor requests for a user
   */
  async getIncomingFavors(userId: string): Promise<FavorWithParties[]> {
    // First check for blocks to filter out blocked requests
    const { data: blocks } = await this.supabase
      .from('favor_blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);

    const blockedIds = (blocks || []).map((b) => b.blocked_id);

    let query = this.supabase
      .from('favors')
      .select(`
        *,
        requester:profiles!favors_requester_id_fkey(id, name, avatar_url),
        recipient:profiles!favors_recipient_id_fkey(id, name, avatar_url),
        token:favor_tokens(id, name, visual_seed, signature_pattern)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false });

    // Filter out requests from blocked users
    if (blockedIds.length > 0) {
      query = query.not('requester_id', 'in', `(${blockedIds.join(',')})`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch incoming favors: ${error.message}`);
    }

    return (data || []) as FavorWithParties[];
  }

  /**
   * Get outgoing favor requests for a user
   */
  async getOutgoingFavors(userId: string): Promise<FavorWithParties[]> {
    const { data, error } = await this.supabase
      .from('favors')
      .select(`
        *,
        requester:profiles!favors_requester_id_fkey(id, name, avatar_url),
        recipient:profiles!favors_recipient_id_fkey(id, name, avatar_url),
        token:favor_tokens(id, name, visual_seed, signature_pattern)
      `)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch outgoing favors: ${error.message}`);
    }

    return (data || []) as FavorWithParties[];
  }

  /**
   * Get a single favor with details
   */
  async getFavorById(favorId: string, userId: string): Promise<FavorWithParties | null> {
    const { data, error } = await this.supabase
      .from('favors')
      .select(`
        *,
        requester:profiles!favors_requester_id_fkey(id, name, avatar_url),
        recipient:profiles!favors_recipient_id_fkey(id, name, avatar_url),
        token:favor_tokens(id, name, visual_seed, signature_pattern)
      `)
      .eq('id', favorId)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch favor: ${error.message}`);
    }

    return data as FavorWithParties;
  }

  // Helper methods

  private async getFavorForRequester(
    favorId: string,
    userId: string
  ): Promise<Favor | null> {
    const { data, error } = await this.supabase
      .from('favors')
      .select('*')
      .eq('id', favorId)
      .eq('requester_id', userId)
      .single();

    if (error) return null;
    return data as Favor;
  }

  private async getFavorForRecipient(
    favorId: string,
    userId: string
  ): Promise<Favor | null> {
    const { data, error } = await this.supabase
      .from('favors')
      .select('*')
      .eq('id', favorId)
      .eq('recipient_id', userId)
      .single();

    if (error) return null;
    return data as Favor;
  }

  private canTransition(from: FavorStatus, to: FavorStatus): boolean {
    const validNextStates = VALID_TRANSITIONS[from] || [];
    return validNextStates.includes(to);
  }

  // ============================================================
  // NEGOTIATION / COUNTER-PROPOSAL METHODS
  // ============================================================

  /**
   * Submit a counter-proposal with different terms
   * Either party can counter at any time during negotiation
   */
  async counterPropose(
    favorId: string,
    userId: string,
    newDescription: string
  ): Promise<ProposalActionResult> {
    // Get the favor and verify user is a party
    const favor = await this.getFavorForParty(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    // Can only counter in asked or negotiating states
    if (favor.status !== 'asked' && favor.status !== 'negotiating') {
      return {
        success: false,
        error: `Cannot counter-propose on a favor with status: ${favor.status}`,
      };
    }

    // Determine who the other party is
    const otherPartyId = favor.requester_id === userId
      ? favor.recipient_id
      : favor.requester_id;

    // Mark any existing pending proposal as superseded
    await this.supabase
      .from('favor_proposals')
      .update({ status: 'superseded', responded_at: new Date().toISOString() })
      .eq('favor_id', favorId)
      .eq('status', 'pending');

    // Create the new counter-proposal
    const { data: proposal, error: proposalError } = await this.supabase
      .from('favor_proposals')
      .insert({
        favor_id: favorId,
        proposer_id: userId,
        description: newDescription,
        status: 'pending',
        awaiting_response_from: otherPartyId,
      })
      .select()
      .single();

    if (proposalError) {
      return { success: false, error: proposalError.message };
    }

    // Update favor status to negotiating and set current proposal
    const { data: updatedFavor, error: favorError } = await this.supabase
      .from('favors')
      .update({
        status: 'negotiating',
        current_proposal_id: proposal.id,
        // Reset confirmations since terms changed
        requester_confirmed: false,
        recipient_confirmed: false,
      })
      .eq('id', favorId)
      .select()
      .single();

    if (favorError) {
      return { success: false, error: favorError.message };
    }

    return {
      success: true,
      proposal: proposal as FavorProposal,
      favor: updatedFavor as Favor,
    };
  }

  /**
   * Accept the current proposal - moves favor to accepted state
   * Only the party awaiting response can accept
   */
  async acceptProposal(favorId: string, userId: string): Promise<ProposalActionResult> {
    const favor = await this.getFavorForParty(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (favor.status !== 'asked' && favor.status !== 'negotiating') {
      return {
        success: false,
        error: `Cannot accept proposal on a favor with status: ${favor.status}`,
      };
    }

    // Get the current pending proposal
    const { data: proposal, error: proposalError } = await this.supabase
      .from('favor_proposals')
      .select('*')
      .eq('favor_id', favorId)
      .eq('status', 'pending')
      .single();

    if (proposalError || !proposal) {
      return { success: false, error: 'No pending proposal found' };
    }

    // Verify user is the one who needs to respond
    if (proposal.awaiting_response_from !== userId) {
      return {
        success: false,
        error: 'You cannot accept your own proposal. Wait for the other party to respond.',
      };
    }

    // Mark proposal as accepted
    await this.supabase
      .from('favor_proposals')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', proposal.id);

    // Update favor: use the agreed description, move to accepted
    const { data: updatedFavor, error: favorError } = await this.supabase
      .from('favors')
      .update({
        status: 'accepted',
        description: proposal.description, // Update to agreed terms
        accepted_at: new Date().toISOString(),
        requester_confirmed: true,
        recipient_confirmed: true,
      })
      .eq('id', favorId)
      .select()
      .single();

    if (favorError) {
      return { success: false, error: favorError.message };
    }

    return {
      success: true,
      proposal: proposal as FavorProposal,
      favor: updatedFavor as Favor,
    };
  }

  /**
   * Decline the current proposal - moves favor to declined state
   * Only the party awaiting response can decline
   */
  async declineProposal(favorId: string, userId: string): Promise<ProposalActionResult> {
    const favor = await this.getFavorForParty(favorId, userId);
    if (!favor) {
      return { success: false, error: 'Favor not found or not authorized' };
    }

    if (favor.status !== 'asked' && favor.status !== 'negotiating') {
      return {
        success: false,
        error: `Cannot decline proposal on a favor with status: ${favor.status}`,
      };
    }

    // Get the current pending proposal
    const { data: proposal, error: proposalError } = await this.supabase
      .from('favor_proposals')
      .select('*')
      .eq('favor_id', favorId)
      .eq('status', 'pending')
      .single();

    if (proposalError || !proposal) {
      return { success: false, error: 'No pending proposal found' };
    }

    // Verify user is the one who needs to respond
    if (proposal.awaiting_response_from !== userId) {
      return {
        success: false,
        error: 'You cannot decline your own proposal.',
      };
    }

    // Mark proposal as declined
    await this.supabase
      .from('favor_proposals')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', proposal.id);

    // Update favor to declined
    const { data: updatedFavor, error: favorError } = await this.supabase
      .from('favors')
      .update({ status: 'declined' })
      .eq('id', favorId)
      .select()
      .single();

    if (favorError) {
      return { success: false, error: favorError.message };
    }

    return {
      success: true,
      proposal: proposal as FavorProposal,
      favor: updatedFavor as Favor,
    };
  }

  /**
   * Get all proposals for a favor (negotiation history)
   */
  async getProposalHistory(favorId: string, userId: string): Promise<FavorProposalWithProposer[]> {
    // Verify user is a party to this favor
    const favor = await this.getFavorForParty(favorId, userId);
    if (!favor) {
      throw new Error('Favor not found or not authorized');
    }

    const { data, error } = await this.supabase
      .from('favor_proposals')
      .select(`
        *,
        proposer:profiles!favor_proposals_proposer_id_fkey(id, name, avatar_url),
        awaiting_user:profiles!favor_proposals_awaiting_response_from_fkey(id, name, avatar_url)
      `)
      .eq('favor_id', favorId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch proposal history: ${error.message}`);
    }

    return (data || []) as FavorProposalWithProposer[];
  }

  /**
   * Get a favor with full negotiation details (proposals, messages)
   */
  async getFavorWithDetails(favorId: string, userId: string): Promise<FavorWithDetails | null> {
    // Verify user is a party to this favor
    const { data: favor, error: favorError } = await this.supabase
      .from('favors')
      .select(`
        *,
        requester:profiles!favors_requester_id_fkey(id, name, avatar_url, company),
        recipient:profiles!favors_recipient_id_fkey(id, name, avatar_url, company),
        token:favor_tokens(id, name, visual_seed, signature_pattern)
      `)
      .eq('id', favorId)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .single();

    if (favorError) {
      if (favorError.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch favor: ${favorError.message}`);
    }

    // Get proposals
    const { data: proposals } = await this.supabase
      .from('favor_proposals')
      .select(`
        *,
        proposer:profiles!favor_proposals_proposer_id_fkey(id, name, avatar_url)
      `)
      .eq('favor_id', favorId)
      .order('created_at', { ascending: true });

    // Get current proposal if exists
    let currentProposal = null;
    if (favor.current_proposal_id) {
      const pending = (proposals || []).find(
        (p: FavorProposal) => p.id === favor.current_proposal_id
      );
      currentProposal = pending || null;
    }

    // Get messages
    const { data: messages } = await this.supabase
      .from('favor_messages')
      .select(`
        *,
        sender:profiles!favor_messages_sender_id_fkey(id, name, avatar_url)
      `)
      .eq('favor_id', favorId)
      .order('created_at', { ascending: true });

    return {
      ...favor,
      proposals: proposals || [],
      current_proposal: currentProposal,
      messages: messages || [],
    } as FavorWithDetails;
  }

  /**
   * Get favor for any party (requester or recipient)
   */
  private async getFavorForParty(
    favorId: string,
    userId: string
  ): Promise<Favor | null> {
    const { data, error } = await this.supabase
      .from('favors')
      .select('*')
      .eq('id', favorId)
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .single();

    if (error) return null;
    return data as Favor;
  }
}
