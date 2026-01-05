# Component Architecture Documentation

## Overview

This document outlines the frontend component architecture for the GoodHang CS Assessment system. It covers component patterns, state management, styling conventions, responsive design, and performance optimization strategies.

---

## Component Patterns

### 1. Component Organization

```
components/
├── assessment/              # Assessment-specific components
│   ├── QuestionCard.tsx
│   ├── AnswerInput.tsx
│   ├── ProgressIndicator.tsx
│   ├── NavigationButtons.tsx
│   ├── CompletionCard.tsx
│   ├── LoadingScreen.tsx
│   ├── MicrophoneButton.tsx
│   ├── SectionTimeline.tsx
│   └── results/            # Results page components
│       ├── PersonalityProfileCard.tsx
│       ├── CategoryScoresSection.tsx
│       ├── DimensionBreakdown.tsx
│       ├── BadgeShowcase.tsx
│       ├── AIOrchestrationCard.tsx
│       ├── BestFitRolesCard.tsx
│       ├── PublicSummaryCard.tsx
│       ├── ResultsHeader.tsx
│       └── ResultsActions.tsx
├── members/                # Member directory components
│   └── AssessmentStatusCard.tsx
└── ui/                     # Reusable UI components
    ├── SkeletonLoader.tsx
    ├── ErrorBoundary.tsx
    └── Toast.tsx
```

### 2. Component Types

#### Presentational Components

Pure components that receive data via props and render UI without side effects.

**Example: QuestionCard**
```typescript
interface QuestionCardProps {
  question: AssessmentQuestion;
}

function QuestionCardComponent({ question }: QuestionCardProps) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold text-white mb-4">
        {question.text}
      </h2>
      {question.followUp && (
        <p className="text-gray-400 text-sm italic">{question.followUp}</p>
      )}
    </div>
  );
}

// Memoized to prevent unnecessary re-renders
export const QuestionCard = memo(QuestionCardComponent, (prevProps, nextProps) => {
  return prevProps.question.id === nextProps.question.id;
});
```

#### Container Components

Components that manage state, handle API calls, and orchestrate child components.

**Example: Assessment Interview Page**
```typescript
'use client';

export default function AssessmentInterviewPage() {
  // State management
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  // API calls
  const saveAnswer = async () => {
    const response = await fetch(`/api/assessment/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id, answer: currentAnswer })
    });
    // Handle response...
  };

  return (
    <div>
      <QuestionCard question={currentQuestion} />
      <AnswerInput value={currentAnswer} onChange={setCurrentAnswer} />
      <NavigationButtons onNext={saveAnswer} />
    </div>
  );
}
```

### 3. TypeScript Patterns

#### Props Interfaces

Always define props interfaces for type safety.

```typescript
// Good - Explicit interface
interface PersonalityProfileCardProps {
  profile: PersonalityProfile;
}

export function PersonalityProfileCard({ profile }: PersonalityProfileCardProps) {
  // Component implementation
}

