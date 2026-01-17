/**
 * Good Hang D&D Assessment
 *
 * Interview-style assessment with 10 personality questions.
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

const STORAGE_KEY = 'goodhang-dnd-assessment-progress';

const SECTIONS: AssessmentSection[] = [
  {
    id: 'your-story',
    title: 'Your Story',
    transitionMessage: "Let's start with some moments that have shaped who you are.",
    questions: [
      {
        id: 'a1-turning-point',
        text: 'Describe a moment or experience that fundamentally changed who you are or how you see the world.',
        followUp: 'Be specific about what happened and how it changed you.',
      },
      {
        id: 'a2-happiest-memory',
        text: 'Tell me about your single happiest memory.',
        followUp: 'What made this moment so special?',
      },
      {
        id: 'a3-difficult-time',
        text: 'Tell me about a difficult time in your life and how you got through it.',
        followUp: 'What did you learn about yourself?',
      },
      {
        id: 'a4-redemption',
        text: 'Tell me about something bad that happened to you that ultimately led to something good.',
        followUp: 'How did the transformation happen?',
      },
    ],
  },
  {
    id: 'who-you-are',
    title: 'Who You Are',
    transitionMessage: "Now let's explore your core identity and values.",
    questions: [
      {
        id: 'b1-failed-someone',
        text: 'Tell me about a time you failed someone you care about.',
        followUp: 'How did it affect your relationship?',
      },
      {
        id: 'b2-core-identity',
        text: "If you stripped away your job, relationships, and achievements - what would remain? What's the core 'you'?",
        followUp: 'What defines you beyond external factors?',
      },
      {
        id: 'b3-simple-thing',
        text: "What's a simple thing that matters a lot to you?",
        followUp: 'Why does this resonate so deeply?',
      },
    ],
  },
  {
    id: 'how-you-connect',
    title: 'How You Connect',
    transitionMessage: "Finally, let's understand how you relate to others.",
    questions: [
      {
        id: 'c1-relationship-need',
        text: 'What do you need from close relationships that you rarely ask for directly?',
        followUp: "What makes it hard to ask?",
      },
      {
        id: 'c2-intellectual-gap',
        text: "What's something you believe in intellectually but can't fully commit to in practice?",
        followUp: 'What holds you back?',
      },
      {
        id: 'c3-happiness-barrier',
        text: "What's really keeping you from being happy?",
        followUp: 'Be honest with yourself.',
      },
    ],
  },
];

const LOADING_MESSAGES = [
  "Analyzing your responses...",
  "Calculating your archetype...",
  "Mapping personality dimensions...",
  "Generating your D&D profile...",
];

const ASSESSMENT_CONFIG: AssessmentConfig = {
  storageKey: STORAGE_KEY,
  sections: SECTIONS,
  loadingMessages: LOADING_MESSAGES,
  themeColor: 'purple',
  title: 'Good Hang Assessment',
  subtitle: 'D&D Character Profile',
  completionTitle: "You've completed all questions!",
  completionDescription:
    "Click below to submit your assessment and generate your D&D character profile. Our AI will analyze your responses and map your personality to a unique race, class, and alignment.",
  submitButtonText: 'Submit & Generate Profile',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function GoodHangAssessmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token, userId } = useAuthStore();

  const returnPath = searchParams.get('return') || '/founder-os/tutorial';

  const handleComplete = async (answers: Record<string, string>) => {
    // Build transcript in the format the scoring API expects
    const allQuestions = SECTIONS.flatMap((s) => s.questions);
    const transcript = allQuestions.flatMap((q) => [
      { role: 'assistant', content: q.text },
      { role: 'user', content: answers[q.id] || '' },
    ]);

    await post('/api/assessment/score', {
      user_id: userId,
      transcript,
      source: 'desktop_app',
    }, token);

    console.log('[Assessment] Scored successfully');

    // Return to tutorial - the character tab should now show results
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
