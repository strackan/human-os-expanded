/**
 * HighlightsSlide Component
 *
 * Displays key wins and performance highlights as a bulleted list.
 */

'use client';

import React, { useState } from 'react';
import { Trophy, Check, Plus, X } from 'lucide-react';

export interface HighlightsSlideContent {
  items: string[];
}

interface HighlightsSlideProps {
  title: string;
  content: HighlightsSlideContent;
  editable?: boolean;
  onContentChange?: (content: HighlightsSlideContent) => void;
}

export function HighlightsSlide({ title, content, editable, onContentChange }: HighlightsSlideProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState('');

  const defaultItems = [
    'Featured in "Top 50 Companies for Women in Tech" article',
    '35% of new hires in Q3 came through InHerSight pipeline',
    'CEO quoted InHerSight data in investor presentation',
    'Used InHerSight insights to restructure parental leave policy',
  ];

  const items = content.items?.length > 0 ? content.items : defaultItems;

  const handleItemChange = (index: number, value: string) => {
    if (onContentChange) {
      const newItems = [...items];
      newItems[index] = value;
      onContentChange({ items: newItems });
    }
  };

  const handleAddItem = () => {
    if (newItem.trim() && onContentChange) {
      onContentChange({ items: [...items, newItem.trim()] });
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    if (onContentChange) {
      const newItems = items.filter((_, i) => i !== index);
      onContentChange({ items: newItems });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Trophy className="w-6 h-6 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>

      {/* Highlights list */}
      <div className="flex-1 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100 group"
          >
            <div className="p-1 bg-green-500 rounded-full flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-white" />
            </div>
            {editable && editingIndex === index ? (
              <input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                onBlur={() => setEditingIndex(null)}
                onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                className="flex-1 bg-white px-2 py-1 rounded border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
              />
            ) : (
              <p
                className="flex-1 text-gray-700 cursor-pointer"
                onClick={() => editable && setEditingIndex(index)}
              >
                {item}
              </p>
            )}
            {editable && (
              <button
                onClick={() => handleRemoveItem(index)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}

        {/* Add new item */}
        {editable && (
          <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Add another highlight..."
              className="flex-1 bg-transparent outline-none text-gray-600 placeholder:text-gray-400"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HighlightsSlide;
