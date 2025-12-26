import React, { useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Mood {
  id: number;
  name: string;
  type: 'global';
}

interface UserMood {
  id: number;
  moodName: string;
  status: string;
  type: 'custom';
}

interface MoodSearchResult {
  id: number;
  name: string;
  type: 'global' | 'custom';
  status?: string;
}

interface EnhancedMoodSearchProps {
  onMoodSelect: (mood: MoodSearchResult) => void;
  currentMoods: { value: number; label: string }[];
  placeholder?: string;
  isReadOnly?: boolean;
}

export function EnhancedMoodSearch({ 
  onMoodSelect, 
  currentMoods, 
  placeholder = "Search or create moods...",
  isReadOnly = false
}: EnhancedMoodSearchProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingMoods, setMatchingMoods] = useState<Mood[]>([]);
  const [userMoods, setUserMoods] = useState<UserMood[]>([]);
  const [showCreatePill, setShowCreatePill] = useState(false);
  const [pendingMoodName, setPendingMoodName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const searchGlobalMoods = async (query: string): Promise<Mood[]> => {
    try {
      const response = await fetch(`/api/moods/search?q=${encodeURIComponent(query)}&type=global`);
      if (response.ok) {
        const data = await response.json();
        return data.global || [];
      }
    } catch (error) {
      console.error('Error searching global moods:', error);
    }
    return [];
  };

  const searchUserMoods = async (query: string): Promise<UserMood[]> => {
    if (!session?.user?.id) return [];
    
    try {
      const response = await fetch(`/api/moods/search?q=${encodeURIComponent(query)}&type=user`);
      if (response.ok) {
        const data = await response.json();
        return data.user || [];
      }
    } catch (error) {
      console.error('Error searching user moods:', error);
    }
    return [];
  };

  const handleSearchChange = useCallback(async (value: string) => {
    setSearchTerm(value);
    setIsOpen(true);
    
    if (value.trim()) {
      setIsLoading(true);
      try {
        // Search both global and user moods
        const [globalMatches, userMatches] = await Promise.all([
          searchGlobalMoods(value),
          searchUserMoods(value)
        ]);
        
        setMatchingMoods(globalMatches);
        setUserMoods(userMatches);
        
        // Show create pill if no exact matches and user has typed enough
        const hasExactMatch = [...globalMatches, ...userMatches]
          .some(mood => {
            const moodName = mood.type === 'global' ? mood.name : mood.moodName;
            return moodName.toLowerCase() === value.toLowerCase();
          });
        
        setShowCreatePill(!hasExactMatch && value.length > 2);
        setPendingMoodName(value.trim());
      } catch (error) {
        console.error('Error during search:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setMatchingMoods([]);
      setUserMoods([]);
      setShowCreatePill(false);
      setIsOpen(false);
    }
  }, [session?.user?.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' && searchTerm.trim() && !matchingMoods.length && !userMoods.length && !isLoading) {
      e.preventDefault();
      setShowCreatePill(true);
      setPendingMoodName(searchTerm.trim());
    }
    
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const handleMoodSelect = (mood: MoodSearchResult) => {
    onMoodSelect(mood);
    setSearchTerm('');
    setIsOpen(false);
    setShowCreatePill(false);
  };

  const handleCreateCustomMood = () => {
    // This will be handled by the parent component
    // For now, we'll create a temporary mood object
    const newMood: MoodSearchResult = {
      id: -1, // Temporary ID
      name: pendingMoodName,
      type: 'custom',
      status: 'private'
    };
    
    onMoodSelect(newMood);
    setSearchTerm('');
    setIsOpen(false);
    setShowCreatePill(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.mood-search-container')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  return (
    <div className="relative mood-search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        disabled={isReadOnly}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      {/* Dropdown with results */}
      {isOpen && (matchingMoods.length > 0 || userMoods.length > 0 || showCreatePill || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          
          {/* Loading state */}
          {isLoading && (
            <div className="p-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <span className="text-sm mt-1">Searching...</span>
            </div>
          )}
          
          {/* Global Moods */}
          {matchingMoods.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                Global Moods
              </div>
              {matchingMoods.map(mood => (
                <div
                  key={`global-${mood.id}`}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleMoodSelect({
                    id: mood.id,
                    name: mood.name,
                    type: 'global'
                  })}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{mood.name}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Global
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* User Custom Moods */}
          {userMoods.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                My Custom Moods
              </div>
              {userMoods.map(mood => (
                <div
                  key={`user-${mood.id}`}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleMoodSelect({
                    id: mood.id,
                    name: mood.moodName,
                    type: 'custom',
                    status: mood.status
                  })}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{mood.moodName}</span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Custom
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Create New Mood Pill */}
          {showCreatePill && !isReadOnly && (
            <div className="p-3 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Create new mood:</span>
                <button
                  onClick={handleCreateCustomMood}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 transition-colors"
                >
                  + {pendingMoodName}
                </button>
              </div>
            </div>
          )}
          
          {/* No results */}
          {!isLoading && matchingMoods.length === 0 && userMoods.length === 0 && !showCreatePill && searchTerm.trim() && (
            <div className="p-3 text-center text-gray-500">
              <span className="text-sm">No moods found</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 