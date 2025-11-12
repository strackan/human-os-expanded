# Renubu Module Architecture

**Created:** 2025-11-11
**Status:** Active Design

---

## Problem Statement

The current workflow system assumes a single domain (Customer Success) with fixed categories (`renewal`, `opportunity`, `risk`, `strategic`). As we expand to hundreds of workflow types across different domains, we need a modular architecture that:

1. Supports multiple product domains beyond CS
2. Allows domain-specific categorization
3. Scales to hundreds of workflow types
4. Keeps the codebase maintainable

---

## Solution: Module-Based Architecture

### Core Concept

A **Module** represents a product domain with its own:
- Workflow types
- Category taxonomy
- UI patterns
- Business logic

**Modules are independent feature sets**, not just organizational buckets.

---

## Module Definitions

### Module 1: Customer Success (`customer-success`)

**Purpose:** B2B customer lifecycle management for CS teams

**Categories:**
- `renewal` - Renewal workflows
- `opportunity` - Expansion/upsell workflows
- `risk` - Risk mitigation workflows
- `strategic` - Strategic account planning

**Example Workflows:**
- Renewal Kickoff (90-day campaigns)
- QBR Planning
- Risk Mitigation
- Expansion Planning

**Target User:** Customer Success Managers

---

### Module 2: Productivity (`productivity`)

**Purpose:** Personal productivity and work management

**Categories:**
- `planner` - Planning workflows (weekly, daily, monthly)
- `gtd` - Getting Things Done workflows
- `capture` - Quick capture (parking lot, inbox)
- `review` - Reflection and review workflows

**Example Workflows:**
- Weekly Planner
- Parking Lot (quick capture)
- Daily Planning
- Weekly Reflection
- Monthly Review

**Target User:** Individual knowledge workers

---

## Future Modules (Q1 2026+)

### Module 3: Sales (`sales`)
- Deal progression
- Pipeline management
- Prospecting workflows

### Module 4: Product (`product`)
- Feature planning
- Roadmap management
- User research workflows

### Module 5: Engineering (`engineering`)
- Sprint planning
- On-call management
- Incident response

### Module 6: Marketing (`marketing`)
- Campaign planning
- Content workflows
- Event management

---

## Implementation

### Data Model

```typescript
interface Module {
  id: string;           // 'customer-success', 'productivity', etc.
  name: string;         // 'Customer Success', 'Productivity'
  description: string;
  categories: string[]; // Module-specific categories
  icon?: string;
  color?: string;       // Brand color for UI
  enabled: boolean;     // Feature flag
}

interface WorkflowComposition {
  id: string;
  name: string;
  moduleId: string;     // NEW: Links to module
  category: string;     // Module-specific category
  description: string;
  // ... rest of fields
}
```

### Module Registry

```typescript
// src/lib/modules/registry.ts
export const MODULES: Record<string, Module> = {
  'customer-success': {
    id: 'customer-success',
    name: 'Customer Success',
    description: 'B2B customer lifecycle management',
    categories: ['renewal', 'opportunity', 'risk', 'strategic'],
    color: 'blue',
    enabled: true,
  },
  'productivity': {
    id: 'productivity',
    name: 'Productivity',
    description: 'Personal productivity and work management',
    categories: ['planner', 'gtd', 'capture', 'review'],
    color: 'purple',
    enabled: true,
  },
};
```

### Type Safety

```typescript
// Module-specific category types
type CustomerSuccessCategory = 'renewal' | 'opportunity' | 'risk' | 'strategic';
type ProductivityCategory = 'planner' | 'gtd' | 'capture' | 'review';

// Union type for all categories
type WorkflowCategory =
  | CustomerSuccessCategory
  | ProductivityCategory
  | string; // Fallback for dynamic modules
```

---

## UX Implications (Future)

### Discovery

**Module Switcher** (Top nav or sidebar)
```
[Customer Success ▼]  |  Productivity  |  Sales
```

**Module-Filtered Views**
- Workflows filtered by active module
- Module-specific dashboards
- Cross-module search

### Personalization

Users can:
- Enable/disable modules
- Set default module
- Customize module order
- Hide unused categories

### Multi-Module Workflows

Some workflows might span modules:
```typescript
{
  moduleId: 'customer-success',
  relatedModules: ['sales', 'product'], // Cross-functional workflows
}
```

---

## Migration Plan

### Phase 1: Foundation (Now)
- [x] Add `moduleId` field to `WorkflowComposition`
- [ ] Create module registry
- [ ] Update existing CS workflows with `moduleId: 'customer-success'`
- [ ] Add productivity module
- [ ] Update category type to be module-aware

### Phase 2: UI Updates (Q1 2026)
- [ ] Module switcher in nav
- [ ] Module-filtered workflow lists
- [ ] Module settings in user profile

### Phase 3: Advanced Features (Q2 2026+)
- [ ] Module marketplace (3rd-party modules)
- [ ] Cross-module analytics
- [ ] Module-specific permissions

---

## Design Principles

1. **Modules are independent** - Each module should work standalone
2. **Categories are module-scoped** - CS "strategic" ≠ Product "strategic"
3. **Progressive disclosure** - Users only see enabled modules
4. **Extensibility first** - Easy to add new modules without core changes
5. **Type-safe** - TypeScript enforces module/category relationships

---

## Open Questions

1. **Module permissions?** - Can users create custom modules?
2. **Cross-module dependencies?** - Can workflows depend on other modules?
3. **Module versioning?** - How do we handle module schema changes?
4. **Module analytics?** - Separate metrics per module?

---

## Success Metrics

- **Scalability:** Add 5 new modules in Q1 2026 without architectural changes
- **Maintainability:** TypeScript errors for invalid module/category combos
- **UX Clarity:** Users understand module boundaries intuitively
- **Performance:** Module filtering doesn't degrade with 100+ workflows

---

**Next Steps:**
1. Implement module registry
2. Add moduleId to WorkflowComposition interface
3. Update existing workflows
4. Fix TypeScript build errors
5. Ship email orchestration + module foundation together

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
