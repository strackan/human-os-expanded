/**
 * Parking Lot Service
 * Core CRUD operations for parking lot items
 */

import { createClient } from '@/lib/supabase/server';
import type {
  ParkingLotItem,
  ParkingLotCategory,
  CreateParkingLotItemRequest,
  ListParkingLotItemsRequest,
  UpdateParkingLotItemRequest
} from '@/types/parking-lot';
import { ParkingLotLLMService } from './ParkingLotLLMService';

export class ParkingLotService {
  /**
   * Create a new parking lot item with LLM enhancement
   */
  static async create(
    userId: string,
    request: CreateParkingLotItemRequest,
    context?: {
      currentWorkflows?: any[];
      recentCustomers?: any[];
      userCategories?: string[];
    }
  ): Promise<{ success: boolean; item?: ParkingLotItem; error?: string }> {
    try {
      const supabase = await createClient();

      // Step 1: Parse with LLM
      const parsed = await ParkingLotLLMService.parseWithModeDetection(
        request.raw_input,
        context
      );

      // Step 2: If mode is brainstorm, generate questions
      let brainstormQuestions = null;
      if (parsed.mode === 'brainstorm') {
        brainstormQuestions = await ParkingLotLLMService.generateBrainstormQuestions(
          parsed.cleanedText,
          parsed.suggestedCategories[0]
        );
      }

      // Step 3: If mode is expand, generate expansion immediately
      let expandedAnalysis = null;
      let artifactData = null;
      if (parsed.mode === 'expand') {
        const expansionResult = await ParkingLotLLMService.expandWithObjectives({
          idea: {
            cleaned_text: parsed.cleanedText,
            extracted_entities: parsed.extractedEntities,
            user_categories: request.user_categories || [],
            readiness_score: parsed.readinessScore
          } as ParkingLotItem,
          context
        });
        expandedAnalysis = expansionResult.expansion;
        artifactData = expansionResult.artifact;
      }

      // Step 4: Insert into database
      const insertData = {
        user_id: userId,
        raw_input: request.raw_input,
        cleaned_text: parsed.cleanedText,
        capture_mode: request.capture_mode || parsed.mode,
        extracted_entities: parsed.extractedEntities || {},
        suggested_categories: parsed.suggestedCategories || [],
        user_categories: request.user_categories || parsed.suggestedCategories || [],
        readiness_score: parsed.readinessScore || 0,
        readiness_factors: parsed.readinessFactors || {},
        potential_workflows: parsed.potentialWorkflows || [],
        wake_triggers: request.wake_triggers || parsed.wakeTriggers || [],
        brainstorm_questions: brainstormQuestions,
        brainstorm_prefer_lighter_day: parsed.mode === 'brainstorm',
        expanded_analysis: expandedAnalysis,
        expanded_at: expandedAnalysis ? new Date().toISOString() : null,
        artifact_generated: artifactData !== null,
        artifact_data: artifactData,
        source: request.source || 'manual',
        status: parsed.mode === 'expand' ? 'expanded' : 'active'
      };

      const { data, error } = await supabase
        .from('parking_lot_items')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[ParkingLotService] Create error:', error);
        return { success: false, error: error.message };
      }

      // Step 5: Increment category usage counts
      if (data.user_categories && data.user_categories.length > 0) {
        for (const category of data.user_categories) {
          await supabase.rpc('increment_category_usage', {
            p_user_id: userId,
            p_category_name: category
          });
        }
      }

      return { success: true, item: data as ParkingLotItem };
    } catch (error: any) {
      console.error('[ParkingLotService] Create error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * List parking lot items with filtering and sorting
   */
  static async list(
    userId: string,
    request: ListParkingLotItemsRequest = {}
  ): Promise<{ success: boolean; items?: ParkingLotItem[]; total?: number; error?: string }> {
    try {
      const supabase = await createClient();

      let query = supabase
        .from('parking_lot_items')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // Apply filters
      if (request.mode) {
        query = query.eq('capture_mode', request.mode);
      }

      if (request.categories && request.categories.length > 0) {
        query = query.contains('user_categories', request.categories);
      }

      if (request.status) {
        query = query.eq('status', request.status);
      }

      if (request.minReadiness !== undefined) {
        query = query.gte('readiness_score', request.minReadiness);
      }

      // Apply sorting
      const sortBy = request.sortBy || 'readiness';
      switch (sortBy) {
        case 'readiness':
          query = query.order('readiness_score', { ascending: false });
          break;
        case 'created':
          query = query.order('created_at', { ascending: false });
          break;
        case 'updated':
          query = query.order('updated_at', { ascending: false });
          break;
      }

      // Apply pagination
      if (request.limit) {
        query = query.limit(request.limit);
      }
      if (request.offset) {
        query = query.range(request.offset, request.offset + (request.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('[ParkingLotService] List error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, items: data as ParkingLotItem[], total: count || 0 };
    } catch (error: any) {
      console.error('[ParkingLotService] List error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get a single parking lot item by ID
   */
  static async getById(
    userId: string,
    itemId: string
  ): Promise<{ success: boolean; item?: ParkingLotItem; error?: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('parking_lot_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('[ParkingLotService] GetById error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, item: data as ParkingLotItem };
    } catch (error: any) {
      console.error('[ParkingLotService] GetById error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a parking lot item
   */
  static async update(
    userId: string,
    itemId: string,
    updates: UpdateParkingLotItemRequest
  ): Promise<{ success: boolean; item?: ParkingLotItem; error?: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('parking_lot_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[ParkingLotService] Update error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, item: data as ParkingLotItem };
    } catch (error: any) {
      console.error('[ParkingLotService] Update error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Archive (soft delete) a parking lot item
   */
  static async archive(
    userId: string,
    itemId: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.update(userId, itemId, { status: 'archived' });
  }

  /**
   * Hard delete a parking lot item
   */
  static async delete(
    userId: string,
    itemId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();

      const { error } = await supabase
        .from('parking_lot_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        console.error('[ParkingLotService] Delete error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[ParkingLotService] Delete error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's categories
   */
  static async getCategories(
    userId: string
  ): Promise<{ success: boolean; categories?: ParkingLotCategory[]; error?: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('parking_lot_categories')
        .select('*')
        .eq('user_id', userId)
        .order('usage_count', { ascending: false });

      if (error) {
        console.error('[ParkingLotService] GetCategories error:', error);
        return { success: false, error: error.message };
      }

      // If no categories exist, seed defaults
      if (!data || data.length === 0) {
        await supabase.rpc('seed_default_parking_lot_categories', {
          p_user_id: userId
        });

        // Fetch again
        const { data: seededData, error: seededError } = await supabase
          .from('parking_lot_categories')
          .select('*')
          .eq('user_id', userId)
          .order('usage_count', { ascending: false });

        if (seededError) {
          return { success: false, error: seededError.message };
        }

        return { success: true, categories: seededData as ParkingLotCategory[] };
      }

      return { success: true, categories: data as ParkingLotCategory[] };
    } catch (error: any) {
      console.error('[ParkingLotService] GetCategories error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a custom category
   */
  static async createCategory(
    userId: string,
    name: string,
    description?: string,
    color?: string,
    icon?: string
  ): Promise<{ success: boolean; category?: ParkingLotCategory; error?: string }> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('parking_lot_categories')
        .insert({
          user_id: userId,
          name,
          description,
          color,
          icon,
          is_default: false
        })
        .select()
        .single();

      if (error) {
        console.error('[ParkingLotService] CreateCategory error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, category: data as ParkingLotCategory };
    } catch (error: any) {
      console.error('[ParkingLotService] CreateCategory error:', error);
      return { success: false, error: error.message };
    }
  }
}
