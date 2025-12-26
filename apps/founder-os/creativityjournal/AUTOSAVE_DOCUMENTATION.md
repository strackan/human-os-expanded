# Auto-Save Functionality Documentation

## Overview
The auto-save functionality ensures that user data is never lost during entry editing. It uses a dual-layer approach:
1. **LocalStorage**: Immediate saving to prevent data loss on browser refresh
2. **Database**: Debounced auto-save to persist data server-side

## Architecture

### Storage Layers
1. **LocalStorage** (`entry_draft`): Real-time data preservation
2. **Database** (via API): Persistent storage with debounced updates

### Entry Types
- **New Entry** (`/entry/page.tsx`): Creates new entries and manages drafts
- **Existing Entry** (`/entry/[id]/page.tsx`): Edits existing entries with auto-save

## How It Works

### 1. LocalStorage Auto-Save
```typescript
// Immediate save to localStorage (no debounce)
useEffect(() => {
  if (dataLoaded && (content || subject || selectedMoods.length > 0 || moodContext || satisfaction !== 5)) {
    const draft = {
      subject,
      content,
      selectedMoods,
      moodContext,
      satisfaction,
      wordCount,
      charCount,
      entryId: currentEntryId,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('entry_draft', JSON.stringify(draft));
  }
}, [content, subject, selectedMoods, moodContext, satisfaction, wordCount, charCount, currentEntryId, dataLoaded]);
```

### 2. Database Auto-Save
```typescript
// Debounced save to database (2 second delay)
const debouncedContent = useDebounce(content, 2000);
const debouncedWordCount = useDebounce(wordCount, 2000);
const debouncedCharCount = useDebounce(charCount, 2000);

useEffect(() => {
  if (debouncedContent && currentEntryId) {
    autoSaveToDatabase();
  }
}, [debouncedContent, debouncedWordCount, debouncedCharCount, currentEntryId]);
```

### 3. Data Restoration on Page Load

#### For New Entries (`/entry/page.tsx`):
```typescript
// Load from localStorage on mount
useEffect(() => {
  const loadDraftData = async () => {
    const saved = localStorage.getItem('entry_draft');
    if (saved) {
      const draft = JSON.parse(saved);
      if (draft.entryId) {
        // Verify entry exists in database
        const response = await fetch(`/api/entries/${draft.entryId}`);
        if (response.ok) {
          // Load from API and merge with localStorage
          const apiEntry = await response.json();
          // Use API data but preserve localStorage changes
        }
      }
    }
  };
  loadDraftData();
}, []);
```

#### For Existing Entries (`/entry/[id]/page.tsx`):
```typescript
// Load entry data from API and merge with localStorage
useEffect(() => {
  const loadEntryData = async () => {
    const response = await fetch(`/api/entries/${entryId}`);
    const data = await response.json();
    
    // Check localStorage for more recent data
    const savedDraft = localStorage.getItem('entry_draft');
    if (savedDraft) {
      const localStorageData = JSON.parse(savedDraft);
      if (localStorageData.entryId === parseInt(entryId)) {
        // Compare timestamps
        const apiTimestamp = new Date(data.updatedDate).getTime();
        const localTimestamp = new Date(localStorageData.timestamp || 0).getTime();
        
        // Use localStorage data if it's more recent
        if (localTimestamp > apiTimestamp) {
          // Use localStorage data
          setContent(localStorageData.content || '');
          setSubject(localStorageData.subject || '');
          // ... restore all fields
          return;
        }
      }
    }
    
    // Use API data if no localStorage or API is more recent
    setContent(data.content || '');
    setSubject(data.subject || '');
    // ... load all fields
  };
  loadEntryData();
}, [entryId]);
```

## Data Structure

### LocalStorage Format
```typescript
interface DraftData {
  subject: string;
  content: string;
  selectedMoods: Array<{value: number; label: string}>;
  moodContext: string;
  satisfaction: number;
  wordCount: number;
  charCount: number;
  entryId: number;
  timestamp: string; // ISO string
}
```

### Database Format
```typescript
interface EntryData {
  entryId: number;
  subject: string;
  content: string;
  moodIds: number[];
  moodContext: string;
  satisfaction: number;
  wordCount: number;
  charCount: number;
}
```

## Critical Implementation Details

### 1. Timestamp Comparison
- **LocalStorage** uses `timestamp` field with current time
- **Database** uses `updatedDate` field from API response
- **Logic**: If localStorage timestamp > API timestamp, use localStorage data

