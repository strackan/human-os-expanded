/**
 * Obsidian Black Call Debrief Workflow Configuration
 *
 * Demo workflow showing AI proactive follow-up after customer call.
 * Demonstrates continuous monitoring and context retention.
 *
 * Flow: Single chat interaction with star rating + text input
 * Key Feature: AI initiates conversation based on call transcript analysis
 */

import { WorkflowConfig } from '@/components/artifacts/workflows/config/WorkflowConfig';

export const obsidianBlackCallDebriefConfig: WorkflowConfig = {
  customer: {
    name: 'Obsidian Black',
  },

  layout: {
    modalDimensions: {
      width: 90,
      height: 90,
      top: 5,
      left: 5
    },
    dividerPosition: 50,
    chatWidth: 50,
    splitModeDefault: false, // Start with chat-only view
  },

  chat: {
    placeholder: 'Share your thoughts...',
    aiGreeting: "I reviewed the transcript of your call with Marcus. How did you think it went?",
    features: {
      attachments: false,
      voiceRecording: false,
      designMode: false,
      editMode: false,
      artifactsToggle: false
    }
  },

  artifacts: {
    sections: []
  },

  slides: [
    {
      id: 'call-debrief',
      slideNumber: 1,
      title: 'Call Debrief',
      description: 'Post-call feedback and analysis',
      label: 'Call Debrief',
      stepMapping: 'call-debrief',
      chat: {
        initialMessage: {
          text: "I reviewed the transcript of your call with Marcus. How did you think it went?",
          component: {
            type: 'star-rating',
            id: 'call-rating',
            min: 1,
            max: 5,
            labels: {
              1: '😞 Poorly',
              2: '😕 Below expectations',
              3: '😐 Okay',
              4: '🙂 Well',
              5: '😊 Excellent'
            },
            required: true
          }
        },
        branches: {
          'rating-received': {
            response: "Thanks! What made you feel that way?",
            storeAs: 'callDebrief.rating',
            nextBranchOnText: 'feedback-received'
          },
          'feedback-received': {
            response: "Got it. That was my take as well.\n\nI've updated the account notes with your feedback and identified a few follow-up actions. I'll handle the CRM updates and send you a reminder in 2 days to check on Marcus's decision timeline.",
            storeAs: 'callDebrief.feedback',
            delay: 2,
            actions: ['closeWorkflow']
          }
        },
        userTriggers: {
          '.+': 'handle-user-response'
        },
        defaultMessage: "I'm listening..."
      },
      artifacts: {
        sections: []
      }
    }
  ],

  sidePanel: {
    enabled: false,
    title: {
      text: 'Call Debrief',
      subtitle: 'Marcus Chen - Obsidian Black'
    },
    steps: [],
    progressMeter: {
      currentStep: 1,
      totalSteps: 1,
      progressPercentage: 100
    }
  }
};
