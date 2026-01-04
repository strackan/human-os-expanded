# Performance Optimization Implementation Guide

## Quick Start

Follow these steps to integrate the optimized components into your codebase.

---

## Step 1: Backup Current Files

```bash
# Create backup directory
mkdir -p backups/pre-optimization

# Backup files that will be replaced
cp lib/hooks/useAssessment.ts backups/pre-optimization/
cp app/assessment/interview/page.tsx backups/pre-optimization/
```

---

## Step 2: Replace Core Files

### Option A: Rename Optimized Files (Recommended)
```bash
# Replace useAssessment hook
mv lib/hooks/useAssessment.ts lib/hooks/useAssessment.original.ts
mv lib/hooks/useAssessment.optimized.ts lib/hooks/useAssessment.ts

# Replace interview page
mv app/assessment/interview/page.tsx app/assessment/interview/page.original.tsx
mv app/assessment/interview/page.optimized.tsx app/assessment/interview/page.tsx
```

### Option B: Manual Integration
If you want to keep both versions, update imports:
```typescript
// In page.tsx
import { useAssessment } from '@/lib/hooks/useAssessment.optimized';
```

---

## Step 3: Add Web Vitals Tracking (Optional)

Update `app/layout.tsx`:

```typescript
import { trackWebVitals } from '@/lib/utils/performance';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  trackWebVitals(metric);
}

// Add to layout component
export default function RootLayout({ children }) {
  // ... existing code ...
}

// Export for Next.js
export { reportWebVitals };
```

---

## Step 4: Test in Development

```bash
# Install dependencies (if not already installed)
npm install

# Run development server
npm run dev

# Open assessment flow
# Navigate to: http://localhost:3200/assessment/interview
```

### Testing Checklist

- [ ] Assessment starts correctly
- [ ] Typing in answer box is smooth (no lag)
- [ ] Progress bar updates correctly
- [ ] Navigation (Next/Previous) works
- [ ] Answer saves after stopping typing (500ms delay)
- [ ] Completion flow works
- [ ] Check console for performance logs

---

## Step 5: Verify Performance Improvements

### Chrome DevTools

1. Open DevTools (F12)
2. Go to Performance tab
3. Record interaction while typing an answer
4. Check for reduced re-renders (should see ~3 instead of ~20)

### React DevTools Profiler

1. Install React DevTools extension
2. Open Profiler tab
3. Start recording
4. Type an answer and click Next
5. Check component re-render count

### Console Logs

Look for performance logs:
```
[Performance] Time to first question: 245.32ms
[Performance] Answer save latency: 127.45ms
[Performance] Section transition: 42.18ms
```

---

## Step 6: Bundle Analysis (Optional)

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Create next.config.js (or update existing)
cat > next.config.js << 'EOF'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... your existing config ...
});
EOF

# Run analysis
ANALYZE=true npm run build
```

This will open an interactive bundle size visualization in your browser.

---

## Step 7: Deploy to Staging

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to staging environment
# (Your deployment process here)
```

### Staging Validation

- [ ] All assessment flows work
- [ ] Performance metrics improved
- [ ] No console errors
- [ ] Mobile responsiveness maintained
- [ ] Voice dictation works (if using)

---

## Step 8: Monitor Production Metrics

### Expected Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Time to Interactive | ~2500ms | ~800ms | <1000ms |
| DB Writes | ~50 | ~10 | <15 |
| Re-renders per Answer | ~20 | ~3 | <5 |
| Bundle Size | 340KB | 290KB | <300KB |

### Monitoring Tools

1. **Lighthouse:** `npx lighthouse https://your-site.com/assessment/interview`
2. **Web Vitals:** Browser console or analytics dashboard
3. **Database:** Monitor write operations to `cs_assessment_sessions`
4. **User feedback:** Check for any reported issues

---

## Rollback Plan

If issues occur in production:

```bash
# Quick rollback
mv lib/hooks/useAssessment.ts lib/hooks/useAssessment.optimized.ts
mv lib/hooks/useAssessment.original.ts lib/hooks/useAssessment.ts

mv app/assessment/interview/page.tsx app/assessment/interview/page.optimized.tsx
mv app/assessment/interview/page.original.tsx app/assessment/interview/page.tsx

# Rebuild and redeploy
npm run build
# Deploy...
```

