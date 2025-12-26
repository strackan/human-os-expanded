import { useEffect, useCallback } from 'react';

interface HotkeyHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
}

export function useHotkeys(handlers: HotkeyHandler[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    for (const handler of handlers) {
      const keyMatch = event.key.toLowerCase() === handler.key.toLowerCase();
      const ctrlMatch = handler.ctrl ? event.ctrlKey : !event.ctrlKey;
      const altMatch = handler.alt ? event.altKey : !event.altKey;
      const shiftMatch = handler.shift ? event.shiftKey : !event.shiftKey;
      const metaMatch = handler.meta ? event.metaKey : !event.metaKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        if (handler.preventDefault !== false) {
          event.preventDefault();
        }
        handler.handler(event);
        break;
      }
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
} 