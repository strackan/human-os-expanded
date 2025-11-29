/**
 * RecommendationsSlide Component
 *
 * Displays strategic recommendations for the customer.
 */

'use client';

import React, { useState } from 'react';
import { Lightbulb, Plus, X, ChevronRight } from 'lucide-react';

export interface RecommendationItem {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface RecommendationsSlideContent {
  items: (string | RecommendationItem)[];
  subtitle?: string;
}

interface RecommendationsSlideProps {
  title: string;
  content: RecommendationsSlideContent;
  editable?: boolean;
  onContentChange?: (content: RecommendationsSlideContent) => void;
}

const priorityColors = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-amber-50 border-amber-200 text-amber-800',
  low: 'bg-blue-50 border-blue-200 text-blue-800',
};

export function RecommendationsSlide({ title, content, editable, onContentChange }: RecommendationsSlideProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState('');

  const defaultItems: RecommendationItem[] = [
    {
      title: 'Upgrade to Enterprise Tier',
      description: 'Unlock API access for Greenhouse integration and additional analytics',
      priority: 'high',
    },
    {
      title: 'Multi-year Renewal',
      description: 'Lock in current pricing with a 2-year commitment',
      priority: 'high',
    },
    {
      title: 'London Office Expansion',
      description: 'Add UK employer profile when London office launches in Q2',
      priority: 'medium',
    },
    {
      title: 'Case Study Partnership',
      description: 'Feature GrowthStack as a reference customer',
      priority: 'low',
    },
  ];

  // Normalize items to RecommendationItem format
  const normalizeItem = (item: string | RecommendationItem): RecommendationItem => {
    if (typeof item === 'string') {
      return { title: item, priority: 'medium' };
    }
    return item;
  };

  const items = content.items?.length > 0 ? content.items.map(normalizeItem) : defaultItems;

  const handleItemChange = (index: number, field: keyof RecommendationItem, value: string) => {
    if (onContentChange) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      onContentChange({ ...content, items: newItems });
    }
  };

  const handleAddItem = () => {
    if (newItem.trim() && onContentChange) {
      const newRec: RecommendationItem = { title: newItem.trim(), priority: 'medium' };
      onContentChange({ ...content, items: [...items, newRec] });
      setNewItem('');
    }
  };

  const handleRemoveItem = (index: number) => {
    if (onContentChange) {
      const newItems = items.filter((_, i) => i !== index);
      onContentChange({ ...content, items: newItems });
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Lightbulb className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {content.subtitle && (
            <p className="text-sm text-gray-500">{content.subtitle}</p>
          )}
        </div>
      </div>

      {/* Recommendations list */}
      <div className="flex-1 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border group transition-all hover:shadow-sm ${
              priorityColors[item.priority || 'medium']
            }`}
          >
            <ChevronRight className="w-5 h-5 flex-shrink-0 mt-0.5 opacity-60" />
            <div className="flex-1">
              {editable && editingIndex === index ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                    className="w-full bg-white px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                    placeholder="Title"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={item.description || ''}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    onBlur={() => setEditingIndex(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                    className="w-full bg-white px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    placeholder="Description (optional)"
                  />
                </div>
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => editable && setEditingIndex(index)}
                >
                  <h3 className="font-medium">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm opacity-75 mt-1">{item.description}</p>
                  )}
                </div>
              )}
            </div>
            {item.priority && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50 capitalize">
                {item.priority}
              </span>
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
              placeholder="Add another recommendation..."
              className="flex-1 bg-transparent outline-none text-gray-600 placeholder:text-gray-400"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItem.trim()}
              className="p-1 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsSlide;
