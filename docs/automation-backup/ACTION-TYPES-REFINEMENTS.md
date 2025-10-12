# Action Types Refinements

## Changes Based on User Feedback

### 1. Snooze Duration: Fixed to 1 Week

**Before:**
- Variable snooze options: 1 day, 2 days, 3 days, 1 week
- Default: 1 day

**After:**
- Fixed duration: **Always 1 week**
- Simpler UX - no dropdown needed
- Daily re-evaluation still applies

```typescript
snooze: {
  config: {
    snoozeDuration: 7, // Always 1 week
    dailyReevaluation: true
  }
}
```

**Rationale:** Keeps tasks tied to workflow context. If snoozed for 30 days, context may have changed significantly (new workflow stage, different priorities). 1 week keeps it manageable.

---

### 2. Skip Behavior: Resurface at Next Workflow

**Before:**
- Skipped recommendations resurface after 30 days

**After:**
- Skipped recommendations **resurface at next workflow** (if still valid)

```typescript
skip: {
  config: {
    resurfaceAt: 'next_workflow', // Not time-based
    requiresReason: false
  }
}
```

**Example Flow:**
1. CSM skips "Send feature adoption email" in Monitor workflow (180 days out)
2. Recommendation marked as skipped
3. When Prepare workflow fires (120 days out), system checks:
   - Is this recommendation still valid for Prepare stage?
   - If YES → Resurface it
   - If NO → Keep it skipped

**Rationale:** Workflow stages change context. What wasn't relevant at 180 days might be critical at 120 days. Let each workflow re-evaluate.

---

### 3. Core Action Focus: Emails, CRM Updates, Transcripts

Added two new action types to focus on core CSM automation needs:

#### **UPDATE_CRM**
```typescript
update_crm: {
  id: 'update_crm',
  label: 'Update CRM',
  icon: '💼',
  automation: 'crm-updater',
  requiresArtifact: 'crm_update',
  taskOwner: 'AI', // AI drafts, CSM approves
  config: {
    draftFlow: true,
    editableInUI: true,
    requiresConfirmation: true,
    updateTypes: ['activity', 'note', 'task', 'opportunity_field'],
    systems: ['salesforce']
  }
}
```

**Flow:**
1. AI generates CRM update (activity log, note, opportunity field change)
2. CSM reviews in UI
3. CSM edits if needed
4. CSM confirms
5. System logs to Salesforce

**Use Cases:**
- Log stakeholder mapping changes
- Document value realization metrics
- Track renewal conversation outcomes
- Update opportunity fields (e.g., renewal probability)

#### **GET_TRANSCRIPT**
```typescript
get_transcript: {
  id: 'get_transcript',
  label: 'Get Transcript',
  icon: '📝',
  automation: 'transcript-fetcher',
  requiresArtifact: 'transcript_request',
  taskOwner: 'AI',
  config: {
    sources: ['gong', 'chorus', 'zoom', 'teams'],
    autoAnalyze: true, // AI analyzes transcript after fetching
    outputArtifact: 'transcript_analysis'
  }
}
```

**Flow:**
1. AI identifies relevant meeting (e.g., "Last QBR from 2 weeks ago")
2. CSM confirms which meeting
3. AI fetches transcript from Gong/Chorus/Zoom/Teams
4. AI analyzes transcript
5. AI generates `transcript_analysis` artifact with:
   - Key discussion points
   - Action items mentioned
   - Sentiment analysis
   - Renewal-relevant insights

**Use Cases:**
- Pull insights from recent customer calls
- Analyze QBR discussions for renewal signals
- Extract action items from meetings
- Understand customer concerns from support calls

---

### 4. Email Attachments: PDF Support (Future)

Updated `send_email` config:

```typescript
send_email: {
  config: {
    sendableTypes: ['email'],
    supportedAttachments: ['pdf'] // Future: attach generated reports/quotes
  }
}
```

**Not implemented yet**, but architecture supports:
- Generate ROI report as PDF → Attach to email
- Generate quote as PDF → Attach to email
- Generate executive summary as PDF → Attach to email

**Rationale:** Start with emails only. Add PDF generation when needed. Avoid over-engineering prematurely.

---

### 5. Updated Recommendation Type Supported Actions

**Added `update_crm` to:**
- `stakeholder_mapping_update` - Log stakeholder changes to Salesforce
- `value_realization_documentation` - Log ROI metrics to opportunity

**Added `get_transcript` to:**
- `conversation_starters` - Pull insights from recent calls to generate talking points

**Example:**
```javascript
// Recommendation: "Update stakeholder map with recent changes"
{
  subcategory: 'stakeholder_mapping_update',
  supportedActions: ['review_data', 'update_crm', 'skip', 'snooze'],

  // CSM can:
  // 1. Review data (see changes)
  // 2. Update CRM (log to Salesforce)
  // 3. Skip (not relevant)
  // 4. Snooze (deal with next week)
}
```

---

## Action Type Summary

| Action | Owner | Automation | Completes Rec? | Key Feature |
|--------|-------|------------|----------------|-------------|
| `send_email` | AI → CSM | email-sender | ✅ | Draft → Review → Edit → Confirm → Send |
| `schedule_meeting` | CSM | calendar-scheduler | ✅ | AI generates agenda |
| `review_data` | - | None | ❌ | Informational only |
| `update_crm` | AI → CSM | crm-updater | ✅ | Draft → Review → Confirm → Log |
| `get_transcript` | AI | transcript-fetcher | ❌ | Fetch → Analyze → Create artifact |
| `create_workflow` | AI → CSM | workflow-spawner | ✅ | Spawn new workflow |
| `skip` | - | None | ✅ | Resurface at next workflow |
| `snooze` | CSM | task-scheduler | ❌ | Fixed 1 week, daily re-eval |

---

## Integration Points (Future Checkpoints)

**Email Sender:**
- SMTP integration
- Email template rendering
- Send tracking

**CRM Updater:**
- Salesforce API
- Field mapping (opportunity, contact, activity)
- Update validation

**Transcript Fetcher:**
- Gong API
- Chorus API
- Zoom API
- Teams API
- Transcript parsing
- AI analysis (LLM)

**Calendar Scheduler:**
- Google Calendar API
- Outlook Calendar API
- Meeting invite generation

**Task Scheduler:**
- Daily snooze evaluation
- Priority-based surfacing
- Snooze extension logic

---

## Next: Checkpoint 2

Now that action types are refined:
1. Fix Signature workflow trigger (7-30 days)
2. Rebuild Monitor workflow with recommendation-driven pattern
3. Test conditional workflow creation
4. Design recommendation artifact UI
