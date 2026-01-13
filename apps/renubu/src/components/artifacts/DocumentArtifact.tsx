import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentArtifactProps {
  data?: Record<string, any> | string;
  readOnly?: boolean;
  title?: string;
  onFieldChange?: (field: string, value: any) => void;
  className?: string;
}

interface EditableFieldProps {
  value: any;
  field: string;
  label?: string;
  type?: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'currency';
  readOnly?: boolean;
  onSave: (field: string, value: any) => void;
  className?: string;
  displayFormat?: (value: any) => string;
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  field,
  label,
  type = 'text',
  readOnly = false,
  onSave,
  className = '',
  displayFormat
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'textarea') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleDoubleClick = () => {
    if (!readOnly) {
      setIsEditing(true);
      setEditValue(value);
      setError('');
    }
  };

  const handleSave = () => {
    setError('');

    // Validation
    if (type === 'email' && editValue && !/\S+@\S+\.\S+/.test(editValue)) {
      setError('Invalid email format');
      return;
    }

    if (type === 'number' || type === 'currency') {
      const numValue = parseFloat(editValue);
      if (isNaN(numValue)) {
        setError('Must be a valid number');
        return;
      }
      onSave(field, numValue);
    } else {
      onSave(field, editValue);
    }

    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setError('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const formatDisplayValue = (val: any) => {
    if (displayFormat) {
      return displayFormat(val);
    }

    if (type === 'currency' && typeof val === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }

    if (type === 'date' && val) {
      return new Date(val).toLocaleDateString();
    }

    return val?.toString() || '';
  };

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="flex items-start space-x-2">
          {type === 'textarea' ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[60px]"
              rows={3}
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type === 'currency' ? 'number' : type}
              step={type === 'currency' ? '0.01' : undefined}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          )}
          <div className="flex space-x-1">
            <button
              onClick={handleSave}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group ${!readOnly ? 'cursor-pointer' : ''} ${className}`}
      onDoubleClick={handleDoubleClick}
      title={!readOnly ? 'Double-click to edit' : ''}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className={`relative px-3 py-2 rounded-md transition-colors ${
        !readOnly
          ? 'hover:bg-gray-50 border border-transparent hover:border-gray-200'
          : 'bg-gray-50 text-gray-600'
      }`}>
        <span className="block">{formatDisplayValue(value) || 'Click to add...'}</span>
        {!readOnly && (
          <Edit2 className="w-3 h-3 text-gray-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
};

const DocumentArtifact: React.FC<DocumentArtifactProps> = ({
  data = {},
  readOnly = false,
  title = 'Document',
  onFieldChange,
  className = ''
}) => {
  // Check if data is markdown content (string)
  const isMarkdown = typeof data === 'string';
  const [documentData, setDocumentData] = useState(isMarkdown ? {} : data);

  const handleFieldSave = (field: string, value: any) => {
    const updatedData = { ...documentData, [field]: value };
    setDocumentData(updatedData);
    onFieldChange?.(field, value);
  };

  // Helper function to render nested object fields
  const renderFieldGroup = (obj: any, prefix = '') => {
    return Object.entries(obj).map(([key, value]) => {
      const fieldPath = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return (
          <div key={fieldPath} className="space-y-4">
            <h4 className="font-medium text-gray-900 text-base capitalize border-b border-gray-200 pb-2">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h4>
            <div className="pl-4 space-y-3">
              {renderFieldGroup(value, fieldPath)}
            </div>
          </div>
        );
      }

      // Determine field type based on key name and value
      let fieldType: 'text' | 'number' | 'email' | 'date' | 'textarea' | 'currency' = 'text';

      if (key.toLowerCase().includes('email')) {
        fieldType = 'email';
      } else if (key.toLowerCase().includes('date')) {
        fieldType = 'date';
      } else if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('value') || key.toLowerCase().includes('amount')) {
        fieldType = 'currency';
      } else if (typeof value === 'number') {
        fieldType = 'number';
      } else if (typeof value === 'string' && value.length > 100) {
        fieldType = 'textarea';
      }

      return (
        <EditableField
          key={fieldPath}
          value={value}
          field={fieldPath}
          label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          type={fieldType}
          readOnly={readOnly}
          onSave={handleFieldSave}
          className="w-full"
        />
      );
    });
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">
              {readOnly ? 'Read-only document' : 'Double-click any field to edit'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isMarkdown ? (
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-table:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data as string}
            </ReactMarkdown>
          </div>
        ) : Object.keys(documentData).length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p>No document data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {renderFieldGroup(documentData)}
          </div>
        )}
      </div>

      {/* Footer - only show for editable field-based documents */}
      {!readOnly && !isMarkdown && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 flex items-center space-x-1">
            <Edit2 className="w-3 h-3" />
            <span>Double-click any field to edit • Press Enter to save • Press Escape to cancel</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default DocumentArtifact;