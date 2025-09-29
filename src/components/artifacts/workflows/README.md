# TaskMode Workflows

## Quick Start

Create a new customer workflow in 2 minutes:

```typescript
// 1. Create config file: /config/configs/YourCustomerConfig.ts
export const yourCustomerConfig: WorkflowConfig = {
  customer: { name: 'Your Customer' },
  // ... customize sections
};

// 2. Use it anywhere
<WorkflowWrapper config={yourCustomerConfig} />
```

## Architecture Overview

```
┌─────────────────────────────────────────┐
│          TaskModeAdvanced               │
│  ┌──────────────┬──────────────┐       │
│  │ CustomerView │   Analytics   │       │
│  ├──────────────┼──────────────┤       │
│  │ ChatInterface│ ArtifactsPanel│       │
│  └──────────────┴──────────────┘       │
└─────────────────────────────────────────┘
```

Each quadrant is independently configurable through `WorkflowConfig`.

## Common Tasks

### Create a New Customer Iteration
```bash
1. Copy an existing config from /config/configs/
2. Modify the data for your customer
3. Import and use with WorkflowWrapper
```

### Add a New Conversation Template
```typescript
// In /conversations/renewalConversations.ts
export const myNewConversation = [
  { sender: 'ai', text: 'Your message here' }
];
```

### Customize a Quadrant
Each quadrant accepts a config object:
- `CustomerOverview`: Metrics, KPIs, status indicators
- `Analytics`: Charts, trends, insights
- `ChatInterface`: Conversation flow, buttons, features
- `ArtifactsPanel`: Documents, analysis, custom content

## File Structure
```
/workflows/
├── README.md                  # You are here
├── ARCHITECTURE.md           # Detailed technical docs
├── TaskModeAdvanced.tsx      # Main modal component
├── WorkflowWrapper.tsx       # Config-driven wrapper
├── /components/              # Quadrant components
├── /config/
│   ├── WorkflowConfig.ts    # TypeScript interfaces
│   └── /configs/            # Customer configurations
├── /conversations/          # Reusable chat templates
└── /examples/              # Usage examples
```

## Configuration Reference

See `WorkflowConfig.ts` for full type definitions.

### Essential Config Properties
- `customer.name` - Display name
- `layout.splitModeDefault` - Show artifacts on load
- `customerOverview.metrics` - 8 metric cards
- `analytics` - 3 chart sections
- `chat.conversationSeed` - Initial messages
- `artifacts.sections` - Right panel content

## Examples

### Urgent Renewal
```typescript
config = {
  customer: { name: 'UrgentCorp' },
  customerOverview: {
    metrics: {
      renewalDate: { value: '5 days', status: 'red' }
    }
  }
}
```

### High Growth Account
```typescript
config = {
  analytics: {
    usageTrend: { upliftPercentage: 85 },
    renewalInsights: { recommendedAction: 'Upsell' }
  }
}
```

## Best Practices

1. **Name configs after customers**: `AcmeCorpConfig.ts`
2. **Reuse conversation templates**: Import from `/conversations`
3. **Keep artifacts focused**: 2-3 sections max
4. **Test with real data**: Use actual customer metrics

## Troubleshooting

**Q: Modal not opening?**
Set `autoOpen={true}` in WorkflowWrapper

**Q: Chat not showing?**
Check `conversationSeed` is properly formatted

**Q: Metrics not updating?**
Verify config structure matches `WorkflowConfig` interface

## Contributing

1. Follow existing patterns in `/configs`
2. Use TypeScript for all configs
3. Test your workflow before committing
4. Update this README with new patterns

---
For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)