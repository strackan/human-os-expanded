'use client';

import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-sm font-medium text-[var(--rt-navy)] rt-typewriter"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`rt-camp-input min-h-[100px] resize-y ${error ? 'border-[var(--rt-rust)]' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-sm text-[var(--rt-rust)]">{error}</span>}
    </div>
  );
}
