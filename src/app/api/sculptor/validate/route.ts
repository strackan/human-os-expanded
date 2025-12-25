/**
 * API Route: Sculptor Validate
 *
 * Validates access codes for Sculptor sessions.
 * Public endpoint - no auth required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SculptorService } from '@/lib/sculptor';

interface ValidateRequestBody {
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequestBody = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const sculptorService = new SculptorService(supabase);

    const result = await sculptorService.validateAccessCode(code);

    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 404 }
      );
    }

    // Return session info (without full system prompt for security)
    const session = result.session!;
    return NextResponse.json({
      valid: true,
      session: {
        id: session.id,
        access_code: session.access_code,
        entity_name: session.entity_name,
        status: session.status,
        thread_id: session.thread_id,
        created_at: session.created_at,
        last_accessed_at: session.last_accessed_at,
        template: session.template ? {
          id: session.template.id,
          slug: session.template.slug,
          name: session.template.name,
          description: session.template.description,
        } : null,
      },
    });
  } catch (error) {
    console.error('[API /sculptor/validate] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
