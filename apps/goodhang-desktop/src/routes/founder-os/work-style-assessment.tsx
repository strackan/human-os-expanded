/**
 * Founder OS Work Style Assessment
 *
 * Interview-style assessment with 10 onboarding questions.
 * Simplified wrapper using the shared AssessmentFlow component.
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { AssessmentFlow } from '@/components/assessment';
import { post } from '@/lib/api';
import type { AssessmentConfig, AssessmentSection } from '@/lib/types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'founder-os-work-style-progress';

const SECTIONS: AssessmentSection[] = [
  {
    id: 'performance',
    title: 'Performance',
    transitionMessage: "Let's start with understanding when you're at your best and worst.",
    questions: [
      {
        id: 'peak-performance',
        text: "Tell me about when you're at your best. Time of day, environment, conditions - what does that look like? And the flip side - when are you at your worst?",
        followUp: 'Be specific about the conditions that help or hurt your performance.',
      },
      {
        id: 'struggle-signals',
        text: "What does it look like when you're overwhelmed, stuck, or avoiding something? How does that spiral usually start for you?",
        followUp: 'Understanding your patterns helps us catch them early.',
      },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    transitionMessage: "Now let's understand what helps when things get tough.",
    questions: [
      {
        id: 'recovery-support',
        text: 'When things get hard, what actually helps? What makes it worse? What kind of support do you want from the people around you?',
        followUp: 'Think about specific examples of helpful vs unhelpful support.',
      },
      {
        id: 'decisions-priorities',
        text: 'How do you like decisions and priorities presented to you? Do you want options, a recommendation, or just the call made? What kinds of decisions drain you versus energize you?',
        followUp: 'Consider both big strategic decisions and small daily ones.',
      },
    ],
  },
  {
    id: 'collaboration',
    title: 'Collaboration',
    transitionMessage: "Let's talk about how you work with others.",
    questions: [
      {
        id: 'feedback-leadership',
        text: 'How do you prefer to give and receive feedback? As a leader, do you share everything with your team or filter to protect focus?',
        followUp: 'What works and what definitely does not?',
      },
      {
        id: 'social-rapport',
        text: 'What makes you want to hang out with someone socially vs just working with them? Any particular senses of humor or personality types work better than others?',
        followUp: 'This helps calibrate tone and rapport.',
      },
      {
        id: 'challenge-style',
        text: 'How do you prefer to be disagreed with or challenged? When do you appreciate someone standing their ground vs it feeling confrontational?',
        followUp: 'Think about examples of pushback that landed well vs poorly.',
      },
    ],
  },
  {
    id: 'ai-preferences',
    title: 'AI Preferences',
    transitionMessage: "Finally, let's customize how your AI assistant should work with you.",
    questions: [
      {
        id: 'ideal-ai',
        text: 'If you could build an ideal AI assistant - what would be the 3-4 most important considerations?',
        followUp: 'Think about what would make it actually useful vs annoying.',
      },
      {
        id: 'ai-role-ranking',
        text: 'Rank these AI assistant roles in order of most desirable to you:',
        followUp: 'Drag to reorder, or type your ranking.',
        isRanking: true,
        options: [
          'Strategic Thought Partner',
          'Deferential Assistant',
          'Coach & Accountability Partner',
          'Friend & Confidante',
        ],
      },
      {
        id: 'anything-else',
        text: "Is there anything else you'd like me to know or take into account before creating your assistant?",
        followUp: "This is your chance to add anything we haven't covered.",
      },
    ],
  },
];

const LOADING_MESSAGES = [
  "Processing your answers...",
  "Building your work style profile...",
  "Configuring your AI assistant...",
  "Finalizing your Founder OS...",
];

const ASSESSMENT_CONFIG: AssessmentConfig = {
  storageKey: STORAGE_KEY,
  sections: SECTIONS,
  loadingMessages: LOADING_MESSAGES,
  themeColor: 'blue',
  title: 'Work Style Assessment',
  subtitle: 'Founder OS Setup',
  completionTitle: "You've completed all questions!",
  completionDescription:
    "Click below to finalize your work style profile and configure your Founder OS assistant.",
  submitButtonText: 'Complete Setup',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function WorkStyleAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();

  const returnPath = searchParams.get('return') || '/founder-os/tutorial';
  const sessionId = searchParams.get('session');

  const handleComplete = async (answers: Record<string, string>) => {
    // Save answers to sculptor session
    await post(
      `/api/sculptor/sessions/${sessionId}/answers`,
      {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: questionId,
          answer,
        })),
        source: 'work_style_assessment',
      },
      token
    );

    console.log('[WorkStyle] Answers saved successfully');

    // Mark work style as complete in localStorage
    localStorage.setItem('founder-os-work-style-completed', new Date().toISOString());

    // Return to tutorial
    navigate(returnPath, { replace: true });
  };

  const handleExit = (_answers: Record<string, string>, _currentIndex: number) => {
    navigate(returnPath);
  };

  return (
    <AssessmentFlow
      config={ASSESSMENT_CONFIG}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
