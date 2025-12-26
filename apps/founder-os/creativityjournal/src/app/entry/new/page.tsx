'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertModal } from '@/components/Modal';
import { EnhancedEmotionSelector } from '@/components/EnhancedEmotionSelector';
import { useToast } from '@/components/Toast';

export default function NewEntryPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [selectedEmotionIds, setSelectedEmotionIds] = useState<number[]>([]);
  const [moodContext, setMoodContext] = useState('');
  const [satisfaction, setSatisfaction] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Toast notifications
  const { showToast } = useToast();
  
  // Modal state
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'success' | 'error' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info'
  });



  const handleStartEntry = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/entries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          content: '',
          moodIds: selectedEmotionIds,
          moodContext,
          satisfaction,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const entryData = {
          subject,
          selectedMoods: [],
          selectedEmotionIds: selectedEmotionIds,
          moodContext,
          satisfaction,
          entryId: data.entryId,
          timestamp: new Date().toISOString(),
          useEnhancedSelector: true,
        };
        console.log('[Interstitial] Saving entry_metadata to localStorage:', entryData);
        localStorage.setItem('entry_metadata', JSON.stringify(entryData));
        router.push(`/entry/${data.entryId}`);
      } else {
        console.error('[Interstitial] Failed to create new entry');
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to create entry. Please try again.',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('[Interstitial] Error creating new entry:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Error creating entry. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Create a minimal entry and go directly to writing
    handleStartEntry();
  };

  return (
    <div className="min-h-screen bg-main-bg flex items-center justify-center p-6">
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
      
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start Your Journal Entry</h1>
          <p className="text-gray-600">Set the context for your writing session (optional)</p>
        </div>

        <div className="space-y-6">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Subject or Topic
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What are you writing about today?"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-core-green focus:border-transparent text-lg"
            />
          </div>

          {/* Satisfaction */}
          <div className="mt-2 mb-2">
            <label htmlFor="satisfaction-range" className="block text-sm font-medium text-gray-700 mb-1">
              How Are You Doing Today? (1-10)
            </label>
            <div className="relative flex items-center gap-4">
              {/* Range track with gradient */}
              <div className="flex-1 relative" style={{ minWidth: '0' }}>
                <div className="h-2 bg-gradient-to-r from-red-300 via-yellow-300 to-green-400 rounded-full"></div>
                {/* Grid lines */}
                <div className="absolute top-0 left-0 right-0 h-2 flex justify-between items-center px-1 pointer-events-none">
                  {[1,2,3,4,5,6,7,8,9,10].map(i => (
                    <div key={i} className="w-0.5 h-4 bg-gray-400 opacity-60"></div>
                  ))}
                </div>
                {/* Range input */}
                <input
                  id="satisfaction-range"
                  type="range"
                  min="1"
                  max="10"
                  value={satisfaction}
                  onChange={e => setSatisfaction(parseInt(e.target.value))}
                  className="absolute top-0 left-0 w-full h-2 bg-transparent appearance-none cursor-pointer range-slider"
                  style={{ background: 'transparent', zIndex: 0 }}
                />
                {/* Scale numbers */}
                <div className="flex justify-between text-xs text-gray-500 mt-2 px-1" style={{ marginTop: '8px' }}>
                  {[1,2,3,4,5,6,7,8,9,10].map(i => (
                    <span key={i} className="text-center" style={{ width: '10%' }}>{i}</span>
                  ))}
                </div>
              </div>
              {/* Numeric indicator to the right */}
              <div className="ml-2 min-w-[2.5rem] text-center" style={{ zIndex: 0 }}>
                <span className="text-xl font-bold text-core-green bg-white border-2 border-core-green rounded-full w-10 h-10 flex items-center justify-center">
                  {satisfaction}
                </span>
              </div>
            </div>
          </div>

          {/* Mood */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="mood-select" className="block text-sm font-medium text-gray-700">
                Current Mood(s)
              </label>

            </div>
            
            <EnhancedEmotionSelector
              selectedEmotions={selectedEmotionIds}
              onEmotionSelect={setSelectedEmotionIds}
              placeholder="How are you feeling? (select multiple if needed)"
              enablePreferences={true}
              showAnalysis={false}
              showCategories={true}
              usageContext="entry_creation"
              className="text-lg"
            />
          </div>

          {/* Mood Context - always visible */}
          <div>
            <label htmlFor="mood-context" className="block text-sm font-medium text-gray-700 mb-2">
              Mood Context (optional)
            </label>
            <textarea
              id="mood-context"
              value={moodContext}
              onChange={e => setMoodContext(e.target.value)}
              placeholder="Any additional context about your mood..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-core-green focus:border-transparent text-lg resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8">
          <button
            onClick={handleStartEntry}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-core-green text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Entry...' : 'Start Writing'}
          </button>
          <div className="text-center mt-4">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 underline text-sm"
            >
              Skip and start writing immediately
            </button>
          </div>
        </div>
      </div>
      

      

    </div>
  );
} 