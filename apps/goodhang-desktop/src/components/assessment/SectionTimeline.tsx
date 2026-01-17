/**
 * Section Timeline Component
 *
 * Horizontal timeline showing assessment sections with progress indicators.
 */

import { Check } from 'lucide-react';
import { TEST_IDS, testId } from '@/lib/test-utils';
import type { AssessmentSection } from '@/lib/types';

interface SectionTimelineProps {
  sections: AssessmentSection[];
  currentSectionIndex: number;
  isSectionCompleted: (sectionIndex: number) => boolean;
  onSectionNavigate: (sectionIndex: number) => void;
  themeColor: 'purple' | 'blue';
}

export function SectionTimeline({
  sections,
  currentSectionIndex,
  isSectionCompleted,
  onSectionNavigate,
  themeColor,
}: SectionTimelineProps) {
  const colorClasses = {
    purple: {
      active: 'bg-purple-600 text-white shadow-lg shadow-purple-500/30',
      completed: 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
      border: 'border-purple-500/20',
    },
    blue: {
      active: 'bg-blue-600 text-white shadow-lg shadow-blue-500/30',
      completed: 'bg-green-600/20 text-green-400 hover:bg-green-600/30',
      border: 'border-blue-500/20',
    },
  };

  const colors = colorClasses[themeColor];

  return (
    <div
      {...testId(TEST_IDS.assessment.timeline)}
      className={`flex justify-center items-center gap-3 py-4 px-4 pr-16 border-b ${colors.border} bg-gray-900/50`}
    >
      {sections.map((section, index) => {
        const isCompleted = isSectionCompleted(index);
        const isActive = currentSectionIndex === index;
        const isPast = index < currentSectionIndex;

        return (
          <button
            key={section.id}
            {...testId(TEST_IDS.assessment.sectionBtn(section.id))}
            onClick={() => onSectionNavigate(index)}
            disabled={!isPast && !isActive && !isCompleted}
            className={`
              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              disabled:cursor-not-allowed
              ${isActive && colors.active}
              ${!isActive && isCompleted && colors.completed}
              ${!isActive && !isCompleted && isPast && 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              ${!isActive && !isCompleted && !isPast && 'bg-gray-800 text-gray-500'}
            `}
          >
            {isCompleted && !isActive && <Check className="w-3 h-3 inline mr-1" />}
            {section.title}
          </button>
        );
      })}
    </div>
  );
}

export default SectionTimeline;
