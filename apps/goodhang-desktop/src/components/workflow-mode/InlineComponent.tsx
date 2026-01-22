/**
 * Inline Component
 *
 * Renders inline widgets within chat messages.
 * Supports: slider, textarea, input, radio, dropdown, checkbox, star-rating
 */

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import type { InlineComponentProps, InlineComponentConfig } from '@/lib/types/workflow';

// =============================================================================
// SLIDER COMPONENT
// =============================================================================

interface SliderInputProps {
  config: InlineComponentConfig;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function SliderInput({ config, value, onChange, disabled }: SliderInputProps) {
  const min = config.min ?? 0;
  const max = config.max ?? 100;
  const step = config.step ?? 1;

  return (
    <div className="space-y-2">
      {config.label && (
        <label className="text-sm text-gray-400">{config.label}</label>
      )}
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="flex-1 h-2 bg-gh-dark-600 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-50"
        />
        <span className="text-sm text-white w-12 text-right">{value}</span>
      </div>
    </div>
  );
}

// =============================================================================
// TEXT INPUT COMPONENT
// =============================================================================

interface TextInputProps {
  config: InlineComponentConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  multiline?: boolean;
}

function TextInput({ config, value, onChange, disabled, multiline }: TextInputProps) {
  const InputComponent = multiline ? 'textarea' : 'input';

  return (
    <div className="space-y-2">
      {config.label && (
        <label className="text-sm text-gray-400">{config.label}</label>
      )}
      <InputComponent
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.placeholder}
        disabled={disabled}
        className={`w-full bg-gh-dark-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
          multiline ? 'min-h-[100px] resize-y' : ''
        }`}
      />
    </div>
  );
}

// =============================================================================
// RADIO/DROPDOWN COMPONENT
// =============================================================================

interface RadioInputProps {
  config: InlineComponentConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function RadioInput({ config, value, onChange, disabled }: RadioInputProps) {
  const options = config.options ?? [];

  return (
    <div className="space-y-2">
      {config.label && (
        <label className="text-sm text-gray-400">{config.label}</label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
              value === option.value
                ? 'bg-blue-600/20 border-blue-500 text-white'
                : 'bg-gh-dark-600 border-gh-dark-500 text-gray-300 hover:border-gray-400'
            } disabled:opacity-50`}
          >
            <div
              className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                value === option.value ? 'border-blue-500' : 'border-gray-500'
              }`}
            >
              {value === option.value && (
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              )}
            </div>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// DROPDOWN COMPONENT
// =============================================================================

interface DropdownInputProps {
  config: InlineComponentConfig;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function DropdownInput({ config, value, onChange, disabled }: DropdownInputProps) {
  const options = config.options ?? [];

  return (
    <div className="space-y-2">
      {config.label && (
        <label className="text-sm text-gray-400">{config.label}</label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-gh-dark-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <option value="">{config.placeholder || 'Select an option...'}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// =============================================================================
// CHECKBOX COMPONENT
// =============================================================================

interface CheckboxInputProps {
  config: InlineComponentConfig;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

function CheckboxInput({ config, value, onChange, disabled }: CheckboxInputProps) {
  const options = config.options ?? [];

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {config.label && (
        <label className="text-sm text-gray-400">{config.label}</label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => toggleOption(option.value)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
              value.includes(option.value)
                ? 'bg-blue-600/20 border-blue-500 text-white'
                : 'bg-gh-dark-600 border-gh-dark-500 text-gray-300 hover:border-gray-400'
            } disabled:opacity-50`}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center ${
                value.includes(option.value)
                  ? 'bg-blue-500'
                  : 'border-2 border-gray-500'
              }`}
            >
              {value.includes(option.value) && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// STAR RATING COMPONENT
// =============================================================================

interface StarRatingInputProps {
  config: InlineComponentConfig;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

function StarRatingInput({ config, value, onChange, disabled }: StarRatingInputProps) {
  const max = config.max ?? 5;
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {config.label && (
        <label className="text-sm text-gray-400">{config.label}</label>
      )}
      <div className="flex gap-1">
        {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            disabled={disabled}
            className="p-1 transition-transform hover:scale-110 disabled:opacity-50"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (hovered ?? value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-500'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function InlineComponent({ config, onSubmit, disabled }: InlineComponentProps) {
  const [value, setValue] = useState<unknown>(config.defaultValue ?? getDefaultValue(config.type));
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    onSubmit(value);
    setSubmitted(true);
  }, [value, onSubmit]);

  // Already submitted
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-sm text-green-400"
      >
        <Check className="w-4 h-4" />
        <span>Response recorded</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gh-dark-800 rounded-xl p-4 border border-gh-dark-600"
    >
      {/* Render appropriate input type */}
      {config.type === 'slider' && (
        <SliderInput
          config={config}
          value={value as number}
          onChange={setValue}
          disabled={disabled}
        />
      )}
      {config.type === 'textarea' && (
        <TextInput
          config={config}
          value={value as string}
          onChange={setValue}
          disabled={disabled}
          multiline
        />
      )}
      {config.type === 'input' && (
        <TextInput
          config={config}
          value={value as string}
          onChange={setValue}
          disabled={disabled}
        />
      )}
      {config.type === 'radio' && (
        <RadioInput
          config={config}
          value={value as string}
          onChange={setValue}
          disabled={disabled}
        />
      )}
      {config.type === 'dropdown' && (
        <DropdownInput
          config={config}
          value={value as string}
          onChange={setValue}
          disabled={disabled}
        />
      )}
      {config.type === 'checkbox' && (
        <CheckboxInput
          config={config}
          value={value as string[]}
          onChange={setValue}
          disabled={disabled}
        />
      )}
      {config.type === 'star-rating' && (
        <StarRatingInput
          config={config}
          value={value as number}
          onChange={setValue}
          disabled={disabled}
        />
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || !isValid(config, value)}
        className="mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        Submit
      </button>
    </motion.div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultValue(type: string): unknown {
  switch (type) {
    case 'slider':
    case 'star-rating':
      return 0;
    case 'checkbox':
      return [];
    default:
      return '';
  }
}

function isValid(config: InlineComponentConfig, value: unknown): boolean {
  if (!config.required) return true;

  switch (config.type) {
    case 'slider':
    case 'star-rating':
      return typeof value === 'number' && value > 0;
    case 'checkbox':
      return Array.isArray(value) && value.length > 0;
    default:
      return typeof value === 'string' && value.trim().length > 0;
  }
}

export default InlineComponent;
