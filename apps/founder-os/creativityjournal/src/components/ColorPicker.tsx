'use client';

import React, { useEffect } from 'react';
import { ColorPicker as ReactColorPicker, useColor } from 'react-color-palette';
import 'react-color-palette/css';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#10b981', // Default emerald green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple  
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6b7280', // Gray
  '#059669', // Dark emerald
  '#7c3aed', // Dark purple
];

export default function ColorPicker({ 
  selectedColor, 
  onColorChange, 
  label = "Mood Color", 
  disabled = false 
}: ColorPickerProps) {
  const [color, setColor] = useColor(selectedColor);

  // Update parent component when color changes
  useEffect(() => {
    onColorChange(color.hex);
  }, [color.hex, onColorChange]);

  // Update internal color when selectedColor prop changes
  useEffect(() => {
    if (selectedColor !== color.hex) {
      setColor(useColor(selectedColor)[0]);
    }
  }, [selectedColor]);

  const handlePresetColorClick = (presetColor: string) => {
    const [newColor] = useColor(presetColor);
    setColor(newColor);
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {/* Color Preview */}
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
          style={{ backgroundColor: color.hex }}
          title={`Selected color: ${color.hex}`}
        />
        <div className="text-sm text-gray-600">
          <div className="font-medium">Current Color</div>
          <div className="text-xs font-mono">{color.hex}</div>
        </div>
      </div>

      {/* React Color Palette Picker */}
      <div className="react-color-palette-wrapper">
        <ReactColorPicker 
          color={color} 
          onChange={setColor} 
          hideInput={["rgb", "hsv"]}
          disabled={disabled}
          height={200}
        />
      </div>
      
      {/* Preset Colors Grid */}
      <div>
        <div className="text-xs font-medium text-gray-600 mb-2">Preset Colors</div>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => handlePresetColorClick(presetColor)}
              disabled={disabled}
              className={`
                w-10 h-10 rounded-lg border-2 transition-all duration-200 
                hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                ${color.hex === presetColor ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300'}
              `}
              style={{ backgroundColor: presetColor }}
              title={`Select color ${presetColor}`}
              aria-label={`Select color ${presetColor}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 