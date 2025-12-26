'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Palette, Settings } from 'lucide-react';
import { isColorDark } from '@/lib/colorUtils';
import LabelManagementModal from './LabelManagementModal';

interface CreateSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string, color: string, labelId?: number) => void;
  selectedText: string;
  labels: { id: number; name: string; color: string }[];
  onLabelsUpdated: () => void;
}

const DEFAULT_COLORS = [
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#03A9F4', // Light Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#8BC34A', // Light Green
  '#CDDC39', // Lime
];

export default function CreateSnippetModal({
  isOpen,
  onClose,
  onSave,
  selectedText,
  labels,
  onLabelsUpdated,
}: CreateSnippetModalProps) {
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFEB3B');
  const [selectedLabelId, setSelectedLabelId] = useState<number | undefined>();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [showLabelManagement, setShowLabelManagement] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setSelectedColor('#FFEB3B');
      setSelectedLabelId(undefined);
      setShowColorPicker(false);
      setCustomColor('');
      setShowLabelManagement(false);
    }
  }, [isOpen]);

  const handleSave = () => {
    const colorToUse = showColorPicker && customColor ? customColor : selectedColor;
    onSave(description, colorToUse, selectedLabelId);
    onClose();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setShowColorPicker(false);
    setCustomColor('');
  };

  const handleCustomColorSelect = () => {
    setShowColorPicker(true);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    setSelectedColor(color);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Snippet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Selected Text Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">Selected Text:</p>
            <p className="text-sm font-medium text-gray-900 italic">
              "{selectedText}"
            </p>
          </div>

          {/* Description Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for this snippet..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highlight Color
            </label>
            <div className="grid grid-cols-8 gap-2 mb-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color && !showColorPicker
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            
            {/* Custom Color Picker */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleCustomColorSelect}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-colors ${
                  showColorPicker
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Palette size={14} />
                <span className="text-sm">Custom Color</span>
              </button>
              {showColorPicker && (
                <input
                  type="color"
                  value={customColor || selectedColor}
                  onChange={handleCustomColorChange}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                  title="Choose custom color"
                  aria-label="Choose custom color"
                />
              )}
            </div>
          </div>

          {/* Label Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Label (optional)
              </label>
              <button
                onClick={() => setShowLabelManagement(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                title="Manage Labels"
                aria-label="Manage Labels"
              >
                <Settings size={12} />
                Manage
              </button>
            </div>
            <select
              value={selectedLabelId || ''}
              onChange={(e) => setSelectedLabelId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              title="Choose a label"
              aria-label="Choose a label"
            >
              <option value="">No Label</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 mb-1">Preview:</p>
            <span
              className="text-sm font-medium px-2 py-1 rounded"
              style={{ 
                backgroundColor: showColorPicker && customColor ? customColor : selectedColor,
                color: isColorDark(showColorPicker && customColor ? customColor : selectedColor) ? '#ffffff' : '#000000'
              }}
            >
              {selectedText}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Snippet
          </button>
        </div>
      </div>

      {/* Label Management Modal */}
      <LabelManagementModal
        isOpen={showLabelManagement}
        onClose={() => setShowLabelManagement(false)}
        onLabelsUpdated={onLabelsUpdated}
      />
    </div>
  );
} 