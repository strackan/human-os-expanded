/**
 * Renewal Presentation Slide
 *
 * Generates a comprehensive customer renewal presentation based on workflow data.
 * This replaces the "prepare-meeting-deck" slide with actual presentation generation.
 *
 * The presentation includes:
 * - Title slide with customer branding
 * - Partnership timeline / relationship history
 * - Performance metrics and achievements
 * - Value delivered / ROI summary
 * - Renewal proposal with pricing
 * - Strategic recommendations
 * - Next steps and action items
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const renewalPresentationSlide: UniversalSlideBuilder = (context) => {
  const customerName = context?.variables?.customerName || '{{customer.name}}';
  // These variables are available for future use in dynamic slide content
  // const currentARR = context?.variables?.currentARR || '{{customer.current_arr}}';
  // const renewalDate = context?.variables?.renewalDate || '{{customer.renewal_date}}';
  // const healthScore = context?.variables?.healthScore || '{{customer.health_score}}';
  const csmName = context?.variables?.csmName || 'Your CSM';

  return {
    id: 'renewal-presentation',
    version: '2',
    name: 'Renewal Presentation',
    category: 'renewal',
    description: 'Generate and customize a comprehensive renewal presentation deck for customer meetings',
    estimatedMinutes: 10,
    requiredFields: ['customer.name'],
    checklistTitle: 'Generate renewal presentation deck',

    structure: {
      id: 'renewal-presentation',
      title: 'Renewal Presentation',
      description: 'Review and customize your customer renewal presentation',
      label: 'Deck',
      stepMapping: 'renewal-presentation',
      showSideMenu: true,

      chat: {
        generateInitialMessage: true,
        initialMessage: {
          text: `I've prepared a comprehensive renewal presentation for ${customerName}. This deck includes:\n\n• **Partnership Overview** - Your journey together\n• **Performance Highlights** - Key wins and metrics\n• **Value Delivered** - ROI and impact\n• **Renewal Proposal** - Pricing and terms\n• **Next Year Planning** - Strategic recommendations\n\nYou can review and customize each slide in the panel on the right. Would you like me to walk you through it, or would you prefer to review it yourself?`,
          buttons: [
            {
              label: 'Walk Me Through',
              value: 'walkthrough',
              'label-background': 'bg-purple-600',
              'label-text': 'text-white',
            },
            {
              label: 'I\'ll Review It',
              value: 'self-review',
              'label-background': 'bg-gray-500',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'walkthrough': 'walkthrough-start',
            'self-review': 'self-review-confirm',
          },
        },
        branches: {
          'walkthrough-start': {
            response: `Great! Let's start with the **Title Slide**.\n\nThis sets the tone for the meeting. It includes:\n- ${customerName}'s company name prominently displayed\n- "Annual Partnership Review" as the subtitle\n- Today's date and your name as the presenter\n\nThe purple gradient matches InHerSight's brand. Does this look good, or would you like to adjust the subtitle?`,
            buttons: [
              {
                label: 'Looks Good',
                value: 'next-slide',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
              {
                label: 'Edit Title',
                value: 'edit-title',
                'label-background': 'bg-gray-500',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'next-slide': 'walkthrough-metrics',
              'edit-title': 'edit-title-prompt',
            },
          },
          'walkthrough-metrics': {
            response: `Next up is the **Performance Dashboard**.\n\nThis slide shows the key metrics from the past year:\n- Brand impressions and growth\n- Profile views and engagement\n- Application clicks generated\n- New employee ratings received\n\nAll metrics show positive trends. This is a strong story to tell!`,
            buttons: [
              {
                label: 'Continue',
                value: 'continue-highlights',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'continue-highlights': 'walkthrough-highlights',
            },
          },
          'walkthrough-highlights': {
            response: `Now the **Key Wins** slide - this is where we celebrate successes!\n\nI've included:\n- Recognition and awards received\n- Hiring impact metrics\n- How leadership has used InHerSight data\n- Policy improvements influenced by insights\n\nThese talking points help reinforce the partnership value.`,
            buttons: [
              {
                label: 'Continue',
                value: 'continue-recommendations',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'continue-recommendations': 'walkthrough-recommendations',
            },
          },
          'walkthrough-recommendations': {
            response: `The **Strategic Recommendations** slide presents growth opportunities:\n\n1. **Tier Upgrade** - Unlock additional features\n2. **Multi-year Commitment** - Lock in pricing\n3. **Expansion Options** - New markets or products\n\nEach recommendation includes a priority level and business justification.`,
            buttons: [
              {
                label: 'Continue',
                value: 'continue-nextsteps',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'continue-nextsteps': 'walkthrough-nextsteps',
            },
          },
          'walkthrough-nextsteps': {
            response: `Finally, the **Next Steps** slide outlines the action plan:\n\n- Schedule renewal discussion\n- Review pricing proposal\n- Finalize contract terms\n- Set up success planning for next year\n\nEach item has an owner and timeline. Ready to finalize the deck?`,
            buttons: [
              {
                label: 'Generate Deck',
                value: 'generate-deck',
                'label-background': 'bg-green-600',
                'label-text': 'text-white',
              },
              {
                label: 'Make Changes',
                value: 'make-changes',
                'label-background': 'bg-gray-500',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'generate-deck': 'deck-ready',
              'make-changes': 'edit-prompt',
            },
          },
          'self-review-confirm': {
            response: `No problem! Take your time reviewing the presentation in the panel on the right.\n\nYou can:\n- Use the arrows to navigate between slides\n- Click "Edit" to modify any content\n- Export to PowerPoint when ready\n\nLet me know when you're done or if you have questions!`,
            buttons: [
              {
                label: 'I\'m Done Reviewing',
                value: 'review-complete',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'review-complete': 'deck-ready',
            },
          },
          'deck-ready': {
            response: `Your presentation is ready! You can:\n\n📥 **Download as PowerPoint** - Click the export button in the presentation panel\n📧 **Share via Email** - Attach the PPTX to your meeting invite\n🖥️ **Present Live** - Use the full-screen mode during your call\n\nWould you like to continue to scheduling the meeting, or do you need anything else with the deck?`,
            buttons: [
              {
                label: 'Schedule Meeting',
                value: 'schedule',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
              {
                label: 'Download Deck',
                value: 'download',
                'label-background': 'bg-green-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'schedule': 'proceed-to-schedule',
            },
          },
          'proceed-to-schedule': {
            response: 'Great! Let\'s move on to scheduling the renewal meeting.',
            actions: ['nextSlide'],
          },
          'edit-title-prompt': {
            response: 'What would you like to change about the title slide? You can edit directly in the presentation panel on the right, or tell me what you\'d like to update.',
          },
          'edit-prompt': {
            response: 'No problem! Use the presentation panel on the right to make your changes. Navigate between slides using the arrows, and click on any text to edit it. Let me know when you\'re ready to proceed.',
          },
        },
        defaultMessage: 'The presentation is ready in the panel on the right. Let me know if you need any help!',
        userTriggers: {},
      },

      artifacts: {
        sections: [
          {
            id: 'renewal-presentation',
            type: 'component:interactive',
            title: 'Renewal Presentation',
            visible: true,
            data: {
              componentType: 'PresentationArtifact',
              props: {
                title: 'Annual Partnership Review',
                customerName: customerName,
                editable: true,
                slides: [
                  {
                    id: 'title',
                    type: 'title',
                    title: customerName,
                    content: {
                      subtitle: 'Annual Partnership Review',
                      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                      preparedBy: csmName,
                    },
                  },
                  {
                    id: 'metrics',
                    type: 'metrics',
                    title: 'Performance Dashboard',
                    content: {
                      impressions: { value: '60K', trend: 'up', trendValue: '+12% vs prior year' },
                      profileViews: { value: '4,500', trend: 'up', trendValue: '+8% vs prior year' },
                      applyClicks: { value: '120', trend: 'up', trendValue: '+15% vs prior year' },
                      newRatings: { value: '45', trend: 'up', trendValue: '+23% vs prior year' },
                      reportingPeriod: 'Last 12 Months',
                    },
                  },
                  {
                    id: 'highlights',
                    type: 'highlights',
                    title: 'Key Wins This Year',
                    content: {
                      items: [
                        'Featured in "Top 50 Companies for Women in Tech" list',
                        '35% of Q3 new hires sourced through InHerSight pipeline',
                        'CEO cited InHerSight data in board presentation',
                        'Parental leave policy updated based on competitive insights',
                        'Employee NPS improved 12 points year-over-year',
                      ],
                    },
                  },
                  {
                    id: 'recommendations',
                    type: 'recommendations',
                    title: 'Strategic Recommendations',
                    content: {
                      items: [
                        {
                          title: 'Upgrade to Enterprise Tier',
                          description: 'Unlock API integration with your ATS for seamless candidate tracking',
                          priority: 'high',
                        },
                        {
                          title: 'Multi-Year Renewal',
                          description: 'Lock in current pricing with a 2-year commitment (5% discount)',
                          priority: 'high',
                        },
                        {
                          title: 'Add International Profile',
                          description: 'Expand employer brand presence for UK office launch',
                          priority: 'medium',
                        },
                      ],
                    },
                  },
                  {
                    id: 'next-steps',
                    type: 'next-steps',
                    title: 'Next Steps',
                    content: {
                      items: [
                        {
                          title: 'Schedule executive renewal discussion',
                          owner: csmName,
                          dueDate: 'This Week',
                          completed: false,
                        },
                        {
                          title: 'Send Enterprise tier pricing proposal',
                          owner: csmName,
                          dueDate: 'Next Week',
                          completed: false,
                        },
                        {
                          title: 'Review multi-year contract terms with legal',
                          owner: 'Customer',
                          dueDate: '2 Weeks',
                          completed: false,
                        },
                        {
                          title: 'Finalize renewal agreement',
                          owner: 'Both',
                          dueDate: 'Before Renewal Date',
                          completed: false,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        ],
      },

      sidePanel: {
        enabled: true,
        title: {
          text: 'Presentation',
          subtitle: 'Your renewal deck',
          icon: 'presentation',
        },
        steps: [],
        progressMeter: {
          currentStep: 0,
          totalSteps: 0,
          progressPercentage: 0,
          showPercentage: true,
          showStepNumbers: true,
        },
        showProgressMeter: false,
        showSteps: false,
      },

      onComplete: {
        nextSlide: undefined,
        updateProgress: true,
      },
    },
  };
};
