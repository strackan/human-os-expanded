/**
 * Ranking Input Component
 *
 * Drag-and-drop ranking input for preference questions.
 */

import { useState } from 'react';
import { GripVertical, ArrowLeft, ArrowRight } from 'lucide-react';
import { TEST_IDS, testId } from '@/lib/test-utils';

interface RankingInputProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  themeColor?: 'purple' | 'blue';
}

export function RankingInput({
  options,
  value,
  onChange,
  themeColor = 'purple',
}: RankingInputProps) {
  const [ranking, setRanking] = useState<string[]>(() => {
    // Parse existing value or use default order
    if (value) {
      const parsed = value
        .split('\n')
        .filter(Boolean)
        .map((line) => line.replace(/^\d+\.\s*/, ''));
      if (parsed.length === options.length) return parsed;
    }
    return [...options];
  });

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newRanking = [...ranking];
    const [removed] = newRanking.splice(fromIndex, 1);
    if (removed) {
      newRanking.splice(toIndex, 0, removed);
      setRanking(newRanking);
      onChange(newRanking.map((item, i) => `${i + 1}. ${item}`).join('\n'));
    }
  };

  const borderColor = themeColor === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30';
  const hoverBorder = themeColor === 'purple' ? 'hover:border-purple-500/50' : 'hover:border-blue-500/50';
  const badgeColor = themeColor === 'purple' ? 'bg-purple-600/30 text-purple-300' : 'bg-blue-600/30 text-blue-300';

  return (
    <div {...testId(TEST_IDS.assessment.rankingContainer)} className="space-y-2">
      {ranking.map((item, index) => (
        <div
          key={item}
          {...testId(TEST_IDS.assessment.rankingItem(index))}
          className={`flex items-center gap-3 bg-gray-800/50 border ${borderColor} rounded-lg p-3 cursor-move ${hoverBorder} transition-colors`}
          draggable
          onDragStart={(e) => e.dataTransfer.setData('index', index.toString())}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const fromIndex = parseInt(e.dataTransfer.getData('index'));
            moveItem(fromIndex, index);
          }}
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
          <span
            className={`w-6 h-6 flex items-center justify-center ${badgeColor} rounded text-sm font-medium`}
          >
            {index + 1}
          </span>
          <span className="text-white">{item}</span>
          <div className="ml-auto flex gap-1">
            {index > 0 && (
              <button
                {...testId(TEST_IDS.assessment.rankingMoveUp(index))}
                onClick={() => moveItem(index, index - 1)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Move up"
              >
                <ArrowLeft className="w-4 h-4 rotate-90" />
              </button>
            )}
            {index < ranking.length - 1 && (
              <button
                {...testId(TEST_IDS.assessment.rankingMoveDown(index))}
                onClick={() => moveItem(index, index + 1)}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Move down"
              >
                <ArrowRight className="w-4 h-4 rotate-90" />
              </button>
            )}
          </div>
        </div>
      ))}
      <p className="text-xs text-gray-500 mt-2">Drag to reorder or use arrows</p>
    </div>
  );
}

export default RankingInput;
