'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddCustomWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMoodAdded?: (mood: any) => void;
  initialMoodName?: string;
}

interface CustomWordFormData {
  emotionName: string;
  valence: 'positive' | 'negative' | 'neutral' | '';
  similarWord: string;
  plutchikEmotions: string[];
  plutchikOther: string;
}

const PLUTCHIK_EMOTIONS = [
  'Happy',
  'Angry / Annoyed', 
  'Sad / Disappointed',
  'Surprised / Shocked',
  'Disgusted',
  'Fearful / Anxious',
  'Accepting / Trusting',
  'Anticipating'
];

export default function AddCustomWordModal({ isOpen, onClose, onMoodAdded, initialMoodName }: AddCustomWordModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CustomWordFormData>({
    emotionName: initialMoodName || '',
    valence: '',
    similarWord: '',
    plutchikEmotions: [],
    plutchikOther: ''
  });

  // Update emotion name when initialMoodName changes
  React.useEffect(() => {
    if (initialMoodName && initialMoodName !== formData.emotionName) {
      setFormData(prev => ({ ...prev, emotionName: initialMoodName }));
    }
  }, [initialMoodName]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmotionToggle = (emotion: string) => {
    setFormData(prev => ({
      ...prev,
      plutchikEmotions: prev.plutchikEmotions.includes(emotion)
        ? prev.plutchikEmotions.filter(e => e !== emotion)
        : [...prev.plutchikEmotions, emotion]
    }));
  };

  const handleOtherToggle = (checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        plutchikEmotions: [...prev.plutchikEmotions, 'Other']
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        plutchikEmotions: prev.plutchikEmotions.filter(e => e !== 'Other'),
        plutchikOther: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.emotionName.trim()) {
        throw new Error('Please enter an emotion name');
      }
      if (!formData.valence) {
        throw new Error('Please select if the emotion is positive, negative, or neutral');
      }
      if (!formData.similarWord.trim()) {
        throw new Error('Please enter a similar word');
      }
      if (formData.plutchikEmotions.length === 0) {
        throw new Error('Please select at least one basic emotion');
      }
      if (formData.plutchikEmotions.includes('Other') && !formData.plutchikOther.trim()) {
        throw new Error('Please specify the "Other" emotion');
      }

      // Submit the form
      const response = await fetch('/api/user-moods/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotionName: formData.emotionName.trim(),
          valence: formData.valence,
          similarWord: formData.similarWord.trim(),
          plutchikEmotions: formData.plutchikEmotions,
          plutchikOther: formData.plutchikOther.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create custom word');
      }

      const newMood = await response.json();
      console.log('[AddCustomWordModal] Successfully created mood:', newMood);
      
      // Reset form
      setFormData({
        emotionName: '',
        valence: '',
        similarWord: '',
        plutchikEmotions: [],
        plutchikOther: ''
      });

      // Notify parent component
      if (onMoodAdded) {
        console.log('[AddCustomWordModal] Calling onMoodAdded callback with:', newMood);
        onMoodAdded(newMood);
      } else {
        console.log('[AddCustomWordModal] No onMoodAdded callback provided');
      }

      // Close modal
      onClose();

      // Note: Removed router.refresh() as the callback should handle UI updates

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add Custom Word</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Don't see your preferred mood? Help us expand our emotion database by adding it below!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question 1: Emotion Name */}
            <div>
              <label htmlFor="emotionName" className="block text-sm font-medium text-gray-700 mb-1">
                What would you call this emotion?
              </label>
              <input
                type="text"
                id="emotionName"
                value={formData.emotionName}
                onChange={(e) => setFormData(prev => ({ ...prev, emotionName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., overwhelmed, ecstatic, melancholic"
                disabled={isSubmitting}
              />
            </div>

            {/* Question 2: Valence */}
            <div>
              <label htmlFor="valence" className="block text-sm font-medium text-gray-700 mb-1">
                Would you describe this emotion as positive, negative, or neutral?
              </label>
              <select
                id="valence"
                value={formData.valence}
                onChange={(e) => setFormData(prev => ({ ...prev, valence: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select valence...</option>
                <option value="positive">Positive</option>
                <option value="negative">Negative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            {/* Question 3: Similar Word */}
            <div>
              <label htmlFor="similarWord" className="block text-sm font-medium text-gray-700 mb-1">
                What is a common word someone might use in place of this word?
              </label>
              <input
                type="text"
                id="similarWord"
                value={formData.similarWord}
                onChange={(e) => setFormData(prev => ({ ...prev, similarWord: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., stressed, happy, sad"
                disabled={isSubmitting}
              />
            </div>

            {/* Question 4: Plutchik Emotions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which of these words best captures this mood? Choose at least one.
              </label>
              <div className="space-y-2">
                {PLUTCHIK_EMOTIONS.map((emotion) => (
                  <label key={emotion} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.plutchikEmotions.includes(emotion)}
                      onChange={() => handleEmotionToggle(emotion)}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm text-gray-700">{emotion}</span>
                  </label>
                ))}
                
                {/* Other option */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.plutchikEmotions.includes('Other')}
                    onChange={(e) => handleOtherToggle(e.target.checked)}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700">Other</span>
                </label>
                
                {formData.plutchikEmotions.includes('Other') && (
                  <input
                    type="text"
                    value={formData.plutchikOther}
                    onChange={(e) => setFormData(prev => ({ ...prev, plutchikOther: e.target.value }))}
                    className="ml-6 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Specify other emotion..."
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Custom Word'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 