# User Preferences API

## Overview

Stores and manages user-specific settings and preferences.

**Status**: ✅ Ready for integration (requires migration first)

---

## Features

- ✅ **Chat Preferences**: Enter key behavior, notifications, auto-scroll
- ✅ **Notification Preferences**: Email digest, in-app, desktop
- ✅ **UI Preferences**: Theme, compact mode, sidebar state
- ✅ **Workflow Preferences**: Auto-advance, completed tasks visibility
- ✅ **Auto-Creation**: Creates default preferences on first access
- ✅ **Partial Updates**: Update only specific preferences
- ✅ **Auth-Protected**: Users can only access their own preferences

---

## API Endpoints

### 1. Get User Preferences

```
GET /api/user/preferences
```

**Auth**: Required (user can only get their own preferences)

**Response**:
```json
{
  "success": true,
  "preferences": {
    "chat": {
      "shiftEnterToSubmit": false,
      "enableSoundNotifications": true,
      "autoScrollToBottom": true
    },
    "notifications": {
      "emailDigest": "daily",
      "inAppNotifications": true,
      "desktopNotifications": false
    },
    "ui": {
      "theme": "light",
      "compactMode": false,
      "sidebarCollapsed": false
    },
    "workflow": {
      "autoAdvanceSteps": false,
      "showCompletedTasks": true
    }
  }
}
```

**Behavior**:
- If preferences don't exist, creates them with defaults
- Always returns a complete preferences object
- User-specific (uses auth.uid())

**Example**:
```bash
curl http://localhost:3000/api/user/preferences \
  -H "Authorization: Bearer {token}"
```

---

### 2. Update User Preferences

```
PUT /api/user/preferences
```

**Auth**: Required (user can only update their own preferences)

**Request Body** (partial updates supported):
```json
{
  "chat": {
    "shiftEnterToSubmit": true
  }
}
```

**Full Update Example**:
```json
{
  "chat": {
    "shiftEnterToSubmit": true,
    "enableSoundNotifications": false,
    "autoScrollToBottom": true
  },
  "ui": {
    "theme": "dark",
    "compactMode": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "preferences": {
    "chat": {
      "shiftEnterToSubmit": true,
      "enableSoundNotifications": false,
      "autoScrollToBottom": true
    },
    "notifications": {
      "emailDigest": "daily",
      "inAppNotifications": true,
      "desktopNotifications": false
    },
    "ui": {
      "theme": "dark",
      "compactMode": true,
      "sidebarCollapsed": false
    },
    "workflow": {
      "autoAdvanceSteps": false,
      "showCompletedTasks": true
    }
  }
}
```

**Behavior**:
- **Partial updates**: Only specified fields are updated
- **Deep merge**: Merges with existing preferences
- **Unspecified fields**: Remain unchanged
- Creates preferences with defaults if none exist

**Example**:
```bash
# Update only shiftEnterToSubmit
curl -X PUT http://localhost:3000/api/user/preferences \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"chat": {"shiftEnterToSubmit": true}}'
```

---

## Database Schema

### Table: `user_preferences`

```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
  chat_preferences JSONB,
  notification_preferences JSONB,
  ui_preferences JSONB,
  workflow_preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Default Values**:
```json
{
  "chat_preferences": {
    "shiftEnterToSubmit": false,
    "enableSoundNotifications": true,
    "autoScrollToBottom": true
  },
  "notification_preferences": {
    "emailDigest": "daily",
    "inAppNotifications": true,
    "desktopNotifications": false
  },
  "ui_preferences": {
    "theme": "light",
    "compactMode": false,
    "sidebarCollapsed": false
  },
  "workflow_preferences": {
    "autoAdvanceSteps": false,
    "showCompletedTasks": true
  }
}
```

**Indexes**:
- `user_id` (unique, for fast lookup)
- GIN indexes on JSONB columns (for analytics/querying)

**Row-Level Security**:
- Users can only SELECT/INSERT/UPDATE/DELETE their own preferences
- Protected by `auth.uid()` policy

---

## Frontend Integration

### Basic Usage

```typescript
import { useState, useEffect } from 'react';

