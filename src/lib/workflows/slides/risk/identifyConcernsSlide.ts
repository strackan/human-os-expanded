/**
 * Identify Concerns Slide
 *
 * Purpose: Analyze root causes of at-risk status and customer concerns
 * Used in: InHerSight 120-day at-risk workflow
 * Artifact: Document (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const identifyConcernsSlide: UniversalSlideBuilder = (context): any => ({
  id: 'identify-concerns',
  version: '2',
  name: 'Identify Customer Concerns',
  category: 'risk',

  structure: {
    id: 'identify-concerns',
    title: 'Identify Concerns',
    description: 'Understand root causes of at-risk status',
    label: 'Concerns',
    stepMapping: 'identify-concerns',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `{{customer.name}} is showing at-risk signals with a health score of {{customer.health_score}}/100. Let's identify the core concerns so we can create a recovery strategy.`,
        buttons: [
          {
            label: 'Primary KPI Not Met',
            value: 'kpi',
            'label-background': 'bg-red-600',
            'label-text': 'text-white',
          },
          {
            label: 'Low Engagement/Usage',
            value: 'engagement',
            'label-background': 'bg-orange-600',
            'label-text': 'text-white',
          },
          {
            label: 'Support/Product Issues',
            value: 'support',
            'label-background': 'bg-yellow-600',
            'label-text': 'text-white',
          },
          {
            label: 'Budget/Pricing Concerns',
            value: 'budget',
            'label-background': 'bg-purple-600',
            'label-text': 'text-white',
          },
          {
            label: 'Multiple Issues',
            value: 'multiple',
            'label-background': 'bg-gray-700',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'kpi': 'kpi',
          'engagement': 'engagement',
          'support': 'support',
          'budget': 'budget',
          'multiple': 'multiple',
        },
      },
      branches: {
        kpi: {
          response: 'Understanding the KPI gap is crucial. Let\'s document what was expected vs. delivered and create a recovery plan.',
          actions: ['nextSlide'],
        },
        engagement: {
          response: 'Low engagement often indicates misalignment. Let\'s explore what\'s causing the lack of usage.',
          actions: ['nextSlide'],
        },
        support: {
          response: 'Product or support issues can seriously impact satisfaction. Let\'s document these concerns.',
          actions: ['nextSlide'],
        },
        budget: {
          response: 'Budget pressure is challenging but solvable. Let\'s understand the financial constraints.',
          actions: ['nextSlide'],
        },
        multiple: {
          response: 'Multiple issues require a comprehensive approach. Let\'s prioritize and address them systematically.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'What\'s the primary concern causing the at-risk status?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'concern-analysis',
          type: 'document',
          title: 'At-Risk Analysis',
          content: `# {{customer.name}} - At-Risk Analysis

**Health Score**: {{customer.health_score}}/100
**Risk Level**: {{customer.risk_level}}
**Days to Renewal**: {{customer.days_to_renewal}}
**Analysis Date**: {{current_date}}

---

## Risk Indicators

### Quantitative Signals
- **Health Score Trend**: {{customer.health_trend}}
- **Usage Metrics**: {{customer.usage_metrics}}
- **Engagement Level**: {{customer.engagement_level}}
- **Support Ticket Volume**: {{customer.support_tickets}}
- **NPS/Satisfaction Score**: {{customer.satisfaction_score}}

### Qualitative Signals
- **Sentiment in Recent Interactions**: [Positive / Neutral / Negative]
- **Response Time to Outreach**: [Fast / Slow / Unresponsive]
- **Stakeholder Changes**: [Key contacts departed? New decision makers?]
- **Competitive Activity**: [Evaluating alternatives?]

---

## Root Cause Analysis

### Primary Concern
**Category**: [KPI Not Met / Low Engagement / Support Issues / Budget / Multiple]

**Specific Issue**:
[Describe the core problem in detail]

**Customer's Perspective**:
[What has the customer said about this? Direct quotes if available]

**When It Started**:
[Timeline of when the concern emerged]

---

## Detailed Concern Breakdown

### Performance/KPI Concerns
{{#if concerns.kpi}}
**Expected Results**:
-

**Actual Results**:
-

**Gap Analysis**:
-

**Contributing Factors**:
- [ ] Unclear success metrics at start
- [ ] Unrealistic expectations
- [ ] Changes in customer's business
- [ ] Platform limitations
- [ ] Implementation issues
- [ ] Market conditions
{{/if}}

### Engagement/Usage Concerns
{{#if concerns.engagement}}
**Usage Patterns**:
- Login frequency: {{usage.login_frequency}}
- Active users: {{usage.active_users}}
- Feature adoption: {{usage.feature_adoption}}

**Barriers to Engagement**:
- [ ] Platform too complex
- [ ] Lack of training/onboarding
- [ ] Internal champion left
- [ ] Competing priorities
- [ ] User experience issues
- [ ] Integration challenges
{{/if}}

### Support/Product Issues
{{#if concerns.support}}
**Recent Issues**:
1.
2.
3.

**Resolution Status**:
- Open tickets: {{support.open_tickets}}
- Average resolution time: {{support.avg_resolution}}
- Customer satisfaction with support: {{support.csat}}

**Impact on Satisfaction**:
[How these issues affected the relationship]
{{/if}}

### Budget/Pricing Concerns
{{#if concerns.budget}}
**Financial Context**:
- Current spend: \${{customer.current_arr}}
- Perceived value: [High / Fair / Low]
- Budget changes: [Increased / Stable / Decreased]
- Competing budget priorities: [List]

**Pricing Perception**:
- "Too expensive for what we get"
- "Better alternatives available"
- "Budget cuts across all vendors"
- "ROI not clear enough"
{{/if}}

---

## Impact Assessment

### Business Impact on Customer
**Severity**: [Critical / High / Medium / Low]

**Consequences if we lose this customer**:
- Revenue impact: \${{customer.current_arr}}
- Strategic importance: [High / Medium / Low]
- Reference value: [Strong / Moderate / Minimal]
- Expansion potential: \${{customer.expansion_potential}}

### Relationship Health
**Executive Sponsorship**: [Strong / Weak / None]
**Champion Status**: [Active / Passive / Gone]
**Decision Maker Access**: [Good / Limited / None]

---

## Customer Sentiment

### Recent Feedback (Last 30 Days)
**Positive**:
-

**Negative**:
-

**Neutral/Questions**:
-

### Relationship Strength
- **Trust Level**: [High / Medium / Low]
- **Communication Quality**: [Open / Guarded / Difficult]
- **Willingness to Collaborate**: [Yes / Maybe / No]

---

## Competitive Pressure

**Are they evaluating alternatives?**: [Yes / No / Unknown]

{{#if competitive.active}}
**Competitors Mentioned**:
1. {{competitor.name_1}} - {{competitor.status_1}}
2. {{competitor.name_2}} - {{competitor.status_2}}

**What competitors are offering**:
-

**Our competitive advantages**:
-
{{/if}}

---

## Recovery Opportunities

### Quick Wins (0-2 weeks)
1.
2.
3.

### Medium-term Solutions (1-2 months)
1.
2.
3.

### Long-term Strategic Fixes (3+ months)
1.
2.
3.

---

## Recommended Recovery Strategy

**Approach**: [Value Demonstration / Freebie / Relationship Rebuild / Pricing Adjustment / Hybrid]

**Key Actions**:
1.
2.
3.

**Timeline**:
- Immediate (this week):
- Short-term (next 2-4 weeks):
- Medium-term (next 1-2 months):

**Success Metrics**:
- [ ] Health score improves to {{target.health_score}}
- [ ] Engagement increases by {{target.engagement_increase}}%
- [ ] Customer sentiment shifts to positive
- [ ] Renewal commitment secured

---

## Risk Mitigation Plan

### If Recovery Fails
**Plan B**:
- Downgrade to smaller package?
- Extended trial period?
- Pause vs. cancel?
- Graceful offboarding?

**Lessons Learned**:
[What can we learn to prevent this with other customers?]

---

## Next Steps

**Immediate Actions**:
- [ ] Schedule urgent customer meeting
- [ ] Prepare value demonstration or freebie
- [ ] Engage executive sponsor (ours and theirs)
- [ ] Create detailed recovery timeline
- [ ] Get internal alignment on recovery approach

**Owner**: {{user.full_name}}
**Due Date**: {{action.due_date}}
**Follow-up Meeting**: {{action.next_meeting}}

---

*This analysis will guide our recovery strategy. Update this document as we learn more.*
`,
          editable: true,
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
