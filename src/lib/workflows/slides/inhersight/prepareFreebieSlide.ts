/**
 * Prepare Freebie Slide
 *
 * Purpose: Select and plan value-add offering to rebuild customer trust
 * Used in: InHerSight 120-day at-risk workflow
 * Artifact: Document (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const prepareFreebieSlide: UniversalSlideBuilder = (context): any => ({
  id: 'prepare-freebie',
  version: '2',
  name: 'Prepare Freebie Strategy',
  category: 'inhersight',

  structure: {
    id: 'prepare-freebie',
    title: 'Freebie Strategy',
    description: 'Select value-add offering to rebuild trust',
    label: 'Freebie',
    stepMapping: 'prepare-freebie',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `To rebuild trust with {{customer.name}}, let's offer a high-value freebie that demonstrates InHerSight's impact. Select the approach that best addresses their concerns.`,
        buttons: [
          {
            label: 'Featured Article',
            value: 'article',
            'label-background': 'bg-blue-600',
            'label-text': 'text-white',
          },
          {
            label: 'Profile Optimization',
            value: 'profile',
            'label-background': 'bg-purple-600',
            'label-text': 'text-white',
          },
          {
            label: 'Social Campaign',
            value: 'social',
            'label-background': 'bg-pink-600',
            'label-text': 'text-white',
          },
          {
            label: 'Premium Job Credits',
            value: 'jobs',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'Custom Package',
            value: 'custom',
            'label-background': 'bg-orange-600',
            'label-text': 'text-white',
          },
        ],
      },
      branches: {
        article: {
          response: 'Excellent choice! A featured article can dramatically boost brand visibility and credibility. Let\'s plan the execution.',
          actions: ['nextSlide'],
        },
        profile: {
          response: 'Great! Profile optimization can immediately improve their presence and engagement metrics.',
          actions: ['nextSlide'],
        },
        social: {
          response: 'Perfect! A targeted social campaign can drive quick engagement and show immediate value.',
          actions: ['nextSlide'],
        },
        jobs: {
          response: 'Smart approach! Premium job credits will help them see candidate pipeline value.',
          actions: ['nextSlide'],
        },
        custom: {
          response: 'A custom package shows you\'re serious about their success. Let\'s define what that looks like.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'Which freebie strategy makes the most sense for this customer?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'freebie-strategy',
          type: 'document',
          title: 'Freebie Strategy Plan',
          content: `# {{customer.name}} - Freebie Strategy

**Objective**: Rebuild trust and demonstrate value through high-impact freebie
**Timeline**: {{freebie.timeline}}
**Owner**: {{user.full_name}}

---

## Freebie Selection

**Selected Approach**: [Featured Article / Profile Optimization / Social Campaign / Premium Job Credits / Custom]

**Why This Freebie?**
[Explain why this freebie addresses their specific concerns and goals]

---

## Freebie Options Details

### Option 1: Featured Article Placement
**What It Is**:
- Sponsored article on InHerSight blog/platform
- Company profile and culture spotlight
- SEO-optimized content about their DEI initiatives
- Distribution to {{platform.audience_size}} audience

**Value Proposition** ($5,000-$10,000 value):
- 50K+ impressions guaranteed
- Thought leadership positioning
- Permanent SEO asset
- Social amplification included

**Best For**:
- Companies needing brand credibility boost
- Low visibility/awareness issues
- Good DEI story to tell
- Content-driven audience

**Timeline**: 2-3 weeks from concept to publish

---

### Option 2: Profile Optimization Session
**What It Is**:
- 1:1 consulting session with InHerSight expert
- Complete profile audit and enhancement
- Photo, description, benefits, ratings optimization
- Best practice implementation

**Value Proposition** ($2,000-$3,000 value):
- Immediate profile score improvement
- Increased click-through rates
- Better search ranking
- Professional recommendations

**Best For**:
- Incomplete or underoptimized profiles
- Low engagement despite good features
- Companies new to platform
- Quick-win opportunities

**Timeline**: 1 week to complete

---

### Option 3: Targeted Social Media Campaign
**What It Is**:
- 4-week social media campaign (LinkedIn, Instagram, Twitter)
- 8-12 posts featuring company culture/jobs
- Influencer amplification
- Targeted audience engagement

**Value Proposition** ($3,000-$5,000 value):
- 100K+ impressions
- Direct candidate pipeline
- Social proof and buzz
- User-generated content potential

**Best For**:
- Companies with active hiring needs
- Good visual culture content
- Social-savvy target audience
- Immediate pipeline needs

**Timeline**: 4 weeks execution

---

### Option 4: Premium Job Posting Credits
**What It Is**:
- 5 premium job postings (normally $500 each)
- Featured placement in job board
- Extended visibility period
- Application tracking and analytics

**Value Proposition** ($2,500 value):
- Immediate hiring support
- Measurable candidate pipeline
- Featured positioning
- ROI-demonstrable results

**Best For**:
- Active hiring companies
- Low application volume concerns
- Need to see direct ROI
- Transactional relationship

**Timeline**: Use within 90 days

---

### Option 5: Custom Value-Add Package
**What It Is**:
- Tailored combination of above
- Addresses multiple pain points
- Flexible based on customer needs

**Value Proposition** (Variable):
- Personalized to specific situation
- Shows commitment to partnership
- Can include consulting, content, credits

**Best For**:
- High-value strategic accounts
- Complex multi-faceted concerns
- Relationship-rebuilding situations

**Timeline**: Custom based on components

---

## Selected Strategy Details

### Execution Plan

**Freebie**: [Name of selected freebie]

**Deliverables**:
1.
2.
3.

**Timeline**:
- **Week 1**: {{week1.deliverable}}
- **Week 2**: {{week2.deliverable}}
- **Week 3**: {{week3.deliverable}}
- **Week 4**: {{week4.deliverable}}

**Quality Standards**:
- [ ] Meets or exceeds normal paid offering
- [ ] Delivered on or ahead of schedule
- [ ] Customer actively involved in creation
- [ ] Results tracked and measured

---

## Positioning & Messaging

### How to Present the Freebie

**Frame it as**:
✅ "Investment in partnership"
✅ "Demonstrate new capabilities"
✅ "Test new strategies together"
✅ "Showcase what's possible"

**NOT as**:
❌ "We messed up, here's a freebie"
❌ "Discount" or "compensation"
❌ "One-time desperate measure"

### Talking Points

"{{customer.name}}, I've been thinking about how we can better support your {{customer.goal}}. I'd love to invest in a {{freebie.name}} at no cost to show you the kind of results we can drive together. This isn't just a one-off—it's a test of a strategy I think could be really powerful for you moving forward. Are you open to trying this?"

---

## Internal Approvals

**Freebie Value**: \${{freebie.value}}

**Approval Status**:
- [ ] Manager approval: {{manager.name}}
- [ ] Marketing/Content team: {{team.contact}}
- [ ] Finance/Ops: {{finance.contact}}
- [ ] Legal (if needed): {{legal.contact}}

**Justification for Approval**:
- Account value: \${{customer.current_arr}}
- At-risk status: {{customer.risk_level}}
- Recovery potential: {{customer.recovery_probability}}%
- Strategic importance: {{customer.strategic_value}}

---

## Success Metrics

### Freebie-Specific Metrics
**Target Outcomes**:
- {{metric.1}}: Target {{target.1}}
- {{metric.2}}: Target {{target.2}}
- {{metric.3}}: Target {{target.3}}

### Relationship Metrics
- Health score improvement: {{customer.health_score}} → {{target.health_score}}
- Customer satisfaction: Track via feedback
- Engagement increase: Measure usage metrics
- Renewal confidence: {{current.confidence}} → {{target.confidence}}

---

## Risk Mitigation

### What If It Doesn't Work?
**Backup Plan**:
- Plan B freebie: {{backup.freebie}}
- Escalation path: {{escalation.plan}}
- Cut-loss criteria: {{cutloss.criteria}}

### Manage Expectations
**With Customer**:
- Clear on what freebie includes/excludes
- Realistic timeline communicated
- Success metrics agreed upon

**Internally**:
- Not guaranteed to save account
- Cost is justified by attempt
- Learnings valuable regardless

---

## Communication Plan

### Initial Pitch (Week 0)
**Meeting**: Schedule call with {{customer.decision_maker}}
**Message**: [Use talking points above]
**Materials**: This strategy doc + freebie spec

### Kickoff (Week 1)
**Meeting**: Align on execution details
**Materials**: Project plan, timeline, deliverables

### Mid-point Check (Week 2)
**Update**: Progress report
**Feedback**: Get customer input

### Delivery (Week 3-4)
**Presentation**: Show results
**Analysis**: Review metrics together

### Follow-up (Week 5)
**Debrief**: Discuss impact
**Next Steps**: Transition to renewal discussion

---

## Post-Freebie Strategy

### If Successful
- Highlight results in renewal discussion
- Build on momentum with expansion
- Create case study (if customer allows)
- Use as template for other at-risk accounts

### If Mixed Results
- Analyze what worked vs. what didn't
- Adjust and offer follow-up actions
- Keep relationship warm
- Pivot renewal approach based on learnings

### If Unsuccessful
- Acknowledge honestly with customer
- Explore root cause (was it freebie or something else?)
- Discuss alternative paths forward
- Make call on continuing vs. graceful exit

---

## Next Steps

**This Week**:
- [ ] Get internal approvals
- [ ] Schedule pitch meeting with customer
- [ ] Prepare freebie proposal materials
- [ ] Align cross-functional team

**Next Week**:
- [ ] Present freebie to customer
- [ ] Get customer buy-in
- [ ] Kick off execution
- [ ] Set up tracking/measurement

---

*Remember: The freebie is a means to an end (renewal), not the end itself. Focus on rebuilding trust and demonstrating value.*
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
