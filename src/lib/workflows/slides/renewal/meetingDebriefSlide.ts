/**
 * Meeting Debrief Slide
 *
 * Purpose: Capture meeting feedback and sentiment after customer meeting
 * Used in: InHerSight 90-day renewal workflow
 * Artifact: Document (generic document)
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const meetingDebriefSlide: UniversalSlideBuilder = (context): any => ({
  id: 'meeting-debrief',
  version: '2',
  name: 'Meeting Debrief',
  category: 'renewal',

  structure: {
    id: 'meeting-debrief',
    title: 'Meeting Debrief',
    description: 'Capture meeting feedback and sentiment',
    label: 'Debrief',
    stepMapping: 'meeting-debrief',
    showSideMenu: true,

    chat: {
      initialMessage: {
        text: context?.variables?.message ||
          `How did the meeting with {{customer.name}} go? Let's capture the key takeaways, sentiment, and any action items.`,
        buttons: [
          {
            label: 'Meeting Went Well',
            value: 'positive',
            'label-background': 'bg-green-600',
            'label-text': 'text-white',
          },
          {
            label: 'Some Concerns Raised',
            value: 'mixed',
            'label-background': 'bg-yellow-600',
            'label-text': 'text-white',
          },
          {
            label: 'Difficult Meeting',
            value: 'challenging',
            'label-background': 'bg-red-600',
            'label-text': 'text-white',
          },
        ],
        nextBranches: {
          'positive': 'positive',
          'mixed': 'mixed',
          'challenging': 'challenging',
        },
      },
      branches: {
        positive: {
          response: 'Great to hear! Let\'s document the positive feedback and next steps.',
          actions: ['nextSlide'],
        },
        mixed: {
          response: 'Thanks for the update. Let\'s capture those concerns so we can address them.',
          actions: ['nextSlide'],
        },
        challenging: {
          response: 'I understand. Let\'s document what happened so we can create a recovery plan.',
          actions: ['nextSlide'],
        },
      },
      defaultMessage: 'How would you summarize the meeting?',
      userTriggers: {},
    },

    artifacts: {
      sections: [
        {
          id: 'meeting-notes',
          type: 'document',
          title: 'Meeting Debrief Notes',
          content: `# {{customer.name}} - Meeting Debrief

**Date**: {{meeting.date}}
**Attendees**: {{meeting.attendees}}
**Meeting Type**: Performance Review & Renewal Discussion

---

## Meeting Overview

**Overall Sentiment**: [Positive / Mixed / Challenging]

**Key Topics Discussed**:
- Performance metrics review
- Contract renewal terms
- Expansion opportunities
- Concerns or challenges

---

## Customer Feedback

### What Went Well
-

### Concerns Raised
-

### Questions Asked
-

---

## Action Items

**For CSM**:
- [ ]
- [ ]

**For Customer**:
- [ ]
- [ ]

---

## Renewal Outlook

**Likelihood to Renew**: [High / Medium / Low]

**Expansion Potential**: [Yes / Maybe / No]

**Risk Factors**:
-

**Opportunities**:
-

---

## Next Steps

**Immediate Follow-up**:
-

**Timeline**:
- Next touchpoint:
- Proposal due:
- Decision timeline:

---

## Notes

[Additional context, quotes, or observations from the meeting]
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
