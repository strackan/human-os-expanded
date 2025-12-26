import React from 'react';

interface SaveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  entry: {
    subject: string;
    content: string;
    mood: string;
    satisfaction: number;
    wordCount: number;
    charCount: number;
  };
}

export default function SaveConfirmationModal({ isOpen, onClose, onConfirm, entry }: SaveConfirmationModalProps) {
  console.log('SaveConfirmationModal rendered with isOpen:', isOpen);
  
  if (!isOpen) {
    console.log('Modal not open, returning null');
    return null;
  }
  
  console.log('Modal is open, rendering modal content');

  // Strip HTML tags for preview
  const plainTextContent = entry.content.replace(/<[^>]*>/g, '');
  const previewContent = plainTextContent.length > 200 
    ? plainTextContent.substring(0, 200) + '...' 
    : plainTextContent;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Confirm Save Entry</h2>
        
        <p className="text-gray-600 mb-6">Do you want to save the following entry?</p>
        
        {/* Entry Preview */}
        <div className="border border-gray-300 rounded-lg p-4 mb-6 bg-gray-50">
          <div className="mb-3">
            <strong>Subject:</strong> {entry.subject || 'No subject'}
          </div>
          <div className="mb-3">
            <strong>Mood:</strong> {entry.mood || 'No mood selected'}
          </div>
          <div className="mb-3">
            <strong>Satisfaction:</strong> {entry.satisfaction}/10
          </div>
          <div className="mb-3">
            <strong>Stats:</strong> {entry.wordCount} words, {entry.charCount} characters
          </div>
          <div>
            <strong>Content Preview:</strong>
            <div className="mt-2 text-gray-700 whitespace-pre-wrap">
              {previewContent || 'No content'}
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-400 text-gray-600 rounded hover:bg-gray-100 transition-colors"
          >
            Go Back to Edit
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
} 