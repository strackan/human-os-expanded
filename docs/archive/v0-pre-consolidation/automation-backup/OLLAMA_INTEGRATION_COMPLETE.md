# Ollama Integration - Backend Complete ✅

## Summary

Backend has implemented Ollama integration with automatic mock fallback. The Messages API now uses a new `LLMService` that seamlessly switches between Ollama (if enabled/available) and mock responses.

**Status**: ✅ Ready for frontend testing

---

## What Was Built

### 1. LLM Service (`src/lib/services/LLMService.ts`)

**Purpose**: Central service for all LLM response generation

**Features**:
- ✅ Ollama API integration (`POST localhost:11434/api/chat`)
- ✅ 10-second timeout (configurable)
- ✅ Automatic fallback to mock on error/timeout
- ✅ Customer context injection (personalized responses)
- ✅ Conversation history support
- ✅ Source tracking (`'ollama'` or `'mock'`)

**Environment Variables**:
```bash
NEXT_PUBLIC_USE_OLLAMA=true              # Enable Ollama (default: false)
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b     # Model to use (default: llama3.1:8b)
NEXT_PUBLIC_OLLAMA_TIMEOUT=10000         # Timeout in ms (default: 10000)
```

### 2. Messages API Update

**File**: `src/app/api/workflows/chat/threads/[threadId]/messages/route.ts`

**Changes**:
- ✅ Replaced inline mock function with `LLMService`
- ✅ Loads full conversation history for context
- ✅ Returns `source` field in response
- ✅ No breaking changes to API contract

---

## API Contract (Unchanged)

### Request
```typescript
POST /api/workflows/chat/threads/[threadId]/messages
{
  "message": "What's the ROI for this customer?"
}
```

### Response
```typescript
{
  "success": true,
  "userMessage": {
    "id": "...",
    "role": "user",
    "content": "What's the ROI for this customer?",
    "messageType": "text",
    "createdAt": "...",
    "sequenceNumber": 1
  },
  "assistantMessage": {
    "id": "...",
    "role": "assistant",
    "content": "Based on the customer's data...", // From Ollama or mock
    "messageType": "text",
    "metadata": null,
    "createdAt": "...",
    "sequenceNumber": 2,
    "source": "ollama" // NEW: 'ollama' or 'mock'
  }
}
```

**New Field**:
- `source`: Indicates where the response came from (`'ollama'` or `'mock'`)

---

## How It Works

### Default Behavior (USE_OLLAMA=false)
```
User Message
    ↓
Messages API
    ↓
LLMService.generateResponse()
    ↓
generateMockResponse() (keyword-based)
    ↓
Returns: { content: "...", source: 'mock' }
```

### Ollama Enabled (USE_OLLAMA=true)
```
User Message
    ↓
Messages API
    ↓
LLMService.generateResponse()
    ↓
Try callOllama() with 10s timeout
    ↓
    ├─ Success → Returns: { content: "...", source: 'ollama' }
    │
    └─ Error/Timeout → Fallback to mock
                        Returns: { content: "...", source: 'mock' }
```

### Conversation History

The service automatically:
1. Fetches all messages from the current thread
2. Builds messages array for Ollama
3. Adds customer context to system message
4. Sends full conversation history to Ollama

**Example Ollama Request**:
```json
{
  "model": "llama3.1:8b",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful AI assistant helping a Customer Success Manager with renewal workflows...\n\nCurrent Customer Context:\n- Company: acme.com\n- ARR: $150,000\n- Days Until Renewal: 45\n..."
    },
    {
      "role": "user",
      "content": "What's the renewal status?"
    },
    {
      "role": "assistant",
      "content": "Based on the context..."
    },
    {
      "role": "user",
      "content": "Should I reach out now?"
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

---

## Testing Instructions

### 1. Test Mock Mode (Default)

**Setup**:
```bash
# In .env.local (or leave unset)
NEXT_PUBLIC_USE_OLLAMA=false
```

**Expected**:
- Fast responses (<100ms)
- Keyword-based mock responses
- `source: 'mock'` in response
- Predictable behavior

**Test**:
```bash
# Send message
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me the ROI"}'

# Should get mock ROI analysis with source: 'mock'
```

---

### 2. Test Ollama Mode

**Prerequisites**:
- Ollama running: `ollama serve`
- Model pulled: `ollama pull llama3.1:8b`

**Setup**:
```bash
# In .env.local
NEXT_PUBLIC_USE_OLLAMA=true
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b
NEXT_PUBLIC_OLLAMA_TIMEOUT=10000
```

**Expected**:
- Slower responses (2-5 seconds)
- Dynamic, contextual responses from Ollama
- `source: 'ollama'` in response
- Uses conversation history

**Test**:
```bash
# Send message
curl -X POST http://localhost:3000/api/workflows/chat/threads/{threadId}/messages \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I focus on for this renewal?"}'

# Should get Ollama-generated response with source: 'ollama'
```

---

### 3. Test Automatic Fallback

**Scenario 1: Ollama Not Running**
```bash
# Stop Ollama
pkill ollama

# .env.local still has USE_OLLAMA=true

