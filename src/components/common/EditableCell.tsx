"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface EditableCellProps {
  value: string | number;
  onSave: (newValue: string | number) => void;
  type?: 'text' | 'number' | 'date' | 'email';
  placeholder?: string;
  className?: string;
  cellClassName?: string;
  displayFormat?: (value: string | number) => string;
  validateValue?: (value: string | number) => boolean;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  onSave,
  type = 'text',
  placeholder,
  className = '',
  cellClassName = '',
  displayFormat,
  validateValue
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' || type === 'email') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (validateValue && !validateValue(editValue)) {
      setIsValid(false);
      return;
    }
    
    setIsValid(true);
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsValid(true);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = type === 'number' ? Number(e.target.value) : e.target.value;
    setEditValue(newValue);
    
    if (validateValue) {
      setIsValid(validateValue(newValue));
    }
  };

  const formatDisplayValue = (val: string | number) => {
    if (displayFormat) {
      return displayFormat(val);
    }
    
    if (type === 'number' && typeof val === 'number') {
      return val.toLocaleString();
    }
    
    if (type === 'date' && val) {
      return new Date(val).toLocaleDateString();
    }
    
    return String(val);
  };

  if (isEditing) {
    return (
      <div className={`relative ${cellClassName}`}>
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              !isValid ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
            } ${className}`}
          />
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="p-1 text-green-600 hover:text-green-800 disabled:text-gray-400"
            title="Save"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-600 hover:text-red-800"
            title="Cancel"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        {!isValid && (
          <p className="text-xs text-red-600 mt-1">Invalid value</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors ${cellClassName}`}
      onDoubleClick={handleDoubleClick}
      title="Double-click to edit"
    >
      <span className={`text-sm font-semibold text-gray-800 ${className}`}>
        {formatDisplayValue(value)}
      </span>
    </div>
  );
};

export default EditableCell;
