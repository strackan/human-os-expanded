'use client';

/**
 * Voice Calibration Component (Web)
 *
 * Displays 3 generated voice samples for user review and editing.
 * Collects feedback on edits to refine Voice OS commandments.
 *
 * Flow: User sees sample -> provides feedback -> AI regenerates ->
 * user approves or gives more feedback -> loop until "Looks Good".
 *
 * Ported from desktop: apps/goodhang-desktop/src/components/voice/VoiceCalibration.tsx
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2,
  Check,
  Edit3,
  Lightbulb,
  Heart,
  UserPlus,
  RefreshCw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { post, isDevMode } from '@/lib/founders/api-client';

// =============================================================================
// TYPES
// =============================================================================

interface VoiceSample {
  id: string;
  type: 'thought_leadership' | 'personal_story' | 'connection_request';
  label: string;
  description: string;
  content: string;
  topic: string;
}

interface SampleFeedback {
  edited: boolean;
  originalContent: string;
  editedContent: string;
  whatDidntWork: string;
  whatWouldHelp: string;
}

interface VoiceCalibrationProps {
  sessionId: string;
  token: string | null;
  interviewAnswers?: Record<string, string>;
  onComplete: (feedback: Record<string, unknown>) => void;
}

// =============================================================================
// MOCK DATA FOR DEV MODE
// =============================================================================

const MOCK_SAMPLES: VoiceSample[] = [
  {
    id: 'thought_leadership',
    type: 'thought_leadership',
    label: 'Thought Leadership Post',
    description: 'A LinkedIn post sharing your expertise',
    content: `Hot take: The best sales advice I ever got wasn't about closing techniques or objection handling.

It was this: "Stop trying to convince people. Start trying to understand them."

Most salespeople spend 80% of their time talking and 20% listening. Flip that ratio and watch what happens.

When you actually listen - not just wait for your turn to speak - you discover the real problems. The ones they might not even know they have.

That's when deals happen naturally. No manipulation required.

What's the best sales advice you've ever received?`,
    topic: 'Sales philosophy and listening',
  },
  {
    id: 'personal_story',
    type: 'personal_story',
    label: 'Personal Story Post',
    description: 'A reflective LinkedIn post',
    content: `I almost quit entrepreneurship three years ago.

The company was failing. I'd burned through savings. My confidence was shot.

Then a mentor said something that changed everything: "You're not failing. You're learning what doesn't work."

That reframe saved me. Not because it made things easier - it didn't. But because it let me see setbacks as data, not verdicts.

Now when things go wrong, I ask: "What is this teaching me?"

It's not toxic positivity. It's survival.

Anyone else had a moment that shifted how you see failure?`,
    topic: 'Reframing failure and resilience',
  },
  {
    id: 'connection_request',
    type: 'connection_request',
    label: 'Connection Request',
    description: 'A LinkedIn connection message',
    content: `Hey Sarah - saw your post about scaling sales teams at Series B companies. Really resonated with me, especially the part about hiring for curiosity over experience.

Would love to connect and trade notes sometime. No pitch, just always looking to learn from folks who've been in the trenches.`,
    topic: 'Connecting with a sales leader',
  },
];

// =============================================================================
// SAMPLE CARD COMPONENT
// =============================================================================

interface SampleCardProps {
  sample: VoiceSample;
  feedback: SampleFeedback;
  onRegenerate: (editedContent: string) => Promise<void>;
  onFeedbackChange: (field: 'whatDidntWork' | 'whatWouldHelp', value: string) => void;
  onConfirm: () => void;
  isConfirmed: boolean;
  isEditing: boolean;
  isRegenerating: boolean;
  wasRegenerated: boolean;
  regenerateError: string | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

function SampleCard({
  sample,
  feedback,
  onRegenerate,
  onFeedbackChange,
  onConfirm,
  isConfirmed,
  isEditing,
  isRegenerating,
  wasRegenerated,
  regenerateError,
  onStartEdit,
  onCancelEdit,
}: SampleCardProps) {
  const [editValue, setEditValue] = useState(feedback.editedContent || sample.content);

  // Sync editValue when feedback.editedContent changes (e.g. after regeneration)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(feedback.editedContent || sample.content);
    }
  }, [feedback.editedContent, sample.content, isEditing]);

  const getIcon = () => {
    switch (sample.type) {
      case 'thought_leadership':
        return <Lightbulb className="w-5 h-5" />;
      case 'personal_story':
        return <Heart className="w-5 h-5" />;
      case 'connection_request':
        return <UserPlus className="w-5 h-5" />;
    }
  };

  const hasFeedback = feedback.whatDidntWork.trim() !== '' || feedback.whatWouldHelp.trim() !== '';

  const handleRegenerate = () => {
    onRegenerate(editValue);
  };

  return (
    <div
      className={`rounded-xl border animate-founders-fade-in ${
        isConfirmed
          ? 'border-green-500/30 bg-green-900/10'
          : 'border-[var(--gh-dark-600)] bg-[var(--gh-dark-800)]/50'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--gh-dark-600)]/50">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${
              isConfirmed
                ? 'bg-green-600/20 text-green-400'
                : 'bg-purple-600/20 text-purple-400'
            }`}
          >
            {isConfirmed ? <Check className="w-5 h-5" /> : getIcon()}
          </div>
          <div>
            <h3 className="font-medium text-white">{sample.label}</h3>
            <p className="text-xs text-gray-500">{sample.topic}</p>
          </div>
        </div>
        {!isConfirmed && !isEditing && !isRegenerating && (
          <button
            onClick={onStartEdit}
            className="p-2 text-gray-400 hover:text-white hover:bg-[var(--gh-dark-600)] rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isRegenerating ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <p className="text-gray-400 text-sm">Regenerating with your feedback...</p>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-40 p-3 bg-[var(--gh-dark-900)] border border-[var(--gh-dark-500)] rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Feedback questions */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  What didn&apos;t quite work? What felt off?
                </label>
                <input
                  type="text"
                  value={feedback.whatDidntWork}
                  onChange={(e) => onFeedbackChange('whatDidntWork', e.target.value)}
                  placeholder="e.g., Too formal, missing my usual humor..."
                  className="w-full p-2 bg-[var(--gh-dark-900)] border border-[var(--gh-dark-500)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  What instruction would have prevented this?
                </label>
                <input
                  type="text"
                  value={feedback.whatWouldHelp}
                  onChange={(e) => onFeedbackChange('whatWouldHelp', e.target.value)}
                  placeholder="e.g., Use shorter sentences, add a personal anecdote..."
                  className="w-full p-2 bg-[var(--gh-dark-900)] border border-[var(--gh-dark-500)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {regenerateError && (
              <div className="flex items-center gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-red-400 text-xs">{regenerateError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                disabled={!hasFeedback}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                  hasFeedback
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-[var(--gh-dark-600)] text-gray-500 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Regenerate
              </button>
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 bg-[var(--gh-dark-600)] hover:bg-[var(--gh-dark-500)] text-white rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
            </div>

            {!hasFeedback && (
              <p className="text-xs text-gray-500 text-center">
                Provide feedback above to enable regeneration
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap">
              {feedback.edited ? feedback.editedContent : sample.content}
            </p>

            {wasRegenerated && (
              <div className="flex items-center gap-1.5 text-xs text-purple-400">
                <Sparkles className="w-3 h-3" />
                Regenerated from your feedback
              </div>
            )}

            {feedback.edited && !wasRegenerated && (
              <div className="text-xs text-gray-500 italic">Edited from original</div>
            )}

            {!isConfirmed && (
              <div className="flex gap-2">
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                >
                  Looks Good
                </button>
                <button
                  onClick={onStartEdit}
                  className="px-4 py-2 bg-[var(--gh-dark-600)] hover:bg-[var(--gh-dark-500)] text-white rounded-lg text-sm transition-colors"
                >
                  {wasRegenerated ? 'Edit Again' : 'Edit'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function VoiceCalibration({
  sessionId,
  token,
  interviewAnswers,
  onComplete,
}: VoiceCalibrationProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samples, setSamples] = useState<VoiceSample[]>([]);
  const [feedback, setFeedback] = useState<Record<string, SampleFeedback>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratedIds, setRegeneratedIds] = useState<Set<string>>(new Set());
  const [regenerateErrors, setRegenerateErrors] = useState<Record<string, string | null>>({});
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  // Initialize feedback for a set of samples
  const initializeFeedback = (sampleList: VoiceSample[]) => {
    const initialFeedback: Record<string, SampleFeedback> = {};
    sampleList.forEach((sample) => {
      initialFeedback[sample.id] = {
        edited: false,
        originalContent: sample.content,
        editedContent: sample.content,
        whatDidntWork: '',
        whatWouldHelp: '',
      };
    });
    return initialFeedback;
  };

  // Load samples on mount
  useEffect(() => {
    const loadSamples = async () => {
      setLoading(true);
      setError(null);

      try {
        // In dev mode with mock session, use mock data
        if (isDevMode() && sessionId === 'dev-mock-session') {
          console.log('[VoiceCalibration] Using mock samples for dev mode');
          setSamples(MOCK_SAMPLES);
          setFeedback(initializeFeedback(MOCK_SAMPLES));
          setLoading(false);
          return;
        }

        // Call API to generate samples
        const response = await post<{ samples: VoiceSample[] }>(
          '/api/voice/generate-samples',
          {
            session_id: sessionId,
            interview_answers: interviewAnswers,
          },
          token,
          { timeout: 60000 }
        );

        if (response.samples && response.samples.length > 0) {
          setSamples(response.samples);
          setFeedback(initializeFeedback(response.samples));
        } else {
          throw new Error('No samples generated');
        }
      } catch (err) {
        console.error('[VoiceCalibration] Failed to load samples:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to generate voice samples'
        );
      } finally {
        setLoading(false);
      }
    };

    loadSamples();
  }, [sessionId, token, interviewAnswers]);

  const handleRegenerate = useCallback(
    async (sampleId: string, editedContent: string) => {
      const sample = samples.find((s) => s.id === sampleId);
      const sampleFeedback = feedback[sampleId];
      if (!sample || !sampleFeedback) return;

      const attemptNumber = (attemptCounts[sampleId] || 0) + 1;

      setRegeneratingId(sampleId);
      setEditingId(null);
      setRegenerateErrors((prev) => ({ ...prev, [sampleId]: null }));
      setAttemptCounts((prev) => ({ ...prev, [sampleId]: attemptNumber }));

      try {
        // Dev mode mock: simulate a delay and return modified content
        if (isDevMode() && sessionId === 'dev-mock-session') {
          console.log('[VoiceCalibration] Mock regeneration for dev mode');
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const mockRegenerated = `[Regenerated v${attemptNumber}] ${sampleFeedback.editedContent || sample.content}\n\n(Applied: ${sampleFeedback.whatDidntWork || sampleFeedback.whatWouldHelp})`;

          setFeedback((prev) => {
            const existing = prev[sampleId];
            if (!existing) return prev;
            return {
              ...prev,
              [sampleId]: {
                edited: true,
                originalContent: existing.originalContent,
                editedContent: mockRegenerated,
                whatDidntWork: existing.whatDidntWork,
                whatWouldHelp: existing.whatWouldHelp,
              },
            };
          });
          setRegeneratedIds((prev) => new Set([...prev, sampleId]));
          setRegeneratingId(null);
          return;
        }

        // Use the current content (which may be from a previous regeneration) as the base
        const currentContent = sampleFeedback.edited
          ? sampleFeedback.editedContent
          : sample.content;

        const response = await post<{
          regenerated_content: string;
          changes_made: string[];
        }>(
          '/api/voice/regenerate-sample',
          {
            session_id: sessionId,
            sample: {
              id: sample.id,
              type: sample.type,
              label: sample.label,
              content: currentContent,
              topic: sample.topic,
            },
            feedback: {
              whatDidntWork: sampleFeedback.whatDidntWork,
              whatWouldHelp: sampleFeedback.whatWouldHelp,
              editedContent:
                editedContent !== currentContent ? editedContent : undefined,
            },
            attempt_number: attemptNumber,
          },
          token,
          { timeout: 30000 }
        );

        if (response.regenerated_content) {
          setFeedback((prev) => {
            const existing = prev[sampleId];
            if (!existing) return prev;
            return {
              ...prev,
              [sampleId]: {
                edited: true,
                originalContent: existing.originalContent,
                editedContent: response.regenerated_content,
                whatDidntWork: existing.whatDidntWork,
                whatWouldHelp: existing.whatWouldHelp,
              },
            };
          });
          setRegeneratedIds((prev) => new Set([...prev, sampleId]));
        } else {
          throw new Error('No regenerated content received');
        }
      } catch (err) {
        console.error('[VoiceCalibration] Regeneration failed:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Regeneration failed';
        setRegenerateErrors((prev) => ({ ...prev, [sampleId]: errorMsg }));
        // Go back to edit mode so user can retry
        setEditingId(sampleId);
      } finally {
        setRegeneratingId(null);
      }
    },
    [samples, feedback, sessionId, token, attemptCounts]
  );

  const handleFeedbackChange = useCallback(
    (sampleId: string, field: 'whatDidntWork' | 'whatWouldHelp', value: string) => {
      setFeedback((prev) => {
        const existing = prev[sampleId];
        if (!existing) return prev;
        return {
          ...prev,
          [sampleId]: {
            edited: existing.edited,
            originalContent: existing.originalContent,
            editedContent: existing.editedContent,
            whatDidntWork: existing.whatDidntWork,
            whatWouldHelp: existing.whatWouldHelp,
            [field]: value,
          },
        };
      });
    },
    []
  );

  const handleConfirm = useCallback((sampleId: string) => {
    setConfirmed((prev) => new Set([...prev, sampleId]));
    setEditingId(null);
  }, []);

  // Check if all samples are confirmed
  const allConfirmed =
    samples.length > 0 && samples.every((s) => confirmed.has(s.id));

  // Handle completion
  useEffect(() => {
    if (allConfirmed) {
      onComplete(feedback);
    }
  }, [allConfirmed, feedback, onComplete]);

  // =========================================================================
  // RENDER: Loading
  // =========================================================================

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400">Generating voice samples...</p>
        <p className="text-gray-500 text-sm mt-2">Based on your interview answers</p>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Error
  // =========================================================================

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--gh-dark-600)] hover:bg-[var(--gh-dark-500)] text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // =========================================================================
  // RENDER: Main
  // =========================================================================

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[var(--gh-dark-600)]">
        <h2 className="text-lg font-semibold text-white">Voice Calibration</h2>
        <p className="text-sm text-gray-400 mt-1">
          Review these samples. Edit anything that doesn&apos;t sound like you.
        </p>
        <div className="flex items-center gap-2 mt-2">
          {samples.map((sample) => (
            <div
              key={sample.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                confirmed.has(sample.id) ? 'bg-green-500' : 'bg-[var(--gh-dark-500)]'
              }`}
            />
          ))}
          <span className="text-xs text-gray-500 ml-2">
            {confirmed.size}/{samples.length} confirmed
          </span>
        </div>
      </div>

      {/* Samples */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {samples.map((sample) => {
          const sampleFeedback = feedback[sample.id];
          if (!sampleFeedback) return null;
          return (
          <SampleCard
            key={sample.id}
            sample={sample}
            feedback={sampleFeedback}
            onRegenerate={(editedContent) =>
              handleRegenerate(sample.id, editedContent)
            }
            onFeedbackChange={(field, value) =>
              handleFeedbackChange(sample.id, field, value)
            }
            onConfirm={() => handleConfirm(sample.id)}
            isConfirmed={confirmed.has(sample.id)}
            isEditing={editingId === sample.id}
            isRegenerating={regeneratingId === sample.id}
            wasRegenerated={regeneratedIds.has(sample.id)}
            regenerateError={regenerateErrors[sample.id] || null}
            onStartEdit={() => setEditingId(sample.id)}
            onCancelEdit={() => setEditingId(null)}
          />
          );
        })}
      </div>

      {/* Footer: completion message */}
      {allConfirmed && (
        <div className="p-4 border-t border-[var(--gh-dark-600)] bg-green-900/20 animate-founders-fade-in">
          <p className="text-center text-green-400 text-sm">
            All samples confirmed! Generating your voice profile...
          </p>
        </div>
      )}
    </div>
  );
}
