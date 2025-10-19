# Spa Aesthetic Design Guide

**Calm, Minimal, Professional UI Patterns for Workflow Artifacts**
**Version:** 1.0
**Last Updated:** October 2025

---

## Philosophy

The Spa Aesthetic creates a **calm, professional experience** that emphasizes information over decoration. Like a spa environment, it reduces stress through:

- **Minimal visual noise** (no gradients, bright colors, or large emojis)
- **Cool, muted palette** (grays and subtle blues)
- **Maximum information density** (more content, less chrome)
- **Subtle iconography** (small, gray-toned icons)
- **Consistent spacing** (predictable rhythm)

**Goal:** Users should focus on the task, not the UI.

---

## When to Use This Aesthetic

### ✅ Use for:
- Strategic workflow artifacts
- Data-heavy interfaces (tables, forms, reports)
- Professional/enterprise contexts
- Long-form content (reading-intensive)
- Interfaces requiring focus and concentration

### ❌ Don't Use for:
- Marketing pages (need visual impact)
- Celebration moments (use color/animation)
- Alerts/warnings (need attention-grabbing)
- Customer-facing public pages
- Onboarding (need friendly, colorful)

**Rule of Thumb:** If the user needs to **think deeply**, use Spa Aesthetic. If they need **motivation or excitement**, use something else.

---

## Color Palette

### Primary Colors

```css
/* Grays - The Foundation */
--gray-50:  #f9fafb;  /* Subtle backgrounds */
--gray-100: #f3f4f6;  /* Card backgrounds */
--gray-200: #e5e7eb;  /* Borders */
--gray-300: #d1d5db;  /* Dividers */
--gray-400: #9ca3af;  /* Icons, subtle text */
--gray-500: #6b7280;  /* Secondary text */
--gray-600: #4b5563;  /* Placeholder text */
--gray-700: #374151;  /* Body text */
--gray-900: #111827;  /* Headers, emphasis */

/* Blues - For Actions & Highlights */
--blue-50:  #eff6ff;  /* AI task backgrounds */
--blue-100: #dbeafe;  /* Hover states */
--blue-500: #3b82f6;  /* Icons, active states */
--blue-600: #2563eb;  /* Primary buttons */
--blue-700: #1d4ed8;  /* Button hover */

/* Greens - For Success (Minimal Use) */
--green-500: #22c55e;  /* Checkmarks only */
--green-600: #16a34a;  /* Success buttons (rare) */

/* Reds/Oranges - For Warnings (Minimal Use) */
--orange-500: #f97316; /* Alert icons only */
--red-600:    #dc2626; /* Error states only */
```

### Color Usage Rules

**Headers:**
- Title text: `text-gray-900` (almost black)
- Subtitle text: `text-gray-500` or `text-gray-600`
- Never use colored backgrounds in headers (except subtle borders)

**Icons:**
- Default: `text-gray-400` (most common)
- Active/interactive: `text-blue-500`
- Success: `text-green-500`
- Warning: `text-orange-500`
- Never use large (> 24px) or bright icons

**Backgrounds:**
- Cards: `bg-white` or `bg-gray-50`
- Sections: `bg-gray-50` or `bg-gray-100`
- AI tasks: `bg-blue-50/50` (50% opacity for subtlety)
- Never use gradients (`bg-gradient-to-r`)

**Borders:**
- Standard: `border-gray-100` or `border-gray-200`
- Accent (left/top only): `border-blue-200` or `border-green-200`
- Never use thick borders (max 2px)

---

## Typography

### Font Sizes

```css
/* Use Sparingly - Prioritize sm/base */
text-xs:   0.75rem  (12px)  /* Labels, captions, metadata */
text-sm:   0.875rem (14px)  /* Body text, descriptions */
text-base: 1rem     (16px)  /* Default, titles */
text-lg:   1.125rem (18px)  /* Rare - only for emphasis */
text-xl:   1.25rem  (20px)  /* Avoid - too large */
text-2xl:  1.5rem   (24px)  /* Never use in artifacts */
```

### Font Weights

