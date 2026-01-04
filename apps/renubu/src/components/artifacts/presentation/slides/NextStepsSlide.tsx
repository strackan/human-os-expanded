/**
 * NextStepsSlide Component
 *
 * Displays action items with owners and timeline.
 */

'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, X, Calendar, User } from 'lucide-react';

export interface NextStepItem {
  title: string;
  owner?: string;
  dueDate?: string;
  completed?: boolean;
}

export interface NextStepsSlideContent {
  items: (string | NextStepItem)[];
  subtitle?: string;
}

interface NextStepsSlideProps {
  title: string;
  content: NextStepsSlideContent;
  editable?: boolean;
  onContentChange?: (content: NextStepsSlideContent) => void;
}

export function NextStepsSlide({ title, content, editable, onContentChange }: NextStepsSlideProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState('');

  const defaultItems: NextStepItem[] = [
    {
      title: 'Schedule renewal discussion with Sarah Johnson',
      owner: 'Grace',
      dueDate: 'Dec 15',
      completed: false,
    },
    {
      title: 'Prepare Enterprise tier pricing proposal',
      owner: 'Grace',
      dueDate: 'Dec 20',
      completed: false,
    },
    {
      title: 'Send London office expansion details',
      owner: 'Sarah',
      dueDate: 'Jan 10',
      completed: false,
    },
    {
      title: 'Review multi-year contract terms with legal',
      owner: 'Grace',
      dueDate: 'Jan 15',
      completed: false,
    },
  ];

  // Normalize items to NextStepItem format
  const normalizeItem = (item: string | NextStepItem): NextStepItem => {
    if (typeof item === 'string') {
      return { title: item, completed: false };
    }
    return item;
  };

  const items = content.items?.length > 0 ? content.items.map(normalizeItem) : defaultItems;

  const handleItemChange = (index: number, field: keyof NextStepItem, value: string | boolean) => {
    if (onContentChange) {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], [field]: value };
      onContentChange({ ...content, items: newItems });
    }
  };

  const handleToggleComplete = (index: number) => {
    handleItemChange(index, 'completed', !items[index].completed);
  };

  const handleAddItem = () => {
    if (newItem.trim() && onContentChange) {
      const newStep: NextStepItem = { title: newItem.trim(), completed: false };
      onContentChange({ ...content, items: [...items, newStep] });
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
    <div className="h-full flex flex-col bg-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {content.subtitle && (
            <p className="text-sm text-gray-500">{content.subtitle}</p>
          )}
        </div>
      </div>

      {/* Action items list */}
      <div className="flex-1 space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border group transition-all ${
              item.completed
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-100 hover:shadow-sm'
            }`}
          >
            {/* Checkbox */}
            <button
              onClick={() => handleToggleComplete(index)}
              className="flex-shrink-0 mt-0.5"
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-blue-400" />
              )}
            </button>

            {/* Content */}
            <div className="flex-1">
              {editable && editingIndex === index ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                    className="w-full bg-white px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Action item"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={item.owner || ''}
                      onChange={(e) => handleItemChange(index, 'owner', e.target.value)}
                      className="flex-1 bg-white px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Owner"
                    />
                    <input
                      type="text"
                      value={item.dueDate || ''}
                      onChange={(e) => handleItemChange(index, 'dueDate', e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                      className="flex-1 bg-white px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Due date"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`cursor-pointer ${item.completed ? 'line-through text-gray-400' : ''}`}
                  onClick={() => editable && setEditingIndex(index)}
                >
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    {item.owner && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {item.owner}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

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
            <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              placeholder="Add another action item..."
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

export default NextStepsSlide;
