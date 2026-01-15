/**
 * POST /api/extraction/analyze
 *
 * Real-time entity extraction from conversation messages.
 * Extracts people, companies, projects, goals, tasks, and events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getEntityExtractor } from '@/lib/extraction';
import type { ExtractionRequest, ExtractedEntity } from '@/lib/extraction';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body: ExtractionRequest = await request.json();
    const { message, conversation_history, existing_entities } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract entities
    const extractor = getEntityExtractor();
    const result = await extractor.extract({
      message,
      conversation_history: conversation_history || [],
      existing_entities: existing_entities || [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[extraction/analyze] Error:', error);
    return NextResponse.json(
      { error: `Extraction error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

/**
 * POST /api/extraction/analyze?action=confirm
 *
 * Confirm and save extracted entities to the database.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { entities, user_id }: { entities: ExtractedEntity[]; user_id: string } = body;

    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return NextResponse.json(
        { error: 'Entities array is required' },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Store entities
    const insertPromises = entities.map(async (entity) => {
      const { error } = await supabase.from('entities').insert({
        entity_type: entity.type,
        name: entity.name,
        metadata: {
          context: entity.context,
          confidence: entity.confidence,
          source_message: entity.sourceMessage,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          extraction_id: entity.id,
        },
        source_system: 'renubu_extraction',
        source_id: entity.id,
        owner_id: user_id,
        privacy_scope: `founder:${user_id}`,
      });

      if (error) {
        console.error('[extraction/confirm] Error storing entity:', error);
        return { success: false, entity: entity.name, error };
      }

      return { success: true, entity: entity.name };
    });

    const results = await Promise.all(insertPromises);
    const failures = results.filter((r) => !r.success);

    if (failures.length > 0) {
      return NextResponse.json({
        status: 'partial',
        saved: results.filter((r) => r.success).length,
        failed: failures.length,
        errors: failures,
      });
    }

    return NextResponse.json({
      status: 'complete',
      saved: entities.length,
    });
  } catch (error) {
    console.error('[extraction/confirm] Error:', error);
    return NextResponse.json(
      { error: `Storage error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}
