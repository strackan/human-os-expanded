'use client';

import React from 'react';

interface NewEntryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDiscard: () => void;
}

export default function NewEntryConfirmationModal({
  isOpen,
  onClose,
  onSaveDraft,
  onPublish,
  onDiscard
}: NewEntryConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          You have an unsaved entry
        </h3>
        
        <p className="text-gray-600 mb-6">
          What would you like to do with your current entry before creating a new one?
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onSaveDraft}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            Save as Draft
          </button>
          
          <button
            onClick={onPublish}
            className="w-full px-4 py-3 bg-core-green text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Publish Entry
          </button>
          
          <button
            onClick={onDiscard}
            className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            Discard Entry
          </button>
          
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 