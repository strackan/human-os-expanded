/**
 * Strategy Synthesis Slide (v0.1.12)
 *
 * Purpose: Final step after all 5 account review phases are approved.
 * The LLM synthesizes all approved phases into:
 *   1. Engagement strategy summary
 *   2. Meeting deck (for PresentationArtifact)
 *   3. Renewal email draft
 *   4. Meeting agenda
 *
 * Uses StrategySynthesisArtifact (new) or PresentationArtifact with tabs.
 */

import type { UniversalSlideBuilder } from '../baseSlide';

export const strategySynthesisSlide: UniversalSlideBuilder = (context): any => {
  // Get synthesis result from workflow context (generated after all phases approved)
  const synthesisResult = context?.variables?.synthesisResult;
  const customerName = context?.variables?.customerName || '{{customer.name}}';
  const isGenerating = context?.variables?.isGenerating ?? true;

  return {
    id: 'strategy-synthesis',
    version: '1.12',
    name: 'Strategy Synthesis',
    category: 'inhersight',
    checklistTitle: 'Review and finalize engagement strategy',

    structure: {
      id: 'strategy-synthesis',
      title: 'Engagement Strategy',
      description: 'AI-generated engagement strategy based on account review',
      label: 'Strategy',
      stepMapping: 'strategy-synthesis',
      showSideMenu: true,

      // Custom slide handlers
      handlers: {
        onEnter: 'accountReview:synthesizeStrategy',
        onExport: 'accountReview:exportOutputs',
      },

      chat: {
        generateInitialMessage: true,
        llmPrompt: `You are helping the CSM finalize their engagement strategy for ${customerName}.

The account review is complete. Based on all 5 approved phases (Usage, Contract, Contacts, Expansion, Risk), you've synthesized a comprehensive engagement strategy.

Guide the CSM through the outputs:
1. Strategy Summary - overall approach
2. Meeting Deck - slides for customer presentation
3. Email Draft - renewal outreach email
4. Meeting Agenda - structure for renewal meeting

Help them review, edit, and finalize each output. Be ready to make adjustments based on their feedback.`,

        initialMessage: {
          text: isGenerating
            ? `Synthesizing your engagement strategy for ${customerName}...

Based on all 5 approved phases, I'm generating:
- Strategy summary
- Meeting deck
- Renewal email
- Meeting agenda

This may take a moment.`
            : `Your engagement strategy for ${customerName} is ready!

I've synthesized all 5 phases into actionable outputs:

**Strategy Summary** - Your overall approach and key talking points
**Meeting Deck** - Ready to export slides for your QBR
**Email Draft** - Renewal outreach email
**Meeting Agenda** - Structured agenda for the renewal meeting

Review each tab and let me know if you'd like any adjustments.`,
          buttons: isGenerating
            ? []
            : [
                {
                  label: 'Review Strategy',
                  value: 'review-strategy',
                  'label-background': 'bg-blue-600',
                  'label-text': 'text-white',
                },
                {
                  label: 'Export All',
                  value: 'export-all',
                  'label-background': 'bg-green-600',
                  'label-text': 'text-white',
                },
              ],
          nextBranches: {
            'review-strategy': 'review-outputs',
            'export-all': 'export-confirm',
          },
        },

        branches: {
          'review-outputs': {
            response: `Let's review each output together. Use the tabs on the right to explore:

**Strategy** - High-level engagement approach
**Deck** - Presentation slides you can export to PowerPoint
**Email** - Draft renewal email ready to customize
**Agenda** - Meeting structure with talking points

Feel free to ask me to modify any section!`,
          },
          'export-confirm': {
            response: `I can help you export these outputs:

- **PowerPoint** - Download the deck as .pptx
- **Google Slides** - Save to your Drive
- **Email** - Copy to clipboard or open in email client
- **PDF** - Download everything as a summary PDF

Which would you like to do?`,
            buttons: [
              {
                label: 'Download PowerPoint',
                value: 'export-pptx',
                'label-background': 'bg-orange-500',
                'label-text': 'text-white',
              },
              {
                label: 'Save to Drive',
                value: 'export-drive',
                'label-background': 'bg-blue-500',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              'export-pptx': 'exporting-pptx',
              'export-drive': 'exporting-drive',
            },
          },
          'exporting-pptx': {
            response: 'Generating your PowerPoint presentation...',
            actions: ['exportPptx'],
          },
          'exporting-drive': {
            response: 'Uploading to Google Drive...',
            actions: ['exportToDrive'],
          },
          'export-complete': {
            response: `Export complete!

Is there anything else you'd like to adjust before we wrap up this workflow?`,
            buttons: [
              {
                label: 'Make adjustments',
                value: 'adjust',
                'label-background': 'bg-gray-100',
                'label-text': 'text-gray-700',
              },
              {
                label: 'Complete workflow',
                value: 'complete',
                'label-background': 'bg-green-600',
                'label-text': 'text-white',
              },
            ],
            nextBranches: {
              adjust: 'review-outputs',
              complete: 'workflow-complete',
            },
          },
          'workflow-complete': {
            response: `Excellent! Your engagement strategy for ${customerName} is complete.

**Summary:**
- Account reviewed across 5 dimensions
- Strategy synthesized with deck, email, and agenda
- Outputs ready for customer engagement

Good luck with the renewal! 🎯`,
            actions: ['nextSlide'],
          },
        },

        defaultMessage: 'Feel free to ask me to modify any of the outputs, or let me know when you\'re ready to export.',

        userTriggers: {
          'edit strategy': 'CSM wants to modify the strategy summary.',
          'edit email': 'CSM wants to modify the email draft.',
          'edit agenda': 'CSM wants to modify the meeting agenda.',
          'change deck': 'CSM wants to modify the presentation deck.',
        },
      },

      artifacts: {
        sections: [
          {
            id: 'synthesis-outputs',
            type: 'component:interactive',
            title: 'Engagement Strategy',
            visible: true,
            data: {
              componentType: 'TabbedContainerArtifact',
              props: {
                title: `${customerName} - Engagement Strategy`,
                showNavigation: false,
                tabs: [
                  {
                    id: 'strategy',
                    label: 'Strategy',
                    icon: 'document-text',
                    artifact: 'StrategyOverviewArtifact',
                    props: {
                      customerName,
                      strategySummary: synthesisResult?.strategySummary,
                      isLoading: isGenerating,
                    },
                  },
                  {
                    id: 'deck',
                    label: 'Deck',
                    icon: 'presentation',
                    artifact: 'PresentationArtifact',
                    props: {
                      customerName,
                      title: '90-Day Performance Review',
                      slides: synthesisResult?.deckSlides,
                      editable: true,
                      isLoading: isGenerating,
                    },
                  },
                  {
                    id: 'email',
                    label: 'Email',
                    icon: 'mail',
                    artifact: 'EmailDraftArtifact',
                    props: {
                      customerName,
                      subject: `${customerName} Partnership Review`,
                      body: synthesisResult?.emailDraft,
                      editable: true,
                      isLoading: isGenerating,
                    },
                  },
                  {
                    id: 'agenda',
                    label: 'Agenda',
                    icon: 'list',
                    artifact: 'MeetingAgendaArtifact',
                    props: {
                      customerName,
                      meetingTitle: `${customerName} Renewal Discussion`,
                      agenda: synthesisResult?.meetingAgenda,
                      editable: true,
                      isLoading: isGenerating,
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
          text: 'Strategy Outputs',
          subtitle: 'Review and export',
          icon: 'rocket',
        },
        steps: [
          { label: 'Strategy Summary', status: synthesisResult?.strategySummary ? 'completed' : 'pending' },
          { label: 'Meeting Deck', status: synthesisResult?.deckSlides ? 'completed' : 'pending' },
          { label: 'Email Draft', status: synthesisResult?.emailDraft ? 'completed' : 'pending' },
          { label: 'Meeting Agenda', status: synthesisResult?.meetingAgenda ? 'completed' : 'pending' },
        ],
        progressMeter: {
          currentStep: getSynthesisProgress(synthesisResult),
          totalSteps: 4,
          progressPercentage: Math.round((getSynthesisProgress(synthesisResult) / 4) * 100),
          showPercentage: true,
          showStepNumbers: true,
        },
        showProgressMeter: true,
        showSteps: true,
      },

      // State to persist for snooze/resume
      persistState: {
        keys: ['synthesisResult', 'isGenerating'],
      },

      onComplete: {
        nextSlide: 'workflow-summary',
        updateProgress: true,
      },
    },
  };
};

// Helper to calculate synthesis progress
function getSynthesisProgress(result: any): number {
  if (!result) return 0;
  let count = 0;
  if (result.strategySummary) count++;
  if (result.deckSlides?.length) count++;
  if (result.emailDraft) count++;
  if (result.meetingAgenda) count++;
  return count;
}

export default strategySynthesisSlide;
