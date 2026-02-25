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
          text: `I've prepared a renewal presentation for ${customerName} with 5 slides:\n\n- **Partnership Overview** — Your journey together\n- **Performance Dashboard** — Key wins and metrics\n- **Key Wins** — ROI and impact highlights\n- **Strategic Recommendations** — Pricing and growth opportunities\n- **Next Steps** — Action items and owners\n\nBrowse through the slides using the arrows. Once you've reviewed them, let me know how it looks.`,
          buttons: [
            {
              label: 'Looks Good',
              value: 'looks-good',
              'label-background': 'bg-green-600',
              'label-text': 'text-white',
            },
          ],
          nextBranches: {
            'looks-good': 'deck-ready',
          },
        },
        branches: {
          'deck-ready': {
            response: `Great, your presentation is finalized! You can download it as PowerPoint or save it to Google Drive using the **Export** button in the presentation panel.\n\nReady to move on to scheduling the meeting?`,
            buttons: [
              {
                label: 'Schedule Meeting',
                value: 'schedule',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
              {
                label: 'Download Deck First',
                value: 'download',
                'label-background': 'bg-green-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'schedule': 'proceed-to-schedule',
              'download': 'download-confirm',
            },
          },
          'download-confirm': {
            response: `Use the **Export** button in the presentation panel to download your deck as PowerPoint, save to Google Drive, or print as PDF.\n\nReady to schedule the renewal meeting?`,
            buttons: [
              {
                label: 'Schedule Meeting',
                value: 'schedule-from-download',
                'label-background': 'bg-purple-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'schedule-from-download': 'proceed-to-schedule',
            },
          },
          'proceed-to-schedule': {
            response: 'Let\'s move on to scheduling the renewal meeting.',
            actions: ['nextSlide'],
          },
        },
        defaultMessage: 'The presentation is ready in the panel on the right. Click the edit icon to make changes, or let me know if you need help!',
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
