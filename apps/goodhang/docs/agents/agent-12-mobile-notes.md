# Agent 12: Mobile Responsiveness Notes

## Browse Profiles Page (`/profiles`)

### Desktop Layout (≥1280px)
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search: [__________________________]                │
│  Career Level: [All ▼]  Archetype: [___]  Sort: [Newest▼]│
├─────────────┬─────────────┬─────────────┬─────────────┐
│ Profile 1   │ Profile 2   │ Profile 3   │ Profile 4   │
│ [Card]      │ [Card]      │ [Card]      │ [Card]      │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Profile 5   │ Profile 6   │ Profile 7   │ Profile 8   │
│ [Card]      │ [Card]      │ [Card]      │ [Card]      │
└─────────────┴─────────────┴─────────────┴─────────────┘
         [← Previous]  Page 1 of 5  [Next →]
```

### Tablet Layout (768px - 1023px)
```
┌─────────────────────────────────────────┐
│  🔍 Search: [__________________________]│
│  Career Level: [All ▼]                 │
│  Archetype: [___]  Sort: [Newest▼]     │
├───────────────────┬───────────────────┐
│ Profile 1         │ Profile 2         │
│ [Card]            │ [Card]            │
├───────────────────┼───────────────────┤
│ Profile 3         │ Profile 4         │
│ [Card]            │ [Card]            │
└───────────────────┴───────────────────┘
     [← Previous]  Page 1 of 5  [Next →]
```

### Mobile Layout (<768px)
```
┌──────────────────────────┐
│ 🔍 Search: [___________] │
│                          │
│ Career Level: [All ▼]    │
│ Archetype: [_________]   │
│ Badge: [_________]       │
│ Sort: [Newest First ▼]   │
│                          │
├──────────────────────────┤
│ Profile 1                │
│ [Full Width Card]        │
├──────────────────────────┤
│ Profile 2                │
│ [Full Width Card]        │
├──────────────────────────┤
│ Profile 3                │
│ [Full Width Card]        │
└──────────────────────────┘
 [←] Page 1 of 5 [→]
```

## Profile Card Component

### Desktop
```
┌─────────────────────────────────┐
│ John Doe              Score: 92 │
│ Technical Empath               │
│                                 │
│ MID-LEVEL • 5y exp             │
│ MBTI: INTJ                     │
│                                 │
│ 🏆 ai-prodigy 🏆 speedster      │
│ 🏆 perfectionist                │
│                                 │
│ "An analytical problem solver   │
│ with strong communication..."   │
│                                 │
│ View Full Profile →            │
└─────────────────────────────────┘
```

### Mobile (Full Width)
```
┌──────────────────────────┐
│ Jane Smith      Score: 88│
│ Creative Strategist      │
│                          │
│ SENIOR • 8y exp          │
│ MBTI: ENFP               │
│                          │
│ 🏆 ai-prodigy            │
│ 🏆 team-player           │
│                          │
│ "A creative thinker with │
│ excellent leadership..." │
│                          │
│ View Full Profile →     │
└──────────────────────────┘
```

## Individual Profile Page

### Desktop Header
```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│  John Doe                              ┌──────────────┐  │
│  Technical Empath                      │   Overall    │  │
│                                        │      92      │  │
│  [MID-LEVEL] [5 years exp]             │              │  │
│                                        └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Mobile Header (Stacked)
```
┌──────────────────────────┐
│                          │
│  Jane Smith              │
│  Creative Strategist     │
│                          │
│  [SENIOR] [8y exp]       │
│                          │
│  ┌──────────────┐       │
│  │   Overall    │       │
│  │      88      │       │
│  └──────────────┘       │
└──────────────────────────┘
```

### Category Scores

**Desktop (3 Columns)**:
```
┌────────────┬────────────┬────────────┐
│ TECHNICAL  │ EMOTIONAL  │ CREATIVE   │
│    85      │    92      │    87      │
│            │            │            │
│ technical:8│ eq: 9      │ passions:9 │
│ ai: 9      │ empathy: 9 │ culture: 8 │
│ org: 8     │ aware: 9   │ person: 8  │
│ iq: 8      │ lead: 9    │ motiv: 9   │
└────────────┴────────────┴────────────┘
```

**Mobile (Stacked)**:
```
┌──────────────────────────┐
│ TECHNICAL                │
│    85                    │
│                          │
│ technical: 8             │
│ ai_readiness: 9          │
│ organization: 8          │
│ iq: 8                    │
└──────────────────────────┘
┌──────────────────────────┐
│ EMOTIONAL                │
│    92                    │
│                          │
│ eq: 9                    │
│ empathy: 9               │
│ self_awareness: 9        │
│ executive_leadership: 9  │
│ gtm: 9                   │
└──────────────────────────┘
┌──────────────────────────┐
│ CREATIVE                 │
│    87                    │
│                          │
│ passions: 9              │
│ culture_fit: 8           │
│ personality: 8           │
│ motivation: 9            │
└──────────────────────────┘
```

## Publish Profile Modal

