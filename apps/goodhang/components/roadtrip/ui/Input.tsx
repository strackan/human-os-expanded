'use client';

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--rt-navy)] rt-typewriter"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rt-camp-input ${error ? 'border-[var(--rt-rust)]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-[var(--rt-rust)]">{error}</span>}
    </div>
  );
}
