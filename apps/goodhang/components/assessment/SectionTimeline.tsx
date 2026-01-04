'use client';

import { cn } from '@/lib/utils';
import type { AssessmentSection } from '@/lib/assessment/types';
import type { AssessmentAnswer } from '@/lib/hooks/useAssessment';

interface SectionTimelineProps {
  sections: AssessmentSection[];
  currentSectionIndex: number;
  answers: AssessmentAnswer[];
  onNavigate: (sectionIndex: number) => void;
}

export function SectionTimeline({
  sections,
  currentSectionIndex,
  answers,
  onNavigate
}: SectionTimelineProps) {
  // Check if section is completed
  const isSectionCompleted = (section: AssessmentSection) => {
    const sectionQuestionIds = section.questions.map(q => q.id);
    return sectionQuestionIds.every(qid =>
      answers.some(a => a.question_id === qid)
    );
  };

  return (
    <div className="flex justify-center items-center gap-3 py-4 px-4 border-b border-purple-500/20 bg-gray-900/50">
      {sections.map((section, index) => {
        const isCompleted = isSectionCompleted(section);
        const isActive = index === currentSectionIndex;
        const isPast = index < currentSectionIndex;

        return (
          <button
            key={section.id}
            onClick={() => onNavigate(index)}
            disabled={!isPast && !isActive && !isCompleted}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              'disabled:cursor-not-allowed',
              isActive && 'bg-purple-600 text-white shadow-lg shadow-purple-500/30',
              !isActive && isCompleted && 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
              !isActive && !isCompleted && isPast && 'bg-gray-700 text-gray-300 hover:bg-gray-600',
              !isActive && !isCompleted && !isPast && 'bg-gray-800 text-gray-500'
            )}
          >
            {isCompleted && !isActive && '\u2713 '}
            {section.title}
          </button>
        );
      })}
    </div>
  );
}
