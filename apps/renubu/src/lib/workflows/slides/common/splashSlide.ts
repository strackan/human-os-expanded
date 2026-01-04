/**
 * Splash Slide - Pre-greeting excitement screen
 *
 * Purpose: Build excitement and hide LLM loading time (Duolingo-style)
 *
 * Flow:
 * 1. Shows fun "Ready to get started?" message with visual
 * 2. User clicks "Yeah let's do it!"
 * 3. Confetti animation plays + LLM starts loading in background
 * 4. Auto-advances to greeting slide when LLM response is ready
 *
 * Context Variables:
 * - customerName: For LLM prefetch
 * - workflowPurpose: For LLM context
 */

import {
  SlideBuilder,
  SlideContext,
  createSlideBuilder,
} from '../baseSlide';
import type { WorkflowSlide } from '@/components/artifacts/workflows/config/WorkflowConfig';

export const splashSlide: SlideBuilder = createSlideBuilder(
  {
    id: 'splash',
    name: 'Get Started',
    category: 'common',
    description: 'Excitement screen that hides LLM loading time',
    estimatedMinutes: 0.5,
    requiredFields: ['customer.name'],
    optionalFields: [],
    tags: ['intro', 'splash', 'start', 'loading'],
    version: '1.0.0',
  },
  (context?: SlideContext): Omit<WorkflowSlide, 'slideNumber'> => {
    const customerName = context?.variables?.customerName || '{{customer.name}}';

    return {
      id: 'splash',
      title: 'Ready?',
      description: 'Get excited to work on this account',
      label: 'Ready',
      stepMapping: 'splash',

      // No artifacts - full-screen chat experience
      artifacts: {
        sections: [] as WorkflowSlide['artifacts']['sections']
      },

      chat: {
        initialMessage: {
          text: `Ready to dive into **${customerName}**?`,
          buttons: [
            {
              label: "Yeah, let's do it!",
              value: 'start',
              'label-background': 'bg-gradient-to-r from-blue-600 to-purple-600',
              'label-text': 'text-white text-lg font-bold'
            },
            {
              label: 'Not right now',
              value: 'snooze',
              'label-background': 'bg-gray-400',
              'label-text': 'text-white'
            },
          ],
          nextBranches: {
            'start': 'celebrate',
          }
        },
        branches: {
          'celebrate': {
            response: "Let's go! Loading your personalized briefing...",
            actions: ['triggerConfetti', 'prefetchLLM', 'nextSlideWhenReady']
          }
        }
      }
    };
  }
);
