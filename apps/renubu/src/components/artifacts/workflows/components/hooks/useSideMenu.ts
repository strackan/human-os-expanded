import { useState, useCallback } from 'react';

interface SideMenuState {
  isVisible: boolean;
  isCollapsed: boolean;
}

interface UseSideMenuProps {
  onToggle?: (isVisible: boolean) => void;
}

/**
 * useSideMenu Hook
 *
 * Manages side menu state and operations:
 * - Visibility toggle
 * - Collapse/expand state
 * - Show/remove/toggle methods
 */
export function useSideMenu({ onToggle }: UseSideMenuProps = {}) {
  const [state, setState] = useState<SideMenuState>({
    isVisible: false,
    isCollapsed: false
  });

  const showSideMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: true,
      isCollapsed: false
    }));
    onToggle?.(true);
  }, [onToggle]);

  const removeSideMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      isCollapsed: false
    }));
    onToggle?.(false);
  }, [onToggle]);

  const toggleSideMenuVisibility = useCallback(() => {
    setState(prev => {
      const newIsVisible = !prev.isVisible;
      onToggle?.(newIsVisible);
      return {
        ...prev,
        isVisible: newIsVisible
      };
    });
  }, [onToggle]);

  const toggleSideMenuCollapse = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCollapsed: !prev.isCollapsed
    }));
  }, []);

  return {
    state,
    showSideMenu,
    removeSideMenu,
    toggleSideMenuVisibility,
    toggleSideMenuCollapse
  };
}
