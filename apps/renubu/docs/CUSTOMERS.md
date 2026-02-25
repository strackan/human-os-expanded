# Customers - Customer-Specific Documentation

**Last Updated:** 2025-11-07
**Version:** 0.1
**Audience:** Internal (Customer Success, Engineering, Product)

---

## Overview

This document catalogs customer-specific code, protocols, technical setups, and known issues. Each customer has a dedicated section with their unique configuration and status.

**Important:** This document contains customer-specific technical details. Handle with care regarding confidentiality.

---

## How to Use This Document

### For Customer Success
- Review before customer calls
- Check known issues and workarounds
- Understand customer's unique setup
- Reference during onboarding

### For Engineering
- Understand custom configurations
- Debug customer-specific issues
- Plan feature enhancements
- Avoid breaking customer setups

### For Product
- Identify common customization patterns
- Prioritize features based on customer needs
- Understand use cases

---

## Customer Template

```markdown
## [Customer Name]

**Status:** Active | Pilot | Churned
**Tier:** Enterprise | Growth | Startup
**Onboarded:** YYYY-MM-DD
**CSM:** Name
**Contract:** $X/month, Y users

### Technical Setup
- Supabase Project: [project-id]
- Custom Domain: app.customer.com (if applicable)
- Integrations: Salesforce, Google Workspace, etc.
- Custom Features: Feature flags, custom workflows, etc.

### Configuration
- Users: X active users
- Workflows: Custom workflow types
- Integrations: Enabled MCP servers
- Settings: Non-default settings

### Custom Code
- File: `src/customers/customer-name/`
- Description: Purpose of custom code
- Owner: Engineering contact

### Known Issues
- Issue #1: Description, workaround
- Issue #2: Description, status

### Support History
- YYYY-MM-DD: Issue resolved, details
- YYYY-MM-DD: Feature request submitted

### Success Metrics
- Adoption: X% users active weekly
- Renewals: Y% improvement
- Satisfaction: NPS score Z
```

---

## Active Customers

### Demo Account (Internal Testing)

**Status:** Active (Internal)
**Tier:** N/A
**Onboarded:** 2025-11-05
**CSM:** Justin Strackany
**Contract:** Internal

### Technical Setup
- Supabase Project: Demo project (localhost)
- Custom Domain: localhost:3000
- Integrations: None (demo mode)
- Demo Mode: Enabled (force-enabled on localhost)

### Configuration
- Users: Multiple test users
- Workflows: All workflow types for testing
- Data: Seed data from `supabase/seed.sql`

### Known Issues
- Demo mode badge always visible (expected)
- RLS bypassed via service role (expected for testing)

### Notes
- Used for development and testing
- Not a real customer
- Can be reset anytime

---

## Pilot Customers

_(To be added as we onboard design partners)_

**Expected:**
- 3-5 design partners in Phase 1 (Dec 2025)
- Focus on SaaS companies with 2-10 CSMs
- Geographic location: US-based initially

---

## Enterprise Customers

_(To be added post-Phase 1)_

---

## Customer-Specific Code

### Location

**Directory Structure:**
```
src/
  customers/
    [customer-slug]/
      workflows/       # Custom workflows
      integrations/    # Custom integrations
      utils/           # Helper functions
      README.md       # Customer-specific docs
```

**Example:**
```
src/customers/acme-corp/
  workflows/
    AcmeRenewalWorkflow.ts
  integrations/
    AcmeAPIClient.ts
  README.md
```

### Guidelines

**When to Create Customer-Specific Code:**
- Unique workflow requirements that can't be configured
- Custom integrations not in MCP marketplace
- Special business logic specific to customer

**When NOT to:**
- Feature would benefit multiple customers → Make it standard
- Can be achieved via configuration → Use settings
- Temporary workaround → Find proper solution

### Maintenance

**Ownership:**
- Customer Success: Owns relationship, knows requirements
- Engineering: Owns code, ensures quality
- Product: Decides if custom code should become standard feature

**Review Cycle:**
- Quarterly: Review all custom code
- Ask: "Should this become a standard feature?"
- Deprecate: Old custom code when standard feature available

---

## Common Custom Scenarios

### Scenario 1: Custom Renewal Workflow

**Customer Need:** Multi-step renewal process with specific approvals

**Solution:**
- Create custom workflow composition
- Add customer-specific slides
- Configure approval routing

**Location:** `src/customers/[customer]/workflows/`

### Scenario 2: Legacy System Integration

**Customer Need:** Integration with proprietary system (no MCP available)

**Solution:**
- Build custom API client
- Create integration service
- Add to customer's environment variables

**Location:** `src/customers/[customer]/integrations/`

### Scenario 3: Custom Data Fields

**Customer Need:** Track additional customer metadata

**Solution:**
- Add JSONB column: `custom_data`
- Document schema in customer README
- Create type definitions

**Location:** `src/customers/[customer]/types/`

---

## Customer Health & Status

### Health Indicators

**Green (Healthy):**
- ✅ 80%+ user adoption
- ✅ Weekly active usage
- ✅ Positive feedback
- ✅ No critical issues

**Yellow (At Risk):**
- ⚠️ 50-80% adoption
- ⚠️ Declining usage
- ⚠️ Open support tickets
- ⚠️ Feature requests unaddressed

**Red (Critical):**
- 🚨 <50% adoption
- 🚨 No usage in 2+ weeks
- 🚨 Escalations from executive
- 🚨 Churn risk

### Monitoring

**Weekly Check (Automated):**
- Query: Active users per customer
- Alert: If usage drops >20% week-over-week
- Action: CSM outreach

**Monthly Review (Manual):**
- Review all customer health scores
- Identify trends
- Plan interventions

---

## Customer Feedback Loop

### Feature Requests

**Process:**
1. Customer requests feature
2. CSM logs in features table (status: "backlog")
3. Product reviews weekly
4. If 2+ customers request → Prioritize
5. CSM notifies customer of status

**Tracking:**
- Location: `features` table in database
- Field: `requested_by_customers` (array of customer IDs)

### Bug Reports

**Process:**
1. Customer reports bug
2. CSM creates GitHub issue (label: "customer-reported")
3. Engineering triages
4. CSM updates customer on status

**SLA:**
- Critical (system down): 4 hours
- High (feature broken): 1 business day
- Medium (inconvenience): 3 business days
- Low (cosmetic): Next sprint

---

## Customer Success Playbooks

### Onboarding Playbook
- See [ONBOARDING.md](./ONBOARDING.md)

### Renewal Playbook (TODO)
- 90-day renewal preparation
- Health score review
- Value demonstration
- Expansion opportunities

### Churn Prevention Playbook (TODO)
- Early warning signs
- Intervention strategies
- Win-back tactics

---

## Compliance & Security

### Customer Data Handling

**RLS Enforcement:**
- All customer data isolated via Row Level Security
- Customers CANNOT see each other's data
- Enforced at database level (not application)

**Data Retention:**
- Active customers: Indefinite
- Churned customers: 90 days post-churn
- Deletion: Full data deletion on request

**Compliance:**
- GDPR: EU customers (not applicable yet)
- SOC 2: Target for 2026
- Data residency: US-based (Supabase)

---

## Related Documentation

- [ONBOARDING.md](./ONBOARDING.md) - Onboarding process
- [SCHEMA.md](./SCHEMA.md) - Database structure
- [API.md](./API.md) - Integration documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment process

---

**Note:** This is a living document. Add new customer sections as they onboard. Update status and configurations regularly.
