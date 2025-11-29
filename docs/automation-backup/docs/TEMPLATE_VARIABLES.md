# Template Variable Resolution Reference

## Overview

Workflow configs use **Handlebars-style** template variables (e.g., `{{customer.name}}`) that are dynamically resolved at runtime. This document provides a complete reference of all available variables.

## Variable Categories

1. **Customer Variables** - Customer account data
2. **CSM Variables** - Assigned Customer Success Manager
3. **Workflow Variables** - Dynamic workflow state
4. **Company Variables** - Organizational settings
5. **Account Team Variables** - Sales, SA, Executive Sponsor
6. **Date/Time Variables** - Contextual date calculations

---

## 1. Customer Variables

**Namespace**: `{{customer.*}}`

**Data Source**: `customers` table + `customers_with_team` view

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{customer.id}}` | UUID | Customer unique ID | `a1b2c3d4-...` |
| `{{customer.name}}` | String | Customer company name | `Acme Corp` |
| `{{customer.slug}}` | String | URL-friendly slug | `acme-corp` |
| `{{customer.arr}}` | Number | Annual Recurring Revenue | `125000` |
| `{{customer.renewalDate}}` | Date | Renewal date (ISO) | `2025-12-15` |
| `{{customer.contractTerm}}` | Number | Contract length in months | `12` |
| `{{customer.industry}}` | String | Industry vertical | `SaaS` |
| `{{customer.employeeCount}}` | Number | Company size | `250` |
| `{{customer.hasAccountPlan}}` | Boolean | Has active account plan | `true` |
| `{{customer.accountPlanOwner}}` | Email | Account plan owner email | `ae@acme.com` |
| `{{customer.accountPlanLastUpdated}}` | Date | Last account plan update | `2025-09-01` |

### Account Plan Details (Object)

```handlebars
{{#if customer.hasAccountPlan}}
  Account Plan Owner: {{customer.accountPlan.owner}}
  Team: {{customer.accountPlan.team}}
  Last Updated: {{customer.accountPlan.lastUpdated}}
{{/if}}
```

**Resolved Object**:
```javascript
customer.accountPlan = {
  owner: "alice.ae@acme.com",
  ownerName: "Alice AE",
  team: ["alice.ae@acme.com", "bob.sa@acme.com", "exec@acme.com"],
  lastUpdated: "2025-09-01T10:30:00Z"
}
```

---

## 2. CSM Variables

**Namespace**: `{{csm.*}}`

**Data Source**: `users` table + `users_with_manager` view

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{csm.id}}` | UUID | CSM user ID | `e5f6g7h8-...` |
| `{{csm.email}}` | Email | CSM email | `carol.csm@acme.com` |
| `{{csm.name}}` | String | CSM full name | `Carol CSM` |
| `{{csm.title}}` | String | CSM job title | `Senior CSM` |
| `{{csm.manager}}` | Email | CSM's manager email | `alice.manager@acme.com` |
| `{{csm.managerName}}` | String | Manager's full name | `Alice Manager` |
| `{{csm.managerTitle}}` | String | Manager's job title | `CS Manager - Alpha Team` |

### CSM Object Example

```handlebars
Assigned CSM: {{csm.name}} ({{csm.email}})
Reports to: {{csm.managerName}}
```

**Output**:
```
Assigned CSM: Carol CSM (carol.csm@acme.com)
Reports to: Alice Manager
```

---

## 3. Workflow Variables

**Namespace**: `{{workflow.*}}`

**Data Source**: Dynamically calculated based on customer renewal date and current timestamp

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{workflow.currentStage}}` | String | Current workflow stage | `7-Signature` |
| `{{workflow.daysUntilRenewal}}` | Number | Days until renewal (negative if overdue) | `5` |
| `{{workflow.hoursUntilRenewal}}` | Number | Hours until renewal | `120` |
| `{{workflow.renewalARR}}` | Number | Renewal ARR (mirrors customer.arr) | `125000` |
| `{{workflow.currentDate}}` | Date | Current date (ISO) | `2025-10-08` |
| `{{workflow.currentTimestamp}}` | Timestamp | Current timestamp | `2025-10-08T14:30:00Z` |
| `{{workflow.isOverdue}}` | Boolean | Is renewal overdue | `false` |
| `{{workflow.daysOverdue}}` | Number | Days overdue (0 if not overdue) | `0` |

### Calculated Examples

```handlebars
{{#if workflow.isOverdue}}
  This renewal is {{workflow.daysOverdue}} days overdue.
{{else}}
  Renewal in {{workflow.daysUntilRenewal}} days.
{{/if}}
```

**Thresholds in Conditionals**:

```handlebars
{{#if workflow.renewalARR >= 100000}}
  High-value renewal - CEO notification required
{{/if}}
```

---

## 4. Company Variables

**Namespace**: `{{company.*}}`

**Data Source**: `company_settings` table

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{company.name}}` | String | Company name | `Acme Corp` |
| `{{company.vpCustomerSuccess}}` | Email | VP CS email | `john.vp@acme.com` |
| `{{company.vpCustomerSuccessName}}` | String | VP CS name | `John VP` |
| `{{company.ceo}}` | Email | CEO email | `jane.ceo@acme.com` |
| `{{company.ceoName}}` | String | CEO name | `Jane CEO` |
| `{{company.csTeamEmail}}` | Email | CS team alias | `cs-team@acme.com` |
| `{{company.execTeamEmail}}` | Email | Executive team alias | `exec-team@acme.com` |

### Example Usage

```handlebars
{{#if workflow.renewalARR >= 100000}}
  Notify CEO: {{company.ceo}}
{{/if}}

{{#if workflow.renewalARR >= 50000}}
  Notify VP CS: {{company.vpCustomerSuccess}}
{{/if}}
```

---

## 5. Account Team Variables

**Namespace**: `{{accountTeam.*}}`

**Data Source**: `customers` table joins to `users` table

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{accountTeam.ae}}` | Email | Account Executive | `alice.ae@acme.com` |
| `{{accountTeam.aeName}}` | String | AE name | `Alice AE` |
| `{{accountTeam.sa}}` | Email | Solutions Architect | `bob.sa@acme.com` |
| `{{accountTeam.saName}}` | String | SA name | `Bob SA` |
| `{{accountTeam.executiveSponsor}}` | Email | Executive Sponsor | `exec@acme.com` |
| `{{accountTeam.executiveSponsorName}}` | String | Exec Sponsor name | `Executive Leader` |

### Account Team Array

For multi-recipient notifications:

```handlebars
{{accountTeam.allEmails}}
```

**Resolves to**:
```javascript
["alice.ae@acme.com", "bob.sa@acme.com", "carol.csm@acme.com", "exec@acme.com"]
```

### Example: Notify Account Team

```handlebars
{{#if customer.hasAccountPlan}}
  **Account Team:**
  - AE: {{accountTeam.aeName}} ({{accountTeam.ae}})
  - SA: {{accountTeam.saName}} ({{accountTeam.sa}})
  - Executive Sponsor: {{accountTeam.executiveSponsorName}}
{{/if}}
```

---

## 6. Date/Time Variables

**Namespace**: `{{date.*}}`

**Data Source**: Computed from `workflow.currentDate` and `customer.renewalDate`

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{date.today}}` | Date | Today's date (ISO) | `2025-10-08` |
| `{{date.renewalDate}}` | Date | Customer renewal date | `2025-12-15` |
| `{{date.gracePeriodEnd}}` | Date | Renewal + 30 days | `2026-01-14` |
| `{{date.contractStart}}` | Date | Renewal date (contract start) | `2025-12-15` |
| `{{date.contractEnd}}` | Date | Contract start + term | `2026-12-15` |

### Relative Dates (Computed)

```handlebars
{{date.daysSince(customer.accountPlan.lastUpdated)}}
```

**Output**: `37` (days since account plan update)

---

## Complex Conditionals

### Multiple Conditions

```handlebars
{{#if (and customer.hasAccountPlan (gte workflow.renewalARR 50000))}}
  Strategic account with >$50K ARR - Enhanced escalation required
{{/if}}
```

### Nested Conditionals

```handlebars
{{#if workflow.isOverdue}}
  {{#if (gte workflow.daysOverdue 30)}}
    War Room Activation Required
  {{else if (gte workflow.daysOverdue 15)}}
    VP CS Involvement Required
  {{else}}
    Manager FYI
  {{/if}}
{{/if}}
```

---

## Resolution Process

### How Variables Are Resolved

1. **Workflow Engine** receives a workflow config with template variables
2. **Data Fetcher** queries `customers_with_team` view for customer ID
3. **Template Resolver** builds context object:

```javascript
const context = {
  customer: {
    id: customer.id,
    name: customer.name,
    arr: customer.arr,
    renewalDate: customer.renewal_date,
    hasAccountPlan: customer.has_account_plan,
    accountPlan: {
      owner: customer.account_plan_owner_email,
      ownerName: customer.account_plan_owner_name,
      team: [customer.account_executive_email, customer.solutions_architect_email],
      lastUpdated: customer.account_plan_last_updated
    }
  },
  csm: {
    id: customer.csm_id,
    email: customer.csm_email,
    name: customer.csm_name,
    manager: customer.csm_manager_email,
    managerName: customer.csm_manager_name
  },
  workflow: {
    currentStage: determineStage(customer.renewal_date),
    daysUntilRenewal: calculateDays(customer.renewal_date),
    renewalARR: customer.arr,
    currentDate: new Date().toISOString(),
    isOverdue: customer.renewal_date < new Date()
  },
  company: {
    name: companySettings.company_name,
    vpCustomerSuccess: companySettings.vp_customer_success_email,
    ceo: companySettings.ceo_email
  }
  // ... etc
};
```

4. **Handlebars** compiles template with context
5. **Output** is sent to LLM or displayed in UI

---

## API Payload Examples

### Notification Payload

```javascript
// Template in workflow config
{
  apiEndpoint: 'POST /api/team-escalations/notify',
  payload: {
    customer_id: '{{customer.id}}',
    escalation_level: 'critical',
    notification_targets: [
      '{{csm.manager}}',
      '{{company.vpCustomerSuccess}}',
      '{{#if customer.hasAccountPlan}}{{accountTeam.allEmails}}{{/if}}'
    ]
  }
}
```

**Resolved Payload**:
```json
{
  "customer_id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "escalation_level": "critical",
  "notification_targets": [
    "alice.manager@acme.com",
    "john.vp@acme.com",
    "alice.ae@acme.com",
    "bob.sa@acme.com",
    "carol.csm@acme.com",
    "exec@acme.com"
  ]
}
```

### Slack Channel Creation

```javascript
// Template
{
  apiEndpoint: 'POST /api/collaboration/create-slack-channel',
  payload: {
    channel_name: 'critical-{{customer.slug}}',
    members: [
      '{{csm.email}}',
      '{{csm.manager}}',
      '{{company.vpCustomerSuccess}}',
      '{{#if customer.hasAccountPlan}}{{accountTeam.allEmails}}{{/if}}'
    ]
  }
}
```

**Resolved**:
```json
{
  "channel_name": "critical-acme-corp",
  "members": [
    "carol.csm@acme.com",
    "alice.manager@acme.com",
    "john.vp@acme.com",
    "alice.ae@acme.com",
    "bob.sa@acme.com",
    "exec@acme.com"
  ]
}
```

---

## UI Artifact Visibility

### Conditional Visibility

```javascript
{
  id: 'account-plan-badge',
  type: 'badge',
  content: '⭐ Strategic Account',
  visible: '{{customer.hasAccountPlan}}',  // Boolean template variable
  style: 'prominent'
}
```

**Resolution**:
- If `customer.hasAccountPlan === true`: Badge renders
- If `customer.hasAccountPlan === false`: Badge hidden

### Dynamic Content

```javascript
{
  id: 'days-until-renewal',
  type: 'text',
  content: '{{#if workflow.isOverdue}}{{workflow.daysOverdue}} days overdue{{else}}{{workflow.daysUntilRenewal}} days until renewal{{/if}}'
}
```

**Output Examples**:
- Not overdue: `5 days until renewal`
- Overdue: `3 days overdue`

---

## Helper Functions (Handlebars)

### Built-in Helpers

| Helper | Description | Example |
|--------|-------------|---------|
| `{{#if}}` | Conditional | `{{#if customer.hasAccountPlan}}...{{/if}}` |
| `{{#unless}}` | Inverse conditional | `{{#unless workflow.isOverdue}}...{{/unless}}` |
| `{{#each}}` | Loop | `{{#each accountTeam.allEmails}}{{this}}{{/each}}` |
| `{{math}}` | Math operations | `{{math workflow.daysUntilRenewal "*" 24}}` (hours) |

### Custom Helpers

```javascript
// Greater than or equal
Handlebars.registerHelper('gte', (a, b) => a >= b);

// Usage
{{#if (gte workflow.renewalARR 100000)}}
  High-value renewal
{{/if}}
```

```javascript
// AND logic
Handlebars.registerHelper('and', (...args) => {
  return args.slice(0, -1).every(Boolean);
});

// Usage
{{#if (and customer.hasAccountPlan (gte workflow.renewalARR 50000))}}
  Strategic high-value renewal
{{/if}}
```

```javascript
// Days since
Handlebars.registerHelper('daysSince', (date) => {
  const now = new Date();
  const then = new Date(date);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
});

// Usage
Last account plan update: {{daysSince customer.accountPlan.lastUpdated}} days ago
```

---

## Error Handling

### Missing Variables

If a variable is undefined (e.g., customer has no account plan):

```handlebars
{{customer.accountPlan.owner}}
```

**Behavior**: Returns empty string `""`, does not error.

**Safe Access Pattern**:
```handlebars
{{#if customer.hasAccountPlan}}
  Owner: {{customer.accountPlan.owner}}
{{else}}
  No account plan assigned
{{/if}}
```

### Null Manager

If CSM has no manager (top-level executive):

```handlebars
{{csm.manager}}
```

**Behavior**: Returns empty string `""`.

**Escalation Fallback**:
```handlebars
{{#if csm.manager}}
  Escalate to: {{csm.manager}}
{{else}}
  Escalate to: {{company.vpCustomerSuccess}}
{{/if}}
```

---

## Full Example: Emergency Workflow Prompt

```handlebars
# EMERGENCY RENEWAL - {{customer.name}}

## RENEWAL DETAILS
- **Customer**: {{customer.name}} ({{customer.industry}})
- **ARR**: ${{customer.arr}}
- **Renewal Date**: {{customer.renewalDate}}
- **Days Until Renewal**: {{workflow.daysUntilRenewal}} days
- **Hours Remaining**: {{workflow.hoursUntilRenewal}} hours

## ASSIGNED TEAM
- **CSM**: {{csm.name}} ({{csm.email}})
- **CSM Manager**: {{csm.managerName}} ({{csm.manager}})

{{#if customer.hasAccountPlan}}
## STRATEGIC ACCOUNT - Account Plan Active
- **Account Plan Owner**: {{customer.accountPlan.ownerName}}
- **Account Team**: {{accountTeam.aeName}}, {{accountTeam.saName}}, {{accountTeam.executiveSponsorName}}
- **Last Updated**: {{customer.accountPlan.lastUpdated}}
{{/if}}

## ESCALATION PROTOCOL

{{#if (gte workflow.renewalARR 100000)}}
**TIER 1 ESCALATION (>$100K ARR)**
- [ ] CEO notified: {{company.ceo}}
- [ ] Twice-daily standups (9am + 3pm)
- [ ] Create Slack channel: #emergency-{{customer.slug}}
{{else if (gte workflow.renewalARR 50000)}}
**TIER 2 ESCALATION (>$50K ARR)**
- [ ] Executive Sponsor notified
- [ ] Daily team sync (9am)
{{else}}
**STANDARD ESCALATION**
- [ ] Manager notified: {{csm.manager}}
- [ ] VP CS notified: {{company.vpCustomerSuccess}}
{{/if}}

{{#if customer.hasAccountPlan}}
**ACCOUNT TEAM ACTIVATION**
- [ ] Notify entire account team: {{accountTeam.allEmails}}
- [ ] Account Plan owner becomes co-pilot: {{customer.accountPlan.owner}}
{{/if}}

## MANAGER ACKNOWLEDGMENT REQUIRED
Before proceeding, {{csm.managerName}} must acknowledge:
- [ ] I have reviewed the emergency ({{workflow.hoursUntilRenewal}} hours remaining)
- [ ] I commit to daily involvement until resolved

**Gate**: Workflow cannot proceed without manager sign-off.
```

**Resolved Output** (for Acme Corp with $125K ARR, 48 hours until renewal):

```
# EMERGENCY RENEWAL - Acme Corp

## RENEWAL DETAILS
- **Customer**: Acme Corp (SaaS)
- **ARR**: $125000
- **Renewal Date**: 2025-12-15
- **Days Until Renewal**: 2 days
- **Hours Remaining**: 48 hours

## ASSIGNED TEAM
- **CSM**: Carol CSM (carol.csm@acme.com)
- **CSM Manager**: Alice Manager (alice.manager@acme.com)

## STRATEGIC ACCOUNT - Account Plan Active
- **Account Plan Owner**: Alice AE
- **Account Team**: Alice AE, Bob SA, Executive Leader
- **Last Updated**: 2025-09-01

## ESCALATION PROTOCOL

**TIER 1 ESCALATION (>$100K ARR)**
- [ ] CEO notified: jane.ceo@acme.com
- [ ] Twice-daily standups (9am + 3pm)
- [ ] Create Slack channel: #emergency-acme-corp

**ACCOUNT TEAM ACTIVATION**
- [ ] Notify entire account team: alice.ae@acme.com, bob.sa@acme.com, carol.csm@acme.com, exec@acme.com
- [ ] Account Plan owner becomes co-pilot: alice.ae@acme.com

## MANAGER ACKNOWLEDGMENT REQUIRED
Before proceeding, Alice Manager must acknowledge:
- [ ] I have reviewed the emergency (48 hours remaining)
- [ ] I commit to daily involvement until resolved

**Gate**: Workflow cannot proceed without manager sign-off.
```

---

## Testing Template Resolution

### Unit Test Example

```javascript
const context = {
  customer: { name: 'Test Corp', arr: 75000 },
  workflow: { renewalARR: 75000 }
};

const template = '{{#if (gte workflow.renewalARR 50000)}}Escalate{{else}}Standard{{/if}}';
const result = Handlebars.compile(template)(context);

expect(result).toBe('Escalate');
```

### Integration Test

1. Create test customer with known values
2. Trigger workflow
3. Capture resolved LLM prompt
4. Assert variables resolved correctly

---

## Performance Considerations

### View vs. Join Performance

We use pre-built views (`customers_with_team`, `users_with_manager`) to avoid N+1 queries during template resolution.

**Bad** (N+1 queries):
```javascript
for each customer {
  fetch csm
  fetch csm.manager
  fetch account team
  resolve template
}
```

**Good** (single query):
```sql
SELECT * FROM customers_with_team WHERE id = ?
-- Returns customer + csm + manager + account team in one query
```

### Caching

For high-traffic workflows, cache company settings (rarely change):

```javascript
const companySettings = await cache.get('company_settings') || await db.query('SELECT * FROM company_settings LIMIT 1');
```

---

## Summary

**Key Principles**:
1. **Handlebars syntax**: `{{namespace.variable}}`
2. **Database views**: Pre-join data for performance
3. **Safe conditionals**: Always check existence with `{{#if}}`
4. **Custom helpers**: Extend Handlebars for complex logic
5. **Error tolerance**: Missing variables return empty string, not errors

**Next Steps**:
1. Implement template resolver in workflow engine
2. Build custom Handlebars helpers (gte, and, daysSince)
3. Create UI preview for template testing
4. Add template validation to workflow config linter
