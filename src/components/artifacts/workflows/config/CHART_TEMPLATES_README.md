# Chart Templates System

This system provides predefined chart data templates for analytics visualizations in workflow configurations.

## Available Chart Types

### 1. YoY Growth (`yoyGrowth`)
- **Falling**: Declining year-over-year growth pattern (-2.1% to -3.2%)
- **Flat**: Stable year-over-year growth pattern (+1.2% ±0.5%)
- **Rising**: Growing year-over-year growth pattern (+2.1% to +8.7%)

### 2. Last Month (`lastMonth`)
- **Falling**: Declining last month performance (-0.8% to -2.1%)
- **Flat**: Stable last month performance (+0.2% ±0.5%)
- **Rising**: Growing last month performance (+1.2% to +3.4%)

### 3. Usage Trend (`usageTrend`)
- **Falling**: Usage declining over time (85% → 48% of license limit)
- **Flat**: Usage hovering around license limit (91% → 98% of limit)
- **Rising**: Usage growing significantly above limit (75% → 112% of limit)

### 4. User Licenses (`userLicenses`)
- **Falling**: Low license utilization (45% active, 40% unused)
- **Flat**: Balanced license utilization (65% active, 15% unused)
- **Rising**: High license utilization (85% active, 5% unused)

## Usage Examples

### Basic Template Usage
```typescript
// In your workflow config
customerOverview: {
  metrics: {
    yoyGrowth: '{{chart.yoyGrowth.falling}}',
    lastMonth: '{{chart.lastMonth.flat}}',
    usageTrend: '{{chart.usageTrend.rising}}',
    userLicenses: '{{chart.userLicenses.flat}}'
  }
}
```

### Accessing Specific Properties
```typescript
// Get just the trend value
text: "Their YoY growth is {{chart.yoyGrowth.falling.trendValue}}"

// Get just the description
text: "Usage shows {{chart.usageTrend.rising.description}}"

// Get just the chart data
data: "{{chart.lastMonth.flat.chart.data}}"
```

### In Chat Messages
```typescript
chat: {
  aiGreeting: "Hi {{user.first}}! {{customer.name}}'s YoY growth is {{chart.yoyGrowth.falling.trendValue}} and usage trend shows {{chart.usageTrend.falling.description}}. Should we discuss retention?"
}
```

### In Dynamic Chat Flows
```typescript
dynamicFlow: {
  initialMessage: {
    text: "Based on the data, {{customer.name}}'s usage has declined from {{chart.usageTrend.falling.chart.data[0].users}} to {{chart.usageTrend.falling.chart.data[11].users}} users over the year."
  }
}
```

## Template Structure

Each chart template includes:
- `label`: Display label for the chart
- `value`: Main value (e.g., "+1.2% Annual")
- `trend`: Trend direction ("falling", "flat", "rising")
- `trendValue`: Numeric trend value (e.g., "+1.2%")
- `chart`: Complete chart configuration with data, colors, thresholds
- `description`: Human-readable description (for usageTrend)

## Chart Data Patterns

### Falling Patterns
- Start near limits/thresholds
- Gradual decline over time
- Red color scheme (#ef4444)
- Negative or declining values

### Flat Patterns
- Hover around limits/thresholds
- Minor fluctuations
- Orange color scheme (#f59e0b)
- Stable values with small variations

### Rising Patterns
- Start below limits
- Gradual increase over time
- Green color scheme (#10b981)
- Positive or growing values

## Integration with Variable Substitution

The chart templates integrate seamlessly with the existing variable substitution system:

```typescript
// These all work together
text: "Hi {{user.first}}! {{customer.name}}'s {{chart.yoyGrowth.falling.trendValue}} growth shows {{chart.usageTrend.falling.description}}."
```

## Predefined Template Sets

Use predefined sets for common scenarios:

```typescript
import { applyTemplateSet } from './templateVariables';

// Apply declining customer template set
const decliningConfig = applyTemplateSet(baseConfig, 'declining');

// Apply stable customer template set  
const stableConfig = applyTemplateSet(baseConfig, 'stable');

// Apply growing customer template set
const growingConfig = applyTemplateSet(baseConfig, 'growing');
```

## File Structure

- `chartTemplates.ts` - Core template definitions
- `templateVariables.ts` - Variable resolution system
- `ChartTemplateExamples.ts` - Example configurations
- `ChartTemplateUsageExample.ts` - Advanced usage examples
- `variableSubstitution.ts` - Enhanced with chart template support

## Best Practices

1. **Use appropriate trends**: Match chart trends to customer scenarios
2. **Mix and match**: Combine different trends for realistic scenarios
3. **Access specific properties**: Use `.property` syntax for precise data
4. **Validate templates**: Ensure chart templates match your customer data
5. **Document usage**: Include chart template variables in your workflow documentation

## Example Workflow Configurations

See `ChartTemplateExamples.ts` and `ChartTemplateUsageExample.ts` for complete examples of how to use chart templates in real workflow configurations.
