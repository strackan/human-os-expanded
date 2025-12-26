import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Mood {
  id: number;
  name: string;
}

interface UseEntryStateProps {
  initialEntryId?: number;
}

interface UseEntryStateReturn {
  // State
  subject: string;
  setSubject: (subject: string) => void;
  content: string;
  setContent: (content: string) => void;
  selectedMoods: { value: number; label: string }[];
  setSelectedMoods: (moods: { value: number; label: string }[]) => void;
  moodContext: string;
  setMoodContext: (context: string) => void;
  satisfaction: number;
  setSatisfaction: (satisfaction: number) => void;
  wordCount: number;
  setWordCount: (count: number) => void;
  charCount: number;
  setCharCount: (count: number) => void;
  moods: Mood[];
  currentEntryId: number | null;
  lastSaved: string;
  isSubmitting: boolean;
  dataLoaded: boolean;
  
  // Actions
  handleSaveAsDraft: () => Promise<void>;
  handlePublish: (onSuccess?: () => void) => Promise<void>;
  createNewEntry: () => Promise<void>;
  clearDraft: () => void;
}

// Debounce function
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

export function useEntryState({ initialEntryId }: UseEntryStateProps = {}): UseEntryStateReturn {
  const router = useRouter();
  
  // State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<{ value: number; label: string }[]>([]);
  const [moodContext, setMoodContext] = useState('');
  const [satisfaction, setSatisfaction] = useState(5);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(initialEntryId || null);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Store mood IDs separately to handle race condition between mood loading and draft loading
  const [storedMoodIds, setStoredMoodIds] = useState<number[]>([]);
  const [moodsLoaded, setMoodsLoaded] = useState(false);
  const [draftDataLoaded, setDraftDataLoaded] = useState(false);

  // Debounced values for auto-save
  const debouncedContent = useDebounce(content, 2000);
  const debouncedWordCount = useDebounce(wordCount, 2000);
  const debouncedCharCount = useDebounce(charCount, 2000);

  // Calculate word/character counts from content
  const calculateCounts = useCallback((htmlContent: string) => {
    // Add spaces around block-level elements to ensure proper word separation
    const text = htmlContent
      .replace(/<\/?(p|div|br|h[1-6]|li|blockquote|pre)[^>]*>/gi, ' ') // Replace block elements with spaces
      .replace(/<[^>]*>/g, '') // Strip remaining HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/&lt;/g, '<')   // Decode common HTML entities
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
    
    const trimmedText = text.trim();
    const wordCount = trimmedText ? trimmedText.split(/\s+/).length : 0;
    const charCount = trimmedText.length; // Count only meaningful characters (no leading/trailing whitespace)
    return { wordCount, charCount };
  }, []);

  // Auto-save function
  const autoSaveToDatabase = useCallback(async () => {
    if (!currentEntryId) return;
    
    try {
      const { wordCount: currentWordCount, charCount: currentCharCount } = calculateCounts(debouncedContent);
      
      console.log('Auto-saving with counts:', {
        content: debouncedContent.substring(0, 100) + '...',
        wordCount: currentWordCount,
        charCount: currentCharCount,
        debouncedWordCount,
        debouncedCharCount
      });
      
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
          wordCount: currentWordCount,
          charCount: currentCharCount,
        }),
      });

      if (response.ok) {
        console.log('Auto-saved to database');
      } else {
        console.error('Auto-save failed');
      }
    } catch (error) {
      console.error('Error auto-saving to database:', error);
    }
  }, [currentEntryId, subject, debouncedContent, selectedMoods, moodContext, satisfaction, calculateCounts, debouncedWordCount, debouncedCharCount]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem('entry_draft');
    localStorage.removeItem('entry_metadata');
  }, []);

  // Clear stale draft data
  const clearStaleDraft = useCallback(() => {
    console.log('Clearing stale draft data');
    localStorage.removeItem('entry_draft');
    setCurrentEntryId(null);
  }, []);

  // Create new entry
  const createNewEntry = useCallback(async () => {
    try {
      const response = await fetch('/api/entries/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: '',
          content: '',
          moodIds: [],
          moodContext: '',
          satisfaction: 5,
          wordCount: 0,
          charCount: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('New entry created:', data);
        setCurrentEntryId(data.entryId);
        
        // Save to localStorage
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
        setDataLoaded(true);
      } else {
        console.error('Failed to create new entry');
      }
    } catch (error) {
      console.error('Error creating new entry:', error);
    }
  }, []);

  // Save as draft
  const handleSaveAsDraft = useCallback(async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { wordCount: currentWordCount, charCount: currentCharCount } = calculateCounts(content);
      
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
          wordCount: currentWordCount,
          charCount: currentCharCount,
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
  }, [isSubmitting, currentEntryId, subject, content, selectedMoods, moodContext, satisfaction, calculateCounts]);

  // Publish entry
  const handlePublish = useCallback(async (onSuccess?: () => void) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const { wordCount: currentWordCount, charCount: currentCharCount } = calculateCounts(content);
      
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
          wordCount: currentWordCount,
          charCount: currentCharCount,
        }),
      });

      if (publishResponse.ok) {
        clearDraft();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/entries?success=save');
        }
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
  }, [isSubmitting, currentEntryId, subject, content, selectedMoods, moodContext, satisfaction, calculateCounts, clearDraft, router]);

  // Map stored mood IDs to selectedMoods whenever moods or storedMoodIds change
  // This eliminates the race condition between mood loading and draft data loading
  useEffect(() => {
    if (moodsLoaded && storedMoodIds.length > 0) {
      const mappedMoods = storedMoodIds.map((id: number) => {
        const mood = moods.find(m => m.id === id);
        return mood ? { value: mood.id, label: mood.name } : null;
      }).filter(Boolean) as { value: number; label: string }[];
      
      console.log('[useEntryState] Mapping stored mood IDs to selectedMoods:', {
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
    console.log('[useEntryState] Updated selectedMoods and storedMoodIds:', { newMoods, newMoodIds });
  }, []);

  // Load draft data on mount
  useEffect(() => {
    const loadDraftData = async () => {
      const metadata = localStorage.getItem('entry_metadata');
      if (metadata) {
        try {
          const entryData = JSON.parse(metadata);
          console.log('[useEntryState] Loaded entry_metadata from localStorage:', entryData);
          setSubject(entryData.subject || '');
          setSelectedMoods(entryData.selectedMoods || []);
          setMoodContext(entryData.moodContext || '');
          setSatisfaction(entryData.satisfaction || 5);
          setCurrentEntryId(entryData.entryId || null);
          localStorage.removeItem('entry_metadata');
        } catch (error) {
          console.error('[useEntryState] Error loading metadata:', error);
        }
      }
      
      const saved = localStorage.getItem('entry_draft');
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          console.log('[useEntryState] Loaded entry_draft from localStorage:', draft);
          
          if (draft.entryId) {
            try {
              const response = await fetch(`/api/entries/${draft.entryId}`);
              if (!response.ok) {
                console.log('[useEntryState] Entry not found in database, clearing stale entryId');
                clearStaleDraft();
                return;
              }
              
              const apiEntry = await response.json();
              console.log('[useEntryState] Loading entry from API:', apiEntry);
              setSubject(apiEntry.subject || '');
              setContent(apiEntry.content || '');
              setMoodContext(apiEntry.moodContext || '');
              setSatisfaction(apiEntry.satisfaction || 5);
              setCurrentEntryId(apiEntry.id || null);
              
              // Load word/character counts from database or calculate from content
              const loadedContent = apiEntry.content || '';
              const dbWordCount = apiEntry.wordCount || 0;
              const dbCharCount = apiEntry.charCount || 0;
              
              const { wordCount: actualWordCount, charCount: actualCharCount } = calculateCounts(loadedContent);
              
              // Use database values if they match, otherwise use calculated values
              const finalWordCount = dbWordCount === actualWordCount ? dbWordCount : actualWordCount;
              const finalCharCount = dbCharCount === actualCharCount ? dbCharCount : actualCharCount;
              
              console.log('[useEntryState] Word/char count verification:', {
                db: { words: dbWordCount, chars: dbCharCount },
                calculated: { words: actualWordCount, chars: actualCharCount },
                final: { words: finalWordCount, chars: finalCharCount }
              });
              
              setWordCount(finalWordCount);
              setCharCount(finalCharCount);
              
              // Store mood IDs for later mapping (eliminates race condition)
              if (Array.isArray(apiEntry.moodIds)) {
                setStoredMoodIds(apiEntry.moodIds);
                console.log('[useEntryState] Stored mood IDs from API:', apiEntry.moodIds);
              } else {
                setStoredMoodIds([]);
              }
              
              setDraftDataLoaded(true);
              setDataLoaded(true);
              return;
            } catch (error) {
              console.log('[useEntryState] Error checking entry existence, clearing stale entryId');
              clearStaleDraft();
              return;
            }
          }
          
          setSubject(draft.subject || '');
          setContent(draft.content || '');
          setMoodContext(draft.moodContext || '');
          setSatisfaction(draft.satisfaction || 5);
          setCurrentEntryId(draft.entryId || null);
          
          // Extract mood IDs from selectedMoods for race condition fix
          const moodIds = (draft.selectedMoods || []).map((mood: any) => mood.value).filter(Boolean);
          setStoredMoodIds(moodIds);
          console.log('[useEntryState] Stored mood IDs from localStorage:', moodIds);
          
          setDraftDataLoaded(true);
          setDataLoaded(true);
        } catch (error) {
          console.error('[useEntryState] Error loading draft from localStorage:', error);
        }
      }
      
      if (!saved) {
        await createNewEntry();
      } else if (!JSON.parse(saved).entryId) {
        await createNewEntry();
      }
    };
    
    loadDraftData();
  }, [clearStaleDraft, calculateCounts, createNewEntry]);

  // Immediate save to localStorage for content (prevent loss on refresh)
  useEffect(() => {
    if (dataLoaded && (content || subject || selectedMoods.length > 0 || moodContext || satisfaction !== 5)) {
      const draft = {
        subject,
        content, // Use current content, not debounced
        selectedMoods,
        moodContext,
        satisfaction,
        entryId: currentEntryId,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('entry_draft', JSON.stringify(draft));
      setLastSaved(new Date().toLocaleTimeString());
    }
  }, [content, subject, selectedMoods, moodContext, satisfaction, currentEntryId, dataLoaded]);

  // Auto-save to database (uses debounced content to avoid excessive API calls)
  useEffect(() => {
    if (debouncedContent && currentEntryId) {
      autoSaveToDatabase();
    }
  }, [debouncedContent, currentEntryId, autoSaveToDatabase]);

  // Load moods
  useEffect(() => {
    fetch('/api/moods')
      .then(res => res.json())
      .then(data => {
        console.log('[useEntryState] Moods API response:', data);
        if (data.moods && Array.isArray(data.moods)) {
          setMoods(data.moods);
          setMoodsLoaded(true);
        } else {
          console.error('[useEntryState] Invalid moods data:', data);
          setMoods([
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
          ]);
          setMoodsLoaded(true);
        }
      })
      .catch(error => {
        console.error('[useEntryState] Failed to fetch moods:', error);
        setMoods([
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
        ]);
        setMoodsLoaded(true);
      });
  }, []);

  return {
    // State
    subject,
    setSubject,
    content,
    setContent,
    selectedMoods,
    setSelectedMoods: setSelectedMoodsWrapper,
    moodContext,
    setMoodContext,
    satisfaction,
    setSatisfaction,
    wordCount,
    setWordCount,
    charCount,
    setCharCount,
    moods,
    currentEntryId,
    lastSaved,
    isSubmitting,
    dataLoaded,
    
    // Actions
    handleSaveAsDraft,
    handlePublish,
    createNewEntry,
    clearDraft,
  };
} 