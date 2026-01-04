'use client';

import { InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export default function Checkbox({
  label,
  description,
  className = '',
  id,
  ...props
}: CheckboxProps) {
  const inputId = id || `checkbox-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-3 cursor-pointer group ${className}`}
    >
      <input
        type="checkbox"
        id={inputId}
        className="rt-camp-checkbox mt-0.5 flex-shrink-0"
        {...props}
      />
      <div className="flex flex-col">
        <span className="text-[var(--rt-navy)] group-hover:text-[var(--rt-forest)] transition-colors">
          {label}
        </span>
        {description && (
          <span className="text-sm text-[var(--rt-cork-dark)] mt-0.5">{description}</span>
        )}
      </div>
    </label>
  );
}
