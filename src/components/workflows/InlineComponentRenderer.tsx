'use client';

/**
 * InlineComponentRenderer
 *
 * Renders interactive form components inline within the chat interface.
 * Supports sliders, text inputs, radio buttons, dropdowns, and checkboxes.
 */

import React, { useState, useEffect } from 'react';
import { InlineComponent } from '@/components/artifacts/workflows/config/WorkflowConfig';

interface InlineComponentRendererProps {
  component: InlineComponent;
  onSubmit: (value: any) => void;
  initialValue?: any;
  autoFocus?: boolean;
}

export default function InlineComponentRenderer({
  component,
  onSubmit,
  initialValue,
  autoFocus = true
}: InlineComponentRendererProps) {
  const [value, setValue] = useState<any>(initialValue);
  const [isValid, setIsValid] = useState(false);

  // Initialize value based on component type
  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue);
    } else {
      // Set default values
      switch (component.type) {
        case 'slider':
          setValue(component.defaultValue || component.min);
          break;
        case 'checkbox':
          setValue([]);
          break;
        default:
          setValue('');
      }
    }
  }, [component, initialValue]);

  // Validate input
  useEffect(() => {
    let valid = false;

    switch (component.type) {
      case 'slider':
        valid = value !== undefined && value !== null;
        break;
      case 'textarea':
      case 'input':
        if (component.required) {
          valid = typeof value === 'string' && value.trim().length > 0;
        } else {
          valid = true;
        }
        break;
      case 'radio':
      case 'dropdown':
        if (component.required) {
          valid = value !== null && value !== undefined && value !== '';
        } else {
          valid = true;
        }
        break;
      case 'checkbox':
        if (component.required || component.minSelections) {
          const minSelections = component.minSelections || 1;
          valid = Array.isArray(value) && value.length >= minSelections;
        } else {
          valid = true;
        }
        break;
      default:
        valid = true;
    }

    setIsValid(valid);
  }, [value, component]);

  const handleSubmit = () => {
    if (isValid) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Enter for single-line inputs
    if (e.key === 'Enter' && !e.shiftKey && component.type === 'input') {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Render component based on type
  switch (component.type) {
    case 'slider':
      return (
        <div className="my-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <input
              type="range"
              min={component.min}
              max={component.max}
              step={component.step || 1}
              value={value || component.min}
              onChange={(e) => setValue(Number(e.target.value))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-${component.accentColor || 'blue'}-600`}
              autoFocus={autoFocus}
            />
          </div>

          <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
            <span>{component.labels?.min || component.min}</span>
            <span className={`text-2xl font-bold text-${component.accentColor || 'blue'}-600`}>
              {value || component.min}
            </span>
            <span>{component.labels?.max || component.max}</span>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      );

    case 'textarea':
      return (
        <div className="my-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <textarea
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            placeholder={component.placeholder}
            rows={component.rows || 4}
            maxLength={component.maxLength}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            autoFocus={autoFocus}
          />
          {component.maxLength && (
            <div className="text-xs text-gray-500 mt-2 text-right">
              {value?.length || 0} / {component.maxLength}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      );

    case 'input':
      return (
        <div className="my-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <input
            type={component.inputType || 'text'}
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={component.placeholder}
            maxLength={component.maxLength}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus={autoFocus}
          />
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      );

    case 'radio':
      return (
        <div className="my-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="space-y-3 mb-4">
            {component.options.map((option) => (
              <label
                key={option.value}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  value === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={component.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => setValue(e.target.value)}
                  className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  autoFocus={autoFocus}
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{option.label}</div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      );

    case 'dropdown':
      return (
        <div className="my-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <select
            value={value || ''}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus={autoFocus}
          >
            <option value="">{component.placeholder || 'Select an option...'}</option>
            {component.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      );

    case 'checkbox':
      return (
        <div className="my-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="space-y-3 mb-4">
            {component.options.map((option) => {
              const isChecked = Array.isArray(value) && value.includes(option.value);
              return (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isChecked
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={isChecked}
                    onChange={(e) => {
                      const newValue = Array.isArray(value) ? [...value] : [];
                      if (e.target.checked) {
                        // Add if not exceeding max
                        if (!component.maxSelections || newValue.length < component.maxSelections) {
                          newValue.push(option.value);
                        }
                      } else {
                        // Remove
                        const index = newValue.indexOf(option.value);
                        if (index > -1) {
                          newValue.splice(index, 1);
                        }
                      }
                      setValue(newValue);
                    }}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                    autoFocus={autoFocus}
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          {(component.minSelections || component.maxSelections) && (
            <div className="text-sm text-gray-600 mb-4">
              {component.minSelections && component.maxSelections ? (
                `Select ${component.minSelections} to ${component.maxSelections} options`
              ) : component.minSelections ? (
                `Select at least ${component.minSelections} option${component.minSelections > 1 ? 's' : ''}`
              ) : (
                `Select up to ${component.maxSelections} options`
              )}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      );

    default:
      return (
        <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Unknown component type: {(component as any).type}
        </div>
      );
  }
}
