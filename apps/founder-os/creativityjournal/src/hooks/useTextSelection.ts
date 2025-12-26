import { useState, useEffect, useCallback } from 'react';

export function useTextSelection() {
  const [selectedText, setSelectedText] = useState<string>('');

  const getSelectedText = useCallback(() => {
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        return selection.toString().trim();
      }
    }
    return '';
  }, []);

  const handleSelectionChange = useCallback(() => {
    const text = getSelectedText();
    setSelectedText(text);
  }, [getSelectedText]);

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectedText('');
  }, []);

  return { selectedText, clearSelection };
} 