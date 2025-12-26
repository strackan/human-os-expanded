# Auto-Save Testing Plan

## Test Environment Setup
1. Open browser with developer tools
2. Navigate to `http://localhost:3000`
3. Have Network tab open to monitor API calls
4. Have Console tab open to monitor localStorage operations

## Test Cases

### Test 1: Page Refresh Data Persistence
**Purpose**: Verify that data persists across page refreshes

**Steps**:
1. Navigate to `/entry/25` (existing entry)
2. Wait for page to load completely
3. Modify the subject field: "Test Subject Update"
4. Add content: "This is test content for auto-save"
5. Change satisfaction to 7
6. Wait 3 seconds (for auto-save to complete)
7. **Hard refresh the page (Ctrl+F5)**
8. Verify all changes are preserved

**Expected Results**:
- Subject shows "Test Subject Update"
- Content shows "This is test content for auto-save"
- Satisfaction is set to 7
- Word count is calculated correctly
- Character count is calculated correctly

**Check in Console**:
```
[EntryDetailPage] Found localStorage data: {...}
[EntryDetailPage] Timestamp comparison: {...}
[EntryDetailPage] Using localStorage data (more recent)
```

### Test 2: New Entry Auto-Save
**Purpose**: Verify auto-save works for new entries

**Steps**:
1. Navigate to `/entry/new`
2. Fill in entry details
3. Click "Start Writing"
4. Add content to the editor
5. **Refresh the page**
6. Verify content is preserved

**Expected Results**:
- All content is preserved after refresh
- Entry ID is maintained
- Auto-save continues to work

### Test 3: Database vs LocalStorage Precedence
**Purpose**: Verify that localStorage data takes precedence when more recent

**Steps**:
1. Open entry in one tab
2. Make changes (don't save manually)
3. Open same entry in another tab
4. Make different changes in second tab
5. Refresh first tab
6. Verify it shows the most recent changes

**Expected Results**:
- Most recent changes are shown
- Timestamp comparison works correctly
- No data loss occurs

### Test 4: Auto-Save API Calls
**Purpose**: Verify debounced auto-save API calls

**Steps**:
1. Open entry for editing
2. Monitor Network tab in developer tools
3. Type content continuously
4. Observe API calls to `/api/entries/save`

**Expected Results**:
- API calls are debounced (only after 2 seconds of inactivity)
- Multiple rapid changes don't cause multiple API calls
- API calls include all current data

### Test 5: Word/Character Count Accuracy
**Purpose**: Verify word and character counts are saved and restored correctly

**Steps**:
1. Edit an entry
2. Add content: "Hello world, this is a test."
3. Note word count (6 words) and character count
4. Refresh page
5. Verify counts are preserved

**Expected Results**:
- Word count: 6
- Character count: matches actual text length
- Counts are restored from localStorage

### Test 6: Mood Selection Persistence
**Purpose**: Verify mood selections are saved and restored

**Steps**:
1. Edit an entry
2. Select multiple moods
3. Refresh page
4. Verify mood selections are preserved

**Expected Results**:
- All selected moods are restored
- Mood IDs are correctly mapped
- No race conditions with mood loading

### Test 7: Publish and Clear
**Purpose**: Verify localStorage is cleared after successful publish

**Steps**:
1. Edit an entry
2. Make changes
3. Publish the entry
4. Check localStorage for `entry_draft`

**Expected Results**:
- `entry_draft` is removed from localStorage
- `entry_metadata` is removed from localStorage
- Console shows "Cleared localStorage draft data"

### Test 8: Network Interruption Recovery
**Purpose**: Verify auto-save works during network issues

**Steps**:
1. Edit an entry
2. Disable network in browser
3. Continue editing
4. Re-enable network
5. Verify changes are preserved and sync to database

**Expected Results**:
- Changes saved to localStorage during network outage
- Data syncs to database when network restored
- No data loss occurs

### Test 9: Browser Crash Recovery
**Purpose**: Verify recovery from browser crashes

**Steps**:
1. Edit an entry
2. Make significant changes
3. Kill browser process (don't close normally)
4. Restart browser
5. Navigate to the entry
6. Verify changes are preserved

**Expected Results**:
- All changes are preserved
- Entry loads with localStorage data
- Auto-save continues to work

### Test 10: Edge Cases
**Purpose**: Test various edge cases

**Steps**:
1. **Empty content**: Refresh with empty content
2. **Special characters**: Test with emojis, HTML, etc.
3. **Large content**: Test with very long content
4. **Rapid changes**: Type very quickly and refresh immediately

**Expected Results**:
- Empty content handled gracefully
- Special characters preserved correctly
- Large content doesn't break localStorage
- Rapid changes don't cause issues

## Performance Verification

### LocalStorage Size
- Monitor localStorage size with large entries
- Verify no performance degradation
- Check for memory leaks

### API Call Frequency
- Verify debouncing works correctly
- No excessive API calls
- Proper error handling

### Page Load Performance
- Verify localStorage restoration doesn't slow page load
- Check for blocking operations
- Monitor console for errors

## Debugging Commands

### Clear LocalStorage
```javascript
localStorage.removeItem('entry_draft');
localStorage.removeItem('entry_metadata');
```

### Inspect LocalStorage
```javascript
console.log(JSON.parse(localStorage.getItem('entry_draft')));
```

### Force Auto-Save
```javascript
window.clearEntryCache(); // If global function is available
```

## Pass/Fail Criteria

**PASS**: All test cases pass without data loss
**FAIL**: Any data loss or corruption occurs

## Critical Success Metrics

1. **Zero Data Loss**: No user data is ever lost
2. **Consistent State**: UI always reflects current data
3. **Performance**: No noticeable slowdown from auto-save
4. **Reliability**: Auto-save works in all scenarios

## Test Results Template

```
Test Case: [Test Name]
Date: [Date]
Browser: [Browser Version]
Status: [PASS/FAIL]
Issues: [Any issues found]
Notes: [Additional notes]
```

## Regression Testing

Run this test suite after any changes to:
- Entry editing components
- Auto-save functionality
- LocalStorage handling
- Database save operations
- State management

---

**⚠️ IMPORTANT**: If any test fails, do not deploy until the issue is resolved. Data loss is a critical user experience issue. 