```css
font-normal:  400  /* Default body text */
font-medium:  500  /* Section headers, labels */
font-semibold: 600 /* Rare - main page titles only */
font-bold:    700  /* Never use in artifacts */
```

### Usage Examples

**Before (Too Bold, Too Large):**
```tsx
<h2 className="text-2xl font-bold text-gray-900">
  Strategic Account Plan
</h2>
<p className="text-lg text-gray-600">
  Based on the information you've provided...
</p>
```

**After (Spa Aesthetic):**
```tsx
<h2 className="text-base font-medium text-gray-900">
  Strategic Account Plan
</h2>
<p className="text-sm text-gray-500">
  Based on the information you've provided...
</p>
```

**Result:** 33% smaller, 2 weight levels lighter, but still readable.

---

## Spacing

### Padding Standards

```css
/* Artifact Sections */
px-8 py-6  /* Content areas (most common) */
px-8 py-4  /* Headers/footers (more compact) */
px-8 py-3  /* Dense sections (rare) */

/* Cards */
p-4        /* Standard card padding */
p-3        /* Compact card padding */
p-2        /* Very compact (rare) */

/* Buttons */
px-6 py-3  /* Primary action buttons */
px-4 py-2  /* Secondary buttons */
```

### Margin/Gap Standards

```css
/* Section Spacing */
space-y-6  /* Between major sections */
space-y-4  /* Between related items */
space-y-3  /* Between cards in list */
space-y-2  /* Between list items */
space-y-1  /* Between labels and values */

/* Horizontal Spacing */
gap-6      /* Between columns */
gap-4      /* Between related elements */
gap-3      /* Between icons and text */
gap-2      /* Between small elements */
```

### Layout Pattern

```tsx
<div className="bg-white h-full flex flex-col">
  {/* Header - Fixed */}
  <div className="px-8 py-4 border-b border-gray-100">
    <h2 className="text-base font-medium text-gray-900">Title</h2>
    <p className="text-sm text-gray-500 mt-1">Subtitle</p>
  </div>

  {/* Content - Scrollable */}
  <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
    {/* Content sections */}
  </div>

  {/* Footer - Fixed */}
  <div className="px-8 py-4 border-t border-gray-100 flex gap-3">
    {/* Action buttons */}
  </div>
</div>
```

**Key Pattern:**
- Headers/footers use `py-4` (more compact)
- Content areas use `py-6` (more breathing room)
- Always use `px-8` horizontally (consistent)

---

## Iconography

### Icon Sizes

```css
/* Default - Most Common */
w-4 h-4  (16px)  /* Section headers, inline icons */

/* Smaller - Rare */
w-3 h-3  (12px)  /* Metadata, labels */

/* Larger - Very Rare */
w-5 h-5  (20px)  /* Only for primary actions */

/* Never Use */
w-8+     (32px+) /* Too large, conflicts with calm aesthetic */
```

### Icon Colors

```tsx
// Default (most common)
<Icon className="w-4 h-4 text-gray-400" />

// Active/Interactive
<Icon className="w-4 h-4 text-blue-500" />

// Status Icons
<CheckCircle className="w-4 h-4 text-green-500" />  // Success
<AlertTriangle className="w-4 h-4 text-orange-500" /> // Warning

// Never use emojis in place of icons
// ❌ <span className="text-4xl">🎯</span>
// ✅ <Target className="w-4 h-4 text-gray-400" />
```

### Icon Placement

**In Headers:**
```tsx
<div className="flex items-center gap-2">
  <Calendar className="w-4 h-4 text-gray-400" />
  <h3 className="text-sm font-medium text-gray-700">Next Follow-up</h3>
</div>
```

**In Lists:**
```tsx
<div className="flex items-start gap-2">
  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
  <span className="text-sm text-gray-700">Task completed</span>
</div>
```

**Never:**
- Don't use icons larger than text
- Don't use bright colors (purple-700, pink-600, etc.)
- Don't use decorative icons (add no meaning)

---

## Components

### Headers

