'use client';

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  rightSidebarWidth: number;
  setRightSidebarWidth: (width: number) => void;
  isModalExpanded: boolean;
  setIsModalExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320); // Default 320px (80 * 4)
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  const handleSetCollapsed = (collapsed: boolean) => {
    console.log('Setting collapsed to:', collapsed);
    setIsCollapsed(collapsed);
  };

  const handleSetRightSidebarWidth = (width: number) => {
    // Constrain width between 280px and 600px
    const constrainedWidth = Math.max(280, Math.min(600, width));
    setRightSidebarWidth(constrainedWidth);
  };

  const handleSetModalExpanded = (expanded: boolean) => {
    setIsModalExpanded(expanded);
  };

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      setIsCollapsed: handleSetCollapsed,
      rightSidebarWidth,
      setRightSidebarWidth: handleSetRightSidebarWidth,
      isModalExpanded,
      setIsModalExpanded: handleSetModalExpanded
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 