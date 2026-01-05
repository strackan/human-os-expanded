// FavorTokenService - Token minting and management

import { SupabaseClient } from '@supabase/supabase-js';
import { generateTokenName, generateTokenSeed } from '../favors/nameGenerator';
import { generateVisualSeed, generateSignaturePattern } from '../favors/visualGenerator';
import type { FavorToken, FavorTokenWithOwner, FavorTokenWithHistory, TokenMintSource } from '../types/database';

interface MintTokenParams {
  userId: string;
  source: TokenMintSource;
  eventId?: string;
}

export class FavorTokenService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * Mint a new favor token for a user
   */
  async mintToken(params: MintTokenParams): Promise<FavorToken> {
    const { userId, source, eventId } = params;

    // Generate unique identifiers
    const seed = generateTokenSeed();
    const visualSeed = generateVisualSeed();
    const signaturePattern = generateSignaturePattern();
    const name = generateTokenName(seed);

    const { data, error } = await this.supabase
      .from('favor_tokens')
      .insert({
        name,
        visual_seed: visualSeed,
        signature_pattern: signaturePattern,
        mint_source: source,
        mint_event_id: eventId || null,
        current_owner_id: userId,
        original_owner_id: userId,
        favor_history: [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mint token: ${error.message}`);
    }

    return data as FavorToken;
  }

  /**
   * Mint initial grant token for a new member
   */
  async mintInitialGrant(userId: string): Promise<FavorToken> {
    return this.mintToken({
      userId,
      source: 'initial_grant',
    });
  }

  /**
   * Attempt to drop a token at an event (10-25% chance)
   * Returns the token if dropped, null otherwise
   */
  async tryEventDrop(userId: string, eventId: string): Promise<FavorToken | null> {
    // Random chance between 10-25%
    const dropChance = 0.10 + Math.random() * 0.15;
    const roll = Math.random();

    if (roll > dropChance) {
      return null; // No drop this time
    }

    return this.mintToken({
      userId,
      source: 'event_drop',
      eventId,
    });
  }

  /**
   * Get user's wallet - tokens they currently own and can spend
   */
  async getWallet(userId: string): Promise<FavorTokenWithOwner[]> {
    const { data, error } = await this.supabase
      .from('favor_tokens')
      .select(`
        *,
        owner:profiles!favor_tokens_current_owner_id_fkey(id, name, avatar_url),
        original_owner:profiles!favor_tokens_original_owner_id_fkey(id, name, avatar_url)
      `)
      .eq('current_owner_id', userId)
      .order('minted_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch wallet: ${error.message}`);
    }

    return (data || []) as FavorTokenWithOwner[];
  }

  /**
   * Get user's collection - tokens they earned by doing favors
   * These are tokens where the user is NOT the original owner
   */
  async getCollection(userId: string): Promise<FavorTokenWithOwner[]> {
    const { data, error } = await this.supabase
      .from('favor_tokens')
      .select(`
        *,
        owner:profiles!favor_tokens_current_owner_id_fkey(id, name, avatar_url),
        original_owner:profiles!favor_tokens_original_owner_id_fkey(id, name, avatar_url)
      `)
      .eq('current_owner_id', userId)
      .neq('original_owner_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch collection: ${error.message}`);
    }

    return (data || []) as FavorTokenWithOwner[];
  }

  /**
   * Get token by ID with full history
   */
  async getTokenById(tokenId: string): Promise<FavorTokenWithHistory | null> {
    const { data: token, error: tokenError } = await this.supabase
      .from('favor_tokens')
      .select(`
        *,
        owner:profiles!favor_tokens_current_owner_id_fkey(id, name, avatar_url)
      `)
      .eq('id', tokenId)
      .single();

    if (tokenError) {
      if (tokenError.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to fetch token: ${tokenError.message}`);
    }

    // Get favor history if there are any
    let favors = [];
    if (token.favor_history && token.favor_history.length > 0) {
      const { data: favorData, error: favorError } = await this.supabase
        .from('favors')
        .select(`
          *,
          requester:profiles!favors_requester_id_fkey(id, name, avatar_url),
          recipient:profiles!favors_recipient_id_fkey(id, name, avatar_url)
        `)
        .in('id', token.favor_history)
        .order('completed_at', { ascending: false });

      if (!favorError && favorData) {
        favors = favorData;
      }
    }

    return {
      ...token,
      favors,
    } as FavorTokenWithHistory;
  }

  /**
   * Get token count for a user
   */
  async getTokenCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('favor_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('current_owner_id', userId);

    if (error) {
      throw new Error(`Failed to count tokens: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get collection count for a user (tokens earned, not original)
   */
  async getCollectionCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('favor_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('current_owner_id', userId)
      .neq('original_owner_id', userId);

    if (error) {
      throw new Error(`Failed to count collection: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if a token is available for spending (owned by user and not in active favor)
   */
  async isTokenAvailable(tokenId: string, userId: string): Promise<boolean> {
    // First check ownership
    const { data: token, error: tokenError } = await this.supabase
      .from('favor_tokens')
      .select('current_owner_id')
      .eq('id', tokenId)
      .single();

    if (tokenError || !token || token.current_owner_id !== userId) {
      return false;
    }

    // Check if token is currently being used in an active favor
    const { data: activeFavor, error: favorError } = await this.supabase
      .from('favors')
      .select('id')
      .eq('token_id', tokenId)
      .in('status', ['asked', 'negotiating', 'accepted', 'pending_confirmation'])
      .maybeSingle();

    if (favorError) {
      return false;
    }

    return !activeFavor;
  }
}