**Before (Too Prominent):**
```tsx
<div className="px-8 py-6 bg-gradient-to-r from-green-50 to-blue-50 border-b">
  <div className="flex items-center gap-3">
    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
      <CheckCircle className="text-green-600" size={20} />
    </div>
    <div>
      <h3 className="text-lg font-semibold text-gray-900">
        Renewal Planning Complete
      </h3>
      <p className="text-sm text-gray-600">
        Obsidian Black - Summary & Next Steps
      </p>
    </div>
  </div>
</div>
```

**After (Spa Aesthetic):**
```tsx
<div className="px-8 py-4 border-b border-gray-100">
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-base font-medium text-gray-900">
        Planning Complete
      </h3>
      <p className="text-sm text-gray-500 mt-0.5">
        Obsidian Black
      </p>
    </div>
    <CheckCircle className="w-4 h-4 text-green-600" />
  </div>
</div>
```

**Changes:**
- Removed gradient background
- Removed large icon circle
- Reduced padding (py-6 → py-4)
- Reduced text sizes (lg → base, text-gray-600 → text-gray-500)
- Icon moved to right, made smaller

**Result:** 50% less vertical space, cleaner appearance.

---

### Cards

**Standard Card:**
```tsx
<div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
  <h4 className="text-sm font-medium text-gray-700 mb-3">
    Section Title
  </h4>
  <div className="space-y-2">
    {/* Content */}
  </div>
</div>
```

**Highlight Card (AI tasks):**
```tsx
<div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
  <div className="flex items-start gap-2">
    <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <h5 className="text-sm font-medium text-gray-900">
        Task Title
      </h5>
      <p className="text-xs text-gray-600 mt-0.5">
        Description
      </p>
    </div>
  </div>
</div>
```

**User Action Card:**
```tsx
<div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
  <div className="flex items-start gap-2">
    <div className="w-4 h-4 flex-shrink-0 mt-0.5 rounded border-2 border-gray-300" />
    <div className="flex-1">
      <h5 className="text-sm font-medium text-gray-900">
        Task Title
      </h5>
      <p className="text-xs text-gray-600 mt-0.5">
        Description
      </p>
    </div>
  </div>
</div>
```

---

### Buttons

**Primary Action:**
```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
  Continue
</button>
```

**Secondary Action:**
```tsx
<button className="px-4 py-2 text-gray-600 text-sm font-medium hover:text-gray-900">
  Cancel
</button>
```

**Never:**
- Avoid `bg-green-600` (use blue for consistency)
- Don't use `shadow-lg` (too prominent)
- Don't use large text (`text-base` max)

---

### Lists

**Standard List:**
```tsx
<ul className="space-y-2">
  {items.map(item => (
    <li key={item.id} className="flex items-start gap-2">
      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-2" />
      <span className="text-sm text-gray-700">{item.text}</span>
    </li>
  ))}
</ul>
```

**Checklist:**
```tsx
<ul className="space-y-2">
  {items.map(item => (
    <li key={item.id} className="flex items-start gap-2">
      <input
        type="checkbox"
        className="mt-0.5 w-3.5 h-3.5 text-blue-500 border-gray-300 rounded"
      />
      <span className="text-xs text-gray-700">{item.text}</span>
    </li>
  ))}
</ul>
```

---

## Before & After Examples

### Example 1: Recommendation Slide

**Before:**
```tsx
<div className="px-8 py-6 border-b border-gray-100">
  <div className="max-w-2xl">
    <div className="inline-flex items-center gap-2 text-sm text-gray-500 mb-3">
      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
      Recommendation
    </div>

    <h1 className="text-2xl font-medium text-gray-900 mb-2">
      Strategic Account Plan - INVEST Strategy
    </h1>

    <p className="text-gray-600">
      Based on the information you've provided, a strategic approach
      will give you the best chance of success.
    </p>

    <div className="mt-4 inline-flex items-center gap-3">
      <span className="text-sm text-gray-500">Confidence</span>
      <span className="text-xl font-medium text-gray-900">92%</span>
    </div>
  </div>
</div>
```

