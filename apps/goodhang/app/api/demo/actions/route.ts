/**
 * Demo Actions API
 *
 * POST /api/demo/actions
 *
 * Execute actions on search results:
 * - draft_intro: Generate intro request message
 * - schedule_meeting: Suggest meeting based on context
 * - save_to_list: Save person to a named list
 * - request_intro: Send intro request through network
 */

import { NextRequest, NextResponse } from 'next/server';
import { createActionEngine } from '@/lib/demo/actions';

// =============================================================================
// TYPES
// =============================================================================

type ActionType = 'draft_intro' | 'schedule_meeting' | 'save_to_list' | 'request_intro';

interface ActionRequestBody {
  action: ActionType;
  data: Record<string, unknown>;
  context: {
    userId: string;
    userName: string;
    userCompany?: string;
    searchQuery?: string;
    searchMode?: string;
  };
}

// =============================================================================
// ROUTE HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ActionRequestBody;

    // Validate request
    if (!body.action || !['draft_intro', 'schedule_meeting', 'save_to_list', 'request_intro'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: draft_intro, schedule_meeting, save_to_list, request_intro' },
        { status: 400 }
      );
    }

    if (!body.context?.userId || !body.context?.userName) {
      return NextResponse.json(
        { error: 'Missing context.userId or context.userName' },
        { status: 400 }
      );
    }

    // Check environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing Supabase credentials' },
        { status: 500 }
      );
    }

    if (!anthropicKey) {
      return NextResponse.json(
        { error: 'Server configuration error: missing Anthropic API key' },
        { status: 500 }
      );
    }

    // Create action engine
    const actionEngine = createActionEngine(supabaseUrl, supabaseKey, anthropicKey);

    // Execute action
    let result: unknown;

    switch (body.action) {
      case 'draft_intro': {
        const draftIntroRequest: Parameters<typeof actionEngine.draftIntro>[0] = {
          targetId: body.data.targetId as string,
          targetName: body.data.targetName as string,
          introducerName: body.data.introducerName as string,
        };
        if (typeof body.data.targetTitle === 'string') {
          draftIntroRequest.targetTitle = body.data.targetTitle;
        }
        if (typeof body.data.targetCompany === 'string') {
          draftIntroRequest.targetCompany = body.data.targetCompany;
        }
        if (typeof body.data.context === 'string') {
          draftIntroRequest.context = body.data.context;
        }
        result = await actionEngine.draftIntro(draftIntroRequest, body.context);
        break;
      }

      case 'schedule_meeting': {
        const scheduleMeetingRequest: Parameters<typeof actionEngine.scheduleMeeting>[0] = {
          targetId: body.data.targetId as string,
          targetName: body.data.targetName as string,
        };
        if (Array.isArray(body.data.sharedInterests)) {
          scheduleMeetingRequest.sharedInterests = body.data.sharedInterests as string[];
        }
        if (typeof body.data.suggestedActivity === 'string') {
          scheduleMeetingRequest.suggestedActivity = body.data.suggestedActivity;
        }
        result = await actionEngine.scheduleMeeting(scheduleMeetingRequest, body.context);
        break;
      }

      case 'save_to_list': {
        const saveToListRequest: Parameters<typeof actionEngine.saveToList>[0] = {
          entityId: body.data.entityId as string,
          name: body.data.name as string,
          listName: (typeof body.data.listName === 'string' ? body.data.listName : 'Saved'),
        };
        if (typeof body.data.notes === 'string') {
          saveToListRequest.notes = body.data.notes;
        }
        result = await actionEngine.saveToList(saveToListRequest, body.context);
        break;
      }

      case 'request_intro': {
        const requestIntroRequest: Parameters<typeof actionEngine.requestIntro>[0] = {
          targetId: body.data.targetId as string,
          targetName: body.data.targetName as string,
          reason: (typeof body.data.reason === 'string' ? body.data.reason : 'Would like to connect'),
        };
        const urgency = body.data.urgency;
        if (urgency === 'low' || urgency === 'medium' || urgency === 'high') {
          requestIntroRequest.urgency = urgency;
        }
        result = await actionEngine.requestIntro(requestIntroRequest, body.context);
        break;
      }
    }

    return NextResponse.json({
      success: true,
      action: body.action,
      result,
    });
  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Return API documentation
// =============================================================================

export async function GET() {
  return NextResponse.json({
    name: 'Good Hang Demo Actions API',
    version: '1.0.0',
    endpoints: {
      'POST /api/demo/actions': {
        description: 'Execute actions on search results',
        body: {
          action: 'string (required) - One of: draft_intro, schedule_meeting, save_to_list, request_intro',
          data: 'object (required) - Action-specific data',
          context: {
            userId: 'string (required) - Current user ID',
            userName: 'string (required) - Current user name',
            userCompany: 'string (optional) - Current user company',
            searchQuery: 'string (optional) - Original search query',
            searchMode: 'string (optional) - Search mode used',
          },
        },
      },
    },
    actions: {
      draft_intro: {
        description: 'Generate intro request message to send to mutual connection',
        data: {
          targetId: 'string - ID of person to be introduced to',
          targetName: 'string - Name of person',
          targetTitle: 'string (optional) - Title',
          targetCompany: 'string (optional) - Company',
          introducerName: 'string - Name of mutual connection',
          context: 'string (optional) - Additional context',
        },
        response: {
          message: 'string - Generated intro request message',
          subject: 'string - Email subject line',
          targetName: 'string',
          introducerName: 'string',
        },
      },
      schedule_meeting: {
        description: 'Suggest meeting times based on shared interests/context',
        data: {
          targetId: 'string - ID of person to meet',
          targetName: 'string - Name of person',
          sharedInterests: 'string[] (optional) - Common interests',
          suggestedActivity: 'string (optional) - Activity type',
        },
        response: {
          suggestion: 'string - Suggested hangout description',
          activity: 'string - Activity type',
          timeframe: 'string - Suggested timeframe',
          message: 'string - Message to send',
        },
      },
      save_to_list: {
        description: 'Save person to a named list',
        data: {
          entityId: 'string - Entity ID',
          name: 'string - Person name',
          listName: 'string (optional, default "Saved") - List name',
          notes: 'string (optional) - Notes about why saved',
        },
        response: {
          listId: 'string - List ID',
          listName: 'string - List name',
          itemCount: 'number - Total items in list',
        },
      },
      request_intro: {
        description: 'Send intro request through network',
        data: {
          targetId: 'string - ID of person to be introduced to',
          targetName: 'string - Name of person',
          reason: 'string (optional) - Why you want to connect',
          urgency: 'string (optional) - low, medium, high',
        },
        response: {
          requestId: 'string - Request ID',
          status: 'string - sent, pending, failed',
          potentialIntroducers: 'string[] - Names of mutual connections',
        },
      },
    },
  });
}