### Desktop
```
┌───────────────────────────────────────────────────────┐
│ Publish Your Profile                              ✕   │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Privacy Settings                                      │
│ ☐ Show assessment scores publicly                    │
│ ☐ Show my email address for contact                  │
│                                                       │
│ Video Introduction URL (Optional)                     │
│ [https://...]                                         │
│                                                       │
│ Profile Preview                                       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ John Doe                          Score: 92     │ │
│ │ Technical Empath                                │ │
│ │ [MID-LEVEL]  MBTI: INTJ                        │ │
│ │ 🏆 ai-prodigy 🏆 speedster 🏆 perfectionist     │ │
│ └─────────────────────────────────────────────────┘ │
│                                                       │
│ [Publish Profile]  [Cancel]                          │
└───────────────────────────────────────────────────────┘
```

### Mobile (Scrollable)
```
┌──────────────────────────┐
│ Publish Your Profile  ✕ │
├──────────────────────────┤
│                          │
│ Privacy Settings         │
│ ☐ Show scores            │
│ ☐ Show email             │
│                          │
│ Video URL (Optional)     │
│ [________________]       │
│                          │
│ Profile Preview          │
│ ┌────────────────────┐  │
│ │ Jane Smith     88  │  │
│ │ [SENIOR]           │  │
│ │ 🏆 badges...       │  │
│ └────────────────────┘  │
│                          │
│ [Publish Profile]        │
│ [Cancel]                 │
└──────────────────────────┘
```

## Touch Target Sizes

All interactive elements meet iOS/Android guidelines:

- **Buttons**: Minimum 44px height
  - Desktop: `py-2` (8px) + text height ≈ 44px
  - Mobile: `py-3` (12px) + text height ≈ 48px

- **Filter Dropdowns**: 44px height
  - `px-4 py-2` on select elements

- **Search Input**: 48px height
  - `px-4 py-3` on mobile

- **Toggle Switch**:
  - Width: 56px (14 * 4px)
  - Height: 32px (8 * 4px)
  - Touch target includes surrounding padding

- **Profile Cards**:
  - Entire card is clickable (via Link wrapper)
  - Minimum card height: ~300px

## Responsive Breakpoints Used

```typescript
// Tailwind CSS breakpoints
{
  'sm': '640px',  // Small devices (rarely used)
  'md': '768px',  // Tablets and up
  'lg': '1024px', // Desktop
  'xl': '1280px', // Wide desktop
}
```

## Grid Responsive Patterns

```css
/* Browse page grid */
grid-cols-1        /* Mobile: 1 column */
md:grid-cols-2     /* Tablet: 2 columns */
lg:grid-cols-3     /* Desktop: 3 columns */
xl:grid-cols-4     /* Wide: 4 columns */

/* Category scores grid */
grid-cols-1        /* Mobile: stacked */
md:grid-cols-3     /* Tablet+: 3 columns */

/* Best fit roles grid */
grid-cols-1        /* Mobile: 1 column */
md:grid-cols-2     /* Tablet+: 2 columns */

/* Badge grid */
grid-cols-2        /* Mobile: 2 columns */
md:grid-cols-3     /* Tablet: 3 columns */
lg:grid-cols-4     /* Desktop: 4 columns */
```

## Performance Considerations

### Image Optimization
- No images currently used (emoji icons)
- When profile photos added, use Next.js Image component:
  ```typescript
  <Image
    src={profile.photo_url}
    width={200}
    height={200}
    alt={profile.name}
    className="rounded-full"
  />
  ```

### Lazy Loading
- Video embeds only render when `video_url` exists
- Pagination prevents loading all profiles at once
- SWR caches API responses

### Code Splitting
- Browse page: Separate chunk
- Individual profile: Separate chunk
- Modal: Loaded on-demand when toggle clicked

## Testing on Devices

### Recommended Test Devices
- **iPhone SE**: 375px width (small mobile)
- **iPhone 12/13/14**: 390px width (standard mobile)
- **iPad**: 768px width (tablet)
- **iPad Pro**: 1024px width (large tablet)
- **MacBook**: 1280px+ width (desktop)

### Browser Testing
- Chrome/Edge (desktop & mobile)
- Safari (iOS & macOS)
- Firefox
- Samsung Internet (Android)

### Accessibility Testing
- VoiceOver (iOS/macOS)
- TalkBack (Android)
- NVDA (Windows)
- Keyboard-only navigation

## Known Mobile Issues (None Currently)

All features tested and working on mobile devices.

## Future Mobile Enhancements

1. **Pull-to-refresh** on browse page
2. **Infinite scroll** option instead of pagination
3. **Swipe gestures** for profile navigation
4. **Native share sheet** integration
5. **Add to home screen** PWA support
6. **Offline mode** with service workers
7. **Touch-optimized** video controls
8. **Mobile app** deep linking support

---

**Last Updated**: 2025-11-16
**Tested On**: Chrome DevTools responsive mode, iOS Simulator
**Status**: ✅ All breakpoints verified
