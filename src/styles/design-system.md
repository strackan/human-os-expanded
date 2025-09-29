# Design System Documentation

## Overview

This document outlines the standardized styling approach for the Renubu application. We use a combination of Tailwind CSS v4 and custom CSS classes to maintain consistency and reduce duplication.

## Styling Architecture

### 1. Tailwind CSS v4
- **Primary styling method**: Use Tailwind utility classes for most styling needs
- **Configuration**: Extended with custom colors, spacing, animations, and shadows
- **File**: `tailwind.config.ts`

### 2. Custom CSS Classes
- **Location**: `src/styles/components.css`
- **Purpose**: Styles that can't be easily achieved with Tailwind utilities
- **Examples**: Complex transitions, specific component layouts, accessibility features

### 3. Shared Components
- **Location**: `src/components/ui/`
- **Purpose**: Reusable components with consistent styling
- **Components**: Button, Card, Stat, StatusBadge, ChartLegend

## Color Palette

### Primary Colors
- `primary-50` to `primary-900`: Blue-based primary colors
- `success-50` to `success-900`: Green-based success colors
- `warning-50` to `warning-900`: Yellow-based warning colors
- `danger-50` to `danger-900`: Red-based danger colors

### Usage Examples
```tsx
// Background colors
<div className="bg-primary-100">Light primary background</div>
<div className="bg-success-500">Success background</div>

// Text colors
<span className="text-warning-700">Warning text</span>
<span className="text-danger-600">Danger text</span>
```

## Component Guidelines

### Buttons
Use the shared `Button` component for consistency:

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Variants**: `primary`, `secondary`, `success`, `warning`, `danger`
**Sizes**: `sm`, `md`, `lg`

### Cards
Use the shared `Card` component:

```tsx
import Card from '@/components/ui/Card';

<Card title="Card Title" subtitle="Card subtitle">
  Card content here
</Card>
```

### Stats
Use the shared `Stat` component:

```tsx
import Stat from '@/components/ui/Stat';

<Stat label="Revenue" value="$50,000" />
```

### Status Badges
Use the shared `StatusBadge` component:

```tsx
import StatusBadge from '@/components/ui/StatusBadge';

<StatusBadge status="success">Completed</StatusBadge>
<StatusBadge status="warning">Pending</StatusBadge>
```

## Layout Patterns

### Customer Layouts
- Use `customer-layout-container` class for main containers
- Use `customer-sidebar` class for sidebar elements
- Use `customer-content` class for main content areas

### Responsive Design
- Mobile-first approach with Tailwind's responsive prefixes
- Custom breakpoints defined in Tailwind config
- Responsive utilities in `components.css`

## Animation Guidelines

### Available Animations
- `animate-fade-in`: Fade in effect
- `animate-slide-up`: Slide up from bottom
- `animate-slide-down`: Slide down from top
- `animate-scale-in`: Scale in effect

### Usage
```tsx
<div className="animate-fade-in">Content that fades in</div>
<div className="animate-slide-up">Content that slides up</div>
```

## Accessibility

### Focus Management
- Custom focus styles defined in `globals.css`
- Focus-visible support for keyboard navigation
- High contrast focus indicators

### Screen Reader Support
- Proper ARIA labels on interactive elements
- Semantic HTML structure
- Color contrast compliance

## Best Practices

### 1. Prefer Tailwind Classes
```tsx
// ✅ Good
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-soft">

// ❌ Avoid
<div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 2px 15px -3px rgba(0, 0, 0, 0.07)' }}>
```

### 2. Use Shared Components
```tsx
// ✅ Good
import Button from '@/components/ui/Button';
<Button variant="primary">Submit</Button>

// ❌ Avoid
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Submit</button>
```

### 3. Consistent Spacing
- Use Tailwind's spacing scale: `p-4`, `m-2`, `gap-4`, etc.
- Custom spacing available: `p-18`, `m-88`, etc.

### 4. Typography
- Use Tailwind's font size utilities: `text-sm`, `text-lg`, `text-2xl`
- Custom font sizes available in config
- Consistent line heights defined

## Migration Guide

### Replacing Inline Styles
1. **Width calculations**: Use CSS custom properties or Tailwind's arbitrary values
2. **Dynamic colors**: Use CSS custom properties or conditional classes
3. **Complex layouts**: Create custom CSS classes in `components.css`

### Replacing Duplicate Components
1. **Stat components**: Replace with shared `Stat` component
2. **Chart legends**: Replace with shared `ChartLegend` component
3. **Buttons**: Replace with shared `Button` component

### Example Migration
```tsx
// Before
const Stat = ({ label, value }) => (
  <div className="flex flex-col items-start bg-gray-50 rounded-lg p-4 min-w-[120px] min-h-[64px]">
    <span className="text-xs text-gray-500 font-medium">{label}</span>
    <span className="text-lg font-bold text-gray-900 mt-1">{value}</span>
  </div>
);

// After
import Stat from '@/components/ui/Stat';
<Stat label={label} value={value} />
```

## File Structure

```
src/
├── styles/
│   ├── components.css          # Custom component styles
│   └── design-system.md        # This documentation
├── components/
│   └── ui/                     # Shared UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Stat.tsx
│       ├── StatusBadge.tsx
│       └── ChartLegend.tsx
├── app/
│   └── globals.css             # Global styles and imports
└── tailwind.config.ts          # Tailwind configuration
```

## Maintenance

### Adding New Styles
1. **Tailwind utilities**: Add to `tailwind.config.ts`
2. **Custom CSS**: Add to `src/styles/components.css`
3. **Shared components**: Create in `src/components/ui/`

### Updating Existing Styles
1. Update the shared component first
2. Update documentation if needed
3. Test across different screen sizes
4. Ensure accessibility compliance

### Performance Considerations
- Tailwind CSS v4 includes built-in purging
- Custom CSS is minimal and focused
- Shared components reduce bundle size through reuse 