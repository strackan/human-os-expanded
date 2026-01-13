import React from 'react';
import { CheckCircle } from 'lucide-react';

interface ReviewCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Reusable review checkbox/button component
 *
 * Used to confirm that a user has reviewed a section
 */
export function ReviewCheckbox({ label, checked, onChange }: ReviewCheckboxProps) {
  return (
    <div className="pt-6 border-t border-gray-200">
      <button
        onClick={() => onChange(!checked)}
        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all w-full text-left ${
          checked
            ? 'bg-green-50 border-green-500'
            : 'bg-gray-50 border-gray-300 hover:border-gray-400'
        }`}
      >
        <div
          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            checked
              ? 'bg-green-500 border-green-500'
              : 'bg-white border-gray-400'
          }`}
        >
          {checked && <CheckCircle className="w-5 h-5 text-white" />}
        </div>
        <span
          className={`text-sm font-medium ${
            checked ? 'text-green-900' : 'text-gray-700'
          }`}
        >
          {label}
        </span>
      </button>
    </div>
  );
}
