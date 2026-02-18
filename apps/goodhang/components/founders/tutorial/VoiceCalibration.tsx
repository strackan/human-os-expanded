'use client';

import { useState, useEffect } from 'react';
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react';

interface VoiceCalibrationProps {
  sessionId: string;
  token: string | null;
  interviewAnswers?: Record<string, string>;
  onComplete: (feedback: Record<string, unknown>) => void;
}

interface VoiceSample {
  id: string;
  type: string;
  content: string;
}

export default function VoiceCalibration({ sessionId, token, onComplete }: VoiceCalibrationProps) {
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, { rating: 'good' | 'bad'; notes: string }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const response = await fetch(`/api/voice/samples?session_id=${sessionId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(`Failed to load samples: ${response.status}`);
        const data = await response.json();
        setSamples(data.samples || []);
      } catch (err) {
        console.error('[VoiceCalibration] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load voice samples');
      } finally {
        setLoading(false);
      }
    };
    fetchSamples();
  }, [sessionId, token]);

  const handleRating = (sampleId: string, rating: 'good' | 'bad') => {
    setFeedback(prev => ({
      ...prev,
      [sampleId]: { ...prev[sampleId], rating, notes: prev[sampleId]?.notes || '' },
    }));
  };

  const handleNotes = (sampleId: string, notes: string) => {
    setFeedback(prev => ({
      ...prev,
      [sampleId]: { ...prev[sampleId], notes, rating: prev[sampleId]?.rating || 'good' },
    }));
  };

  const handleNext = () => {
    if (currentIndex < samples.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(feedback);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading voice samples...</p>
        </div>
      </div>
    );
  }

  if (error || samples.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-yellow-400 mb-2">
            {error || 'No voice samples available yet.'}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Voice samples are generated from your interview answers.
          </p>
          <button onClick={() => onComplete({})}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            Continue Anyway
          </button>
        </div>
      </div>
    );
  }

  const currentSample = samples[currentIndex];
  if (!currentSample) return null;
  const currentFeedback = feedback[currentSample.id];

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex-shrink-0 mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Voice Calibration</h3>
        <p className="text-sm text-gray-400">
          Sample {currentIndex + 1} of {samples.length} — Does this sound like you?
        </p>
        <div className="mt-2 h-1 bg-[var(--gh-dark-600)] rounded-full">
          <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / samples.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 bg-[var(--gh-dark-700)] rounded-lg mb-4">
          <span className="text-[11px] text-gray-500 uppercase tracking-wider mb-2 block">{currentSample.type}</span>
          <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{currentSample.content}</p>
        </div>

        <div className="flex gap-3 mb-4">
          <button onClick={() => handleRating(currentSample.id, 'good')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              currentFeedback?.rating === 'good' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-[var(--gh-dark-600)] text-gray-400 hover:text-white hover:border-gray-500'}`}>
            <ThumbsUp className="w-4 h-4" /> Sounds like me
          </button>
          <button onClick={() => handleRating(currentSample.id, 'bad')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-colors ${
              currentFeedback?.rating === 'bad' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-[var(--gh-dark-600)] text-gray-400 hover:text-white hover:border-gray-500'}`}>
            <ThumbsDown className="w-4 h-4" /> Not quite
          </button>
        </div>

        {currentFeedback?.rating && (
          <div className="animate-founders-fade-in">
            <textarea value={currentFeedback.notes} onChange={(e) => handleNotes(currentSample.id, e.target.value)}
              placeholder={currentFeedback.rating === 'bad' ? "What would you change?" : "Any specific notes? (optional)"}
              className="w-full bg-[var(--gh-dark-700)] text-white rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3} />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 pt-4">
        <button onClick={handleNext} disabled={!currentFeedback?.rating}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors">
          {currentIndex < samples.length - 1 ? 'Next Sample' : 'Complete Calibration'}
        </button>
      </div>
    </div>
  );
}
