'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { get } from '../api-client';

// =============================================================================
// TYPES
// =============================================================================

interface ApiQuestion {
  id: string;
  slug: string;
  text: string;
  question_type: string;
  category: string;
  subcategory: string;
  description: string;
  options: string[] | null;
  maps_to_output: string;
  display_order: number;
}

interface ApiQuestionSet {
  id: string;
  slug: string;
  name: string;
  domain: string;
  target: string;
  description: string;
}

interface ApiResponse {
  questions: ApiQuestion[];
  metadata: {
    question_set: ApiQuestionSet;
    entity_slug: string | null;
    total_questions: number;
  };
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  followUp?: string | undefined;
  isRanking?: boolean | undefined;
  options?: string[] | undefined;
}

export interface AssessmentSection {
  id: string;
  title: string;
  transitionMessage: string;
  questions: AssessmentQuestion[];
}

// =============================================================================
// SECTION CONFIGURATION
// =============================================================================

const SECTION_CONFIG: Record<string, { id: string; title: string; transitionMessage: string; order: number }> = {
  story: { id: 'your-story', title: 'Your Story', transitionMessage: "Let's start with some moments that have shaped who you are.", order: 1 },
  self: { id: 'who-you-are', title: 'Who You Are', transitionMessage: "Now let's explore your core identity and values.", order: 2 },
  connect: { id: 'who-you-are', title: 'Who You Are', transitionMessage: "Now let's explore your core identity and values.", order: 2 },
  performance: { id: 'work-and-ai', title: 'Work & AI', transitionMessage: "Finally, let's understand how you work best and what you need from an AI assistant.", order: 3 },
  support: { id: 'work-and-ai', title: 'Work & AI', transitionMessage: "Finally, let's understand how you work best and what you need from an AI assistant.", order: 3 },
  collaboration: { id: 'work-and-ai', title: 'Work & AI', transitionMessage: "Finally, let's understand how you work best and what you need from an AI assistant.", order: 3 },
  'ai-preferences': { id: 'work-and-ai', title: 'Work & AI', transitionMessage: "Finally, let's understand how you work best and what you need from an AI assistant.", order: 3 },
};

const DEFAULT_SECTION = { id: 'general', title: 'General', transitionMessage: "Let's continue with a few more questions.", order: 99 };

// =============================================================================
// HOOK
// =============================================================================

export function useQuestionSet(questionSetSlug: string, token?: string | null) {
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchStatusRef = useRef<'idle' | 'fetching' | 'done'>('idle');
  const slugRef = useRef(questionSetSlug);
  const tokenRef = useRef(token);
  slugRef.current = questionSetSlug;
  tokenRef.current = token;

  const refetch = useCallback(async () => {
    if (fetchStatusRef.current === 'fetching') return;
    fetchStatusRef.current = 'fetching';
    setIsLoading(true);
    setError(null);

    try {
      const response = await get<ApiResponse>(
        `/api/questions/${slugRef.current}`,
        tokenRef.current
      );

      const sectionMap = new Map<string, { config: typeof DEFAULT_SECTION; questions: AssessmentQuestion[] }>();

      for (const q of response.questions) {
        const sectionConfig = SECTION_CONFIG[q.subcategory] || DEFAULT_SECTION;
        const sectionId = sectionConfig.id;
        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, { config: sectionConfig, questions: [] });
        }
        sectionMap.get(sectionId)!.questions.push({
          id: q.slug,
          text: q.text,
          followUp: q.description,
          isRanking: q.question_type === 'ranking',
          options: q.options || undefined,
        });
      }

      const sortedSections = Array.from(sectionMap.entries())
        .sort((a, b) => a[1].config.order - b[1].config.order)
        .map(([, { config, questions }]) => ({
          id: config.id,
          title: config.title,
          transitionMessage: config.transitionMessage,
          questions,
        }));

      setSections(sortedSections);
      fetchStatusRef.current = 'done';
    } catch (err) {
      console.error('[useQuestionSet] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
      fetchStatusRef.current = 'idle';
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchStatusRef.current === 'idle') refetch();
  }, [refetch]);

  return { sections, isLoading, error, refetch };
}
