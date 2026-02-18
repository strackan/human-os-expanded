'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { LoadingStage, LoadingState } from '../types';

export interface UseLoadingStagesOptions {
  stages: LoadingStage[];
  onComplete?: () => void;
}

export function useLoadingStages(options: UseLoadingStagesOptions) {
  const { stages, onComplete } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    active: false,
    stage: 0,
    message: '',
  });

  const abortRef = useRef(false);

  useEffect(() => {
    return () => { abortRef.current = true; };
  }, []);

  const startLoading = useCallback(async () => {
    abortRef.current = false;
    setLoadingState({ active: true, stage: 0, message: stages[0]?.message || 'Loading...' });

    for (let i = 0; i < stages.length; i++) {
      if (abortRef.current) break;
      const stage = stages[i];
      if (!stage) continue;
      setLoadingState({ active: true, stage: i, message: stage.message });
      await new Promise((resolve) => setTimeout(resolve, stage.duration));
    }

    if (!abortRef.current) {
      setLoadingState({ active: false, stage: 0, message: '' });
      onComplete?.();
    }
  }, [stages, onComplete]);

  const stopLoading = useCallback(() => {
    abortRef.current = true;
    setLoadingState({ active: false, stage: 0, message: '' });
  }, []);

  const reset = useCallback(() => {
    abortRef.current = false;
    setLoadingState({ active: false, stage: 0, message: '' });
  }, []);

  const progress = loadingState.active
    ? ((loadingState.stage + 1) / stages.length) * 100
    : 0;

  return {
    loadingState,
    isActive: loadingState.active,
    currentStage: loadingState.stage,
    currentMessage: loadingState.message,
    progress,
    startLoading,
    stopLoading,
    reset,
  };
}
