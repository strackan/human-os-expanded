/**
 * API Route: Sculptor Export
 *
 * Exports session responses to markdown format.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getHumanOSAdminClient } from '@/lib/supabase/human-os';
import { SculptorService } from '@/lib/sculptor';

interface ExportRequestBody {
  session_id: string;
  format?: 'markdown' | 'json';
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequestBody = await request.json();
    const { session_id, format = 'markdown' } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 }
      );
    }

    const supabase = getHumanOSAdminClient();
    const sculptorService = new SculptorService(supabase);

    const session = await sculptorService.getSession(session_id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (format === 'json') {
      const responses = await sculptorService.getResponses(session_id);
      return NextResponse.json({
        session: {
          id: session.id,
          entity_name: session.entity_name,
          status: session.status,
          template_name: session.template?.name,
          created_at: session.created_at,
        },
        responses,
        exported_at: new Date().toISOString(),
      });
    }

    // Default: markdown format
    const markdown = await sculptorService.exportToMarkdown(session_id);

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="sculptor-${session.entity_name || session_id}.md"`,
      },
    });
  } catch (error) {
    console.error('[API /sculptor/export] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