**After:**
```tsx
<div className="px-8 py-4 border-b border-gray-100">
  <div className="flex items-center justify-between">
    <h1 className="text-base font-medium text-gray-900">
      Strategic Account Plan - INVEST Strategy
    </h1>
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">Confidence</span>
      <span className="text-sm font-medium text-gray-900">92%</span>
    </div>
  </div>
</div>
```

**Savings:**
- 60% less vertical space
- Removed redundant label
- Removed unnecessary description
- Condensed to single line
- Confidence score inline

---

### Example 2: Strategic Plan Header

**Before:**
```tsx
<div className="px-8 py-6 border-b bg-blue-100 border-blue-300 text-blue-800">
  <div className="flex items-center gap-3">
    <span className="text-4xl">🎯</span>
    <div className="flex-1">
      <h2 className="text-2xl font-bold">INVEST Strategy</h2>
      <p className="text-sm mt-1">
        Strategic partnership potential. Focus on deepening relationship and long-term value.
      </p>
    </div>
  </div>
</div>
```

**After:**
```tsx
<div className="px-8 py-4 border-b border-l-4 border-blue-200 bg-gray-50/30">
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium text-blue-700">Invest Strategy</h2>
        <span className="text-xs text-gray-500">•</span>
        <span className="text-xs text-gray-600">Partnership development</span>
      </div>
      <p className="text-sm text-gray-600 mt-1">Obsidian Black</p>
    </div>
    <Calendar className="w-4 h-4 text-gray-400" />
  </div>
</div>
```

**Changes:**
- Removed emoji (4xl → replaced with subtle left border)
- Changed from full-color background to subtle tint
- Reduced text sizes (2xl → base)
- Condensed strategy description to inline label
- Added customer name below

**Result:** 70% less visual weight, more professional.

---

### Example 3: Next Actions

**Before:**
```tsx
<div className="space-y-3">
  <div className="border border-gray-200 rounded-lg p-4">
    <div className="flex items-start justify-between mb-2">
      <div className="flex-1">
        <h5 className="font-medium text-gray-900">
          Schedule stakeholder meeting
        </h5>
        <p className="text-sm text-gray-600 mt-1">
          Book 30-min call with Marcus Castellan to present strategic plan
        </p>
      </div>
      <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-50 border-red-200 text-red-600">
        HIGH
      </span>
    </div>
    <div className="flex items-center gap-4 text-xs text-gray-500">
      <div className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        <span>Due: Mar 20, 2025</span>
      </div>
      <div className="flex items-center gap-1">
        <Users className="w-3 h-3" />
        <span>You</span>
      </div>
    </div>
  </div>
</div>
```

