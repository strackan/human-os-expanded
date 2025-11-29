/**
 * User Preferences Migration
 *
 * Creates user_preferences table for storing user-specific settings
 * - Chat preferences (shiftEnterToSubmit, etc.)
 * - Notification preferences (future)
 * - UI preferences (future)
 */

-- =====================================================
-- 1. USER PREFERENCES TABLE
-- =====================================================

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Chat preferences
  chat_preferences JSONB DEFAULT '{
    "shiftEnterToSubmit": false,
    "enableSoundNotifications": true,
    "autoScrollToBottom": true
  }'::jsonb,

  -- Notification preferences (future)
  notification_preferences JSONB DEFAULT '{
    "emailDigest": "daily",
    "inAppNotifications": true,
    "desktopNotifications": false
  }'::jsonb,

  -- UI preferences (future)
  ui_preferences JSONB DEFAULT '{
    "theme": "light",
    "compactMode": false,
    "sidebarCollapsed": false
  }'::jsonb,

  -- Workflow preferences (future)
  workflow_preferences JSONB DEFAULT '{
    "autoAdvanceSteps": false,
    "showCompletedTasks": true
  }'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE user_preferences IS 'User-specific preferences and settings';
COMMENT ON COLUMN user_preferences.chat_preferences IS 'Chat behavior settings (Enter key, notifications, etc.)';
COMMENT ON COLUMN user_preferences.notification_preferences IS 'Notification delivery preferences';
COMMENT ON COLUMN user_preferences.ui_preferences IS 'UI/UX customization settings';
COMMENT ON COLUMN user_preferences.workflow_preferences IS 'Workflow automation preferences';

-- =====================================================
-- 2. INDEXES
-- =====================================================

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- GIN indexes for JSONB querying (if needed for analytics)
CREATE INDEX idx_user_preferences_chat ON user_preferences USING gin(chat_preferences);
CREATE INDEX idx_user_preferences_notifications ON user_preferences USING gin(notification_preferences);

-- =====================================================
-- 3. TRIGGERS
-- =====================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_preferences_updated
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  chat_preferences JSONB,
  notification_preferences JSONB,
  ui_preferences JSONB,
  workflow_preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  -- Try to get existing preferences
  RETURN QUERY
  SELECT
    up.id,
    up.user_id,
    up.chat_preferences,
    up.notification_preferences,
    up.ui_preferences,
    up.workflow_preferences,
    up.created_at,
    up.updated_at
  FROM user_preferences up
  WHERE up.user_id = p_user_id;

  -- If no preferences exist, create them
  IF NOT FOUND THEN
    INSERT INTO user_preferences (user_id)
    VALUES (p_user_id)
    RETURNING
      user_preferences.id,
      user_preferences.user_id,
      user_preferences.chat_preferences,
      user_preferences.notification_preferences,
      user_preferences.ui_preferences,
      user_preferences.workflow_preferences,
      user_preferences.created_at,
      user_preferences.updated_at
    INTO
      id,
      user_id,
      chat_preferences,
      notification_preferences,
      ui_preferences,
      workflow_preferences,
      created_at,
      updated_at;

    RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_or_create_user_preferences IS 'Gets user preferences or creates default preferences if none exist';

-- =====================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only read their own preferences
CREATE POLICY user_preferences_select_policy ON user_preferences
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can only insert their own preferences
CREATE POLICY user_preferences_insert_policy ON user_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can only update their own preferences
CREATE POLICY user_preferences_update_policy ON user_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own preferences (if needed)
CREATE POLICY user_preferences_delete_policy ON user_preferences
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- 6. VALIDATION TESTS
-- =====================================================

DO $$
DECLARE
  test_user_id UUID;
  prefs RECORD;
BEGIN
  -- Test 1: Create test user preferences
  test_user_id := gen_random_uuid();

  INSERT INTO user_preferences (user_id)
  VALUES (test_user_id);

  RAISE NOTICE 'Test 1 passed: User preferences created';

  -- Test 2: Verify default chat preferences
  SELECT chat_preferences INTO prefs
  FROM user_preferences
  WHERE user_id = test_user_id;

  IF prefs.chat_preferences->>'shiftEnterToSubmit' = 'false' THEN
    RAISE NOTICE 'Test 2 passed: Default chat preferences correct';
  ELSE
    RAISE EXCEPTION 'Test 2 failed: Default chat preferences incorrect';
  END IF;

  -- Test 3: Update preferences
  UPDATE user_preferences
  SET chat_preferences = jsonb_set(
    chat_preferences,
    '{shiftEnterToSubmit}',
    'true'
  )
  WHERE user_id = test_user_id;

  SELECT chat_preferences INTO prefs
  FROM user_preferences
  WHERE user_id = test_user_id;

  IF prefs.chat_preferences->>'shiftEnterToSubmit' = 'true' THEN
    RAISE NOTICE 'Test 3 passed: Preference update works';
  ELSE
    RAISE EXCEPTION 'Test 3 failed: Preference update failed';
  END IF;

  -- Test 4: Test get_or_create function
  DELETE FROM user_preferences WHERE user_id = test_user_id;

  PERFORM get_or_create_user_preferences(test_user_id);

  IF EXISTS (SELECT 1 FROM user_preferences WHERE user_id = test_user_id) THEN
    RAISE NOTICE 'Test 4 passed: get_or_create function works';
  ELSE
    RAISE EXCEPTION 'Test 4 failed: get_or_create function failed';
  END IF;

  -- Cleanup
  DELETE FROM user_preferences WHERE user_id = test_user_id;

  RAISE NOTICE '=== All user preferences tests passed ===';
END $$;
