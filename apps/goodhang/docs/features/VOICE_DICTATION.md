# Voice Dictation Feature

**Status:** ✅ Implemented
**Release:** 0.1.8
**Date:** 2025-11-15

## Overview

Voice dictation allows users to answer CS Assessment questions using speech instead of typing. The system uses a hybrid approach with automatic fallback for maximum compatibility.

## Architecture

### Dual-Mode Implementation

```
Browser Check
     ↓
Has Web Speech API?
     ├─ YES → Use Web Speech API (FREE, 90% of browsers)
     └─ NO  → Use OpenAI Whisper API (PAID, unsupported browsers)
```

### Mode 1: Web Speech API (Default)

**Supported Browsers:**
- Chrome 25+ ✅
- Edge 79+ ✅
- Safari 14.1+ ✅
- Opera 27+ ✅

**Features:**
- Real-time transcription
- Interim results (shows what you're saying as you speak)
- Continuous mode (keeps listening)
- 100+ languages supported
- **Cost: $0** (uses Google's speech recognition)

**Accuracy:** 85-95%

### Mode 2: OpenAI Whisper (Fallback)

**Used For:**
- Firefox (no Web Speech API support)
- Older browsers
- When Web Speech API fails

**Features:**
- Industry-leading accuracy (95-99%)
- Better with accents, jargon, technical terms
- Punctuation and capitalization

**Cost:** $0.006 per minute (~$0.36/hour)

---

## User Experience

### How It Works

1. **Microphone Button:**
   - Located in bottom-right corner of answer textarea
   - Purple icon when ready
   - Red pulsing animation when recording

2. **Visual Feedback:**
   - Interim transcript appears in popup above button
   - Shows what's being heard in real-time
   - Auto-appends to textarea when final

3. **Browser Support Message:**
   - Yellow warning if browser doesn't support dictation
   - User can still type manually

4. **Error Handling:**
   - Red error message if microphone permission denied
   - Graceful fallback to typing

---

## Technical Implementation

### Files Created

**Hook:** `lib/hooks/useSpeechToText.ts`
```typescript
const { isListening, transcript, startListening, stopListening } = useSpeechToText();
```

**Component:** `components/assessment/MicrophoneButton.tsx`
```tsx
<MicrophoneButton
  value={currentAnswer}
  onChange={setCurrentAnswer}
  disabled={isLoading}
/>
```

**API Route:** `app/api/speech-to-text/route.ts`
- Whisper API fallback endpoint
- Accepts audio file (multipart/form-data)
- Returns transcribed text

**Integration:** `app/assessment/interview/page.tsx`
- Microphone button added to all answer textareas
- Positioned absolutely in bottom-right
- Disabled during loading states

---

## Browser Permissions

### First Use

When user clicks microphone for first time:
1. Browser prompts for microphone permission
2. User must click "Allow"
3. Permission persists for future visits

### Permission Denied

If user denies permission:
- Error message displays
- Feature gracefully disables
- User can still type answers

---

## Cost Analysis

### Current Setup (Web Speech Only)

**Cost:** $0/month for all browsers that support it

**Coverage:**
- Chrome/Edge: ~70% of users → $0
- Safari: ~15% of users → $0
- **Total: 85% of users at $0 cost**

### With Whisper Fallback

**Scenario:** 1,000 assessments/month

**Usage Estimate:**
- 26 questions per assessment
- ~2 minutes per question (average)
- = 52 minutes per assessment

**Firefox Users (15%):**
- 150 assessments × 52 min = 7,800 minutes
- 7,800 min × $0.006 = **$46.80/month**

**Recommendation:** Enable Whisper only if Firefox/older browser support is critical.

---

## Environment Configuration

### Required (Already Set)
```env
# None - Web Speech API is built into browsers
```

### Optional (For Whisper Fallback)
```env
OPENAI_API_KEY=sk-...
```

Get API key from: https://platform.openai.com/api-keys

---

## Usage Instructions

### For Users

1. Navigate to assessment question
2. Click microphone icon in bottom-right of answer box
3. When icon turns red and pulses, start speaking
4. Speak clearly and naturally
5. See your words appear in real-time
6. Click microphone again to stop
7. Edit text if needed before submitting

### Tips for Best Results

- Speak clearly but naturally
- Pause briefly between sentences
- Mention punctuation if needed ("period", "comma")
- Use in quiet environment
- Grant microphone permission when prompted

---

## Testing Checklist

### Web Speech API Mode

- [x] Microphone button appears in textarea
- [x] Button styled correctly (purple default, red when active)
- [x] Click starts recording (browser permission prompt)
- [x] Interim transcript shows above button
- [x] Final transcript appends to textarea
- [x] Click stops recording
- [x] Works on Chrome/Edge/Safari
- [x] Error handling for permission denied
- [x] Error handling for unsupported browser

### Whisper Fallback Mode

- [ ] Test in Firefox (after adding OPENAI_API_KEY)
- [ ] Verify API call to `/api/speech-to-text`
- [ ] Verify audio recording starts/stops
- [ ] Verify transcription accuracy
- [ ] Verify cost tracking

### Integration

- [x] Works during assessment interview
- [x] Disabled during loading states
- [x] Preserves existing text when appending
- [x] Respects character limits (if any)
- [x] Mobile responsive

---

## Troubleshooting

### "Voice dictation not supported in this browser"

**Cause:** Browser doesn't support Web Speech API
**Solution:**
1. Use Chrome, Edge, or Safari
2. Or enable Whisper fallback (requires OPENAI_API_KEY)

### "Microphone permission denied"

**Cause:** User clicked "Block" on permission prompt
**Solution:**
1. Click lock icon in browser address bar
2. Change microphone permission to "Allow"
3. Refresh page

### "Speech recognition error: no-speech"

**Cause:** No audio detected
**Solution:**
1. Check microphone is plugged in
2. Check microphone not muted
3. Try speaking louder
4. Check browser has microphone permission

### No transcription appearing

**Cause:** Various
**Debug Steps:**
1. Check browser console for errors
2. Verify microphone working in other apps
3. Try in incognito mode (to rule out extensions)
4. Clear browser cache and reload

---

## Future Enhancements

### v1.1 (Planned)
- [ ] Language selection (Spanish, French, etc.)
- [ ] Custom wake word ("Hey GoodHang")
- [ ] Offline mode (on-device transcription)
- [ ] Audio playback review before submit

### v1.2 (Ideas)
- [ ] Speaker diarization (multi-person detection)
- [ ] Sentiment analysis during dictation
- [ ] Automatic summary generation
- [ ] Voice commands ("delete that", "start over")

---

## Performance Metrics

### Web Speech API
- **Latency:** < 100ms (real-time)
- **Accuracy:** 85-95%
- **Battery Impact:** Low
- **Network:** Required (Google's servers)

### Whisper API
- **Latency:** 1-5 seconds
- **Accuracy:** 95-99%
- **Cost:** $0.006/minute
- **Network:** Required (OpenAI's servers)

---

## Privacy Considerations

### Web Speech API
- Audio sent to Google's servers for processing
- No audio stored by GoodHang
- Subject to Google's privacy policy

### Whisper API
- Audio sent to OpenAI's servers for processing
- OpenAI retains data for 30 days (as of 2024)
- Subject to OpenAI's privacy policy

### Recommendation
Add privacy disclosure:
> "Voice dictation uses third-party services (Google or OpenAI) to transcribe your speech. Audio is processed securely and not stored by GoodHang."

---

## Code Examples

### Basic Usage
```typescript
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';

function MyComponent() {
  const { isListening, transcript, startListening, stopListening } = useSpeechToText({
    continuous: true,
    interimResults: true,
    language: 'en-US',
  });

  return (
    <button onClick={isListening ? stopListening : startListening}>
      {isListening ? 'Stop' : 'Start'} Dictation
    </button>
  );
}
```

### With Callbacks
```typescript
const { transcript } = useSpeechToText({
  onTranscriptChange: (text) => console.log('New transcript:', text),
  onError: (error) => console.error('Dictation error:', error),
});
```

---

## Support

For issues or questions:
1. Check browser compatibility
2. Verify microphone permissions
3. Review console errors
4. Contact support with error details

---

**Last Updated:** 2025-11-15
**Maintained By:** Claude Code
**Status:** Production Ready (Web Speech), Optional (Whisper)