// Custom hook for user preferences
function useUserPreferences() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        setPreferences(data.preferences);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load preferences', err);
        setLoading(false);
      });
  }, []);

  // Update preference helper
  const updatePreference = async (updates: any) => {
    // Optimistic update
    setPreferences(prev => ({
      ...prev,
      ...updates
    }));

    // Persist to backend
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      setPreferences(data.preferences);
    } catch (err) {
      console.error('Failed to save preferences', err);
      // Revert optimistic update on error
      // (or reload from server)
    }
  };

  return { preferences, loading, updatePreference };
}
```

---

### Chat Toggle Example

```typescript
function ChatPanel() {
  const { preferences, updatePreference } = useUserPreferences();

  const handleToggleShiftEnter = (value: boolean) => {
    updatePreference({
      chat: {
        shiftEnterToSubmit: value
      }
    });
  };

  if (!preferences) return <div>Loading...</div>;

  return (
    <div>
      <Toggle
        checked={preferences.chat.shiftEnterToSubmit}
        onChange={handleToggleShiftEnter}
        label="Use Shift+Enter to submit"
      />
    </div>
  );
}
```

---

### With localStorage Fallback

```typescript
function useUserPreferences() {
  const [preferences, setPreferences] = useState(() => {
    // Try localStorage first (immediate)
    const cached = localStorage.getItem('userPreferences');
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    // Load from API (authoritative)
    fetch('/api/user/preferences')
      .then(res => res.json())
      .then(data => {
        setPreferences(data.preferences);
        localStorage.setItem('userPreferences', JSON.stringify(data.preferences));
      })
      .catch(err => {
        console.error('Failed to load preferences from API', err);
      });
  }, []);

  const updatePreference = async (updates: any) => {
    const updated = { ...preferences, ...updates };

    // Optimistic update
    setPreferences(updated);
    localStorage.setItem('userPreferences', JSON.stringify(updated));

    // Sync to backend
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      setPreferences(data.preferences);
      localStorage.setItem('userPreferences', JSON.stringify(data.preferences));
    } catch (err) {
      console.error('Failed to save preferences to API', err);
      // localStorage still has optimistic update
    }
  };

  return { preferences, updatePreference };
}
```

---

## Preference Categories

### Chat Preferences

```typescript
interface ChatPreferences {
  shiftEnterToSubmit: boolean;      // true = Shift+Enter submits, Enter = newline
                                     // false = Enter submits, Shift+Enter = newline
  enableSoundNotifications: boolean; // Play sound on new messages
  autoScrollToBottom: boolean;       // Auto-scroll to latest message
}
```

**Usage**:
```typescript
// Update chat preference
updatePreference({
  chat: { shiftEnterToSubmit: true }
});
```

---

### Notification Preferences

```typescript
interface NotificationPreferences {
  emailDigest: 'daily' | 'weekly' | 'never'; // Email digest frequency
  inAppNotifications: boolean;               // Show in-app notifications
  desktopNotifications: boolean;             // Browser push notifications
}
```

**Usage**:
```typescript
// Update notification preference
updatePreference({
  notifications: { emailDigest: 'weekly' }
});
```

---

### UI Preferences

```typescript
interface UIPreferences {
  theme: 'light' | 'dark' | 'auto'; // Color theme
  compactMode: boolean;              // Compact UI layout
  sidebarCollapsed: boolean;         // Sidebar collapsed by default
}
```

**Usage**:
```typescript
// Update UI preference
updatePreference({
  ui: { theme: 'dark', compactMode: true }
});
```

---

### Workflow Preferences

```typescript
interface WorkflowPreferences {
  autoAdvanceSteps: boolean;    // Auto-advance to next step on completion
  showCompletedTasks: boolean;  // Show completed tasks in lists
}
```

**Usage**:
```typescript
// Update workflow preference
updatePreference({
  workflow: { autoAdvanceSteps: true }
});
```

---

## Migration Instructions

**File**: `automation/database/migrations/006_user_preferences.sql`

**Run**:
```bash
psql -U postgres -d renubu -f automation/database/migrations/006_user_preferences.sql
```

**Validation**:
Migration includes built-in tests that verify:
- ✅ Table creation
- ✅ Default preferences
- ✅ Preference updates
- ✅ `get_or_create_user_preferences` function

**Expected Output**:
```
NOTICE:  Test 1 passed: User preferences created
NOTICE:  Test 2 passed: Default chat preferences correct
NOTICE:  Test 3 passed: Preference update works
NOTICE:  Test 4 passed: get_or_create function works
NOTICE:  === All user preferences tests passed ===
```

---

## Testing

### 1. Get Preferences (Auto-Creates Defaults)

```bash
curl http://localhost:3000/api/user/preferences \
  -H "Authorization: Bearer {token}"
```

**Expected**:
```json
{
  "success": true,
  "preferences": {
    "chat": {
      "shiftEnterToSubmit": false,
      "enableSoundNotifications": true,
      "autoScrollToBottom": true
    },
    ...
  }
}
```

---

### 2. Update Single Preference

```bash
curl -X PUT http://localhost:3000/api/user/preferences \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"chat": {"shiftEnterToSubmit": true}}'
```

**Expected**:
```json
{
  "success": true,
  "preferences": {
    "chat": {
      "shiftEnterToSubmit": true,  // <-- Updated
      "enableSoundNotifications": true,
      "autoScrollToBottom": true
    },
    ...
  }
}
```

---

### 3. Update Multiple Preferences

```bash
curl -X PUT http://localhost:3000/api/user/preferences \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {"shiftEnterToSubmit": true},
    "ui": {"theme": "dark", "compactMode": true}
  }'
```

**Expected**: All specified preferences updated, others unchanged

---

## Error Handling

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```
**Cause**: No auth token or invalid token

---

### 500 Internal Server Error
```json
{
  "error": "Failed to fetch user preferences"
}
```
**Cause**: Database error or table doesn't exist (run migration)

---

## Files Created

**Migration**:
- `automation/database/migrations/006_user_preferences.sql`

**API**:
- `renubu/src/app/api/user/preferences/route.ts`

**Documentation**:
- `automation/USER_PREFERENCES_API.md` (this file)

---

## Next Steps

1. ✅ **APIs Built** - GET and PUT endpoints ready
2. ⏳ **Run Migration** - Execute `006_user_preferences.sql`
3. ⏳ **Frontend Integration** - Use `useUserPreferences` hook
4. ⏳ **Test End-to-End** - Verify preference persistence

---

## Support

For questions or issues:
1. Check this documentation
2. Review migration file: `006_user_preferences.sql`
3. Test with curl examples above
