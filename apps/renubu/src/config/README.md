# UI Text Configuration System

## Overview

This directory contains centralized configuration for UI text strings across the application, implementing an i18n-style pattern for easy maintenance and future localization support.

## Files

- **`uiText.ts`** - Main UI text configuration file

## Usage

### Importing the Configuration

```tsx
import { uiText } from '@/config/uiText';

// Access nested values
<h2>{uiText.dashboard.priorityTasks.title}</h2>
```

### Using the Helper Function

For safer access with fallback values:

```tsx
import { getUIText } from '@/config/uiText';

const title = getUIText('dashboard.priorityTasks.title', 'Default Title');
```

## Structure

The configuration is organized hierarchically:

```typescript
uiText = {
  dashboard: {
    priorityTasks: {
      title: "Before You Leave",
      subtitle: "tasks",
      emptyState: "No priority tasks at this time"
    },
    metrics: { ... }
  },
  workflow: { ... },
  artifacts: { ... },
  common: { ... }
}
```

## Benefits

1. **Centralized Text Management** - All UI text in one place
2. **Type Safety** - TypeScript autocomplete and type checking
3. **Easy Updates** - Change text globally from single location
4. **Future i18n Ready** - Easy to extend for multiple languages
5. **Consistency** - Ensures consistent terminology across app

## Adding New Text

### 1. Add to Configuration

Edit `src/config/uiText.ts`:

```typescript
export const uiText = {
  dashboard: {
    // Existing sections...

    newSection: {
      title: "New Section Title",
      description: "Section description"
    }
  }
};
```

### 2. Use in Components

```tsx
import { uiText } from '@/config/uiText';

function MyComponent() {
  return (
    <div>
      <h1>{uiText.dashboard.newSection.title}</h1>
      <p>{uiText.dashboard.newSection.description}</p>
    </div>
  );
}
```

## Future Enhancements

This system can be extended to support:

- **Multiple Languages** - Add `en`, `es`, `fr` objects
- **Context-Based Text** - Different text for different user roles
- **Dynamic Loading** - Load text from database or API
- **Variable Substitution** - Template strings with variables
- **Theme-Based Text** - Different wording for different app themes

## Example: Multi-Language Support (Future)

```typescript
// Future structure
export const uiText = {
  en: {
    dashboard: {
      priorityTasks: {
        title: "Before You Leave"
      }
    }
  },
  es: {
    dashboard: {
      priorityTasks: {
        title: "Antes de Irte"
      }
    }
  }
};

// Usage with language selection
const currentLang = 'en';
<h2>{uiText[currentLang].dashboard.priorityTasks.title}</h2>
```

## Migration Guide

To migrate existing hardcoded text:

1. Find the hardcoded string in your component
2. Add it to `uiText.ts` in the appropriate section
3. Import `uiText` in your component
4. Replace the string with the config reference
5. Test to ensure it displays correctly

## Best Practices

1. **Organize by Feature** - Group related text together
2. **Use Descriptive Keys** - Make keys self-documenting
3. **Avoid Duplication** - Reuse common strings from `common` section
4. **Document Unusual Text** - Add comments for context-specific strings
5. **Keep It Flat** - Avoid deeply nested structures (3-4 levels max)