### 2. Word/Character Count Handling
- **Real-time calculation**: From content in TiptapEditor
- **LocalStorage**: Stored with each save
- **Database**: Debounced save with calculated counts
- **Restoration**: Use stored counts if available, otherwise calculate from content

### 3. Race Condition Prevention
- **Mood Loading**: Separate `storedMoodIds` state to handle async mood loading
- **Data Loading**: `dataLoaded` flag to prevent premature localStorage saves
- **Entry Creation**: Ensure `entryId` exists before saving

### 4. Data Cleanup
```typescript
const clearDraft = useCallback(() => {
  localStorage.removeItem('entry_draft');
  localStorage.removeItem('entry_metadata');
  console.log('Cleared localStorage draft data');
}, []);
```

## Testing Scenarios

### 1. Page Refresh Test
1. Start editing an entry
2. Make changes to content, subject, moods
3. Refresh the page
4. **Expected**: All changes should be preserved

### 2. Browser Crash Recovery
1. Start editing an entry
2. Make changes
3. Kill browser process
4. Reopen browser and navigate to entry
5. **Expected**: Recent changes should be preserved

### 3. Network Interruption
1. Start editing an entry
2. Disconnect network
3. Continue editing
4. Reconnect network
5. **Expected**: Changes saved to localStorage should persist and sync to database

### 4. Concurrent Editing
1. Edit entry in one tab
2. Open same entry in another tab
3. Make changes in both tabs
4. **Expected**: Most recent changes should take precedence

## Common Issues and Solutions

### Issue 1: Data Lost on Refresh
**Cause**: localStorage data not being restored on page load
**Solution**: Ensure `loadEntryData` includes localStorage checking logic

### Issue 2: Stale Data After Publish
**Cause**: localStorage not cleared after successful publish
**Solution**: Call `clearDraft()` in publish success handler

### Issue 3: Word Count Mismatch
**Cause**: Word count not being saved/restored with other data
**Solution**: Include `wordCount` and `charCount` in localStorage save/restore

### Issue 4: Race Conditions
**Cause**: Multiple async operations (mood loading, data loading) happening simultaneously
**Solution**: Use separate state flags and careful dependency management

## API Endpoints

### Auto-Save Endpoint
- **URL**: `/api/entries/save`
- **Method**: POST
- **Purpose**: Save entry data to database
- **Debounced**: Yes (2 seconds)

### Entry Loading Endpoint
- **URL**: `/api/entries/[id]`
- **Method**: GET
- **Purpose**: Load entry data from database
- **Used for**: Timestamp comparison with localStorage

## Best Practices

### 1. Always Include Timestamp
```typescript
const draft = {
  // ... other fields
  timestamp: new Date().toISOString(), // REQUIRED
};
```

### 2. Validate localStorage Data
```typescript
if (savedDraft) {
  try {
    const localStorageData = JSON.parse(savedDraft);
    // Always check if data is for correct entry
    if (localStorageData.entryId === parseInt(entryId)) {
      // Use the data
    }
  } catch (error) {
    console.error('Error parsing localStorage data:', error);
  }
}
```

### 3. Handle Missing Fields Gracefully
```typescript
// Use fallback values for missing fields
setSubject(localStorageData.subject || '');
setContent(localStorageData.content || '');
setSatisfaction(localStorageData.satisfaction || 5);
```

### 4. Clear Data on Success
```typescript
// Always clear localStorage after successful publish
if (publishResponse.ok) {
  clearDraft();
  router.push('/entries?success=save');
}
```

### 5. Log for Debugging
```typescript
console.log('[EntryDetailPage] Using localStorage data (more recent)');
console.log('[EntryDetailPage] Timestamp comparison:', {
  api: apiTimestamp,
  local: localTimestamp,
  useLocal: localTimestamp > apiTimestamp
});
```

## Maintenance Checklist

When modifying entry editing functionality:

- [ ] Ensure localStorage save includes all necessary fields
- [ ] Update localStorage restore logic to handle new fields
- [ ] Test page refresh scenarios
- [ ] Verify timestamp comparison works correctly
- [ ] Check that `clearDraft()` is called on successful operations
- [ ] Update word/character count handling if content processing changes
- [ ] Test with network interruptions
- [ ] Verify race condition handling still works

## Future Improvements

1. **Conflict Resolution**: Better handling of concurrent edits
2. **Data Compression**: Compress localStorage data for large entries
3. **Version Control**: Track multiple versions of drafts
4. **Sync Indicators**: Show user when data is being saved
5. **Recovery UI**: Better user interface for data recovery scenarios

---

**⚠️ CRITICAL**: Never modify the auto-save functionality without thoroughly testing page refresh scenarios. Data loss is a critical user experience issue. 