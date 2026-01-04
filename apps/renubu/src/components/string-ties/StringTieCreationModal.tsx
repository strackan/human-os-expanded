'use client';

import React, { useState, useEffect } from 'react';
import { X, Mic, Keyboard, Loader2, Edit2, Check } from 'lucide-react';
import { useVoiceRecording } from '@/lib/hooks/useVoiceRecording';
import { useCreateStringTie, useParseReminder } from '@/lib/hooks/useStringTies';
import { useToast } from '@/components/ui/ToastProvider';
import { ParsedReminder } from '@/types/string-ties';
import { format } from 'date-fns';

/**
 * StringTieCreationModal Component
 *
 * Voice-first modal for creating string-tie reminders with:
 * - Primary: Voice recording with visual feedback
 * - Secondary: Text input fallback
 * - Preview: LLM-parsed result before creating
 * - Edit: Ability to correct parsing
 */

interface StringTieCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type InputMode = 'voice' | 'text';
type FlowState = 'input' | 'parsing' | 'preview';

export function StringTieCreationModal({
  isOpen,
  onClose,
  onSuccess,
}: StringTieCreationModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [textInput, setTextInput] = useState('');
  const [parsedReminder, setParsedReminder] = useState<ParsedReminder | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedReminderText, setEditedReminderText] = useState('');
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editedDateTime, setEditedDateTime] = useState('');

  const {
    isRecording,
    transcript,
    isSupported: isVoiceSupported,
    error: voiceError,
    startRecording,
    stopRecording,
    resetTranscript,
  } = useVoiceRecording();

  const parseMutation = useParseReminder();
  const createMutation = useCreateStringTie();
  const { showToast } = useToast();

  // Auto-switch to text mode if voice not supported
  useEffect(() => {
    if (!isVoiceSupported && inputMode === 'voice') {
      setInputMode('text');
      showToast({
        message: 'Voice input not available. Using text input.',
        type: 'info',
        duration: 5000,
      });
    }
  }, [isVoiceSupported, inputMode, showToast]);

  // Auto-parse when voice transcript received
  useEffect(() => {
    if (transcript && !isRecording && flowState === 'input') {
      handleParse(transcript);
    }
  }, [transcript, isRecording, flowState]);

  const handleParse = async (content: string) => {
    if (!content.trim()) {
      showToast({
        message: 'Please enter a reminder',
        type: 'error',
        icon: 'alert',
        duration: 3000,
      });
      return;
    }

    setFlowState('parsing');
    try {
      const result = await parseMutation.mutateAsync({
        content: content.trim(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      setParsedReminder(result.parsedReminder);
      setEditedReminderText(result.parsedReminder.reminderText);
      setEditedDateTime(result.parsedReminder.remindAt);
      setFlowState('preview');
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to parse reminder',
        type: 'error',
        icon: 'alert',
        duration: 5000,
      });
      setFlowState('input');
    }
  };

  const handleCreate = async () => {
    if (!parsedReminder) return;

    try {
      const content = inputMode === 'voice' ? transcript : textInput;
      await createMutation.mutateAsync({
        content,
        source: inputMode === 'voice' ? 'voice' : 'manual',
        reminderText: editedReminderText,
        remindAt: editedDateTime,
      });

      showToast({
        message: 'String tie created successfully!',
        type: 'success',
        icon: 'check',
        duration: 3000,
      });

      handleClose();
      onSuccess?.();
    } catch (error: any) {
      showToast({
        message: error.message || 'Failed to create string tie',
        type: 'error',
        icon: 'alert',
        duration: 5000,
      });
    }
  };

  const handleClose = () => {
    setFlowState('input');
    setTextInput('');
    setParsedReminder(null);
    setIsEditingText(false);
    setIsEditingTime(false);
    resetTranscript();
    onClose();
  };

  const handleStartVoiceRecording = () => {
    resetTranscript();
    startRecording();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            Tie a String
          </h2>
          <button
            onClick={handleClose}
            disabled={createMutation.isPending || parseMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Input Mode Toggle */}
          {flowState === 'input' && (
            <>
              <div className="flex gap-2 mb-6">
                {isVoiceSupported && (
                  <button
                    onClick={() => setInputMode('voice')}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      inputMode === 'voice'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Mic className="w-4 h-4" />
                      <span className="font-medium">Voice</span>
                    </div>
                  </button>
                )}
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    inputMode === 'text'
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Keyboard className="w-4 h-4" />
                    <span className="font-medium">Text</span>
                  </div>
                </button>
              </div>

              {/* Voice Input Mode */}
              {inputMode === 'voice' && (
                <div className="flex flex-col items-center justify-center py-8">
                  {/* Microphone Button */}
                  <button
                    onClick={isRecording ? stopRecording : handleStartVoiceRecording}
                    disabled={parseMutation.isPending}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } disabled:opacity-50 shadow-lg`}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded"></div>
                    ) : (
                      <Mic className="w-10 h-10 text-white" />
                    )}
                  </button>

                  {/* Status Text */}
                  <p className="mt-4 text-center text-sm font-medium text-gray-700">
                    {isRecording ? 'Listening...' : 'Tap to speak'}
                  </p>

                  {/* Transcript Display */}
                  {transcript && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
                      <p className="text-sm text-gray-700">"{transcript}"</p>
                    </div>
                  )}

                  {/* Voice Error */}
                  {voiceError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg w-full">
                      <p className="text-sm text-red-700">{voiceError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Text Input Mode */}
              {inputMode === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remind me to...
                    </label>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="e.g., call client tomorrow at 3pm"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && textInput.trim()) {
                          handleParse(textInput);
                        }
                      }}
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={() => handleParse(textInput)}
                    disabled={!textInput.trim() || parseMutation.isPending}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {parseMutation.isPending ? 'Parsing...' : 'Continue'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Parsing State */}
          {flowState === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="mt-4 text-center text-sm text-gray-600">
                Parsing your reminder...
              </p>
            </div>
          )}

          {/* Preview State */}
          {flowState === 'preview' && parsedReminder && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Preview:</h3>

                {/* Reminder Text */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Reminder:</label>
                    {!isEditingText && (
                      <button
                        onClick={() => setIsEditingText(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingText ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editedReminderText}
                        onChange={(e) => setEditedReminderText(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setIsEditingText(false)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{editedReminderText}</p>
                  )}
                </div>

                {/* Remind Time */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Remind at:</label>
                    {!isEditingTime && (
                      <button
                        onClick={() => setIsEditingTime(true)}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingTime ? (
                    <div className="flex gap-2">
                      <input
                        type="datetime-local"
                        value={editedDateTime.slice(0, 16)}
                        onChange={(e) => setEditedDateTime(new Date(e.target.value).toISOString())}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => setIsEditingTime(false)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">
                      {format(new Date(editedDateTime), 'EEEE, MMMM d, yyyy')} at{' '}
                      {format(new Date(editedDateTime), 'h:mm a')}
                    </p>
                  )}
                </div>

                {parsedReminder.detectedTime && (
                  <p className="text-xs text-gray-500 mt-2">
                    Detected: {parsedReminder.detectedTime}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setFlowState('input');
                    setParsedReminder(null);
                  }}
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Reminder'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
