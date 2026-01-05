// Hook: useGlitchImages
// Extracted from components/GlitchIntroV2.tsx (lines 88-111)

import { useMemo } from 'react';
import { FLASH_SCHEDULE, BACKGROUND_SCHEDULE } from '@/utils/glitchSequence';
import { getRandomImagePath } from '@/utils/glitchImages';

export function useGlitchImages() {
  // Pre-assign random images to each flash event (macabre/social overlays)
  const flashImages = useMemo(() => {
    try {
      return FLASH_SCHEDULE.map(flash => ({
        path: getRandomImagePath(flash.type as 'macabre' | 'social'),
        type: flash.type
      }));
    } catch (error) {
      console.error('Failed to load flash images:', error);
      return [];
    }
  }, []);

  // Pre-assign random background images (TECH only)
  const backgroundImages = useMemo(() => {
    try {
      return BACKGROUND_SCHEDULE.map(bg => ({
        path: getRandomImagePath('tech'),
        type: bg.type
      }));
    } catch (error) {
      console.error('Failed to load background images:', error);
      return [];
    }
  }, []);

  return { flashImages, backgroundImages };
}