---

## Troubleshooting

### Issue: "Module not found: Can't resolve '@/lib/utils/debounce'"

**Solution:** The utility files are new. Make sure they exist:
```bash
ls -la lib/utils/debounce.ts
ls -la lib/utils/performance.ts
```

### Issue: "Cannot read property 'question_id' of undefined"

**Solution:** Check that the optimized hook returns the same interface. The API hasn't changed, so this shouldn't occur.

### Issue: Voice dictation not loading

**Solution:** The MicrophoneButton is lazy loaded. Check:
1. Network tab shows it loads when clicked
2. Suspense fallback displays briefly
3. No import errors in console

### Issue: Answers not saving

**Solution:** Check debounce timing:
- Answers save 500ms after typing stops
- Check network tab for POST to `/api/assessment/[sessionId]/answer`
- Verify optimistic update shows immediately in UI

---

## Configuration Options

### Adjust Debounce Timing

In `lib/hooks/useAssessment.optimized.ts`:
```typescript
// Change from 500ms to 1000ms (1 second)
const debouncedSaveAnswer = useMemo(
  () => debounce(async (questionId, answer) => {
    // ...
  }, 1000), // <-- Change this value
  [sessionId]
);
```

### Adjust Retry Logic

```typescript
// In useAssessment.optimized.ts
const MAX_RETRIES = 3;    // Change to 5 for more retries
const BASE_DELAY = 1000;  // Change to 2000 for longer delays
```

### Disable Performance Tracking

```typescript
// In useAssessment.optimized.ts
// Comment out performance tracking lines:
// performanceTracker.current.markAnswerSaveStart();
// performanceTracker.current.markAnswerSaveEnd();
```

---

## Integration with Existing Features

### SWR Configuration

If you want to use SWR for API calls:

```typescript
import useSWR from 'swr';
import { assessmentSwrConfig, fetcher, cacheKeys } from '@/lib/api/swr-config';

function MyComponent() {
  const { data, error } = useSWR(
    cacheKeys.assessmentStatus(),
    fetcher,
    assessmentSwrConfig
  );
}
```

### Performance Tracking in Other Pages

```typescript
import { getPerformanceTracker } from '@/lib/utils/performance';

function ResultsPage() {
  const tracker = getPerformanceTracker();

  useEffect(() => {
    tracker.markFirstQuestionShown();
  }, []);
}
```

---

## Future Enhancements

### Phase 1.1 Recommendations

1. **Add Web Vitals Dashboard**
   - Create admin page showing performance metrics
   - Graph improvements over time

2. **Implement Service Worker**
   - Offline assessment capability
   - Cache API responses

3. **Add Intersection Observer**
   - Lazy load sections as user scrolls
   - Prefetch next section

4. **Optimize Images**
   - Use WebP for badge icons
   - Lazy load result visualizations

### Phase 2 Preparation

1. **Context API Migration**
   - When adding multi-page flow
   - Reduces prop drilling

2. **Virtual Scrolling**
   - For Lightning Round questions
   - Handles 100+ questions efficiently

3. **Advanced Caching**
   - Service worker with Cache API
   - Persist assessment progress

---

## Support

### Getting Help

- **Performance Issues:** Check browser console for errors
- **Integration Issues:** Review this guide and the main report
- **Questions:** Contact Agent 3 or create GitHub issue

### Additional Resources

- [Performance Optimization Report](./PERFORMANCE-OPTIMIZATION-REPORT.md)
- [React Performance Docs](https://react.dev/learn/render-and-commit)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)

---

## Success Criteria

You'll know the optimization is successful when:

✅ Typing feels instant (no lag)
✅ Console shows performance logs
✅ Lighthouse score > 90
✅ Time to Interactive < 1000ms
✅ No increase in error rate
✅ User feedback is positive

---

**Last Updated:** November 15, 2025
**Status:** Ready for production
**Next Review:** After Phase 2 planning
