/**
 * Deliver Freebie Slide
 *
 * Purpose: Track freebie execution and ensure quality delivery
 * Used in: InHerSight 120-day at-risk workflow
 * Artifact: Document (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const deliverFreebieSlide: UniversalSlideBuilder = (context): any => ({
  id: 'deliver-freebie',
  version: '2',
  name: 'Deliver Freebie',
  category: 'inhersight',

  structure: {
    id: 'deliver-freebie',
    title: 'Freebie Delivery Tracker',
    description: 'Track execution and quality of freebie delivery',
    label: 'Delivery',
    stepMapping: 'deliver-freebie',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `Time to execute the freebie for {{customer.name}}! Let's track the delivery to ensure it's high-quality and on schedule. This is our chance to re-earn their trust.`,
        buttons: [
          {
            label: 'Start Tracking',
            value: 'track',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
        ],
      },
      branches: {
        track: {
          response: 'Great! Use the tracker below to monitor progress and maintain quality standards.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Ready to track freebie delivery?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'freebie-tracker',
          type: 'document',
          title: 'Freebie Delivery Tracker',
          content: `# {{customer.name}} - Freebie Delivery Tracker

**Freebie Type**: {{freebie.type}}
**Start Date**: {{freebie.start_date}}
**Target Completion**: {{freebie.target_date}}
**Owner**: {{user.full_name}}

---

## Execution Checklist

### Phase 1: Planning & Setup (Week 1)
- [ ] Customer approved freebie approach
- [ ] Kick-off meeting scheduled and completed
- [ ] Success metrics agreed upon
- [ ] Timeline confirmed with customer
- [ ] Internal team aligned (content, marketing, ops)
- [ ] Resources allocated
- [ ] Quality standards defined

**Status**: [Not Started / In Progress / Complete]
**Notes**:

---

### Phase 2: Execution (Weeks 2-3)
- [ ] Initial deliverable created
- [ ] Customer involved in process (as appropriate)
- [ ] Quality review completed internally
- [ ] Adjustments made based on feedback
- [ ] On track for timeline
- [ ] Regular updates provided to customer
- [ ] Any blockers resolved

**Status**: [Not Started / In Progress / Complete]
**Notes**:

---

### Phase 3: Delivery & Launch (Week 3-4)
- [ ] Final deliverable completed
- [ ] Customer final approval received
- [ ] Launch/activation executed
- [ ] Initial metrics tracked
- [ ] Customer notified of completion
- [ ] Documentation provided

**Status**: [Not Started / In Progress / Complete]
**Notes**:

---

## Quality Control

### Quality Standards Checklist
- [ ] **Meets "paid" quality level**: Freebie is indistinguishable from paid offering
- [ ] **On-brand for customer**: Aligns with their voice, values, aesthetic
- [ ] **Professional execution**: No shortcuts or "good enough" mentality
- [ ] **Measurable outcomes**: Clear metrics to track success
- [ ] **Customer satisfaction**: Customer is genuinely pleased with quality

**Quality Rating**: [Excellent / Good / Needs Improvement]

### Quality Issues Log
| Date | Issue | Resolution | Owner |
|------|-------|------------|-------|
                                    

---

## Deliverables Tracking

### Specific Deliverables

#### Deliverable 1: {{deliverable.1.name}}
**Description**: {{deliverable.1.description}}
**Due Date**: {{deliverable.1.due_date}}
**Status**: [Not Started / In Progress / Complete / Delayed]
**Completion Date**: {{deliverable.1.completion_date}}
**Customer Feedback**:

---

#### Deliverable 2: {{deliverable.2.name}}
**Description**: {{deliverable.2.description}}
**Due Date**: {{deliverable.2.due_date}}
**Status**: [Not Started / In Progress / Complete / Delayed]
**Completion Date**: {{deliverable.2.completion_date}}
**Customer Feedback**:

---

#### Deliverable 3: {{deliverable.3.name}}
**Description**: {{deliverable.3.description}}
**Due Date**: {{deliverable.3.due_date}}
**Status**: [Not Started / In Progress / Complete / Delayed]
**Completion Date**: {{deliverable.3.completion_date}}
**Customer Feedback**:

---

## Customer Engagement

### Touch Points During Execution

| Date | Type | Attendees | Purpose | Outcome |
|------|------|-----------|---------|---------|
         Call/Email       
         Call/Email       

### Customer Sentiment
**Initial** (at kickoff): [Skeptical / Cautiously Optimistic / Enthusiastic]
**Mid-point**: [Getting Worse / Neutral / Improving]
**At Delivery**: [Disappointed / Satisfied / Delighted]

### Customer Feedback Quotes
> "[Customer feedback here]"

> "[Additional feedback]"

---

## Metrics & Performance

### Freebie-Specific Metrics

**Target Metrics** (set at beginning):
1. {{metric.1}}: Target {{target.1}}
2. {{metric.2}}: Target {{target.2}}
3. {{metric.3}}: Target {{target.3}}

**Actual Results** (measured at completion):
1. {{metric.1}}: Actual {{actual.1}} ({{variance.1}}% vs. target)
2. {{metric.2}}: Actual {{actual.2}} ({{variance.2}}% vs. target)
3. {{metric.3}}: Actual {{actual.3}} ({{variance.3}}% vs. target)

**Overall Performance**: [Exceeded Expectations / Met Expectations / Below Expectations]

---

## Timeline Tracking

### Key Milestones

| Milestone | Target Date | Actual Date | Status | Notes |
|-----------|-------------|-------------|--------|-------|
  Kickoff         
  Initial Draft         
  Customer Review         
  Revisions Complete         
  Final Approval         
  Launch/Delivery         
  Results Measurement         

**Overall Timeline Status**: [On Track / Minor Delays / Significant Delays]

**If Delayed**:
- Reason for delay:
- Impact on customer:
- Recovery plan:

---

## Resource Allocation

### Team Members Involved

| Team Member | Role | Time Commitment | Actual Hours | Status |
|-------------|------|-----------------|--------------|--------|
  {{team.member1}}         
  {{team.member2}}         
  {{team.member3}}         

### External Resources
- **Vendors**: {{external.vendors}}
- **Tools**: {{external.tools}}
- **Budget**: \${{freebie.budget}} (Actual: \${{freebie.actual_cost}})

---

## Issues & Blockers

### Active Issues
1. **Issue**: [Description]
   - **Impact**: [High / Medium / Low]
   - **Owner**: {{issue.owner}}
   - **Status**: [Open / In Progress / Resolved]
   - **Resolution**:

### Resolved Issues
1. **Issue**: [Description]
   - **Resolution**: [How it was resolved]
   - **Lessons Learned**:

---

## Communication Log

### Internal Updates
| Date | Update | Audience | Notes |
|------|--------|----------|-------|
                                   

### Customer Updates
| Date | Update Type | Message | Response |
|------|-------------|---------|----------|
         Email/Call                       

---

## Risk Management

### Potential Risks
- [ ] **Quality concerns**: Mitigation strategy:
- [ ] **Timeline slippage**: Mitigation strategy:
- [ ] **Customer availability**: Mitigation strategy:
- [ ] **Resource constraints**: Mitigation strategy:
- [ ] **Scope creep**: Mitigation strategy:

---

## Success Evaluation

### Did We Achieve the Goal?

**Primary Goal**: [Rebuild trust / Demonstrate value / Re-engage customer]

**Achievement Level**: [Yes, Fully / Partially / No]

**Evidence**:
-
-
-

### Customer Reaction

**How did customer respond to freebie?**
[Describe their reaction, feedback, and any changes in behavior or sentiment]

**Quotes from Customer**:
> "[Positive feedback]"

> "[Concerns or constructive feedback]"

### Impact on Relationship

**Health Score Change**: {{before.health_score}} → {{after.health_score}} ({{change.direction}} {{change.amount}})

**Engagement Change**: {{engagement.change}}

**Sentiment Shift**: [Positive / Neutral / Negative]

---

## Lessons Learned

### What Worked Well
1.
2.
3.

### What Could Be Improved
1.
2.
3.

### Recommendations for Future Freebies
1.
2.
3.

---

## Next Steps

### Immediate Follow-up (This Week)
- [ ] Schedule results review meeting with customer
- [ ] Gather customer testimonial/feedback
- [ ] Update CRM with freebie results
- [ ] Prepare for next workflow step (impact measurement)

### Transition to Renewal
- [ ] How will we leverage this freebie in renewal discussion?
- [ ] What additional support might customer need?
- [ ] Timeline for moving to renewal proposal?

---

*This tracker ensures we maintain high quality and customer satisfaction throughout freebie delivery.*
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
