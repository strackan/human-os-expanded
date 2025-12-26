'use client';

import { useState, useEffect } from 'react';
import { AVAILABLE_FONTS, FontOption, fontManager } from '@/lib/fontManager';

interface FontSelectorProps {
  onFontChange?: (fontId: string) => void;
}

export default function FontSelector({ onFontChange }: FontSelectorProps) {
  const [selectedFont, setSelectedFont] = useState<string>('system-default');
  const [isApplying, setIsApplying] = useState(false);
  const [previewFont, setPreviewFont] = useState<string | null>(null);

  useEffect(() => {
    // Initialize with current font
    const currentFont = fontManager.getCurrentFontSync();
    setSelectedFont(currentFont);
  }, []);

  const handleFontSelect = async (fontId: string) => {
    setIsApplying(true);
    try {
      await fontManager.applyFont(fontId);
      setSelectedFont(fontId);
      onFontChange?.(fontId);
    } catch (error) {
      console.error('Failed to apply font:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handlePreview = async (fontId: string) => {
    const font = AVAILABLE_FONTS.find(f => f.id === fontId);
    if (font?.source === 'google') {
      try {
        await fontManager.loadGoogleFont(font);
      } catch (error) {
        console.error('Failed to load preview font:', error);
      }
    }
    setPreviewFont(fontId);
  };

  const clearPreview = () => {
    setPreviewFont(null);
  };

  const fontsByCategory = AVAILABLE_FONTS.reduce((acc, font) => {
    if (!acc[font.category]) {
      acc[font.category] = [];
    }
    acc[font.category].push(font);
    return acc;
  }, {} as Record<string, FontOption[]>);

  const categoryOrder = ['sans-serif', 'serif', 'display', 'monospace'];
  const categoryTitles = {
    'sans-serif': 'Sans Serif',
    'serif': 'Serif',
    'display': 'Display',
    'monospace': 'Monospace'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Font Family</h3>
        {isApplying && (
          <div className="flex items-center text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Applying font...
          </div>
        )}
      </div>

      {/* Font Preview Area */}
      <div className="bg-gray-50 rounded-lg p-6 border">
        <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
        <div 
          className="text-lg leading-relaxed"
          style={{ 
            fontFamily: previewFont 
              ? AVAILABLE_FONTS.find(f => f.id === previewFont)?.family 
              : AVAILABLE_FONTS.find(f => f.id === selectedFont)?.family 
          }}
        >
          The quick brown fox jumps over the lazy dog. This is how your journal entries will look with the selected font.
        </div>
        <div 
          className="text-sm text-gray-600 mt-2"
          style={{ 
            fontFamily: previewFont 
              ? AVAILABLE_FONTS.find(f => f.id === previewFont)?.family 
              : AVAILABLE_FONTS.find(f => f.id === selectedFont)?.family 
          }}
        >
          Numbers: 1234567890 | Special characters: @#$%&*
        </div>
      </div>

      {/* Font Options by Category */}
      {categoryOrder.map(category => {
        if (!fontsByCategory[category]) return null;
        
        return (
          <div key={category} className="space-y-3">
            <h4 className="text-md font-medium text-gray-800 border-b border-gray-200 pb-1">
              {categoryTitles[category]}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {fontsByCategory[category].map(font => (
                <div
                  key={font.id}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedFont === font.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleFontSelect(font.id)}
                  onMouseEnter={() => handlePreview(font.id)}
                  onMouseLeave={clearPreview}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="font-medium text-gray-900">{font.name}</span>
                        <span className="ml-2 text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {font.source}
                        </span>
                        {selectedFont === font.id && (
                          <span className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            ✓ Active
                          </span>
                        )}
                      </div>
                      <div 
                        className="text-lg text-gray-700 mb-1"
                        style={{ fontFamily: font.family }}
                      >
                        {font.preview}
                      </div>
                      <div className="text-xs text-gray-500">{font.family}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Reset Option */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => handleFontSelect('system-default')}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
          disabled={isApplying}
        >
          Reset to system default
        </button>
      </div>
    </div>
  );
} 