# Send message - should fallback to mock
```

**Expected**:
- Warning in console: `[LLMService] Ollama failed, falling back to mock`
- Response with `source: 'mock'`
- No errors, seamless fallback

---

**Scenario 2: Ollama Timeout**
```bash
# .env.local
NEXT_PUBLIC_OLLAMA_TIMEOUT=100  # Very short timeout

# Send message - should timeout and fallback
```

**Expected**:
- Warning in console: `[LLMService] Ollama request timed out`
- Response with `source: 'mock'`
- No hanging requests

---

## Customer Context (Optional)

The `LLMService` supports passing customer context for personalized responses:

```typescript
const customerContext = {
  customerId: 'cust-123',
  domain: 'acme.com',
  arr: 150000,
  renewalDate: '2025-12-31',
  daysUntilRenewal: 45,
  renewalStage: 'active',
  accountPlan: 'invest'
};

const response = await LLMService.generateResponse(messages, customerContext);
```

**System Message with Context**:
```
You are a helpful AI assistant helping a Customer Success Manager with renewal workflows...

Current Customer Context:
- Company: acme.com
- ARR: $150,000
- Renewal Date: 2025-12-31
- Days Until Renewal: 45
- Renewal Stage: active
- Account Plan: invest

Use this context to provide personalized, relevant responses.
```

**Note**: Currently context is optional. To enable, backend needs to fetch customer data from `workflow_executions` table.

---

## Frontend Tasks

### ✅ No Changes Required to Current Chat UI

The existing chat UI should work as-is. The only change is the addition of the `source` field.

### 🔲 Optional: Add LLM Mode Indicator

**Recommendation**: Show users which mode is active

```typescript
// In chat UI
{message.source === 'ollama' && (
  <Badge color="green">Real LLM</Badge>
)}
{message.source === 'mock' && (
  <Badge color="gray">Mock</Badge>
)}
```

### 🔲 Optional: Add Toggle Switch

**Recommendation**: Let users enable/disable Ollama on the fly

```typescript
// Settings panel
<Toggle
  checked={useOllama}
  onChange={(enabled) => {
    // Update environment variable or localStorage
    // May require page refresh
  }}
  label="Use Ollama (local LLM)"
/>
```

**Note**: Changing environment variables requires server restart or runtime config

---

## Console Logging

The service logs helpful debugging information:

**Ollama Success**:
```
[LLMService] Attempting Ollama API call...
[LLMService] Ollama response successful
```

**Ollama Failure**:
```
[LLMService] Attempting Ollama API call...
[LLMService] Ollama failed, falling back to mock: Ollama API returned 500: Internal Server Error
```

**Ollama Timeout**:
```
[LLMService] Attempting Ollama API call...
[LLMService] Ollama failed, falling back to mock: Ollama request timed out
```

---

## Files Changed

**Created**:
- `renubu/src/lib/services/LLMService.ts` - LLM service with Ollama + mock

**Modified**:
- `renubu/src/app/api/workflows/chat/threads/[threadId]/messages/route.ts` - Updated to use LLMService

**Documentation**:
- `automation/OLLAMA_INTEGRATION_COMPLETE.md` (this file)

---

## Configuration

### Recommended `.env.local` for Development

```bash
# Ollama Integration
NEXT_PUBLIC_USE_OLLAMA=false              # Start with mock, enable when ready
NEXT_PUBLIC_OLLAMA_MODEL=llama3.1:8b      # Or llama2, codellama, etc.
NEXT_PUBLIC_OLLAMA_TIMEOUT=10000          # 10 seconds
```

### Production Recommendations

```bash
# Production should use real LLM API (OpenAI, Anthropic, etc.)
NEXT_PUBLIC_USE_OLLAMA=false
# Or point to hosted Ollama instance
# NEXT_PUBLIC_OLLAMA_URL=https://ollama.yourcompany.com/api/chat
```

---

## Next Steps

### ✅ Backend Complete
- LLMService implemented
- Messages API updated
- Automatic fallback working
- Source tracking enabled

### 🔲 Frontend Tasks (Optional)
1. Add LLM mode indicator badge
2. Add toggle switch in settings
3. Test with Ollama enabled
4. Test fallback scenarios

### 🔲 Future Enhancements
1. Customer context integration (fetch from workflow_executions)
2. Streaming responses (real-time)
3. Tool calling support (charts, database queries)
4. Multiple LLM provider support (OpenAI, Anthropic, Ollama)

---

## Support

**Check Ollama Status**:
```bash
curl http://localhost:11434/api/tags
```

**Test Ollama Directly**:
```bash
curl http://localhost:11434/api/chat -d '{
  "model": "llama3.1:8b",
  "messages": [{"role": "user", "content": "Hello!"}],
  "stream": false
}'
```

**Common Issues**:
- **Ollama not running**: `ollama serve`
- **Model not found**: `ollama pull llama3.1:8b`
- **Port conflict**: Check if port 11434 is in use

---

## Questions for Frontend

**Do you need**:
1. ❓ Real-time streaming responses (vs waiting for complete response)?
2. ❓ UI toggle to switch between Ollama/mock without restart?
3. ❓ Different models for different use cases?
4. ❓ Token usage display for cost tracking?

Let me know and I can implement any of these!
