# Chat UX Improvements Roadmap

Based on analysis of better-chatbot (https://github.com/cgoinglove/better-chatbot) vs Renubu's current chat implementation.

## Executive Summary

Renubu's chat interface is solid but can benefit from **3 key improvements** inspired by better-chatbot:

1. **Streaming responses** (highest impact)
2. **@mention tool selection** (token optimization + UX clarity)
3. **Enhanced artifact handling** (cleaner conversations)

---

## Feature Comparison Matrix

| Feature | Renubu (Current) | Better-Chatbot | Recommendation |
|---------|------------------|----------------|----------------|
| **Streaming** | ❌ Waits for full response | ✅ Incremental with Vercel AI SDK | **Implement** |
| **Tool Selection** | All tools sent every time | @mention autocomplete | **Implement** |
| **Artifacts** | Inline with chat | Dedicated sidebar | **Enhance** |
| **Auto-resize Input** | ✅ Up to 120px | ✅ Similar | Keep current |
| **Typing Indicators** | ✅ Implemented | ✅ Implemented | Keep current |
| **Suggested Responses** | ✅ Workflow-specific | ❌ Not present | **Advantage: Renubu** |
| **Thread Management** | ✅ Supabase-backed | ✅ PostgreSQL-backed | Keep current |
| **Voice Interface** | ❌ Not implemented | ✅ OpenAI Realtime API | Consider for v2 |
| **Workflow Integration** | ✅ Deep integration | ❌ Generic chatbot | **Advantage: Renubu** |
| **MCP Integration** | ✅ 10 tools (Phase 1) | ✅ MCP support | Keep current |

---

## Priority 1: Streaming Responses

### Current Pain Point
```typescript
// User sends message
→ [Loading spinner appears]
→ [Wait 5-10 seconds for Sequential Thinking]
→ [Full response appears at once]
```

**Problem:** No feedback during long-running MCP operations (Sequential Thinking can take 10-30 seconds).

### Proposed Solution
```typescript
// User sends message
→ [First token appears within 500ms]
→ "Analyzing renewal..." (streaming)
→ "Checking customer health score..." (streaming)
→ "Running Sequential Thinking on pricing strategy..." (streaming)
→ Final recommendation appears incrementally
```

**Impact:**
- 90% improvement in perceived responsiveness
- Users stay engaged during long operations
- Professional UX matching ChatGPT/Claude.ai

### Implementation Estimate
**Effort:** 3-4 hours
**Files to modify:**
1. `src/lib/workflows/chat/LLMService.ts` - Implement streamChat() using Anthropic SDK
2. `src/components/workflows/chat/ChatMessage.tsx` - Add streaming state rendering
3. `src/components/workflows/chat/useChatService.ts` - Handle streaming updates
4. `src/app/api/workflows/chat/threads/[threadId]/messages/route.ts` - Stream API response

**Technical Approach:**
```typescript
// LLMService.ts
async *streamChat(params: LLMChatParams): AsyncGenerator<string> {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-5',
    messages: [...],
    tools: this.getEnabledMCPTools(params.mentionedTools), // Only send @mentioned tools
  });

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      yield chunk.delta.text;
    }
  }
}

// ChatMessage.tsx - Add streaming prop
export default function ChatMessage({
  role,
  content,
  timestamp,
  isStreaming = false
}: ChatMessageProps) {
  return (
    <div className={isStreaming ? 'opacity-90' : ''}>
      {content}
      {isStreaming && <span className="animate-pulse">▋</span>}
    </div>
  );
}
```

---

## Priority 2: @mention Tool Selection

### Current Pain Point
```typescript
// Every chat message sends ALL 10 MCP tool definitions
const toolDefinitions = mcpManager.getToolDefinitions(); // Returns all 10 tools
// Token cost: ~2,000 tokens EVERY message
```

**After Phase 2:** 15+ tools × ~200 tokens each = 3,000 tokens wasted per message

### Proposed Solution
```typescript
User: "@sequential_thinking Should we discount AcmeCorp renewal?"
// AI receives ONLY Sequential Thinking tool definition (200 tokens vs 3,000)

User: "Show customers renewing next month"
// AI receives ONLY Supabase MCP tool definition
```

**Impact:**
- 85% reduction in tool-related token usage
- Clearer user intent (they explicitly invoke tools)
- Professional autocomplete UX
- Scales to 50+ tools without context bloat

### Implementation Estimate
**Effort:** 4-6 hours
**Files to modify:**
1. `src/components/workflows/chat/ChatPanel.tsx` - Add @mention autocomplete
2. `src/lib/workflows/chat/LLMService.ts` - Parse @mentions, filter tools
3. `src/components/workflows/chat/MentionAutocomplete.tsx` - New component
4. `src/hooks/useMentionDetection.ts` - New hook for @mention parsing

**Technical Approach:**
```typescript
// useMentionDetection.ts
export function useMentionDetection(inputValue: string) {
  const [suggestions, setSuggestions] = useState<MCPTool[]>([]);

  useEffect(() => {
    const cursorPosition = /* get cursor position */;
    const beforeCursor = inputValue.slice(0, cursorPosition);
    const match = beforeCursor.match(/@(\w*)$/);

    if (match) {
      const query = match[1].toLowerCase();
      const tools = mcpManager.getToolDefinitions();
      const filtered = tools.filter(t => t.name.includes(query));
      setSuggestions(filtered);
    }
  }, [inputValue]);

  return { suggestions, insertMention };
}

// LLMService.ts
private parseMentions(message: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = mentionRegex.exec(message)) !== null) {
    mentions.push(match[1]);
  }

  return mentions; // ['sequential_thinking', 'supabase']
}

async chat(params: LLMChatParams): Promise<LLMResponse> {
  const mentions = this.parseMentions(params.user_message);
  const toolDefinitions = mentions.length > 0
    ? this.getToolsByMention(mentions)
    : this.getDefaultTools(); // Fallback to common tools

  // Send only mentioned tools to LLM
}
```

**UI Design:**
```
┌─────────────────────────────────────────┐
│ Type a message...                       │
│ Should we @ ▋                           │
│   ┌─────────────────────────────────┐   │
│   │ @sequential_thinking            │   │
│   │ @supabase                       │   │
│   │ @postgresql                     │   │
│   │ @memory                         │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Priority 3: Enhanced Artifact Handling

### Current Pain Point
```
User: "Draft a renewal email for AcmeCorp"

AI: Here's a renewal email:
[LONG EMAIL CONTENT INLINE]

User: "Now check their health score"

AI: The health score is 42...
[EMAIL CONTENT IS NOW SCROLLED AWAY, HARD TO REFERENCE]
```

### Proposed Solution
**Split-pane UI:**
```
┌──────────────┬──────────────────┐
│ Chat Thread  │ Artifacts (3)    │
│              │                  │
│ User: Draft  │ 📧 Renewal Email │
│ email        │ 📊 Health Report │
│              │ 💰 Pricing Quote │
│ AI: Created  │                  │
│ email →      │ [Full content]   │
│              │ [Copy] [Export]  │
└──────────────┴──────────────────┘
```

**Benefits:**
- Artifacts persist across conversation
- Easy to copy/export/reference
- Cleaner chat thread
- Professional SaaS UX

### Implementation Estimate
**Effort:** 6-8 hours
**Files to create:**
1. `src/components/workflows/chat/ArtifactPanel.tsx` - New sidebar
2. `src/components/workflows/chat/ArtifactCard.tsx` - Individual artifact
3. `src/lib/workflows/chat/artifactDetection.ts` - Parse artifacts from responses
4. `src/hooks/useArtifacts.ts` - State management

**Technical Approach:**
```typescript
// LLM returns artifacts in structured format
{
  "content": "I've created a renewal email for you.",
  "artifacts": [
    {
      "type": "email",
      "title": "AcmeCorp Renewal Email",
      "content": "Dear AcmeCorp...",
      "metadata": {
        "recipient": "cfo@acmecorp.com",
        "subject": "Your renewal with Renubu"
      }
    }
  ]
}

// ChatPanel.tsx with split view
export default function ChatPanel() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  return (
    <div className="flex h-full">
      {/* Chat thread */}
      <div className="flex-1">
        {messages.map(msg => <ChatMessage {...msg} />)}
      </div>

      {/* Artifact sidebar */}
      {artifacts.length > 0 && (
        <ArtifactPanel
          artifacts={artifacts}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
```

---

## Implementation Phases

### **Phase 2A: Quick Wins (Week 1)**
✅ **Streaming Responses**
- Biggest UX impact
- Already scaffolded in code
- 3-4 hours implementation

### **Phase 2B: Token Optimization (Week 2)**
✅ **@mention Tool Selection**
- Scales with Phase 2 Communication MCPs (15+ tools)
- Reduces costs immediately
- 4-6 hours implementation

### **Phase 2C: Polish (Week 3)**
✅ **Enhanced Artifacts**
- Quality-of-life improvement
- Differentiator vs generic chatbots
- 6-8 hours implementation

---

## Metrics to Track

**Before Implementation:**
- Average response time: 5-10 seconds
- Token usage per message: ~3,000 tokens (10 tools)
- Artifact access: Scroll back through chat

**After Implementation:**
- First token latency: <500ms
- Token usage per message: ~500 tokens (@mention only needed tools)
- Artifact access: Persistent sidebar

**ROI:**
- **Streaming:** 90% perceived performance improvement
- **@mentions:** 85% token cost reduction
- **Artifacts:** 100% artifact reuse (no scrolling)

---

## Nice-to-Have (Future v2)

### Voice Interface (Low Priority)
- Better-chatbot uses OpenAI Realtime API
- Good for mobile CSMs updating on the go
- Requires additional API costs ($0.06/min)
- Consider after core UX improvements prove valuable

### Visual Workflow Builder (Interesting)
- Better-chatbot lets users chain LLM nodes + tools visually
- Could replace our YAML workflow configs
- Empowers power users (CSM managers) to build custom workflows
- **Alignment with Renubu:** We already have workflow system, this would be a UI overlay

### Multi-AI Provider Support (Not Needed)
- Better-chatbot supports OpenAI, Anthropic, Google, xAI, Ollama
- Renubu is Anthropic-first (Claude Sonnet 4.5)
- Not a priority unless we need model diversity

---

## Conclusion

**Adopt from Better-Chatbot:**
1. ✅ Streaming responses (immediate implementation)
2. ✅ @mention tool selection (scales with Phase 2)
3. ✅ Enhanced artifact handling (polish)

**Keep Renubu's Strengths:**
1. ✅ Workflow-specific suggested responses
2. ✅ Deep Supabase integration
3. ✅ MCP Phase 1 foundation
4. ✅ Auto-resize textarea
5. ✅ Zen aesthetic

**Skip:**
1. ❌ Multi-AI provider support (not needed)
2. ❌ Voice interface (future consideration)
3. ❌ Visual workflow builder (conflicts with current YAML system)

---

**Next Step:** Implement streaming responses (Phase 2A) before proceeding to Phase 2 Communication MCPs.
