import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

export interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'radio';
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  helpText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ label: string; value: any }>;
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  icon?: React.ReactNode;
}

/**
 * FormField - Atomic Component
 *
 * Universal form input component supporting multiple input types.
 * Handles validation, error display, help text, and accessibility.
 *
 * @example
 * <FormField
 *   label="Renewal Price"
 *   name="renewalPrice"
 *   type="number"
 *   value={120000}
 *   onChange={(val) => setPrice(val)}
 *   placeholder="Enter price"
 *   helpText="Recommended: $120,000 (+7.5%)"
 *   required
 *   min={0}
 *   step={1000}
 *   icon={<CurrencyDollarIcon />}
 * />
 */
export const FormField = React.memo(function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  helpText,
  error,
  required = false,
  disabled = false,
  options = [],
  rows = 4,
  min,
  max,
  step,
  icon
}: FormFieldProps) {
  const id = `field-${name}`;
  const hasError = !!error;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) : e.target.value;
    onChange(newValue);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  const baseInputClasses = `
    w-full rounded-md border px-3 py-2 text-sm
    transition-colors duration-150
    ${hasError
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    focus:outline-none focus:ring-2 focus:ring-opacity-50
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={id}
            name={name}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            className={baseInputClasses}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          />
        );

      case 'select':
        return (
          <select
            id={id}
            name={name}
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            className={baseInputClasses}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          >
            <option value="" disabled>
              {placeholder || 'Select an option...'}
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              id={id}
              name={name}
              type="checkbox"
              checked={value || false}
              onChange={handleCheckboxChange}
              disabled={disabled}
              required={required}
              className="
                w-4 h-4 rounded border-gray-300 text-blue-600
                focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50
                disabled:cursor-not-allowed disabled:opacity-50
              "
              aria-invalid={hasError}
              aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            />
            <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer select-none">
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <div key={option.value} className="flex items-center gap-2">
                <input
                  id={`${id}-${option.value}`}
                  name={name}
                  type="radio"
                  value={option.value}
                  checked={value === option.value}
                  onChange={handleChange}
                  disabled={disabled}
                  required={required}
                  className="
                    w-4 h-4 border-gray-300 text-blue-600
                    focus:ring-blue-500 focus:ring-2 focus:ring-opacity-50
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                />
                <label
                  htmlFor={`${id}-${option.value}`}
                  className="text-sm text-gray-700 cursor-pointer select-none"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'number':
        return (
          <input
            id={id}
            name={name}
            type="number"
            value={value ?? ''}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            className={baseInputClasses}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          />
        );

      case 'date':
        return (
          <input
            id={id}
            name={name}
            type="date"
            value={value || ''}
            onChange={handleChange}
            disabled={disabled}
            required={required}
            min={min as any}
            max={max as any}
            className={baseInputClasses}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          />
        );

      default: // text
        return (
          <input
            id={id}
            name={name}
            type="text"
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={baseInputClasses}
            aria-invalid={hasError}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          />
        );
    }
  };

  // Checkbox and radio have inline labels, skip wrapper label
  if (type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderInput()}
        {error && (
          <div id={`${id}-error`} className="flex items-center gap-1 text-sm text-red-600">
            <ExclamationCircleIcon className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && helpText && (
          <p id={`${id}-help`} className="text-sm text-gray-500">
            {helpText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Label */}
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700">
        {icon && <span className="text-gray-500">{icon}</span>}
        <span>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>

      {/* Input */}
      {renderInput()}

      {/* Error Message */}
      {error && (
        <div id={`${id}-error`} className="flex items-center gap-1 text-sm text-red-600">
          <ExclamationCircleIcon className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Help Text */}
      {!error && helpText && (
        <p id={`${id}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
