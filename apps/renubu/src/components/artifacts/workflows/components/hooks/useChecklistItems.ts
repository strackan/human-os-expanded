import { useState, useEffect, useCallback } from 'react';
import { ChecklistItem } from '../../../PlanningChecklistArtifact';

interface UseChecklistItemsProps {
  visibleSections: any[];
  onChapterNavigation?: (chapterNumber: number) => void;
}

/**
 * useChecklistItems Hook
 *
 * Manages checklist items extracted from visible artifact sections.
 * Handles item clicks and navigation to checklist sections.
 */
export function useChecklistItems({ visibleSections, onChapterNavigation }: UseChecklistItemsProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  // Extract checklist items from visible sections
  useEffect(() => {
    const checklistSection = visibleSections.find(s =>
      s.type === 'planning-checklist' || s.type === 'planning-checklist-enhanced'
    );

    if (checklistSection && checklistSection.content?.items) {
      setChecklistItems(checklistSection.content.items);
    } else {
      setChecklistItems([]);
    }
  }, [visibleSections]);

  // Handle checklist item clicks in side menu
  const handleChecklistItemClick = useCallback((itemId: string, index: number) => {
    // Scroll to the checklist artifact in the main panel
    const checklistElement = document.querySelector(`[data-checklist-item="${itemId}"]`);
    if (checklistElement) {
      checklistElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // If there's an onChapterNavigation callback, use it
    if (onChapterNavigation) {
      onChapterNavigation(index + 1); // Convert to 1-based chapter number
    }
  }, [onChapterNavigation]);

  return {
    checklistItems,
    setChecklistItems,
    handleChecklistItemClick
  };
}
