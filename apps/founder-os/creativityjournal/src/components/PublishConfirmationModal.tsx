import React from 'react';

interface PublishConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  entryData: {
    subject: string;
    content: string;
    selectedMoods: { value: number; label: string }[];
    satisfaction: number;
    wordCount: number;
    charCount: number;
  };
}

export default function PublishConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  entryData
}: PublishConfirmationModalProps) {
  if (!isOpen) return null;

  const { subject, content, selectedMoods, satisfaction, wordCount, charCount } = entryData;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center" 
      style={{ 
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
      }}
    >
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Confirm Publish Entry</h2>
        
        <p className="text-gray-600 mb-6">
          Do you want to publish the following entry? Published entries are read-only and can only be edited from the view page.
        </p>
        
        {/* Entry Preview */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
          <div className="mb-3">
            <strong>Subject:</strong> {subject || 'No subject'}
          </div>
          <div className="mb-3">
            <strong>Mood(s):</strong> {selectedMoods.length > 0 ? selectedMoods.map(m => m.label).join(', ') : 'No mood selected'}
          </div>
          <div className="mb-3">
            <strong>Satisfaction:</strong> {satisfaction}/10
          </div>
          <div className="mb-3">
            <strong>Stats:</strong> {wordCount} words, {charCount} characters
          </div>
          <div>
            <strong>Content Preview:</strong>
            <div className="mt-2 text-gray-700 whitespace-pre-wrap">
              {content.replace(/<[^>]*>/g, '').slice(0, 200)}{content.length > 200 ? '...' : ''}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : 'Confirm & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
} 