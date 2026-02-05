/**
 * Synthesis Progress Artifact
 *
 * Animated progress indicator shown while synthesis API is running.
 * Displays stages of document generation.
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Brain,
  FileText,
  Mic,
  Sparkles,
  CheckCircle2,
  User,
  MessageSquare,
  Target,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export interface SynthesisProgressArtifactProps {
  /** Whether synthesis is in progress */
  isRunning: boolean;
  /** Error message if synthesis failed */
  error?: string | null;
  /** Callback when retry is clicked after error */
  onRetry?: () => void;
}

interface SynthesisStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  duration: number; // Simulated duration in ms
}

// =============================================================================
// STAGES
// =============================================================================

const SYNTHESIS_STAGES: SynthesisStage[] = [
  {
    id: 'sculptor',
    label: 'Analyzing Sculptor session...',
    icon: <MessageSquare className="w-5 h-5" />,
    duration: 2000,
  },
  {
    id: 'interview',
    label: 'Processing interview responses...',
    icon: <User className="w-5 h-5" />,
    duration: 2500,
  },
  {
    id: 'voice',
    label: 'Evaluating voice calibration...',
    icon: <Mic className="w-5 h-5" />,
    duration: 2000,
  },
  {
    id: 'personality',
    label: 'Building personality profile...',
    icon: <Brain className="w-5 h-5" />,
    duration: 3000,
  },
  {
    id: 'founder_os',
    label: 'Generating Founder OS commandments...',
    icon: <Target className="w-5 h-5" />,
    duration: 3500,
  },
  {
    id: 'voice_os',
    label: 'Creating Voice OS protocols...',
    icon: <Mic className="w-5 h-5" />,
    duration: 3000,
  },
  {
    id: 'executive',
    label: 'Building executive profile...',
    icon: <FileText className="w-5 h-5" />,
    duration: 2500,
  },
  {
    id: 'finalizing',
    label: 'Finalizing your Human OS...',
    icon: <Sparkles className="w-5 h-5" />,
    duration: 2000,
  },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function SynthesisProgressArtifact({
  isRunning,
  error = null,
  onRetry,
}: SynthesisProgressArtifactProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<Set<string>>(new Set());

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Simulate stage progression
  useEffect(() => {
    if (!isRunning || error) return;

    const advanceStage = () => {
      if (currentStageIndex < SYNTHESIS_STAGES.length - 1) {
        // Mark current stage as complete
        const stage = SYNTHESIS_STAGES[currentStageIndex];
        setCompletedStages((prev) => new Set([...prev, stage.id]));

        // Move to next stage
        setCurrentStageIndex((prev) => prev + 1);
      }
    };

    // Schedule next stage advancement
    const stage = SYNTHESIS_STAGES[currentStageIndex];
    timeoutRef.current = setTimeout(advanceStage, stage.duration);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isRunning, currentStageIndex, error]);

  // Reset when synthesis stops
  useEffect(() => {
    if (!isRunning && !error) {
      setCurrentStageIndex(0);
      setCompletedStages(new Set());
    }
  }, [isRunning, error]);

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gh-dark-900 to-gh-dark-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Synthesis Failed
          </h2>
          <p className="text-gray-400 mb-6 max-w-md">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gh-dark-900 to-gh-dark-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Main animation */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Building Your Human OS
          </h2>
          <p className="text-gray-400 text-center">
            Synthesizing all sources into your complete profile...
          </p>
        </div>

        {/* Stages list */}
        <div className="space-y-3">
          {SYNTHESIS_STAGES.map((stage, index) => {
            const isActive = index === currentStageIndex;
            const isComplete = completedStages.has(stage.id);
            // isPending could be used for future styling of pending stages

            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-500/20 border border-purple-500/30'
                    : isComplete
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-gh-dark-800/50 border border-transparent'
                }`}
              >
                {/* Status icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive
                      ? 'bg-purple-500 text-white'
                      : isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-gh-dark-700 text-gray-500'
                  }`}
                >
                  {isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    stage.icon
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-sm ${
                    isActive
                      ? 'text-white font-medium'
                      : isComplete
                      ? 'text-green-400'
                      : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="ml-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 bg-gh-dark-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStageIndex + 1) / SYNTHESIS_STAGES.length) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Processing...</span>
            <span>
              {currentStageIndex + 1} of {SYNTHESIS_STAGES.length}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SynthesisProgressArtifact;
