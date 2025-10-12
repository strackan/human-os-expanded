/**
 * Simple Form Step Component
 *
 * A flexible form step that can render different field types based on configuration.
 * Supports: text, textarea, select, checkbox, date, number fields
 *
 * Phase 2.4: Step Components
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { StepComponentProps } from '../StepRenderer';

// =====================================================
// Types
// =====================================================

export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' | 'email';
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>; // For select fields
  defaultValue?: any;
  validation?: (value: any) => string | null; // Returns error message or null
  helperText?: string;
}

export interface SimpleFormStepConfig {
  fields: FormFieldConfig[];
  submitLabel?: string;
  allowSkip?: boolean;
}

// =====================================================
// SimpleFormStep Component
// =====================================================

export const SimpleFormStep: React.FC<StepComponentProps> = ({
  data = {},
  executionId,
  customerId,
  onDataChange,
  onComplete
}) => {
  // Get config from data or use defaults
  const config: SimpleFormStepConfig = data._config || {
    fields: [
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Enter any notes or observations...',
        required: false
      }
    ],
    submitLabel: 'Continue',
    allowSkip: true
  };

  // Initialize form state from saved data or defaults
  const [formData, setFormData] = useState(() => {
    const initialData: any = {};
    config.fields.forEach(field => {
      if (data[field.name] !== undefined) {
        initialData[field.name] = data[field.name];
      } else if (field.defaultValue !== undefined) {
        initialData[field.name] = field.defaultValue;
      } else {
        initialData[field.name] = field.type === 'checkbox' ? false : '';
      }
    });
    return initialData;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const firstInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  // Auto-focus first input on mount
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // Notify parent of data changes
  useEffect(() => {
    onDataChange({ ...formData, _config: config });
  }, [formData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate a single field
  const validateField = (field: FormFieldConfig, value: any): string | null => {
    // Required validation
    if (field.required) {
      if (field.type === 'checkbox' && !value) {
        return `${field.label} is required`;
      }
      if (!value || (typeof value === 'string' && !value.trim())) {
        return `${field.label} is required`;
      }
    }

    // Custom validation
    if (field.validation) {
      return field.validation(value);
    }

    // Email validation
    if (field.type === 'email' && value && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }

    return null;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle field change
  const handleChange = (field: FormFieldConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field.name]: value }));

    // Clear error when user starts typing
    if (errors[field.name]) {
      setErrors(prev => ({ ...prev, [field.name]: '' }));
    }
  };

  // Handle field blur
  const handleBlur = (field: FormFieldConfig) => {
    setTouched(prev => ({ ...prev, [field.name]: true }));

    // Validate on blur if field has been touched
    const error = validateField(field, formData[field.name]);
    if (error) {
      setErrors(prev => ({ ...prev, [field.name]: error }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    config.fields.forEach(field => {
      allTouched[field.name] = true;
    });
    setTouched(allTouched);

    // Validate
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render field based on type
  const renderField = (field: FormFieldConfig, index: number) => {
    const value = formData[field.name];
    const error = touched[field.name] ? errors[field.name] : null;
    const isFirst = index === 0;

    const baseInputClasses = `
      w-full px-3 py-2 border rounded-md transition-colors
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed
      ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
    `;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            ref={isFirst ? (firstInputRef as React.RefObject<HTMLTextAreaElement>) : undefined}
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={field.placeholder}
            disabled={isSubmitting}
            className={`${baseInputClasses} min-h-[100px]`}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            ref={isFirst ? (firstInputRef as React.RefObject<HTMLSelectElement>) : undefined}
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            disabled={isSubmitting}
            className={baseInputClasses}
          >
            <option value="">Select an option...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              ref={isFirst ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(field, e.target.checked)}
              onBlur={() => handleBlur(field)}
              disabled={isSubmitting}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              {field.label}
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            ref={isFirst ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="number"
            value={value}
            onChange={(e) => handleChange(field, e.target.value ? parseFloat(e.target.value) : '')}
            onBlur={() => handleBlur(field)}
            placeholder={field.placeholder}
            disabled={isSubmitting}
            className={baseInputClasses}
          />
        );

      case 'date':
        return (
          <input
            ref={isFirst ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="date"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            disabled={isSubmitting}
            className={baseInputClasses}
          />
        );

      case 'email':
        return (
          <input
            ref={isFirst ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="email"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={field.placeholder}
            disabled={isSubmitting}
            className={baseInputClasses}
          />
        );

      default: // text
        return (
          <input
            ref={isFirst ? (firstInputRef as React.RefObject<HTMLInputElement>) : undefined}
            type="text"
            value={value}
            onChange={(e) => handleChange(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            placeholder={field.placeholder}
            disabled={isSubmitting}
            className={baseInputClasses}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {config.fields.map((field, index) => (
        <div key={field.name}>
          {field.type !== 'checkbox' && (
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}

          {renderField(field, index)}

          {/* Helper text */}
          {field.helperText && !errors[field.name] && (
            <p className="mt-1 text-sm text-gray-500">{field.helperText}</p>
          )}

          {/* Error message */}
          {touched[field.name] && errors[field.name] && (
            <div className="mt-1 flex items-start space-x-1 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{errors[field.name]}</span>
            </div>
          )}
        </div>
      ))}

      {/* Submit button */}
      <div className="flex items-center space-x-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              {config.submitLabel || 'Continue'}
            </>
          )}
        </button>

        {config.allowSkip && (
          <button
            type="button"
            onClick={() => onComplete()}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Skip
          </button>
        )}
      </div>
    </form>
  );
};

export default SimpleFormStep;
