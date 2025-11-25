/**
 * Negotiation Guide Slide
 *
 * Purpose: Provide talking points and pricing flexibility for renewal negotiations
 * Used in: InHerSight 90-day renewal, 120-day at-risk workflows
 * Artifact: Document (generic document, read-only)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const negotiationGuideSlide: UniversalSlideBuilder = (context): any => ({
  id: 'negotiation-guide',
  version: '2',
  name: 'Negotiation Guide',
  category: 'renewal',

  structure: {
    id: 'negotiation-guide',
    title: 'Negotiation Playbook',
    description: 'Talking points and pricing flexibility guide',
    label: 'Negotiation',
    stepMapping: 'negotiation-guide',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Time to close the deal with {{customer.name}}! I've prepared a negotiation playbook with talking points, objection handling, and pricing flexibility guidelines.`,
        buttons: [
          {
            label: 'Review Playbook',
            value: 'review',
            'label-background': 'bg-purple-600',
            'label-text': 'text-white',
          },
          {
            label: 'Start Negotiation',
            value: 'start',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
      },
      branches: {
        review: {
          response: 'Take a look at the playbook. Use these guidelines during your negotiation calls.',
          actions: [],
        },
        start: {
          response: 'Good luck with the negotiation! Remember to lead with value and stay within the approved pricing range.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Ready for the negotiation?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'negotiation-guide',
          type: 'document',
          title: 'Negotiation Playbook',
          content: `# {{customer.name}} - Negotiation Playbook

**Account**: {{customer.name}}
**Proposal Value**: \${{renewal.proposed_arr}}
**CSM**: {{user.full_name}}
**Last Updated**: {{current_date}}

---

## Quick Reference

### Pricing Parameters
- **Proposed Price**: \${{renewal.proposed_arr}}
- **Floor Price**: \${{renewal.floor_price}}
- **Maximum Discount**: {{renewal.max_discount_pct}}%
- **Approval Required Below**: \${{renewal.approval_threshold}}

### Decision Makers
- **Primary**: {{customer.decision_maker_primary}}
- **Influencer**: {{customer.decision_maker_influencer}}
- **Financial Approver**: {{customer.decision_maker_finance}}

---

## Value Proposition Framework

### Lead with Value
"{{customer.name}} has seen strong results with InHerSight:
- **{{customer.brand_impressions}}** brand impressions reaching qualified candidates
- **{{customer.apply_clicks}}** job applications from engaged women in tech
- **{{customer.profile_views}}** profile views demonstrating employer brand strength"

### ROI Talking Points
1. **Cost Efficiency**:
   - Cost per application: \${{metrics.cost_per_application}}
   - Industry benchmark: \${{metrics.industry_benchmark}}
   - Your efficiency: {{metrics.efficiency_vs_benchmark}}

2. **Quality of Reach**:
   - Access to {{platform.audience_size}} women in tech
   - {{platform.engagement_rate}} average engagement rate
   - Higher retention rates for diverse hires

3. **Brand Impact**:
   - Measurable improvement in employer brand perception
   - Competitive advantage in DEI recruitment
   - Authentic employer reviews from real employees

---

## Common Objections & Responses

### "The price is too high"

**Diagnose First**:
- Is it truly budget, or is it value perception?
- What's the comparison point? (competitor, prior year, budget allocation)
- Who needs to approve, and what's their concern?

**Response Framework**:
"I understand budget is always a consideration. Let's look at the ROI:
- You're currently paying $X per application through InHerSight
- Industry average for tech recruiting is $Y per application
- That means you're {{#if savings}}saving{{else}}investing{{/if}} $Z per hire

Can we explore what would work within your budget while maintaining the core value?"

**Negotiation Options**:
1. **Payment Terms**: Spread payments quarterly vs. annual
2. **Contract Length**: 2-year commitment for lower annual cost
3. **Package Adjustment**: Reduce scope to fit budget (if approved)
4. **Value-Add**: Include bonus content or profile optimization

### "We need to reduce spend / cut vendors"

**Response Framework**:
"I appreciate you being direct about budget pressures. Let's talk about impact:
- How many hires did InHerSight contribute to this year?
- What would it cost to replace that candidate pipeline?
- What's the opportunity cost of reduced employer brand visibility?

Instead of cutting completely, could we right-size the investment to maintain your presence while fitting the new budget?"

**Options**:
- Reduce to core package: \${{renewal.base_package_price}}
- Pause non-essential features
- Month-to-month during budget uncertainty (premium pricing)

### "We want to try other platforms / competitors"

**Response Framework**:
"Exploring options makes sense. I'm curious—what are you hoping to get that you're not seeing with InHerSight?"

*Listen for the real concern: reach, price, features, results*

"Here's what sets InHerSight apart:
- Only platform focused exclusively on women in tech
- Authentic peer reviews, not just job boards
- {{customer.success_metric}} improvement in your metrics this year

What if we structured a pilot expansion with performance guarantees?"

**Competitive Intelligence**:
- **Fairygodboss**: Broader audience, less tech-focused
- **Glassdoor**: General recruitment, not diversity-specific
- **Built In**: Tech-focused but not diversity-centric
- **InHerSight USP**: Only platform with women-in-tech focus + reviews + jobs

### "We need more time to decide"

**Diagnose**:
- Is this real (budget cycle, approval process) or a stall?
- What's the actual decision timeline?
- Who else needs to be involved?

**Response Framework**:
"I want to respect your timeline. Help me understand:
- When does your fiscal planning finalize?
- Who else needs to review this proposal?
- What information would help move the decision forward?

I want to make sure we can lock in your current pricing and avoid any service interruption."

**Create Urgency** (if appropriate):
- Pricing guarantee expires: {{renewal.pricing_deadline}}
- Current contract ends: {{customer.renewal_date}}
- Q1 hiring needs start: {{customer.hiring_season_start}}

### "We're not seeing enough value"

**Diagnose**:
- Which metrics are they looking at?
- What were their expectations vs. reality?
- Are they using the platform fully?

**Response Framework**:
"This is important feedback. Let's dig into the data together:
- What success metrics matter most to your team?
- Let me pull your engagement analytics and see where we can optimize
- Have you been using {{underutilized_feature}}? I've seen similar companies get {{feature_benefit}} from it

Let me schedule a strategy session to make sure you're getting full value. If we can't demonstrably improve your results in 60 days, we'll discuss contract adjustments."

---

## Pricing Flexibility Matrix

### Standard Pricing: \${{renewal.proposed_arr}}

| Scenario | Discount | Final Price | Approval Required |
|----------|----------|-------------|-------------------|
| Sign by {{renewal.early_deadline}} | {{pricing.early_discount}}% | \${{pricing.early_price}} | No |
| 2-year commitment | {{pricing.multiyear_discount}}% | \${{pricing.multiyear_price}}/yr | No |
| Reduced package | - | \${{pricing.base_package}} | Manager |
| Custom discount | {{pricing.max_discount}}% | \${{pricing.floor_price}} | VP Approval |

### Discount Approval Process
- **0-{{pricing.csm_discount_limit}}%**: CSM approved
- **{{pricing.csm_discount_limit}}-{{pricing.manager_discount_limit}}%**: Manager approval required
- **Above {{pricing.manager_discount_limit}}%**: VP/Leadership approval

**Discount Justification Required**:
- Competitive pressure (who, what price)
- Budget constraints (verified)
- Strategic account importance
- Risk of churn

---

## Negotiation Tactics

### Create Value, Not Just Discount

**Instead of discounting, offer**:
1. **Extended support**: Quarterly strategy sessions
2. **Priority features**: Early access to new platform features
3. **Content partnership**: Co-branded article or webinar
4. **Hiring toolkit**: Premium resources and guides
5. **Multi-year lock-in**: Price protection for 2+ years

### Anchoring Strategy

1. **Start high**: Present proposed package first
2. **Show value**: Link price to specific outcomes/metrics
3. **Concede strategically**: If discounting, get something in return
   - "I can do $X if we can lock in a 2-year term"
   - "I can include Y feature if we close by Z date"

### Trial Close Questions

- "If we can get to $X, would you be ready to move forward today?"
- "Is price the only concern, or is there something else holding you back?"
- "On a scale of 1-10, how likely are you to renew? What would make it a 10?"

### Know When to Walk

**Red Flags**:
- Demanding below floor pricing
- Unreasonable terms or scope
- Disrespectful negotiation tactics
- No genuine buying intent

**Graceful Exit**:
"I appreciate our partnership, and I want to find a solution that works. Based on what you're looking for, it sounds like we might not be the right fit right now. I'll leave the door open, and I'm happy to revisit if circumstances change."

---

## Closing Checklist

### Before You Negotiate
- [ ] Review customer performance data
- [ ] Understand their budget cycle and constraints
- [ ] Identify all decision makers and influencers
- [ ] Prepare pricing options and approval limits
- [ ] Have contract documents ready

### During Negotiation
- [ ] Lead with value, not price
- [ ] Listen more than talk (70/30 rule)
- [ ] Address objections with questions first
- [ ] Take notes on concerns and commitments
- [ ] Summarize agreements before ending call

### After Negotiation
- [ ] Send summary email within 2 hours
- [ ] Update CRM with notes and next steps
- [ ] Get required approvals for any discounts
- [ ] Send contract within 24 hours
- [ ] Schedule follow-up if not closed

---

## Key Contacts

### Internal Support
- **Manager**: {{user.manager_name}} ({{user.manager_email}})
- **Sales Support**: {{company.sales_support}}
- **Legal/Contracts**: {{company.legal_contact}}
- **Finance/Billing**: {{company.finance_contact}}

### Escalation Path
If you need help:
1. Slack: #csm-support
2. Manager: {{user.manager_name}}
3. Sales leadership: For strategic/large deals

---

## Remember

✅ **Do**:
- Focus on value and outcomes
- Listen actively to understand real concerns
- Be consultative, not transactional
- Protect pricing integrity
- Document everything

❌ **Don't**:
- Lead with discounts
- Make promises you can't keep
- Go below floor without approval
- Rush to close without addressing concerns
- Negotiate via email (use calls!)

---

**Confidence Check**: How confident are you in this renewal?
- **High**: Strong relationship, clear value, budget aligned
- **Medium**: Some concerns, but addressable
- **Low**: Significant risks, may need escalation

If Medium or Low: Loop in your manager before final negotiation.

---

*Good luck! Remember: You're not just closing a deal, you're building a long-term partnership.*
`,
          editable: false,
          visible: true,
        },
      ],
    },

    sidePanel: {
      enabled: true,
      title: {
        text: 'Workflow Progress',
        subtitle: 'Track your progress',
        icon: 'checklist',
      },
      steps: [],
      progressMeter: {
        currentStep: 0,
        totalSteps: 0,
        progressPercentage: 0,
        showPercentage: true,
        showStepNumbers: true,
      },
      showProgressMeter: true,
      showSteps: true,
    },

    onComplete: {
      nextSlide: undefined,
      updateProgress: true,
    },
  },
});