**After (Spa + AI/User Split):**
```tsx
{/* AI Section */}
<div className="space-y-2">
  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
    <Target className="w-4 h-4 text-blue-400" />
    I'll Handle
  </h4>
  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
    <div className="flex items-start gap-2">
      <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
      <div className="flex-1">
        <h5 className="text-sm font-medium text-gray-900">
          Send strategic plan summary email
        </h5>
        <p className="text-xs text-gray-600 mt-0.5">
          Automated email with plan overview and key milestones
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
          <Calendar className="w-3 h-3" />
          <span>Tomorrow</span>
        </div>
      </div>
    </div>
  </div>
</div>

{/* User Section */}
<div className="space-y-2">
  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
    <Users className="w-4 h-4 text-gray-400" />
    You'll Need To
  </h4>
  <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
    <div className="flex items-start gap-2">
      <div className="w-4 h-4 flex-shrink-0 mt-0.5 rounded border-2 border-gray-300" />
      <div className="flex-1">
        <h5 className="text-sm font-medium text-gray-900">
          Schedule stakeholder meeting
        </h5>
        <p className="text-xs text-gray-600 mt-0.5">
          30-min call to present strategic plan
        </p>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
          <Calendar className="w-3 h-3" />
          <span>Mar 20, 2025</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Changes:**
- Split into "AI" vs "User" sections
- AI tasks: Blue tint, checkmarks, reassuring
- User tasks: Minimal, no priority badges
- Removed "HIGH" urgency badge (overwhelming)
- Removed assignee field (redundant)

**Result:** Less anxiety, clearer responsibilities.

---

## Implementation Checklist

When converting an artifact to Spa Aesthetic:

### Headers
- [ ] Change `py-6` to `py-4`
- [ ] Change `text-lg` or `text-2xl` to `text-base`
- [ ] Remove gradients (`bg-gradient-to-r`)
- [ ] Remove large icons/emojis (text-4xl)
- [ ] Use `text-gray-500` for subtitles (not text-gray-600)

### Content
- [ ] Change `py-6` content padding (keep it)
- [ ] Use `text-sm` for body text (not text-base)
- [ ] Use `text-xs` for metadata (not text-sm)
- [ ] Replace bright colors with grays
- [ ] Make icons `w-4 h-4` (not w-5 h-5)
- [ ] Change icon colors to `text-gray-400`

### Cards
- [ ] Use `bg-gray-50` (not bg-blue-50)
- [ ] Use `border-gray-100` (not border-blue-300)
- [ ] Change padding `p-4` to `p-3` if dense

### Footers
- [ ] Change `py-6` to `py-4`
- [ ] Use simple buttons (no shadow-lg)
- [ ] Remove extra buttons (simplify actions)

---

## Anti-Patterns (Don't Do This)

### ❌ Too Much Color
```tsx
<div className="bg-gradient-to-r from-purple-100 via-blue-100 to-green-100">
  <h2 className="text-purple-800 font-bold text-2xl">Amazing Feature!</h2>
</div>
```

### ❌ Too Large
```tsx
<span className="text-4xl">🎯</span>
<h1 className="text-3xl font-bold">Strategic Account Plan</h1>
```

### ❌ Too Many Badges
```tsx
<span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-bold">
  HIGH PRIORITY
</span>
<span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold">
  URGENT
</span>
```

### ❌ Overwhelming Lists
```tsx
<ul>
  <li>☐ Task 1</li>
  <li>☐ Task 2</li>
  <li>☐ Task 3</li>
  {/* 15 more tasks... */}
</ul>
```

---

## Accessibility Notes

Spa Aesthetic should **not compromise accessibility**:

### Color Contrast
- Ensure text-gray-500 meets WCAG AA (4.5:1 ratio)
- Use text-gray-600 for labels if needed
- Icons can be text-gray-400 if paired with text

### Focus States
```tsx
<button className="... focus:ring-2 focus:ring-blue-500 focus:outline-none">
  Action
</button>
```

### Screen Readers
- Don't rely solely on icons (add labels)
- Use proper heading hierarchy (h1 → h2 → h3)
- Add aria-labels where needed

---

## Migration Guide

### Step 1: Identify Candidates
Look for artifacts with:
- Large headers (py-6 or more)
- Bright colors (gradients, colored backgrounds)
- Large text (text-xl, text-2xl)
- Emojis or large icons
- Overwhelming action lists

### Step 2: Apply Changes
Use this order:
1. **Headers first** (most visual impact)
2. **Icons second** (make smaller, gray)
3. **Text sizes third** (reduce by 1-2 levels)
4. **Colors fourth** (replace with grays)
5. **Spacing last** (tighten if needed)

### Step 3: Test
- Verify scrolling works
- Check mobile responsiveness
- Test with accessibility tools
- Get user feedback

---

## Tools & Resources

### Tailwind Color Reference
https://tailwindcss.com/docs/customizing-colors

### Icon Library (Lucide)
https://lucide.dev/icons/

### Accessibility Checker
https://webaim.org/resources/contrastchecker/

---

## Questions?

**For design decisions:** Review this guide + examples
**For implementation:** See `STRATEGIC-ACCOUNT-PLANNING-WORKFLOW.md`
**For component patterns:** Check existing artifacts in `src/components/artifacts/`

---

**Status:** ✅ Active design system, used in Strategic Account Planning workflow

**Next Phase:** Apply to other workflows (Opportunity, Risk, Expansion)
