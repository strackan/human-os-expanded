/**
 * Network Analysis API
 *
 * POST /api/intelligence/network
 *
 * Analyzes cross-org network connections:
 * - Find shared connections between entities
 * - Identify key connectors (high network breadth)
 * - Discover warm intro paths
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

interface NetworkRequest {
  action: 'connectors' | 'shared' | 'path' | 'company_intel';
  entityIds?: string[];
  company?: string;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: NetworkRequest = await request.json();
    const { action, entityIds, company, limit = 20 } = body;

    const supabase = createClient(supabaseUrl, supabaseKey);

    switch (action) {
      case 'connectors': {
        // Find top connectors (highest network breadth)
        const { data, error } = await supabase
          .schema('global')
          .from('entity_intelligence')
          .select('id, name, linkedin_url, current_company, current_title, network_breadth, avg_sentiment')
          .gt('network_breadth', 1)
          .order('network_breadth', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return NextResponse.json({
          action: 'connectors',
          results: data || [],
          description: 'Top connectors by network breadth (known by multiple users)',
        });
      }

      case 'shared': {
        // Find entities known by multiple specified users
        // This requires entity_signals analysis
        if (!entityIds || entityIds.length < 2) {
          return NextResponse.json(
            { error: 'At least 2 entity IDs required for shared analysis' },
            { status: 400 }
          );
        }

        // Get entities with signals from multiple contributors
        const { data, error } = await supabase
          .schema('global')
          .from('entity_intelligence')
          .select('*')
          .gte('network_breadth', 2)
          .order('network_breadth', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return NextResponse.json({
          action: 'shared',
          results: data || [],
          description: 'Entities known by multiple contributors',
        });
      }

      case 'company_intel': {
        // Get intelligence on all entities at a specific company
        if (!company) {
          return NextResponse.json(
            { error: 'Company name required' },
            { status: 400 }
          );
        }

        const { data, error } = await supabase
          .schema('global')
          .from('entity_intelligence')
          .select('*')
          .ilike('current_company', `%${company}%`)
          .order('network_breadth', { ascending: false })
          .limit(limit);

        if (error) throw error;

        // Aggregate company-level stats
        const stats = {
          total_contacts: data?.length || 0,
          avg_sentiment: 0,
          champions: 0,
          blockers: 0,
          total_deals_won: 0,
          total_deals_lost: 0,
        };

        if (data && data.length > 0) {
          let sentimentSum = 0;
          let sentimentCount = 0;

          for (const entity of data) {
            if (entity.avg_sentiment !== null) {
              sentimentSum += entity.avg_sentiment;
              sentimentCount++;
            }
            if (entity.is_champion) stats.champions++;
            if (entity.is_blocker) stats.blockers++;
            stats.total_deals_won += entity.deals_won || 0;
            stats.total_deals_lost += entity.deals_lost || 0;
          }

          stats.avg_sentiment = sentimentCount > 0 ? sentimentSum / sentimentCount : 0;
        }

        return NextResponse.json({
          action: 'company_intel',
          company,
          stats,
          contacts: data || [],
          description: `Intelligence on ${company}`,
        });
      }

      case 'path': {
        // Find warm intro paths (future: graph traversal)
        // For now, return entities with high network breadth that might connect
        const { data, error } = await supabase
          .schema('global')
          .from('entity_intelligence')
          .select('id, name, linkedin_url, current_company, network_breadth, is_champion')
          .gt('network_breadth', 2)
          .eq('is_champion', true)
          .order('network_breadth', { ascending: false })
          .limit(10);

        if (error) throw error;

        return NextResponse.json({
          action: 'path',
          results: data || [],
          description: 'Potential intro paths through champions with high network breadth',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: connectors, shared, company_intel, or path' },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error('Network API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
