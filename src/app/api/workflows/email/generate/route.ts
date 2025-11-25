/**
 * Email Generation API Route
 *
 * POST /api/workflows/email/generate
 *
 * Generates AI-powered contextual emails for customers using Claude Haiku 4.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailOrchestrationService } from '@/lib/services/EmailOrchestrationService';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { GenerateEmailRequest, GenerateEmailResponse, EmailType } from '@/types/email';

/**
 * Valid email types
 */
const VALID_EMAIL_TYPES: EmailType[] = [
  'renewal_kickoff',
  'pricing_discussion',
  'qbr_invitation',
  'risk_mitigation',
  'expansion_pitch',
];

/**
 * POST /api/workflows/email/generate
 *
 * Generate AI-powered email for a customer
 *
 * Request body:
 * {
 *   customerId: string;
 *   emailType: EmailType;
 *   recipientContactId?: string;
 *   customInstructions?: string;
 * }
 *
 * Response:
 * {
 *   success: boolean;
 *   email?: GeneratedEmail;
 *   error?: string;
 *   errorCode?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateEmailRequest = await request.json();
    const { customerId, emailType, recipientContactId, customInstructions } = body;

    // Validate required fields
    if (!customerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: customerId',
          errorCode: 'MISSING_CUSTOMER_ID',
        } as GenerateEmailResponse,
        { status: 400 }
      );
    }

    if (!emailType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: emailType',
          errorCode: 'MISSING_EMAIL_TYPE',
        } as GenerateEmailResponse,
        { status: 400 }
      );
    }

    // Validate email type
    if (!VALID_EMAIL_TYPES.includes(emailType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid email type. Must be one of: ${VALID_EMAIL_TYPES.join(', ')}`,
          errorCode: 'INVALID_TYPE',
        } as GenerateEmailResponse,
        { status: 400 }
      );
    }

    // Validate customerId format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customerId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid customer ID format. Must be a valid UUID.',
          errorCode: 'INVALID_CUSTOMER',
        } as GenerateEmailResponse,
        { status: 400 }
      );
    }

    // Get authenticated user and company_id
    const supabase = createServiceRoleClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Please sign in.',
          errorCode: 'UNAUTHORIZED',
        } as GenerateEmailResponse,
        { status: 401 }
      );
    }

    // Get user's company_id from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'No company associated with user',
          errorCode: 'NO_COMPANY',
        },
        { status: 403 }
      );
    }

    // Generate email
    console.log(`[Email Generation] Starting for customer ${customerId}, type: ${emailType}, company: ${profile.company_id}`);

    const email = await EmailOrchestrationService.generateEmail(
      {
        customerId,
        emailType,
        recipientContactId,
        customInstructions,
      },
      profile.company_id,
      supabase
    );

    console.log(`[Email Generation] Success! Generated ${email.subject.length} char subject, ${email.body.length} char body`);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        email,
      } as GenerateEmailResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('[Email Generation API] Error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // Customer not found
      if (error.message.includes('Customer not found')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Customer not found',
            errorCode: 'INVALID_CUSTOMER',
          } as GenerateEmailResponse,
          { status: 404 }
        );
      }

      // Anthropic API errors
      if (error.message.includes('Anthropic API')) {
        return NextResponse.json(
          {
            success: false,
            error: 'AI service unavailable. Please try again later.',
            errorCode: 'API_ERROR',
          } as GenerateEmailResponse,
          { status: 503 }
        );
      }

      // Rate limit errors
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please try again in a few moments.',
            errorCode: 'RATE_LIMIT',
          } as GenerateEmailResponse,
          { status: 429 }
        );
      }

      // Generic error with message
      return NextResponse.json(
        {
          success: false,
          error: `Failed to generate email: ${error.message}`,
          errorCode: 'API_ERROR',
        } as GenerateEmailResponse,
        { status: 500 }
      );
    }

    // Unknown error
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        errorCode: 'UNKNOWN_ERROR',
      } as GenerateEmailResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/email/generate
 *
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: '/api/workflows/email/generate',
      method: 'POST',
      description: 'Generate AI-powered contextual emails for customers',
      requestBody: {
        customerId: 'string (required) - UUID of customer',
        emailType: `string (required) - One of: ${VALID_EMAIL_TYPES.join(', ')}`,
        recipientContactId: 'string (optional) - UUID of specific contact',
        customInstructions: 'string (optional) - Additional instructions for AI',
      },
      response: {
        success: 'boolean',
        email: {
          subject: 'string',
          body: 'string',
          tone: 'string - formal | casual | urgent',
          metadata: {
            emailType: 'string',
            customerId: 'string',
            generatedAt: 'ISO 8601 date',
            aiModel: 'string',
            tokensUsed: 'number',
          },
        },
        error: 'string (if success = false)',
        errorCode: 'string (if success = false)',
      },
      errorCodes: {
        MISSING_CUSTOMER_ID: 'customerId not provided',
        MISSING_EMAIL_TYPE: 'emailType not provided',
        INVALID_TYPE: 'emailType not in valid list',
        INVALID_CUSTOMER: 'Customer not found or invalid UUID',
        UNAUTHORIZED: 'Not authenticated',
        API_ERROR: 'Anthropic API error',
        RATE_LIMIT: 'Too many requests',
        UNKNOWN_ERROR: 'Unexpected error',
      },
    },
    { status: 200 }
  );
}
