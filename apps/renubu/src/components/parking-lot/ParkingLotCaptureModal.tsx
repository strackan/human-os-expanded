'use client';

/**
 * Parking Lot Capture Modal
 * Quick capture interface with LLM enhancement and mode detection
 * Opens with global keyboard shortcut: Cmd+Shift+P (Ctrl+Shift+P on Windows)
 */

import { useState, useEffect } from 'react';
import { X, Loader2, Sparkles } from 'lucide-react';
import { useCreateParkingLotItem } from '@/lib/hooks/useParkingLot';

interface ParkingLotCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ParkingLotCaptureModal({
  isOpen,
  onClose,
  onSuccess
}: ParkingLotCaptureModalProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const createMutation = useCreateParkingLotItem();

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setInput('');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      await createMutation.mutateAsync({
        raw_input: input.trim(),
        source: 'manual'
      });

      // Success
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create parking lot item:', error);
      // Error handling - could show toast
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🅿️</span>
            <h2 className="text-xl font-semibold text-gray-900">Capture Idea</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Input */}
            <div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your idea... Try: 'Renubu: McDonald's expansion', 'Brainstorm: new product idea', or just capture freely"
                className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                autoFocus
                disabled={isProcessing}
              />
            </div>

            {/* Magic Keywords Hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium text-blue-900 mb-1">Magic Keywords</p>
                  <div className="text-blue-700 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded">Renubu</span>
                      <span>→ Convert to workflow when ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded">Brainstorm</span>
                      <span>→ Interactive Q&A to flesh out</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-blue-100 px-2 py-0.5 rounded">Expand</span>
                      <span>→ AI analysis with action plan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm text-gray-600">
                  AI is analyzing your idea...
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <div className="text-sm text-gray-500">
              <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+P
              </kbd>
              <span className="ml-2">to open anytime</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Capture</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
