/**
 * User Preferences API
 *
 * GET /api/user/preferences
 * - Returns current user's preferences
 * - Creates default preferences if none exist
 *
 * PUT /api/user/preferences
 * - Updates current user's preferences
 * - Supports partial updates (only update specified fields)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase-server';

// =====================================================
// Types
// =====================================================

interface UserPreferences {
  chat: {
    shiftEnterToSubmit: boolean;
    enableSoundNotifications: boolean;
    autoScrollToBottom: boolean;
  };
  notifications: {
    emailDigest: 'daily' | 'weekly' | 'never';
    inAppNotifications: boolean;
    desktopNotifications: boolean;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
    sidebarCollapsed: boolean;
  };
  workflow: {
    autoAdvanceSteps: boolean;
    showCompletedTasks: boolean;
  };
}

interface UpdatePreferencesRequest {
  chat?: Partial<UserPreferences['chat']>;
  notifications?: Partial<UserPreferences['notifications']>;
  ui?: Partial<UserPreferences['ui']>;
  workflow?: Partial<UserPreferences['workflow']>;
}

// =====================================================
// GET - Get User Preferences
// =====================================================

export async function GET(request: NextRequest) {
  try {
    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =====================================================
    // Get or Create User Preferences
    // =====================================================

    // Try to get existing preferences
    const prefsResult = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let preferences = prefsResult.data;
    const prefsError = prefsResult.error;

    // If no preferences exist, create them with defaults
    if (prefsError && prefsError.code === 'PGRST116') {
      const { data: newPrefs, error: createError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          chat_preferences: {
            shiftEnterToSubmit: false,
            enableSoundNotifications: true,
            autoScrollToBottom: true
          },
          notification_preferences: {
            emailDigest: 'daily',
            inAppNotifications: true,
            desktopNotifications: false
          },
          ui_preferences: {
            theme: 'light',
            compactMode: false,
            sidebarCollapsed: false
          },
          workflow_preferences: {
            autoAdvanceSteps: false,
            showCompletedTasks: true
          }
        })
        .select()
        .single();

      if (createError || !newPrefs) {
        console.error('Error creating user preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to create user preferences' },
          { status: 500 }
        );
      }

      preferences = newPrefs;
    } else if (prefsError) {
      console.error('Error fetching user preferences:', prefsError);
      return NextResponse.json(
        { error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    // =====================================================
    // Format Response
    // =====================================================

    const response: { success: true; preferences: UserPreferences } = {
      success: true,
      preferences: {
        chat: preferences.chat_preferences || {
          shiftEnterToSubmit: false,
          enableSoundNotifications: true,
          autoScrollToBottom: true
        },
        notifications: preferences.notification_preferences || {
          emailDigest: 'daily',
          inAppNotifications: true,
          desktopNotifications: false
        },
        ui: preferences.ui_preferences || {
          theme: 'light',
          compactMode: false,
          sidebarCollapsed: false
        },
        workflow: preferences.workflow_preferences || {
          autoAdvanceSteps: false,
          showCompletedTasks: true
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in get user preferences API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =====================================================
// PUT - Update User Preferences
// =====================================================

export async function PUT(request: NextRequest) {
  try {
    // Parse request body
    const body: UpdatePreferencesRequest = await request.json();

    // Use service role client if DEMO_MODE or auth bypass is enabled
    const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const authBypassEnabled = process.env.NEXT_PUBLIC_AUTH_BYPASS_ENABLED === 'true';
    const supabase = (demoMode || authBypassEnabled) ? createServiceRoleClient() : await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // =====================================================
    // Get Current Preferences
    // =====================================================

    const fetchResult = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let currentPrefs = fetchResult.data;
    const fetchError = fetchResult.error;

    // If no preferences exist, create them first
    if (fetchError && fetchError.code === 'PGRST116') {
      const { data: newPrefs, error: createError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: user.id,
          chat_preferences: {},
          notification_preferences: {},
          ui_preferences: {},
          workflow_preferences: {}
        })
        .select()
        .single();

      if (createError || !newPrefs) {
        console.error('Error creating user preferences:', createError);
        return NextResponse.json(
          { error: 'Failed to create user preferences' },
          { status: 500 }
        );
      }

      currentPrefs = newPrefs;
    } else if (fetchError) {
      console.error('Error fetching user preferences:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch user preferences' },
        { status: 500 }
      );
    }

    // =====================================================
    // Merge Updates (Partial Update Support)
    // =====================================================

    const updatedChatPrefs = body.chat
      ? { ...currentPrefs.chat_preferences, ...body.chat }
      : currentPrefs.chat_preferences;

    const updatedNotificationPrefs = body.notifications
      ? { ...currentPrefs.notification_preferences, ...body.notifications }
      : currentPrefs.notification_preferences;

    const updatedUiPrefs = body.ui
      ? { ...currentPrefs.ui_preferences, ...body.ui }
      : currentPrefs.ui_preferences;

    const updatedWorkflowPrefs = body.workflow
      ? { ...currentPrefs.workflow_preferences, ...body.workflow }
      : currentPrefs.workflow_preferences;

    // =====================================================
    // Update Preferences
    // =====================================================

    const { data: updatedPrefs, error: updateError } = await supabase
      .from('user_preferences')
      .update({
        chat_preferences: updatedChatPrefs,
        notification_preferences: updatedNotificationPrefs,
        ui_preferences: updatedUiPrefs,
        workflow_preferences: updatedWorkflowPrefs
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError || !updatedPrefs) {
      console.error('Error updating user preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user preferences' },
        { status: 500 }
      );
    }

    // =====================================================
    // Return Updated Preferences
    // =====================================================

    const response: { success: true; preferences: UserPreferences } = {
      success: true,
      preferences: {
        chat: updatedPrefs.chat_preferences,
        notifications: updatedPrefs.notification_preferences,
        ui: updatedPrefs.ui_preferences,
        workflow: updatedPrefs.workflow_preferences
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in update user preferences API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