// Bad - Inline types
export function PersonalityProfileCard({ profile }: { profile: any }) {
  // Component implementation
}
```

#### Type Imports

Import types from centralized type files.

```typescript
import type {
  AssessmentQuestion,
  AssessmentSession,
  PersonalityProfile
} from '@/lib/assessment/types';
```

---

## State Management

### 1. Local State (useState)

Use for component-specific state that doesn't need to be shared.

**When to use:**
- Form input values
- UI toggle states (open/closed, expanded/collapsed)
- Loading states for component-specific operations

**Example:**
```typescript
const [answer, setAnswer] = useState('');
const [isSaving, setIsSaving] = useState(false);
```

### 2. URL State (useSearchParams, params)

Use for state that should be shareable/bookmarkable.

**When to use:**
- Current page/step in multi-step flows
- Filter/sort states
- Selected items

**Example:**
```typescript
const searchParams = useSearchParams();
const sessionId = searchParams.get('session');
```

### 3. Server State (API Calls)

Fetch data from API routes, cache appropriately.

**Pattern:**
```typescript
// Fetch on mount
useEffect(() => {
  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessment/${sessionId}/results`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  fetchSession();
}, [sessionId]);
```

### 4. Persistent State (localStorage)

Use sparingly for client-side persistence.

**When to use:**
- Draft answers (backup before save)
- UI preferences (dark mode, collapsed sections)
- Recently viewed items

**Example:**
```typescript
// Save draft answer
useEffect(() => {
  if (answer) {
    localStorage.setItem(`draft-${questionId}`, answer);
  }
}, [answer, questionId]);

// Restore draft on mount
useEffect(() => {
  const draft = localStorage.getItem(`draft-${questionId}`);
  if (draft) setAnswer(draft);
}, [questionId]);
```

---

## Styling Conventions

### 1. Tailwind CSS

All styling uses Tailwind utility classes.

#### Color Palette

```typescript
// Background gradients
'bg-gradient-to-br from-purple-900/20 to-blue-900/20'
'bg-gradient-to-r from-purple-400 to-blue-400'

// Text colors
'text-white'           // Primary text
'text-gray-300'        // Secondary text
'text-gray-400'        // Tertiary text
'text-purple-400'      // Accent (MBTI)
'text-blue-400'        // Accent (Enneagram)
'text-green-400'       // Success/positive
'text-red-400'         // Error/negative

// Border colors
'border-purple-500/30'  // Subtle borders
'border-green-500/50'   // Success borders
```

#### Spacing Scale

```typescript
// Consistent spacing
'mb-4'  // 1rem (16px) - Small gaps
'mb-6'  // 1.5rem (24px) - Medium gaps
'mb-8'  // 2rem (32px) - Large gaps
'mb-12' // 3rem (48px) - Section gaps

// Padding
'p-4'   // Small padding
'p-6'   // Medium padding
'p-8'   // Large padding
```

#### Typography

```typescript
// Headings
'text-4xl font-bold'  // Page titles (H1)
'text-3xl font-bold'  // Section titles (H2)
'text-2xl font-semibold' // Subsection titles (H3)
'text-xl font-semibold'  // Card titles

// Body text
'text-base'           // Default (16px)
'text-sm'             // Small text (14px)
'text-xs'             // Fine print (12px)

// Line height
'leading-relaxed'     // 1.625
'leading-normal'      // 1.5
```

### 2. Gradient System

#### Background Gradients

```typescript
// Card backgrounds
'bg-gradient-to-br from-purple-900/20 to-blue-900/20'
'bg-gradient-to-br from-green-900/20 to-teal-900/20'
'bg-gradient-to-br from-orange-900/20 to-red-900/20'

// Text gradients
'bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent'
```

#### Hover Effects

```typescript
// Button hovers
'hover:from-purple-600 hover:to-blue-600'
'transition-all duration-300'

// Card hovers
'hover:border-purple-400/60'
'hover:shadow-lg hover:shadow-purple-500/20'
```

### 3. Responsive Design

All components follow **mobile-first** responsive design.

#### Breakpoints

```typescript
// Tailwind breakpoints (min-width)
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Small desktops
xl: 1280px  // Large desktops
2xl: 1536px // Extra large screens
```

#### Responsive Patterns

```typescript
// Mobile-first grid
'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'

// Mobile-first text
'text-xl md:text-2xl lg:text-3xl'

// Mobile-first padding
'p-4 md:p-6 lg:p-8'

// Hide on mobile, show on desktop
'hidden md:block'

// Show on mobile, hide on desktop
'block md:hidden'
```

#### Example: Responsive Card

```typescript
<div className="
  grid
  grid-cols-1           // 1 column on mobile
  md:grid-cols-2        // 2 columns on tablet
  gap-4 md:gap-6        // Smaller gap on mobile
  p-4 md:p-6 lg:p-8     // Progressive padding
">
  {cards.map(card => (
    <Card key={card.id} />
  ))}
</div>
```

---

## Performance Optimization

### 1. React.memo

Use `React.memo` for expensive pure components.

**When to use:**
- Components that render frequently
- Components with expensive render logic
- List items in long lists

**Example:**
```typescript
// Memoize with custom comparison
export const QuestionCard = memo(
  QuestionCardComponent,
  (prevProps, nextProps) => {
    // Only re-render if question ID changes
    return prevProps.question.id === nextProps.question.id;
  }
);
```

**When NOT to use:**
- Components that change frequently anyway
- Simple components with minimal render cost
- Components with functions/objects as props (unless memoized)

### 2. useMemo & useCallback

Memoize expensive computations and callbacks.

```typescript
// Memoize expensive calculation
const categoryScores = useMemo(() => {
  return calculateCategoryScores(dimensions);
}, [dimensions]);

// Memoize callback to prevent child re-renders
const handleSave = useCallback(async () => {
  await saveAnswer(answer);
}, [answer]);

// Pass to memoized child
<AnswerInput onSave={handleSave} />
```

### 3. Code Splitting

Use dynamic imports for large components.

```typescript
// Lazy load heavy component
const BadgeShowcase = dynamic(() => import('./BadgeShowcase'), {
  loading: () => <SkeletonLoader />,
  ssr: false // Client-side only if needed
});
```

### 4. Image Optimization

Use Next.js Image component for automatic optimization.

```typescript
import Image from 'next/image';

<Image
  src="/badges/ai-wizard.png"
  alt="AI Wizard Badge"
  width={64}
  height={64}
  loading="lazy"
/>
```

---

## Component Composition Patterns

### 1. Compound Components

Group related components for better API.

```typescript
// Parent component manages shared state
function ResultsSection({ children }: { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <ResultsContext.Provider value={{ expanded, setExpanded }}>
      {children}
    </ResultsContext.Provider>
  );
}

// Child components consume context
ResultsSection.Header = function Header({ title }: { title: string }) {
  const { expanded, setExpanded } = useResultsContext();
  return <button onClick={() => setExpanded(!expanded)}>{title}</button>;
};

ResultsSection.Content = function Content({ children }: { children: React.ReactNode }) {
  const { expanded } = useResultsContext();
  return expanded ? <div>{children}</div> : null;
};

// Usage
<ResultsSection>
  <ResultsSection.Header title="Dimension Breakdown" />
  <ResultsSection.Content>
    <DimensionBreakdown dimensions={dimensions} />
  </ResultsSection.Content>
</ResultsSection>
```

### 2. Render Props

Pass rendering logic as props for flexibility.

```typescript
interface DataFetcherProps<T> {
  url: string;
  render: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode;
}

function DataFetcher<T>({ url, render }: DataFetcherProps<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch logic...
  }, [url]);

  return render(data, loading, error);
}

// Usage
<DataFetcher<AssessmentResults>
  url="/api/assessment/123/results"
  render={(data, loading, error) => {
    if (loading) return <LoadingScreen />;
    if (error) return <ErrorMessage error={error} />;
    return <ResultsDisplay results={data} />;
  }}
/>
```

---

## Error Handling

### 1. Error Boundaries

Wrap sections in error boundaries to prevent full page crashes.

```typescript
'use client';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-400">{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <AssessmentResults sessionId={sessionId} />
</ErrorBoundary>
```

### 2. Loading States

Always show loading states for async operations.

```typescript
if (loading) {
  return <LoadingScreen message="Analyzing your assessment..." />;
}

if (error) {
  return <ErrorMessage error={error} retry={fetchData} />;
}

if (!data) {
  return <EmptyState message="No results found" />;
}

return <ResultsDisplay data={data} />;
```

---

## Accessibility

### 1. Semantic HTML

Use semantic HTML elements for better accessibility.

```typescript
// Good
<nav>
  <ul>
    <li><a href="/assessment">Assessment</a></li>
  </ul>
</nav>

// Bad
<div className="nav">
  <div className="nav-item">Assessment</div>
</div>
```

### 2. ARIA Labels

Add ARIA labels for screen readers.

```typescript
<button
  aria-label="Next question"
  onClick={handleNext}
>
  <ArrowRight />
</button>

<input
  aria-describedby="answer-hint"
  placeholder="Your answer..."
/>
<p id="answer-hint" className="text-sm text-gray-400">
  Minimum 50 characters
</p>
```

### 3. Keyboard Navigation

Ensure all interactive elements are keyboard accessible.

```typescript
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  onClick={handleClick}
>
  Click me
</div>
```

---

## Testing Conventions

### 1. Component Testing

Test components in isolation with React Testing Library.

```typescript
import { render, screen } from '@testing-library/react';
import { QuestionCard } from './QuestionCard';

describe('QuestionCard', () => {
  it('renders question text', () => {
    const question = {
      id: 'test-1',
      text: 'What is your name?',
      followUp: 'Please be specific',
    };

    render(<QuestionCard question={question} />);

    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.getByText('Please be specific')).toBeInTheDocument();
  });
});
```

### 2. Integration Testing

Test component interactions and API calls.

```typescript
it('saves answer on submit', async () => {
  const mockSave = jest.fn();
  render(<AnswerInput onSave={mockSave} />);

  const input = screen.getByPlaceholderText('Your answer...');
  await userEvent.type(input, 'Test answer');

  const button = screen.getByText('Save');
  await userEvent.click(button);

  expect(mockSave).toHaveBeenCalledWith('Test answer');
});
```

---

## File Structure Conventions

```
components/
├── ComponentName.tsx          # Main component
├── ComponentName.module.css   # Scoped styles (if needed, prefer Tailwind)
├── ComponentName.test.tsx     # Tests
└── index.ts                   # Re-export

# Example
components/assessment/
├── QuestionCard.tsx
├── QuestionCard.test.tsx
└── index.ts  # export { QuestionCard } from './QuestionCard';
```

---

## Best Practices Summary

### Do's

✅ Use TypeScript for all components
✅ Define explicit prop interfaces
✅ Use React.memo for expensive components
✅ Follow mobile-first responsive design
✅ Use Tailwind utility classes
✅ Add loading and error states
✅ Use semantic HTML
✅ Add ARIA labels for accessibility
✅ Memoize callbacks passed to memoized children

### Don'ts

❌ Don't use inline styles
❌ Don't mix Tailwind with CSS modules
❌ Don't forget loading states
❌ Don't use `any` types
❌ Don't over-memoize (profile first)
❌ Don't forget mobile responsiveness
❌ Don't use div for everything (use semantic HTML)
❌ Don't create new objects/functions in render (breaks memoization)

---

## Component Checklist

Before merging a new component, ensure:

- [ ] TypeScript types defined for all props
- [ ] Responsive design tested (mobile, tablet, desktop)
- [ ] Loading and error states handled
- [ ] Memoization applied if component is expensive
- [ ] ARIA labels added for accessibility
- [ ] Follows Tailwind styling conventions
- [ ] Unit tests written
- [ ] No console errors or warnings
- [ ] Works in both light and dark mode (if applicable)
- [ ] Keyboard navigation works

---

Last Updated: 2025-11-16
