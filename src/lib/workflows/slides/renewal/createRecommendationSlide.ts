/**
 * Create Recommendation Slide
 *
 * Purpose: Draft renewal recommendation based on performance and meeting feedback
 * Used in: InHerSight 90-day renewal, 120-day at-risk workflows
 * Artifact: Document (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const createRecommendationSlide: UniversalSlideBuilder = (context): any => ({
  id: 'create-recommendation',
  version: '2',
  name: 'Create Renewal Recommendation',
  category: 'renewal',

  structure: {
    id: 'create-recommendation',
    title: 'Renewal Recommendation',
    description: 'Draft renewal recommendation and pricing',
    label: 'Recommendation',
    stepMapping: 'create-recommendation',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Based on the performance data and meeting feedback, let's create a renewal recommendation for {{customer.name}}. I'll draft the proposal including pricing and contract terms.`,
        buttons: [
          {
            label: 'Create Recommendation',
            value: 'create',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
      },
      branches: {
        create: {
          response: 'I\'ve drafted a renewal recommendation. Please review and adjust as needed before sending to the customer.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Ready to create the renewal recommendation?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'renewal-recommendation',
          type: 'document',
          title: 'Renewal Recommendation',
          content: `# {{customer.name}} - Renewal Recommendation

**Prepared For**: {{customer.primary_contact_name}}, {{customer.primary_contact_title}}
**Prepared By**: {{user.full_name}}, Customer Success Manager
**Date**: {{current_date}}

---

## Executive Summary

{{customer.name}} has been a valued InHerSight partner for {{customer.tenure}}. Based on our performance review and recent discussions, we recommend the following renewal approach:

**Recommendation**: [Standard Renewal / Renewal with Expansion / Custom Package]

**Proposed Contract Value**: \${{renewal.proposed_arr}}
**Contract Term**: {{renewal.proposed_term}}
**Effective Date**: {{renewal.proposed_start_date}}

---

## Performance Highlights

### What's Working Well

**Brand Visibility**:
- Brand impressions: {{customer.brand_impressions}} ({{customer.impressions_trend}})
- Profile views: {{customer.profile_views}} ({{customer.views_trend}})

**Hiring Impact**:
- Job applications: {{customer.apply_clicks}} ({{customer.clicks_trend}})
- Candidate engagement: {{customer.engagement_summary}}

**Platform Health**: {{customer.health_score}}/100

### Areas of Focus

Based on our analysis, we've identified opportunities to enhance:
- [Key focus area 1]
- [Key focus area 2]
- [Key focus area 3]

---

## Renewal Proposal

### Base Renewal
- **Current ARR**: \${{customer.current_arr}}
- **Proposed ARR**: \${{renewal.base_arr}}
- **Term**: {{renewal.base_term}}

### Value-Add Components
{{#if renewal.has_expansion}}
**Expansion Opportunities**:
- {{expansion.component_1}}: \${{expansion.value_1}}
- {{expansion.component_2}}: \${{expansion.value_2}}

**Total Expansion Value**: \${{expansion.total_value}}
{{/if}}

### Pricing Summary
- **Base Renewal**: \${{renewal.base_arr}}
- **Expansion**: \${{renewal.expansion_arr}}
- **Total Contract Value**: \${{renewal.total_arr}}

**Investment Change**: {{renewal.percentage_change}} vs. current contract

---

## Strategic Rationale

### Why This Makes Sense for {{customer.name}}

**Business Alignment**:
- Supports {{customer.hiring_goals}}
- Enhances employer brand in competitive market
- Provides measurable ROI through candidate pipeline

**InHerSight Value**:
- Access to {{platform.audience_size}} engaged women in tech
- Premium placement and content opportunities
- Dedicated CSM support and strategic guidance

### ROI Indicators
- Cost per application: \${{metrics.cost_per_application}}
- Brand impression efficiency: {{metrics.impression_efficiency}}
- Employer brand sentiment: {{metrics.brand_sentiment}}

---

## Contract Terms

### Key Terms
- **Contract Length**: {{contract.term}}
- **Payment Terms**: {{contract.payment_terms}}
- **Auto-Renewal**: {{contract.auto_renewal}}
- **Cancellation Policy**: {{contract.cancellation}}

### Special Considerations
{{#if contract.special_terms}}
- {{contract.special_term_1}}
- {{contract.special_term_2}}
{{/if}}

---

## Next Steps

### Proposed Timeline
1. **This Week**: Review proposal internally
2. **Next Week**: Present to {{customer.decision_makers}}
3. **Week 3**: Finalize terms and pricing
4. **Week 4**: Execute contract renewal

### Required Actions
**From {{customer.name}}**:
- [ ] Review renewal proposal
- [ ] Schedule decision-maker meeting
- [ ] Provide feedback on terms

**From InHerSight Team**:
- [ ] Schedule renewal presentation
- [ ] Prepare contract documents
- [ ] Coordinate with legal/finance as needed

---

## Risk Assessment

**Renewal Confidence**: {{renewal.confidence_level}}

**Risk Factors**:
{{#if renewal.risks}}
- {{renewal.risk_1}}
- {{renewal.risk_2}}
{{else}}
- No significant risk factors identified
{{/if}}

**Mitigation Strategy**:
{{renewal.mitigation_strategy}}

---

## Questions or Concerns?

I'm here to discuss any aspects of this recommendation. Please reach out with:
- Questions about pricing or terms
- Customization requests
- Timeline adjustments
- Budget or approval process needs

**Contact**: {{user.email}}   {{user.phone}}

---

*This recommendation is based on performance data through {{report.end_date}} and customer discussions on {{meeting.date}}.*
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
