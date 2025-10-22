# Obsidian Black V3 - Issues Found

## 🐛 Issues Discovered During Testing

### 1. ✅ FIXED - Main Page Layout
**Issue:** Priority workflow card too skinny and close to greeting
**Cause:** Missing proper spacing classes from original
**Fix Applied:**
- Changed from `<div>` to `<>` fragment wrapper
- Added `mb-12` to ZenGreeting
- Used `space-y-6` container for proper spacing
- Fixed PriorityWorkflowCard props (was passing `workflow` object, should pass individual props)

---

### 2. 🚧 CRITICAL - Placeholder Hydration
**Issue:** {{customer.name}} placeholders not being replaced
**Location:** Throughout workflow slides (greeting, review-account, quote, summary)
**Example:**
```
greetingText: "...Renewal Planning for {{customer.name}}..."
```

**Current Behavior:** Placeholders show literally as `{{customer.name}}`
**Expected Behavior:** Should show "Renewal Planning for Obsidian Black"

**Root Cause:** Slide library doesn't hydrate mustache-style placeholders

**Composition file uses:**
- `{{customer.name}}` (lines 50, 61, 104, 181, 195)
- `<User.First>` (line 135)

**Options to Fix:**
1. **Add hydration to composer** - Replace placeholders before passing to slides
2. **Update slide builders** - Handle placeholders in individual slides
3. **Use different templating** - Switch to function-based templating

---

### 3. 🚧 CRITICAL - Button Handling
**Issue:** Buttons defined in composition aren't being rendered/handled properly

**From composition:**
```typescript
buttons: [
  { label: 'Review Later', value: 'snooze' },
  { label: "Let's Begin!", value: 'start' }
]
```

**Expected Behavior:**
- "Review Later" → Creates snooze action
- "Let's Begin!" → Advances to next slide

**Current Behavior:** Unknown - needs testing

---

### 4. 🚧 CRITICAL - Slide Navigation Broken
**Issue:** App breaks when advancing to slide 3, no artifact shown
**Symptoms:**
- Can advance from slide 1 to 2
- Slide 2 to 3 breaks
- No artifact/content displayed
- App becomes unresponsive

**Possible Causes:**
- Slide 3 (`pricing-analysis`) missing or broken
- Artifact rendering issue
- Chat system interfering
- Missing slide context data

---

### 5. 🚧 CRITICAL - Chat Breaks App
**Issue:** Any chat interaction breaks the entire application
**Behavior:** Cannot progress past step 2 when chat is used

**Likely Cause:**
- ChatService trying to access database tables
- Missing foreign key relationships (workflow_executions, step_executions don't exist)
- Chat thread creation failing
- Error not being caught/handled

---

### 6. 🔍 MINOR - Contact Style Changes
**Issue:** Contacts should change style when reviewed (per user)
**Status:** Need to verify expected behavior
**Likely Location:** review-account slide

---

## 🎯 Priority Fix Order

### Phase 1: Make It Work (Immediate)
1. **Disable chat temporarily** to prevent app crashes
2. **Fix placeholder hydration** so customer names show
3. **Debug slide 3 navigation** to find why it breaks

### Phase 2: Full Functionality
4. **Implement button handling** for snooze/advance
5. **Fix chat integration** with proper error handling
6. **Add contact review styling** if needed

---

## 💡 Recommended Approach

### Quick Fix (30 min):
```typescript
// In db-composer.ts, add hydration before returning config
function hydrateTemplate(text: string, context: any): string {
  return text
    .replace(/\{\{customer\.name\}\}/g, context.name || 'Customer')
    .replace(/<User\.First>/g, 'Justin')  // Get from auth
    // ... etc
}
```

### Proper Fix (2-3 hours):
1. Create `TemplateHydrator` service
2. Support mustache syntax: `{{customer.name}}`, `{{customer.arr}}`
3. Support user variables: `<User.First>`, `<User.Last>`
4. Handle nested objects: `{{contact.name}}`, `{{primary_contact.title}}`
5. Add to composer pipeline before slide building

---

## 🔬 Testing Needed

### To Reproduce Issues:
1. Navigate to `/obsidian-black-v3`
2. Click "Launch Workflow"
3. On slide 1:
   - Check if {{customer.name}} shows
   - Try "Review Later" button
   - Click "Let's Begin!"
4. On slide 2:
   - Review account info
   - Click to advance
5. On slide 3:
   - **App should break here**
   - Check console for errors

### What to Check:
- [ ] Customer name displays correctly
- [ ] Buttons render and work
- [ ] Can navigate through all 6 slides
- [ ] Artifacts display properly
- [ ] Chat doesn't crash app
- [ ] Contact states change when reviewed

---

## 📝 Files Involved

**Main Issues:**
- `src/lib/workflows/db-composer.ts` - Add hydration
- `src/lib/workflows/slides/*.ts` - Individual slide builders
- `src/components/workflows/TaskMode.tsx` - Navigation logic
- `src/lib/workflows/chat/ChatService.ts` - Error handling

**Compositions:**
- `src/lib/workflows/compositions/obsidianBlackRenewalComposition.ts` - Source of placeholders

**Status:**
- ✅ Main page layout FIXED
- 🚧 5 critical issues remaining
- 📊 Estimated 3-4 hours to resolve all issues

---

**Last Updated:** 2025-10-21
**Tester:** User
**Version:** obsidian-black-v3
