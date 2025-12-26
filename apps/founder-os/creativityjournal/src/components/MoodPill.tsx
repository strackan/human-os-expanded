import React, { useState } from 'react';

interface MoodPillProps {
  mood: {
    id: number;
    name: string;
    pillStatus?: 'red' | 'yellow' | 'green' | 'grey' | 'user';
    canPromote?: boolean;
    userMoodId?: number;
  };
  onPromote?: (mood: { id: number; name: string; description?: string }) => void;
  onDefine?: (mood: { id: number; name: string }) => void;
  showPromoteButton?: boolean;
  className?: string;

}

export function MoodPill({ 
  mood, 
  onPromote, 
  onDefine, 
  showPromoteButton = true, 
  className = '' 
}: MoodPillProps) {
  const [isPromoting, setIsPromoting] = useState(false);

  const handlePromote = async () => {
    if (!mood.userMoodId || isPromoting) return;
    
    setIsPromoting(true);
    try {
      const response = await fetch(`/api/user-moods/${mood.userMoodId}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        alert(result.message || 'Mood promoted successfully!');
        
        if (onPromote) {
          onPromote({ 
            id: mood.userMoodId, 
            name: mood.name, 
            description: result.message 
          });
        }
      } else {
        alert(result.error || 'Failed to promote mood');
      }
    } catch (error) {
      console.error('Error promoting mood:', error);
      alert('Failed to promote mood');
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <span 
        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
      >
        {mood.name}
      </span>
      
      {/* Promotion button for user moods that can be promoted */}
      {mood.pillStatus === 'red' && mood.canPromote && showPromoteButton && onPromote && (
        <button
          onClick={handlePromote}
          disabled={isPromoting}
          className="text-xs text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
          title="Promote this mood for community review"
        >
          {isPromoting ? 'Promoting...' : 'Promote'}
        </button>
      )}
      
      {/* Define button for incomplete moods */}
      {mood.pillStatus === 'grey' && onDefine && (
        <button
          onClick={() => onDefine({ id: mood.id, name: mood.name })}
          className="text-xs text-gray-600 hover:text-gray-800 underline"
          title="Complete the definition for this mood"
        >
          Define
        </button>
      )}
    </div>
  );
} 