'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { useRole } from '@/hooks/useRole';

interface EmotionSuggestion {
  id: number;
  emotionName: string;
  userDescription: string;
  usageContext: string;
  joyRating: number;
  trustRating: number;
  fearRating: number;
  surpriseRating: number;
  sadnessRating: number;
  anticipationRating: number;
  angerRating: number;
  disgustRating: number;
  arousalLevel: number;
  valence: number;
  dominance: number;
  intensity: number;
  userAgeRange: string;
  userCulturalBackground: string;
  userRegion: string;
  status: string;
  adminNotes: string;
  submissionCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function EmotionSuggestionsAdmin() {
  const router = useRouter();
  const role = useRole();
  const [suggestions, setSuggestions] = useState<EmotionSuggestion[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<EmotionSuggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  // Toast notifications
  const { showToast } = useToast();

  // Check admin access
  if (!role.isAuthenticated) {
    router.push('/');
    return <div>Redirecting...</div>;
  }

  if (!role.canAccessAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this admin area.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Fetch suggestions based on filter
  useEffect(() => {
    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/emotions/suggest?status=${filter}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (err) {
        showToast('Failed to fetch suggestions', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [filter, error]);

  const handleApprove = async (suggestionId: number) => {
    try {
      const response = await fetch(`/api/emotions/suggest/${suggestionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes })
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Suggestion approved and emotion created successfully', 'success');
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        setSelectedSuggestion(null);
        setAdminNotes('');
      } else {
        showToast(result.error || 'Failed to approve suggestion', 'error');
      }
    } catch (err) {
      showToast('Failed to approve suggestion', 'error');
    }
  };

  const handleReject = async (suggestionId: number) => {
    try {
      const response = await fetch(`/api/emotions/suggest/${suggestionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes })
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Suggestion rejected successfully', 'success');
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
        setSelectedSuggestion(null);
        setAdminNotes('');
      } else {
        showToast(result.error || 'Failed to reject suggestion', 'error');
      }
    } catch (err) {
      showToast('Failed to reject suggestion', 'error');
    }
  };

  const renderSuggestionCard = (suggestion: EmotionSuggestion) => (
    <div
      key={suggestion.id}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => setSelectedSuggestion(suggestion)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 capitalize">
            {suggestion.emotionName}
          </h3>
          <p className="text-sm text-gray-600">
            Submitted by {suggestion.user.name || suggestion.user.email}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {suggestion.submissionCount} vote{suggestion.submissionCount !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            {new Date(suggestion.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-3">{suggestion.userDescription}</p>

      {suggestion.usageContext && (
        <p className="text-sm text-gray-600 mb-3">
          <strong>Context:</strong> {suggestion.usageContext}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {Object.entries({
          joy: suggestion.joyRating,
          trust: suggestion.trustRating,
          fear: suggestion.fearRating,
          surprise: suggestion.surpriseRating,
          sadness: suggestion.sadnessRating,
          anticipation: suggestion.anticipationRating,
          anger: suggestion.angerRating,
          disgust: suggestion.disgustRating
        }).filter(([_, rating]) => rating > 0).map(([emotion, rating]) => (
          <span
            key={emotion}
            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
          >
            {emotion}: {rating}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>Arousal: {suggestion.arousalLevel}/10</div>
        <div>Valence: {suggestion.valence}/10</div>
        <div>Dominance: {suggestion.dominance}/10</div>
        <div>Intensity: {suggestion.intensity}/10</div>
      </div>

      {(suggestion.userAgeRange || suggestion.userCulturalBackground || suggestion.userRegion) && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-x-4">
            {suggestion.userAgeRange && <span>Age: {suggestion.userAgeRange}</span>}
            {suggestion.userCulturalBackground && <span>Culture: {suggestion.userCulturalBackground}</span>}
            {suggestion.userRegion && <span>Region: {suggestion.userRegion}</span>}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetailModal = () => {
    if (!selectedSuggestion) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {selectedSuggestion.emotionName}
                </h2>
                <p className="text-gray-600">
                  Submitted by {selectedSuggestion.user.name || selectedSuggestion.user.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedSuggestion.userDescription}</p>
              </div>

              {selectedSuggestion.usageContext && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Usage Context</h3>
                  <p className="text-gray-700">{selectedSuggestion.usageContext}</p>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Plutchik Ratings</h3>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries({
                    Joy: selectedSuggestion.joyRating,
                    Trust: selectedSuggestion.trustRating,
                    Fear: selectedSuggestion.fearRating,
                    Surprise: selectedSuggestion.surpriseRating,
                    Sadness: selectedSuggestion.sadnessRating,
                    Anticipation: selectedSuggestion.anticipationRating,
                    Anger: selectedSuggestion.angerRating,
                    Disgust: selectedSuggestion.disgustRating
                  }).map(([emotion, rating]) => (
                    <div key={emotion} className="text-center">
                      <div className="text-sm font-medium text-gray-700">{emotion}</div>
                      <div className="text-2xl font-bold text-blue-600">{rating}</div>
                      <div className="text-xs text-gray-500">/5</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Emotional Dimensions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Arousal Level</div>
                    <div className="text-xl font-bold text-blue-600">{selectedSuggestion.arousalLevel}/10</div>
                    <div className="text-xs text-gray-500">Calm → Energizing</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Valence</div>
                    <div className="text-xl font-bold text-green-600">{selectedSuggestion.valence}/10</div>
                    <div className="text-xs text-gray-500">Negative → Positive</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Dominance</div>
                    <div className="text-xl font-bold text-purple-600">{selectedSuggestion.dominance}/10</div>
                    <div className="text-xs text-gray-500">Powerless → In Control</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Intensity</div>
                    <div className="text-xl font-bold text-red-600">{selectedSuggestion.intensity}/10</div>
                    <div className="text-xs text-gray-500">Subtle → Strong</div>
                  </div>
                </div>
              </div>

              {(selectedSuggestion.userAgeRange || selectedSuggestion.userCulturalBackground || selectedSuggestion.userRegion) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Demographics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {selectedSuggestion.userAgeRange && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Age Range</div>
                        <div className="text-gray-600">{selectedSuggestion.userAgeRange}</div>
                      </div>
                    )}
                    {selectedSuggestion.userCulturalBackground && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Cultural Background</div>
                        <div className="text-gray-600">{selectedSuggestion.userCulturalBackground}</div>
                      </div>
                    )}
                    {selectedSuggestion.userRegion && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Region</div>
                        <div className="text-gray-600">{selectedSuggestion.userRegion}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this suggestion..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedSuggestion(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedSuggestion.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedSuggestion.id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Emotion Suggestions</h1>
          <p className="text-gray-600 mt-2">Review and manage user-submitted emotion suggestions</p>
        </div>

        {/* Filter tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === status
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {suggestions.length > 0 && filter === status && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2 rounded-full text-xs">
                    {suggestions.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Suggestions grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading suggestions...</div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No {filter} suggestions found.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {suggestions.map(renderSuggestionCard)}
          </div>
        )}

        {/* Detail modal */}
        {renderDetailModal()}

  
      </div>
    </div>
  );
} 