'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Select from 'react-select';
import TiptapEditor from '@/components/TiptapEditor';
import SaveConfirmationModal from '@/components/SaveConfirmationModal';
import EntryPanel from '@/components/EntryPanel';
import TaskPanel from '@/components/TaskPanel';
import { useEntry } from '@/components/EntryContext';
import { useHotkeys } from '@/hooks/useHotkeys';
import { useTextSelection } from '@/hooks/useTextSelection';

interface Mood {
  id: number | string;
  name: string;
  pillStatus?: 'red' | 'yellow' | 'green' | 'grey';
  canPromote?: boolean;
  userMoodId?: number;
  type?: string;
  status?: string;
}

interface MoodLoadingState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  lastRetryTime: number | null;
}

// Debounce function to prevent excessive saves
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function EntryPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<{ value: number | string; label: string }[]>([]);
  const [moodContext, setMoodContext] = useState('');
  const [satisfaction, setSatisfaction] = useState(5);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [moods, setMoods] = useState<Mood[]>([]);

  const [moodLoadingState, setMoodLoadingState] = useState<MoodLoadingState>({
    loading: false,
    error: null,
    retryCount: 0,
    lastRetryTime: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { writingMode, setWritingMode } = useEntry();
  const [editor, setEditor] = useState<any>(null);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const { selectedText, clearSelection } = useTextSelection();
  const [wordTarget, setWordTarget] = useState<number>(500);
  
  // Store mood IDs separately to handle race condition between mood loading and draft loading
  const [storedMoodIds, setStoredMoodIds] = useState<(number | string)[]>([]);
  const [moodsLoaded, setMoodsLoaded] = useState(false);
  const [draftDataLoaded, setDraftDataLoaded] = useState(false);

  // Debounce content changes for auto-save
  const debouncedContent = useDebounce(content, 2000);
  const debouncedWordCount = useDebounce(wordCount, 2000);
  const debouncedCharCount = useDebounce(charCount, 2000);

  // Hotkey handlers
  useHotkeys([
    {
      key: 't',
      alt: true,
      handler: () => {
        setShowTaskPanel(true);
        if (selectedText) {
          // The TaskPanel will automatically use the selected text
          clearSelection();
        }
      },
    },
  ]);

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
    // Ensure modal starts closed
    setShowConfirmationModal(false);
    
    // Add global function for debugging
    (window as any).clearEntryCache = () => {
      console.log('Clearing entry cache via global function');
      localStorage.removeItem('entry_draft');
      setCurrentEntryId(null);
    };
  }, []);

  // Fetch user data including word target
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.wordTarget) {
            setWordTarget(data.user.wordTarget);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    if (mounted) {
      fetchUserData();
    }
  }, [mounted]);

  // Clear stale draft data
  const clearStaleDraft = useCallback(() => {
    console.log('Clearing stale draft data');
    localStorage.removeItem('entry_draft');
    setCurrentEntryId(null);
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    const loadDraftData = async () => {
      const metadata = localStorage.getItem('entry_metadata');
      if (metadata) {
        try {
          const entryData = JSON.parse(metadata);
          console.log('[EntryPage] Loaded entry_metadata from localStorage:', entryData);
          setSubject(entryData.subject || '');
          setMoodContext(entryData.moodContext || '');
          setSatisfaction(entryData.satisfaction || 5);
          setCurrentEntryId(entryData.entryId || null);
          
          // Handle both enhanced selector (selectedEmotionIds) and traditional selector (selectedMoods)
          if (entryData.useEnhancedSelector && entryData.selectedEmotionIds && entryData.selectedEmotionIds.length > 0) {
            console.log('[EntryPage] Using selectedEmotionIds from enhanced selector:', entryData.selectedEmotionIds);
            setStoredMoodIds(entryData.selectedEmotionIds);
          } else if (entryData.selectedMoods && entryData.selectedMoods.length > 0) {
            console.log('[EntryPage] Using selectedMoods from traditional selector:', entryData.selectedMoods);
            setSelectedMoods(entryData.selectedMoods);
            setStoredMoodIds(entryData.selectedMoods.map((mood: any) => mood.value));
          }
          
          localStorage.removeItem('entry_metadata');
        } catch (error) {
          console.error('[EntryPage] Error loading metadata:', error);
        }
      }
      const saved = localStorage.getItem('entry_draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          console.log('[EntryPage] Loaded entry_draft from localStorage:', draft);
          if (draft.entryId) {
            try {
              const response = await fetch(`/api/entries/${draft.entryId}`);
              if (!response.ok) {
                console.log('[EntryPage] Entry not found in database, clearing stale entryId');
                clearStaleDraft();
                return;
              }
              const apiEntry = await response.json();
              console.log('[EntryPage] Loading entry from API:', apiEntry);
              setSubject(apiEntry.subject || '');
              setContent(apiEntry.content || '');
              setMoodContext(apiEntry.moodContext || '');
              setSatisfaction(apiEntry.satisfaction || 5);
              setCurrentEntryId(apiEntry.id || null);
              
              // Load word/character counts from database or calculate from content
              const loadedContent = apiEntry.content || '';
              const dbWordCount = apiEntry.wordCount || 0;
              const dbCharCount = apiEntry.charCount || 0;
              
              // Calculate actual counts from content as verification
              const actualText = loadedContent.replace(/<[^>]*>/g, ''); // Strip HTML tags
              const actualWordCount = actualText.trim() ? actualText.trim().split(/\s+/).length : 0;
              const actualCharCount = actualText.trim().length;
              
              // Use database values if they match, otherwise use calculated values
              const finalWordCount = dbWordCount === actualWordCount ? dbWordCount : actualWordCount;
              const finalCharCount = dbCharCount === actualCharCount ? dbCharCount : actualCharCount;
              
              console.log('[EntryPage] Word/char count verification:', {
                db: { words: dbWordCount, chars: dbCharCount },
                calculated: { words: actualWordCount, chars: actualCharCount },
                final: { words: finalWordCount, chars: finalCharCount }
              });
              
              setWordCount(finalWordCount);
              setCharCount(finalCharCount);
              // Store mood IDs for later mapping (eliminates race condition)
              if (Array.isArray(apiEntry.moodIds)) {
                setStoredMoodIds(apiEntry.moodIds);
                console.log('[EntryPage] Stored mood IDs from API:', apiEntry.moodIds);
              } else {
                setStoredMoodIds([]);
              }
              
              // If we have mood data from the API, map it directly to selectedMoods
              if (apiEntry.moods && apiEntry.moods.length > 0) {
                const mappedMoods = apiEntry.moods.map((mood: any) => ({
                  value: mood.id,
                  label: mood.name
                }));
                setSelectedMoods(mappedMoods);
                console.log('[EntryPage] Mapped moods from API to selectedMoods:', mappedMoods);
              }
              setDataLoaded(true); // Mark data as loaded
              return; // Don't continue with local draft if API entry loaded
            } catch (error) {
              console.log('[EntryPage] Error checking entry existence, clearing stale entryId');
              clearStaleDraft();
              return;
            }
          }
          setSubject(draft.subject || '');
          setContent(draft.content || '');
          setMoodContext(draft.moodContext || '');
          setSatisfaction(draft.satisfaction || 5);
          setCurrentEntryId(draft.entryId || null);
          
          // Load word and character counts from localStorage if available
          if (draft.wordCount !== undefined && draft.charCount !== undefined) {
            setWordCount(draft.wordCount);
            setCharCount(draft.charCount);
          } else {
            // Calculate word and character counts from content
            const actualText = (draft.content || '').replace(/<[^>]*>/g, ''); // Strip HTML tags
            const actualWordCount = actualText.trim() ? actualText.trim().split(/\s+/).length : 0;
            const actualCharCount = actualText.trim().length;
            
            setWordCount(actualWordCount);
            setCharCount(actualCharCount);
          }
          
          // Extract mood IDs from selectedMoods for race condition fix
          const moodIds = (draft.selectedMoods || []).map((mood: any) => mood.value).filter(Boolean);
          setStoredMoodIds(moodIds);
          console.log('[EntryPage] Stored mood IDs from localStorage:', moodIds);
          
          setDataLoaded(true); // Mark data as loaded
        } catch (error) {
          console.error('[EntryPage] Error loading draft from localStorage:', error);
        }
      }
      // Ensure we always have an entryId
      if (!saved) {
        // No saved draft at all, create new entry
        await createNewEntry();
      } else {
        const draft = JSON.parse(saved);
        if (!draft.entryId) {
          // Has saved draft but no entryId, create new entry
          await createNewEntry();
        } else {
          // We have an entryId, mark data as loaded
          setDataLoaded(true);
        }
      }
    };
    loadDraftData();
  }, [clearStaleDraft]);

  // Focus editor when both editor and data are loaded
  useEffect(() => {
    if (editor && dataLoaded && isClient) {
      console.log('[EntryPage] Focusing editor after data load');
      // Focus the editor after a short delay to ensure it's ready
      setTimeout(() => {
        if (editor) {
          editor.commands.focus();
        }
      }, 200);
    }
  }, [editor, dataLoaded, isClient]);

  // Create a new entry in the database
  const createNewEntry = async () => {
    try {
      console.log('Creating new entry in database');
      const response = await fetch('/api/entries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: '',
          content: '',
          moodId: null,
          satisfaction: 5,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('New entry created:', data);
        setCurrentEntryId(data.entryId);
        
        // Update localStorage with the new entryId
        const draft = {
          subject: '',
          content: '',
          selectedMoods: [],
          moodContext: '',
          satisfaction: 5,
          entryId: data.entryId,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem('entry_draft', JSON.stringify(draft));
        setStoredMoodIds([]);
        setDataLoaded(true); // Mark data as loaded
      } else {
        console.error('Failed to create new entry');
      }
    } catch (error) {
      console.error('Error creating new entry:', error);
    }
  };

  // Immediate save to localStorage for content (prevent loss on refresh)
  useEffect(() => {
    if (dataLoaded && (content || subject || selectedMoods.length > 0 || moodContext || satisfaction !== 5)) {
      const draft = {
        subject,
        content, // Use current content, not debounced
        selectedMoods,
        moodContext,
        satisfaction,
        wordCount,
        charCount,
        entryId: currentEntryId,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('entry_draft', JSON.stringify(draft));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [content, subject, selectedMoods, moodContext, satisfaction, wordCount, charCount, currentEntryId, dataLoaded]);

  // Auto-save to database (uses debounced content to avoid excessive API calls)
  useEffect(() => {
    if (debouncedContent && currentEntryId) {
      autoSaveToDatabase();
    }
  }, [debouncedContent, currentEntryId]);

  // Auto-save function for database updates
  const autoSaveToDatabase = async () => {
    if (!currentEntryId) return;
    
    try {
      const response = await fetch('/api/entries/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: currentEntryId,
          subject,
          content: debouncedContent,
          moodIds: selectedMoods.map(m => m.value),
          moodContext,
          satisfaction,
          wordCount: debouncedWordCount,
          charCount: debouncedCharCount,
        }),
      });

      if (response.ok) {
        console.log('Auto-saved to database');
      } else if (response.status === 401) {
        // Handle authentication errors
        const errorData = await response.json();
        if (errorData.needsReauth) {
          console.log('Session corrupted during auto-save, redirecting to login');
          // Redirect to login page
          window.location.href = '/';
        } else {
          console.error('Authentication failed during auto-save');
        }
      } else {
        console.error('Auto-save failed');
      }
    } catch (error) {
      console.error('Error auto-saving to database:', error);
    }
  };

  // Clear draft after successful save
  const clearDraft = useCallback(() => {
    localStorage.removeItem('entry_draft');
  }, []);

  // Enhanced mood loading with retry mechanism
  const loadMoods = useCallback(async (isRetry = false) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_BASE = 1000; // 1 second base delay
    
    // Don't retry if we've exceeded max retries
    if (isRetry && moodLoadingState.retryCount >= MAX_RETRIES) {
      console.log('[EntryPage] Max retries reached for mood loading');
      return;
    }
    
    // Don't retry too frequently
    if (isRetry && moodLoadingState.lastRetryTime) {
      const timeSinceLastRetry = Date.now() - moodLoadingState.lastRetryTime;
      const minRetryDelay = RETRY_DELAY_BASE * Math.pow(2, moodLoadingState.retryCount);
      if (timeSinceLastRetry < minRetryDelay) {
        console.log('[EntryPage] Too soon to retry mood loading');
        return;
      }
    }
    
    setMoodLoadingState(prev => ({
      ...prev,
      loading: true,
      error: null,
      retryCount: isRetry ? prev.retryCount + 1 : 0,
      lastRetryTime: isRetry ? Date.now() : null
    }));
    
    try {
      const response = await fetch('/api/moods', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch moods: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[EntryPage] Moods API response:', data);
      
      if (data.moods && Array.isArray(data.moods) && data.moods.length > 0) {
        setMoods(data.moods);
        
        setMoodsLoaded(true);
        setMoodLoadingState(prev => ({
          ...prev,
          loading: false,
          error: null,
          retryCount: 0,
          lastRetryTime: null
        }));
        console.log('[EntryPage] Successfully loaded moods:', data.moods.length);
        
      } else {
        throw new Error('Invalid moods data structure or empty moods array');
      }
    } catch (error) {
      console.error('[EntryPage] Failed to fetch moods:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMoodLoadingState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      // Use fallback moods if this is not a retry or we've exhausted retries
      if (!isRetry || moodLoadingState.retryCount >= MAX_RETRIES - 1) {
        console.log('[EntryPage] Using fallback moods due to error');
        const fallbackMoods = [
          { id: 1, name: 'Happy' },
          { id: 2, name: 'Sad' },
          { id: 3, name: 'Excited' },
          { id: 4, name: 'Calm' },
          { id: 5, name: 'Anxious' },
          { id: 6, name: 'Confident' },
          { id: 7, name: 'Confused' },
          { id: 8, name: 'Grateful' },
          { id: 9, name: 'Frustrated' },
          { id: 10, name: 'Inspired' }
        ];
        setMoods(fallbackMoods);
        setMoodsLoaded(true);
      }
    }
  }, [moodLoadingState.retryCount, moodLoadingState.lastRetryTime]);

  // Manual retry function
  const retryMoodLoading = useCallback(async () => {
    console.log('[EntryPage] Manual retry requested for mood loading');
    return await loadMoods(true);
  }, [loadMoods]);

  // Initial mood loading
  useEffect(() => {
    loadMoods(false);
  }, [loadMoods]);

  // Debug modal state changes
  useEffect(() => {
    console.log('showConfirmationModal state changed to:', showConfirmationModal);
  }, [showConfirmationModal]);

  // Debug initial state
  useEffect(() => {
    console.log('Component mounted, initial showConfirmationModal:', showConfirmationModal);
  }, []);

  useEffect(() => {
    console.log('[EntryPage] setMoods:', moods);
    console.log('[EntryPage] setSelectedMoods:', selectedMoods);
  }, [moods, selectedMoods]);

  // Map stored mood IDs to selectedMoods whenever moods or storedMoodIds change
  // This eliminates the race condition between mood loading and draft data loading
  useEffect(() => {
    if (moodsLoaded && storedMoodIds.length > 0) {
      const mappedMoods = storedMoodIds.map((id: number | string) => {
        const mood = moods.find(m => m.id === id);
        return mood ? { value: mood.id, label: mood.name } : null;
      }).filter(Boolean) as { value: number | string; label: string }[];
      
      console.log('[EntryPage] Mapping stored mood IDs to selectedMoods:', {
        storedMoodIds,
        mappedMoods,
        moodsLoaded
      });
      
      setSelectedMoods(mappedMoods);
    } else if (moodsLoaded && storedMoodIds.length === 0) {
      // If we have moods loaded but no stored mood IDs, clear selectedMoods
      setSelectedMoods([]);
    }
  }, [moodsLoaded, storedMoodIds, moods]);

  // Wrapper function to keep selectedMoods and storedMoodIds in sync
  const setSelectedMoodsWrapper = useCallback((newMoods: { value: number | string; label: string }[]) => {
    setSelectedMoods(newMoods);
    const newMoodIds = newMoods.map(mood => mood.value);
    setStoredMoodIds(newMoodIds);
    console.log('[EntryPage] Updated selectedMoods and storedMoodIds:', { newMoods, newMoodIds });
  }, []);

  // Calculate word and character counts from content

  const handlePublishClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Publish button clicked!');
    console.log('Current showConfirmationModal state:', showConfirmationModal);
    console.log('Current state:', { subject, content, selectedMoods, moodContext, satisfaction, wordCount, charCount });
    console.log('Setting showConfirmationModal to true...');
    setShowConfirmationModal(true);
    console.log('showConfirmationModal set to true');
  };

  const handleSaveAsDraft = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/entries/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: currentEntryId,
          subject,
          content,
          moodIds: selectedMoods.map(m => m.value),
          moodContext,
          satisfaction,
          wordCount,
          charCount,
        }),
      });

      if (response.ok) {
        console.log('Entry saved as draft');
        alert('Entry saved as draft successfully!');
      } else {
        console.error('Failed to save as draft');
        alert('Failed to save as draft. Please try again.');
      }
    } catch (error) {
      console.error('Error saving as draft:', error);
      alert('Error saving as draft. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSave = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setShowConfirmationModal(false);
    
    try {
      // Publish the entry (change status to published)
      const publishResponse = await fetch('/api/entries/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entryId: currentEntryId,
          subject,
          content,
          moodIds: selectedMoods.map(m => m.value),
          moodContext,
          satisfaction,
          wordCount,
          charCount,
        }),
      });

      if (publishResponse.ok) {
        clearDraft(); // Clear draft after successful save
        localStorage.removeItem('entry_metadata'); // Also clear metadata
        router.push('/entries?success=save');
      } else {
        console.error('Failed to publish entry');
        alert('Failed to save entry. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing entry:', error);
      alert('Error saving entry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? Your work will be saved as a draft.')) {
      router.push('/dashboard');
    }
  };

  const handleCancelSave = () => {
    setShowConfirmationModal(false);
  };

  // Don't render anything until mounted on client to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-core-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your journal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full bg-main-bg relative transition-all duration-500 ${writingMode ? 'writing-mode-bg' : ''}`}>
      {/* Save Confirmation Modal */}
      {showConfirmationModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center" 
          style={{ 
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)'
          }}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Confirm Publish Entry</h2>
            
            <p className="text-gray-600 mb-6">Do you want to publish the following entry? Published entries are read-only and can only be edited from the view page.</p>
            
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
            <div className="flex justify-between">
              <button
                onClick={handleCancelSave}
                className="px-4 py-2 border border-gray-400 text-gray-600 rounded hover:bg-gray-100 transition-colors"
              >
                Go Back to Edit
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Publish Entry
              </button>
            </div>
          </div>
        </div>
      )}
      <div className={`h-full p-6 ${writingMode ? 'max-w-5xl mx-auto' : ''}`}>
        {/* Task Panel Toggle Button */}
        <div className="flex justify-end gap-3 mb-4">
          <button
            type="button"
            onClick={() => setShowTaskPanel(!showTaskPanel)}
            className={`px-5 py-2 rounded-lg font-medium shadow transition-colors border border-purple-500 ${showTaskPanel ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white text-purple-500 hover:bg-purple-50'}`}
            aria-label={showTaskPanel ? 'Hide Task Panel' : 'Show Task Panel'}
            title="Toggle Task Panel (Alt+T)"
          >
            {showTaskPanel ? 'Hide Tasks' : 'Show Tasks'}
          </button>
        </div>
        <div className={`flex h-full ${writingMode ? 'justify-center' : ''}`}> 
          {/* Main Content Column */}
          <div className={`${writingMode ? 'w-full max-w-4xl mx-auto shadow-2xl rounded-2xl border-4 border-core-green bg-white p-8 transition-all duration-500' : 'flex-1 pr-0'}`}
            style={writingMode ? { minHeight: '80vh', boxShadow: '0 8px 32px rgba(101,104,57,0.10)' } : {}}>
            {/* Back to Main Mode Button - only show in writing mode */}
            {writingMode && (
              <div className="flex justify-start mb-4 -mt-2">
                <button
                  type="button"
                  onClick={() => setWritingMode(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Main Mode
                </button>
              </div>
            )}
            <div className="mt-4">
              <div id="entry_form" aria-label="Journal entry form">
                {/* Main content area - clean and focused on writing */}
                {!writingMode && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 text-sm">
                        Last saved: {lastSaved || 'Not saved yet'}
                      </p>
                      <div className="flex items-center space-x-4">
                        <p className={`text-sm font-medium ${wordCount >= wordTarget ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                          {wordCount} / {wordTarget} words
                          {wordCount >= wordTarget && (
                            <span className="ml-2 text-green-600">
                              ✓ Target reached!
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600 text-sm">
                          {charCount} characters
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Editor - always visible */}
                <div className="w-full" style={{ minHeight: writingMode ? '70vh' : '420px', marginBottom: '10px' }}>
                  <TiptapEditor
                    content={content}
                    onChange={setContent}
                    onWordCountChange={setWordCount}
                    onCharCountChange={setCharCount}
                    entryId={currentEntryId || undefined}
                    onSnippetCreated={() => {
                      // Refresh any snippet-related data if needed
                      console.log('Snippet created, refreshing data...');
                    }}
                    onEditorReady={(editorInstance) => {
                      setEditor(editorInstance);
                    }}
                  />
                </div>
                {/* Buttons - show only in normal mode, or as floating in writing mode */}
                {!writingMode ? (
                  <div className="flex justify-between items-center mt-2.5 p-4 bg-white rounded-lg border-t border-gray-200 relative z-10">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 border border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        style={{ pointerEvents: 'auto' }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsDraft}
                        disabled={isSubmitting}
                        className="px-4 py-3 text-gray-600 hover:text-gray-800 underline transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ pointerEvents: 'auto' }}
                      >
                        Save as Draft
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handlePublishClick}
                      disabled={isSubmitting}
                      className="px-6 py-3 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ 
                        pointerEvents: 'auto',
                        position: 'relative',
                        zIndex: 100
                      }}
                      onMouseDown={(e) => {
                        console.log('Publish button mouse down');
                        e.stopPropagation();
                      }}
                      onMouseUp={(e) => {
                        console.log('Publish button mouse up');
                        e.stopPropagation();
                      }}
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish'}
                    </button>
                  </div>
                ) : (
                  <div className="fixed bottom-8 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <div className="flex gap-6 bg-white/90 border border-core-green rounded-xl shadow-lg px-8 py-4 pointer-events-auto">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 border border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveAsDraft}
                        disabled={isSubmitting}
                        className="px-4 py-3 text-gray-600 hover:text-gray-800 underline transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={handlePublishClick}
                        disabled={isSubmitting}
                        className="px-6 py-3 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Publishing...' : 'Publish'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right Panel - hide in writing mode */}
          {!writingMode && currentEntryId && (
            <EntryPanel
              subject={subject}
              setSubject={setSubject}
              selectedMoods={selectedMoods}
              setSelectedMoods={setSelectedMoodsWrapper}
              moodContext={moodContext}
              setMoodContext={setMoodContext}
              satisfaction={satisfaction}
              setSatisfaction={setSatisfaction}
              moods={moods}
      
              moodLoadingState={moodLoadingState}
              onRetryMoodLoading={retryMoodLoading}
              wordCount={wordCount}
              charCount={charCount}
              lastSaved={lastSaved}
              setWritingMode={setWritingMode}
              isReadOnly={false}
              entryId={currentEntryId}
              onSaveDraft={handleSaveAsDraft}
              onPublishEntry={async () => {
                await handlePublishClick();
              }}
              onDiscardEntry={() => {
                // Clear localStorage and reset form
                localStorage.removeItem('entry_draft');
                setSubject('');
                setContent('');
                setSelectedMoods([]);
                setMoodContext('');
                setSatisfaction(5);
              }}
              hasUnsavedChanges={!!(subject || content || selectedMoods.length > 0 || moodContext || satisfaction !== 5)}
            />
          )}
          
          {/* Task Panel - show when enabled */}
          {showTaskPanel && (
            <TaskPanel
              selectedText={selectedText}
              onTaskCreated={(task) => {
                console.log('Task created:', task);
                // Optionally hide the panel after task creation
                // setShowTaskPanel(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
} 