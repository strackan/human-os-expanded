'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Select from 'react-select';
import TiptapEditor from '@/components/TiptapEditor';
import SaveConfirmationModal from '@/components/SaveConfirmationModal';
import EntryPanel from '@/components/EntryPanel';
import { useEntry } from '@/components/EntryContext';
import { AlertModal, ConfirmModal } from '@/components/Modal';
import PrivacyProtectionModal from '@/components/PrivacyProtectionModal';
import UnlockEntryModal from '@/components/UnlockEntryModal';
import PrivateEntryDisplay from '@/components/PrivateEntryDisplay';

interface Mood {
  id: number;
  name: string;
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

export default function EntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
  
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<{ value: number; label: string }[]>([]);
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
  const [isPublished, setIsPublished] = useState(false);
  const { writingMode, setWritingMode } = useEntry();
  const [editor, setEditor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [wordTarget, setWordTarget] = useState<number>(500);
  
  // Privacy state
  const [isPrivate, setIsPrivate] = useState(false);
  const [hasBreakGlass, setHasBreakGlass] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  // Pending privacy state for edit mode
  const [pendingPrivacyPassword, setPendingPrivacyPassword] = useState<string | null>(null);
  const [willRemovePrivacy, setWillRemovePrivacy] = useState(false);
  
  // Debounced values for auto-save
  const debouncedContent = useDebounce(content, 2000);
  const debouncedWordCount = useDebounce(wordCount, 2000);
  const debouncedCharCount = useDebounce(charCount, 2000);
  
  // Store mood IDs separately to handle race condition between mood loading and draft loading
  const [storedMoodIds, setStoredMoodIds] = useState<number[]>([]);
  const [moodsLoaded, setMoodsLoaded] = useState(false);
  const [draftDataLoaded, setDraftDataLoaded] = useState(false);
  
  // Modal states
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
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info'
  });

  // Set client flag to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    setMounted(true);
    // Ensure modal starts closed
    setShowConfirmationModal(false);
  }, []);

  // Check for entry metadata from interstitial page
  useEffect(() => {
    if (!mounted) return;
    
    const entryMetadata = localStorage.getItem('entry_metadata');
    if (entryMetadata) {
      try {
        const data = JSON.parse(entryMetadata);
        console.log('[EntryPage] Found entry_metadata in localStorage:', data);
        
        // Only use this data if it's for the current entry
        if (data.entryId === parseInt(entryId)) {
          console.log('[EntryPage] Using entry_metadata for current entry');
          setSubject(data.subject || '');
          setMoodContext(data.moodContext || '');
          setSatisfaction(data.satisfaction || 5);
          
          // Handle both enhanced selector (selectedEmotionIds) and traditional selector (selectedMoods)
          if (data.useEnhancedSelector && data.selectedEmotionIds && data.selectedEmotionIds.length > 0) {
            console.log('[EntryPage] Using selectedEmotionIds from enhanced selector:', data.selectedEmotionIds);
            setStoredMoodIds(data.selectedEmotionIds);
          } else if (data.selectedMoods && data.selectedMoods.length > 0) {
            console.log('[EntryPage] Using selectedMoods from traditional selector:', data.selectedMoods);
            setSelectedMoods(data.selectedMoods);
            setStoredMoodIds(data.selectedMoods.map((mood: any) => mood.value));
          }
          
          // Clear the metadata after using it
          localStorage.removeItem('entry_metadata');
        }
      } catch (error) {
        console.error('[EntryPage] Error parsing entry_metadata:', error);
      }
    }
  }, [mounted, entryId]);

  // Load entry data from API and merge with localStorage
  useEffect(() => {
    const loadEntryData = async () => {
      if (!entryId) return;
      
      try {
        const response = await fetch(`/api/entries/${entryId}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Loading entry from API:', data);
          
          // If entry is published, redirect to view page
          if (data.status === 'Published') {
            router.push(`/entry/${entryId}/view`);
            return;
          }
          
          // Check localStorage for more recent data
          const localStorage_key = `entry_draft`;
          const savedDraft = localStorage.getItem(localStorage_key);
          let localStorageData = null;
          
          if (savedDraft) {
            try {
              localStorageData = JSON.parse(savedDraft);
              console.log('[EntryDetailPage] Found localStorage data:', localStorageData);
              
              // Only use localStorage data if it's for the current entry
              if (localStorageData.entryId === parseInt(entryId)) {
                console.log('[EntryDetailPage] Using localStorage data for current entry');
                
                // Compare timestamps to determine which data is more recent
                const apiTimestamp = new Date(data.updatedDate).getTime();
                const localTimestamp = new Date(localStorageData.timestamp || 0).getTime();
                
                console.log('[EntryDetailPage] Timestamp comparison:', {
                  api: apiTimestamp,
                  local: localTimestamp,
                  useLocal: localTimestamp > apiTimestamp
                });
                
                                 // Use localStorage data if it's more recent than API data
                if (localTimestamp > apiTimestamp) {
                  console.log('[EntryDetailPage] Using localStorage data (more recent)');
                  setSubject(localStorageData.subject || '');
                  setContent(localStorageData.content || '');
                  setMoodContext(localStorageData.moodContext || '');
                  setSatisfaction(localStorageData.satisfaction || 5);
                  setSelectedMoods(localStorageData.selectedMoods || []);
                  
                  // Extract mood IDs from selectedMoods
                  const moodIds = (localStorageData.selectedMoods || []).map((mood: any) => mood.value).filter(Boolean);
                  setStoredMoodIds(moodIds);
                  
                  setCurrentEntryId(parseInt(entryId));
                  setIsPublished(data.status === 'Published');
                  
                  // Set privacy information from API
                  setIsPrivate(data.isPrivate || false);
                  setHasBreakGlass(data.hasBreakGlass || false);
                  
                  // Restore pending privacy state from localStorage
                  if (localStorageData.pendingPrivacyPassword) {
                    setPendingPrivacyPassword(localStorageData.pendingPrivacyPassword);
                  }
                  if (localStorageData.willRemovePrivacy) {
                    setWillRemovePrivacy(localStorageData.willRemovePrivacy);
                  }
                  
                  // If entry is private, don't use localStorage content
                  if (data.isPrivate) {
                    setContent('');
                    setIsUnlocked(false);
                  } else {
                    // Use word and character counts from localStorage if available, otherwise calculate
                    if (localStorageData.wordCount !== undefined && localStorageData.charCount !== undefined) {
                      setWordCount(localStorageData.wordCount);
                      setCharCount(localStorageData.charCount);
                    } else {
                      // Calculate word and character counts from localStorage content
                      const localContent = localStorageData.content || '';
                      // Add spaces around block-level elements to ensure proper word separation
                      const textWithSpaces = localContent
                        .replace(/<\/?(p|div|br|h[1-6]|li|blockquote|pre)[^>]*>/gi, ' ') // Replace block elements with spaces
                        .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
                        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
                        .replace(/&lt;/g, '<')   // Decode common HTML entities
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&')
                        .replace(/&quot;/g, '"')
                        .replace(/&#39;/g, "'")
                        .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
                      
                      const trimmedText = textWithSpaces.trim();
                      const actualWordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
                      const actualCharCount = trimmedText.length;
                      
                      setWordCount(actualWordCount);
                      setCharCount(actualCharCount);
                    }
                  }
                  
                  return; // Exit early, don't use API data
                }
              }
            } catch (error) {
              console.error('[EntryDetailPage] Error parsing localStorage data:', error);
            }
          }
          
          // Use API data (either no localStorage data or API data is more recent)
          console.log('[EntryDetailPage] Using API data');
          setSubject(data.subject || '');
          setContent(data.content || '');
          setMoodContext(data.moodContext || '');
          setSatisfaction(data.satisfaction || 5);
          setCurrentEntryId(parseInt(entryId));
          setIsPublished(data.status === 'Published');
          
          // Store moodIds for later mapping when moods are loaded
          const moodIds = data.moodIds || [];
          console.log('[EntryDetailPage] Loading entry with moodIds:', moodIds);
          
          // Store the moodIds for later mapping (eliminates race condition)
          setStoredMoodIds(moodIds);
          
          // If we have mood data from the API, map it directly to selectedMoods
          if (data.moods && data.moods.length > 0) {
            const mappedMoods = data.moods.map((mood: any) => ({
              value: mood.id,
              label: mood.name
            }));
            setSelectedMoods(mappedMoods);
            console.log('[EntryDetailPage] Mapped moods from API to selectedMoods:', mappedMoods);
          }
          
          // Set word and character counts from API
          setWordCount(data.wordCount || 0);
          setCharCount(data.charCount || 0);
          
          // Set privacy information
          setIsPrivate(data.isPrivate || false);
          setHasBreakGlass(data.hasBreakGlass || false);
          
          // If entry is private, don't load content until unlocked
          if (data.isPrivate) {
            setContent('');
            setIsUnlocked(false);
          }
          
        } else {
          console.error('Entry not found');
          router.push('/entries?error=not-found');
        }
      } catch (error) {
        console.error('Error loading entry:', error);
        router.push('/entries?error=load-failed');
      } finally {
        setLoading(false);
      }
    };

    loadEntryData();
  }, [entryId, router]);

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
        console.log('[EntryDetailPage] Successfully loaded moods:', data.moods.length);
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
          { id: 21, name: 'Happy' },
          { id: 22, name: 'Sad' },
          { id: 23, name: 'Excited' },
          { id: 24, name: 'Calm' },
          { id: 25, name: 'Anxious' },
          { id: 26, name: 'Confident' },
          { id: 27, name: 'Confused' },
          { id: 28, name: 'Grateful' },
          { id: 29, name: 'Frustrated' },
          { id: 30, name: 'Inspired' }
        ];
        setMoods(fallbackMoods);
        setMoodsLoaded(true);
      }
    }
  }, [moodLoadingState.retryCount, moodLoadingState.lastRetryTime]);

  // Manual retry function
  const retryMoodLoading = useCallback(() => {
    console.log('[EntryPage] Manual retry requested for mood loading');
    loadMoods(true);
  }, [loadMoods]);

  // Initial mood loading
  useEffect(() => {
    loadMoods(false);
  }, [loadMoods]);

  // Immediate save to localStorage for content (prevent loss on refresh)
  useEffect(() => {
    if (loading === false && currentEntryId && (content || subject || selectedMoods.length > 0 || moodContext || satisfaction !== 5)) {
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
        pendingPrivacyPassword: pendingPrivacyPassword || null,
        willRemovePrivacy: willRemovePrivacy || false,
      };
      localStorage.setItem('entry_draft', JSON.stringify(draft));
      setLastSaved(new Date().toLocaleTimeString());
      console.log('[EntryDetailPage] Saved to localStorage:', draft);
    }
  }, [content, subject, selectedMoods, moodContext, satisfaction, wordCount, charCount, currentEntryId, loading, pendingPrivacyPassword, willRemovePrivacy]);

  // Auto-save to database (uses debounced content to avoid excessive API calls)
  useEffect(() => {
    if (debouncedContent && currentEntryId) {
      autoSaveToDatabase();
    }
  }, [debouncedContent, debouncedWordCount, debouncedCharCount, currentEntryId]);

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
    localStorage.removeItem('entry_metadata');
    console.log('[EntryDetailPage] Cleared localStorage draft data');
  }, []);

  const handlePublishClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    console.log('Publish button clicked!');
    setShowConfirmationModal(true);
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
        // Apply pending privacy changes
        await applyPendingPrivacyChanges();
        
        console.log('Entry saved as draft');
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Entry saved as draft successfully!',
          variant: 'success'
        });
      } else {
        console.error('Failed to save as draft');
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to save as draft. Please try again.',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error saving as draft:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Error saving as draft. Please try again.',
        variant: 'error'
      });
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
        // Apply pending privacy changes
        await applyPendingPrivacyChanges();
        
        clearDraft(); // Clear draft after successful save
        localStorage.removeItem('entry_metadata'); // Also clear metadata
        router.push('/entries?success=save');
      } else {
        console.error('Failed to publish entry');
        setAlertModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to save entry. Please try again.',
          variant: 'error'
        });
      }
    } catch (error) {
      console.error('Error publishing entry:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Error saving entry. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Entry',
      message: 'Are you sure you want to cancel? This draft will be deleted and cannot be recovered.',
      onConfirm: async () => {
        try {
          if (currentEntryId) {
            const response = await fetch(`/api/entries/${currentEntryId}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              // Dispatch event to notify other components of the delete action
              window.dispatchEvent(new CustomEvent('draftsUpdated', { detail: { action: 'delete' } }));
              router.push('/dashboard');
            } else {
              console.error('Failed to delete draft');
              // Still redirect even if deletion fails
              router.push('/dashboard');
            }
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error deleting draft:', error);
          // Still redirect even if deletion fails
          router.push('/dashboard');
        }
      },
      variant: 'danger'
    });
  };

  const handleCancelSave = () => {
    setShowConfirmationModal(false);
  };

  // Apply pending privacy changes after save/publish
  const applyPendingPrivacyChanges = async () => {
    try {
      if (pendingPrivacyPassword) {
        // Apply privacy protection
        const response = await fetch(`/api/entries/${entryId}/privacy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'set-privacy',
            password: pendingPrivacyPassword
          }),
        });

        if (response.ok) {
          setIsPrivate(true);
          setPendingPrivacyPassword(null);
          console.log('Privacy protection applied successfully');
        } else {
          console.error('Failed to apply privacy protection');
        }
      }

      if (willRemovePrivacy) {
        // Remove privacy protection
        const response = await fetch(`/api/entries/${entryId}/privacy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'remove-privacy',
            password: 'dummy' // We don't need password validation for removal during save
          }),
        });

        if (response.ok) {
          setIsPrivate(false);
          setWillRemovePrivacy(false);
          console.log('Privacy protection removed successfully');
        } else {
          console.error('Failed to remove privacy protection');
        }
      }
    } catch (error) {
      console.error('Error applying privacy changes:', error);
    }
  };

  // Privacy functions
  const handleSetPrivacy = async (password: string) => {
    try {
      // If already published, apply privacy protection immediately
      if (isPublished) {
        const response = await fetch(`/api/entries/${entryId}/privacy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'set-privacy',
            password
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to set privacy protection');
        }

        const data = await response.json();
        setIsPrivate(true);
        setIsUnlocked(false);
        setContent(''); // Clear content from display
        
        setAlertModal({
          isOpen: true,
          title: 'Privacy Protection Enabled',
          message: 'Your entry is now password protected.',
          variant: 'success'
        });
      } else {
        // For draft entries, just store the password for later application
        setPendingPrivacyPassword(password);
        setWillRemovePrivacy(false);
        
        setAlertModal({
          isOpen: true,
          title: 'Privacy Will Be Applied',
          message: 'Your entry will be password protected when you save or publish it.',
          variant: 'info'
        });
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to set privacy protection');
    }
  };

  const handleRemovePrivacy = async (password: string) => {
    try {
      // If there's a pending password, just clear it
      if (pendingPrivacyPassword && !isPrivate) {
        setPendingPrivacyPassword(null);
        setWillRemovePrivacy(false);
        
        setAlertModal({
          isOpen: true,
          title: 'Privacy Removed',
          message: 'Pending privacy protection has been cancelled.',
          variant: 'success'
        });
        return;
      }

      const response = await fetch(`/api/entries/${entryId}/privacy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'remove-privacy',
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove privacy protection');
      }

      const data = await response.json();
      
      if (isPublished) {
        setIsPrivate(false);
        setHasBreakGlass(false);
        setIsUnlocked(true);
        
        // Reload content
        window.location.reload();
      } else {
        // For draft entries, mark for removal on next save
        setWillRemovePrivacy(true);
        setPendingPrivacyPassword(null);
      }
      
      setAlertModal({
        isOpen: true,
        title: 'Privacy Protection Removed',
        message: isPublished ? 'Your entry is no longer password protected.' : 'Privacy protection will be removed when you save or publish.',
        variant: 'success'
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to remove privacy protection');
    }
  };

  const handleUnlockEntry = async (password: string) => {
    try {
      const response = await fetch(`/api/entries/${entryId}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unlock',
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid password');
      }

      const data = await response.json();
      setIsUnlocked(true);
      
      // Reload entry data to get the actual content
      const entryResponse = await fetch(`/api/entries/${entryId}`);
      if (entryResponse.ok) {
        const entryData = await entryResponse.json();
        setContent(entryData.content || '');
        setSubject(entryData.subject || '');
        setMoodContext(entryData.moodContext || '');
        setSatisfaction(entryData.satisfaction || 5);
        setWordCount(entryData.wordCount || 0);
        setCharCount(entryData.charCount || 0);
        
        // Update mood data
        const moodIds = entryData.moodIds || [];
        setStoredMoodIds(moodIds);
      }
      
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unlock entry');
    }
  };

  const handleBreakGlass = async (): Promise<string> => {
    try {
      const response = await fetch(`/api/entries/${entryId}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'break-glass'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request break glass code');
      }

      const data = await response.json();
      setHasBreakGlass(true);
      return data.breakGlassCode || '';
    } catch (error: any) {
      throw new Error(error.message || 'Failed to request break glass code');
    }
  };

  const handleBreakGlassVerify = async (code: string): Promise<string> => {
    try {
      const response = await fetch(`/api/entries/${entryId}/privacy`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'break-glass-verify',
          breakGlassCode: code
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid or expired break glass code');
      }

      const data = await response.json();
      setHasBreakGlass(false);
      return data.passwordHash || '';
    } catch (error: any) {
      throw new Error(error.message || 'Failed to verify break glass code');
    }
  };

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

  // Map stored mood IDs to selectedMoods whenever moods or storedMoodIds change
  // This eliminates the race condition between mood loading and draft data loading
  useEffect(() => {
    if (moodsLoaded && storedMoodIds.length > 0) {
      const mappedMoods = storedMoodIds.map((id: number) => {
        const mood = moods.find(m => m.id === id);
        return mood ? { value: mood.id, label: mood.name } : null;
      }).filter(Boolean) as { value: number; label: string }[];
      
      console.log('[EntryDetailPage] Mapping stored mood IDs to selectedMoods:', {
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
  const setSelectedMoodsWrapper = useCallback((newMoods: { value: number; label: string }[]) => {
    setSelectedMoods(newMoods);
    const newMoodIds = newMoods.map(mood => mood.value);
    setStoredMoodIds(newMoodIds);
    console.log('[EntryDetailPage] Updated selectedMoods and storedMoodIds:', { newMoods, newMoodIds });
  }, []);

  // Calculate word and character counts from content
  useEffect(() => {
    if (content) {
      // Add spaces around block-level elements to ensure proper word separation
      const textWithSpaces = content
        .replace(/<\/?(p|div|br|h[1-6]|li|blockquote|pre)[^>]*>/gi, ' ') // Replace block elements with spaces
        .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
        .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
        .replace(/&lt;/g, '<')   // Decode common HTML entities
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
      
      const trimmedText = textWithSpaces.trim();
      const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
      const charCount = trimmedText.length;
      
      setWordCount(wordCount);
      setCharCount(charCount);
    } else {
      setWordCount(0);
      setCharCount(0);
    }
  }, [content]);

  // Don't render anything until mounted on client to prevent hydration issues
  if (!mounted || loading) {
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
      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
      />
      
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
      
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
                {/* Date/Stats - only show in normal mode */}
                {!writingMode && (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-gray-600 text-sm">
                        Last saved: {lastSaved || 'Not saved yet'}
                      </p>
                      <div className="flex items-center space-x-4">
                        <p className={`text-sm font-medium ${wordCount >= wordTarget ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                          <span id="wordCount">{wordCount} / {wordTarget} words</span>
                          {wordCount >= wordTarget && (
                            <span className="ml-2 text-green-600">
                              ✓ Target reached!
                            </span>
                          )}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <span id="charCount">{charCount} characters</span>
                        </p>
                      </div>
                    </div>
                    <hr className="border-gray-300 mb-6" />
                  </>
                )}
                {/* Editor or Privacy Display */}
                <div className={`w-full ${writingMode ? 'entry-editor-container-writing' : 'entry-editor-container'}`} style={{ marginBottom: '10px' }}>
                  {isPrivate && !isUnlocked ? (
                    <PrivateEntryDisplay
                      title={subject}
                      onUnlock={() => setShowUnlockModal(true)}
                      hasBreakGlass={hasBreakGlass}
                    />
                  ) : (
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
                        // Focus the editor after a short delay to ensure it's ready
                        setTimeout(() => {
                          if (editorInstance && !isPublished) {
                            editorInstance.commands.focus();
                          }
                        }, 100);
                      }}
                    />
                  )}
                </div>
                {/* Buttons - show only in normal mode, or as floating in writing mode */}
                {!writingMode ? (
                  <div className="flex justify-between items-center mt-2.5 p-4 bg-white rounded-lg border-t border-gray-200 relative z-10">
                    {isPublished ? (
                      <div className="flex items-center gap-4">
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                          📖 Published Entry (Read-only)
                        </span>
                        <button
                          type="button"
                          onClick={() => router.push('/entries')}
                          className="px-6 py-3 border border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                        >
                          Back to Entries
                        </button>
                      </div>
                    ) : (
                      <>
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
                          <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                              isPrivate || pendingPrivacyPassword
                                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                            }`}
                            style={{ pointerEvents: 'auto' }}
                          >
                            {isPrivate 
                              ? '🔒 Remove Privacy' 
                              : pendingPrivacyPassword 
                                ? '🔒 Will Lock on Save' 
                                : willRemovePrivacy
                                  ? '🔓 Will Unlock on Save'
                                  : '🔓 Set Privacy'
                            }
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
                      </>
                    )}
                  </div>
                ) : (
                  <div className="fixed bottom-8 left-0 w-full flex justify-center z-50 pointer-events-none">
                    <div className="flex gap-6 bg-white/90 border border-core-green rounded-xl shadow-lg px-8 py-4 pointer-events-auto">
                      {isPublished ? (
                        <>
                          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                            📖 Published Entry
                          </span>
                          <button
                            type="button"
                            onClick={() => router.push('/entries')}
                            className="px-6 py-3 border border-gray-400 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                          >
                            Back to Entries
                          </button>
                        </>
                      ) : (
                        <>
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
                            onClick={() => setShowPrivacyModal(true)}
                            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                              isPrivate || pendingPrivacyPassword
                                ? 'bg-red-100 text-red-700 border border-red-300 hover:bg-red-200' 
                                : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                            }`}
                          >
                            {isPrivate 
                              ? '🔒 Remove Privacy' 
                              : pendingPrivacyPassword 
                                ? '🔒 Will Lock on Save' 
                                : willRemovePrivacy
                                  ? '🔓 Will Unlock on Save'
                                  : '🔓 Set Privacy'
                            }
                          </button>
                          <button
                            type="button"
                            onClick={handlePublishClick}
                            disabled={isSubmitting}
                            className="px-6 py-3 border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Publishing...' : 'Publish'}
                          </button>
                        </>
                      )}
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
              isReadOnly={isPublished}
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
              hasUnsavedChanges={!isPublished && (subject || content || selectedMoods.length > 0 || moodContext || satisfaction !== 5)}
            />
          )}
        </div>
      </div>

      {/* Privacy Modals */}
      <PrivacyProtectionModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onSetPrivacy={handleSetPrivacy}
        onRemovePrivacy={handleRemovePrivacy}
        isCurrentlyPrivate={isPrivate || !!pendingPrivacyPassword}
      />

      <UnlockEntryModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onUnlock={handleUnlockEntry}
        onBreakGlass={handleBreakGlass}
        onBreakGlassVerify={handleBreakGlassVerify}
        hasBreakGlass={hasBreakGlass}
      />
    </div>
  );
} 