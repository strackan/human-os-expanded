/**
 * Measure Freebie Impact Slide
 *
 * Purpose: Analyze freebie results and determine next steps for renewal
 * Used in: InHerSight 120-day at-risk workflow
 * Artifact: Document (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const measureFreebieImpactSlide: UniversalSlideBuilder = (context): any => ({
  id: 'measure-freebie-impact',
  version: '2',
  name: 'Measure Freebie Impact',
  category: 'inhersight',
  checklistTitle: 'Analyze freebie results and plan next steps',

  structure: {
    id: 'measure-freebie-impact',
    title: 'Freebie Impact Analysis',
    description: 'Analyze freebie results and plan renewal approach',
    label: 'Impact',
    stepMapping: 'measure-freebie-impact',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `The freebie for {{customer.name}} is complete! Let's review the results and determine our renewal strategy based on the impact.`,
        buttons: [
          {
            label: 'Strong Results!',
            value: 'strong',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'Mixed Results',
            value: 'mixed',
            'label-background': 'bg-yellow-600',
            'label-text': 'text-white',
          },
          {
            label: 'Disappointing',
            value: 'weak',
            'label-background': 'bg-red-600',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'strong': 'strong',
          'mixed': 'mixed',
          'weak': 'weak',
        },
      },
      branches: {
        strong: {
          response: 'Excellent! Strong freebie results give us great momentum for the renewal discussion. Let\'s document the wins and prepare the proposal.',
          actions: ['nextSlide'],
        },
        mixed: {
          response: 'Okay, mixed results mean we need to be strategic. Let\'s analyze what worked and adjust our renewal approach accordingly.',
          actions: ['nextSlide'],
        },
        weak: {
          response: 'Disappointing results are a challenge, but not insurmountable. Let\'s understand what went wrong and decide if we can recover or need to pivot.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'How would you assess the freebie results?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'freebie-impact-report',
          type: 'document',
          title: 'Freebie Impact Report',
          content: `# {{customer.name}} - Freebie Impact Report

**Freebie Type**: {{freebie.type}}
**Execution Period**: {{freebie.start_date}} - {{freebie.end_date}}
**Measurement Date**: {{current_date}}
**Analyst**: {{user.full_name}}

---

## Executive Summary

**Overall Assessment**: [Strong Success / Moderate Success / Mixed Results / Below Expectations]

**Key Takeaway**: [One-sentence summary of results and implications]

**Renewal Confidence**: {{renewal.confidence_before}} → {{renewal.confidence_after}} ({{confidence.change}})

---

## Freebie Performance Metrics

### Target vs. Actual Results

| Metric | Target | Actual | Variance | Status |
|--------|--------|--------|----------|--------|
| {{metric.1}} | {{target.1}} | {{actual.1}} | {{variance.1}} | ✅/⚠️/❌ |
| {{metric.2}} | {{target.2}} | {{actual.2}} | {{variance.2}} | ✅/⚠️/❌ |
| {{metric.3}} | {{target.3}} | {{actual.3}} | {{variance.3}} | ✅/⚠️/❌ |

**Overall Performance**: {{overall.performance_pct}}% of targets achieved

---

## Detailed Results Analysis

### What Worked Well

**Quantitative Wins**:
1. **{{win.1}}**: {{win.1.detail}}
   - Metric: {{win.1.metric}}
   - Impact: {{win.1.impact}}

2. **{{win.2}}**: {{win.2.detail}}
   - Metric: {{win.2.metric}}
   - Impact: {{win.2.impact}}

**Qualitative Wins**:
- {{qualitative.win.1}}
- {{qualitative.win.2}}
- {{qualitative.win.3}}

---

### What Fell Short

**Quantitative Misses**:
1. **{{miss.1}}**: {{miss.1.detail}}
   - Expected: {{miss.1.expected}}
   - Actual: {{miss.1.actual}}
   - Why: {{miss.1.reason}}

2. **{{miss.2}}**: {{miss.2.detail}}
   - Expected: {{miss.2.expected}}
   - Actual: {{miss.2.actual}}
   - Why: {{miss.2.reason}}

**Qualitative Concerns**:
- {{qualitative.concern.1}}
- {{qualitative.concern.2}}

---

### Root Cause Analysis

**Why Results Exceeded/Met/Missed Expectations**:

**Factors Under Our Control**:
- {{factor.internal.1}}
- {{factor.internal.2}}

**External Factors**:
- {{factor.external.1}}
- {{factor.external.2}}

**Customer-Side Factors**:
- {{factor.customer.1}}
- {{factor.customer.2}}

---

## Customer Response

### Feedback During/After Freebie

**Customer's Perspective**:
> "[Direct quote from customer about freebie]"

> "[Additional feedback]"

**Satisfaction Level**: [Very Satisfied / Satisfied / Neutral / Dissatisfied]

### Behavior Changes

**Engagement**:
- Platform usage: {{engagement.before}} → {{engagement.after}} ({{engagement.change}})
- Response time: {{response.before}} → {{response.after}}
- Meeting attendance: {{meetings.before}} → {{meetings.after}}

**Sentiment Shift**:
- Before freebie: {{sentiment.before}}
- After freebie: {{sentiment.after}}
- Change: {{sentiment.change_direction}}

---

## Relationship Impact

### Trust & Goodwill

**Did the freebie rebuild trust?**: [Yes / Partially / No]

**Evidence**:
- {{evidence.1}}
- {{evidence.2}}
- {{evidence.3}}

**Customer's Tone Shift**:
- Before: [Frustrated / Disappointed / Skeptical / Checked Out]
- After: [Enthusiastic / Optimistic / Cautiously Open / Still Skeptical]

---

### Health Score Movement

**Health Score Trajectory**:
- Pre-freebie: {{health.before}}/100
- Post-freebie: {{health.after}}/100
- Change: {{health.change}} points ({{health.percentage}}%)

**Component Breakdown**:
| Component | Before | After | Change |
|-----------|--------|-------|--------|
| Usage | {{usage.before}} | {{usage.after}} | {{usage.change}} |
| Engagement | {{eng.before}} | {{eng.after}} | {{eng.change}} |
| Satisfaction | {{sat.before}} | {{sat.after}} | {{sat.change}} |
| Growth | {{growth.before}} | {{growth.after}} | {{growth.change}} |

---

## Business Outcomes

### Tangible Results for Customer

**Direct Benefits**:
1. {{benefit.1}}: {{benefit.1.detail}}
2. {{benefit.2}}: {{benefit.2.detail}}
3. {{benefit.3}}: {{benefit.3.detail}}

**ROI Evidence**:
- Investment (freebie value): \${{freebie.value}}
- Measurable return: \${{return.value}}
- ROI: {{roi.percentage}}%

### Strategic Value

**Beyond the Numbers**:
- {{strategic.value.1}}
- {{strategic.value.2}}
- {{strategic.value.3}}

---

## Renewal Implications

### Renewal Outlook

**Likelihood to Renew**:
- Before freebie: {{renewal.before}}%
- After freebie: {{renewal.after}}%
- Change: {{renewal.change_direction}} {{renewal.change_amount}}%

**Confidence Level**: [High / Medium / Low]

---

### Renewal Strategy Based on Results

{{#if results.strong}}
### Strong Results → Momentum Play

**Approach**: Leverage freebie success to drive renewal with potential expansion

**Key Messages**:
- "The freebie showed what's possible when we work together"
- "Let's scale these results across your whole program"
- "Here's how we can build on this momentum"

**Proposed Package**:
- Base renewal: \${{renewal.base}}
- Expansion (based on freebie success): \${{renewal.expansion}}
- Total: \${{renewal.total}}

**Timeline**: Strike while iron is hot—propose within 1 week

{{/if}}

{{#if results.mixed}}
### Mixed Results → Diagnostic Approach

**Approach**: Use freebie learnings to right-size renewal and set realistic expectations

**Key Messages**:
- "We learned a lot from this test"
- "Let's focus on what clearly works for you"
- "Here's a tailored approach based on these insights"

**Proposed Package**:
- Adjusted scope based on what worked: \${{renewal.adjusted}}
- Focus areas: {{focus.areas}}

**Timeline**: 2-3 weeks to refine proposal based on learnings

{{/if}}

{{#if results.weak}}
### Weak Results → Recovery Decision Point

**Approach**: Honest assessment and decision on path forward

**Key Messages**:
- "Let's be direct about what we're seeing"
- "What would success actually look like for you?"
- "Should we continue or make a change?"

**Options**:
1. **Pivot Strategy**: Try different approach (\${{option.pivot}})
2. **Scale Back**: Minimal commitment while we figure it out (\${{option.minimal}})
3. **Pause/Exit**: Graceful offboarding or pause

**Timeline**: Customer decides—no pressure

{{/if}}

---

## Competitive Position

### How Freebie Affected Competitive Dynamics

**Before Freebie**:
- Competitive pressure: {{competitive.before}}
- Customer exploring alternatives: {{exploring.before}}

**After Freebie**:
- Competitive pressure: {{competitive.after}}
- Customer exploring alternatives: {{exploring.after}}

**Our Position**:
- Stronger / Maintained / Weaker

---

## Internal Cost-Benefit

### Investment Analysis

**Costs**:
- Freebie value: \${{cost.freebie}}
- Internal time: {{cost.hours}} hours × \${{cost.hourly_rate}} = \${{cost.time}}
- External resources: \${{cost.external}}
- **Total Investment**: \${{cost.total}}

**Return (if renewal)**:
- Renewal value: \${{return.renewal}}
- Margin: {{return.margin}}%
- **Net Value**: \${{return.net}}

**Payback**: {{payback.timeline}}

---

### Was It Worth It?

**ROI on Freebie**: {{roi.percentage}}%

**Strategic Value**: [High / Medium / Low]

**Would We Do It Again?**: [Yes / Maybe / No]

**Rationale**:
{{decision.rationale}}

---

## Lessons Learned

### For This Account

**What We Learned About {{customer.name}}**:
1. {{learning.customer.1}}
2. {{learning.customer.2}}
3. {{learning.customer.3}}

**How to Apply These Learnings**:
- Renewal strategy: {{application.renewal}}
- Future engagement: {{application.engagement}}
- Risk prevention: {{application.prevention}}

---

### For Future Freebies

**What Worked**:
1. {{worked.1}}
   - **Replicable?**: Yes/No
   - **When to use**: {{worked.1.when}}

2. {{worked.2}}
   - **Replicable?**: Yes/No
   - **When to use**: {{worked.2.when}}

**What to Avoid**:
1. {{avoid.1}}
   - **Why**: {{avoid.1.reason}}
   - **Alternative**: {{avoid.1.alternative}}

2. {{avoid.2}}
   - **Why**: {{avoid.2.reason}}
   - **Alternative**: {{avoid.2.alternative}}

**Recommendations for Future At-Risk Accounts**:
- {{recommendation.1}}
- {{recommendation.2}}
- {{recommendation.3}}

---

## Next Steps

### Immediate Actions (This Week)

- [ ] Share results with customer (presentation/email)
- [ ] Schedule renewal discussion meeting
- [ ] Prepare renewal proposal based on results
- [ ] Update CRM with freebie outcomes
- [ ] Brief manager on results and renewal strategy

---

### Renewal Discussion Prep

**Meeting Date**: {{meeting.renewal_date}}

**Attendees**:
- Customer: {{attendees.customer}}
- Our team: {{attendees.our_team}}

**Agenda**:
1. Review freebie results together
2. Discuss what customer learned
3. Present renewal proposal
4. Address questions/concerns
5. Agree on next steps

**Materials to Prepare**:
- [ ] Freebie results deck
- [ ] Renewal proposal with pricing options
- [ ] Case studies or additional proof points
- [ ] Contract ready to sign

---

### Follow-up Timeline

**Week 1**: Results presentation
**Week 2**: Renewal proposal
**Week 3**: Negotiate and refine
**Week 4**: Close deal (target)

---

## Risk Factors Still Present

**Ongoing Concerns**:
- {{risk.1}}: Mitigation: {{mitigation.1}}
- {{risk.2}}: Mitigation: {{mitigation.2}}

**Red Flags**:
- [ ] Customer still unresponsive
- [ ] Feedback lukewarm despite good results
- [ ] Budget constraints unchanged
- [ ] Competitive pressure increasing
- [ ] Internal champion still uninvolved

**Escalation Needed?**: [Yes / No]
- If yes, escalate to: {{escalation.to}}

---

## Final Assessment

**In one sentence, what did this freebie accomplish?**
[Your summary here]

**Renewal Recommendation**:
- **Action**: [Full renewal / Adjusted renewal / Pause / Exit]
- **Confidence**: [High / Medium / Low]
- **Reasoning**: {{reasoning}}

---

*This analysis will guide our final renewal approach. Share with manager before proceeding to renewal proposal.*
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
