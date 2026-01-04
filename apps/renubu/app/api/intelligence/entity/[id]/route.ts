/**
 * Entity Intelligence Detail API
 *
 * GET /api/intelligence/entity/[id]
 *
 * Returns comprehensive intelligence about a global entity:
 * - Basic profile
 * - Aggregated signals
 * - Network connections
 * - Signal timeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Entity ID required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch entity from global.entities
    const { data: entity, error: entityError } = await supabase
      .schema('global')
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();

    if (entityError || !entity) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      );
    }

    // Fetch intelligence summary from materialized view
    const { data: intelligence } = await supabase
      .schema('global')
      .from('entity_intelligence')
      .select('*')
      .eq('id', id)
      .single();

    // Fetch recent signals (anonymized)
    const { data: signals } = await supabase
      .schema('global')
      .from('entity_signals')
      .select('signal_type, value, score, observed_at')
      .eq('entity_id', id)
      .order('observed_at', { ascending: false })
      .limit(50);

    // Aggregate signal counts by type
    const signalSummary: Record<string, { count: number; avgScore: number | null }> = {};
    if (signals) {
      for (const signal of signals) {
        if (!signalSummary[signal.signal_type]) {
          signalSummary[signal.signal_type] = { count: 0, avgScore: null };
        }
        signalSummary[signal.signal_type].count++;
        if (signal.score !== null) {
          const current = signalSummary[signal.signal_type].avgScore;
          signalSummary[signal.signal_type].avgScore =
            current === null
              ? signal.score
              : (current * (signalSummary[signal.signal_type].count - 1) + signal.score) /
                signalSummary[signal.signal_type].count;
        }
      }
    }

    // Build timeline (signals by month)
    const timeline: Record<string, number> = {};
    if (signals) {
      for (const signal of signals) {
        const month = signal.observed_at.substring(0, 7); // YYYY-MM
        timeline[month] = (timeline[month] || 0) + 1;
      }
    }

    return NextResponse.json({
      entity: {
        id: entity.id,
        name: entity.name,
        linkedin_url: entity.linkedin_url,
        email: entity.email,
        current_company: entity.current_company,
        current_title: entity.current_title,
        location: entity.location,
        created_at: entity.created_at,
        updated_at: entity.updated_at,
      },
      intelligence: intelligence
        ? {
            network_breadth: intelligence.network_breadth,
            avg_sentiment: intelligence.avg_sentiment,
            avg_responsiveness: intelligence.avg_responsiveness,
            deals_won: intelligence.deals_won,
            deals_lost: intelligence.deals_lost,
            interests: intelligence.interests?.filter(Boolean) || [],
            skills: intelligence.skills?.filter(Boolean) || [],
            is_champion: intelligence.is_champion,
            is_blocker: intelligence.is_blocker,
            last_signal_at: intelligence.last_signal_at,
          }
        : null,
      signals: {
        summary: signalSummary,
        recent: signals?.slice(0, 10) || [],
        timeline: Object.entries(timeline)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 12)
          .map(([month, count]) => ({ month, count })),
      },
    });
  } catch (err) {
    console.error('Entity API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
