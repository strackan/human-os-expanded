import React from 'react';

interface EntryActionButtonsProps {
  isSubmitting: boolean;
  writingMode: boolean;
  onSaveAsDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onToggleWritingMode: () => void;
}

export default function EntryActionButtons({
  isSubmitting,
  writingMode,
  onSaveAsDraft,
  onPublish,
  onCancel,
  onToggleWritingMode
}: EntryActionButtonsProps) {
  if (writingMode) {
    return (
      <div className="fixed bottom-8 right-8 flex space-x-4">
        <button
          onClick={onToggleWritingMode}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Exit Writing Mode
        </button>
        <button
          onClick={onSaveAsDraft}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={onPublish}
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mt-6">
      <div className="flex space-x-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          onClick={onToggleWritingMode}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          Writing Mode
        </button>
      </div>
      <div className="flex space-x-4">
        <button
          onClick={onSaveAsDraft}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={onPublish}
          disabled={isSubmitting}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  );
} 