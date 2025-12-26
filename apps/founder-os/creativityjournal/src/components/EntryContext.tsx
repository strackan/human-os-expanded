'use client';

import React, { createContext, useContext, useState } from 'react';

interface EntryContextType {
  writingMode: boolean;
  setWritingMode: (mode: boolean) => void;
}

const EntryContext = createContext<EntryContextType | undefined>(undefined);

export function EntryProvider({ children }: { children: React.ReactNode }) {
  const [writingMode, setWritingMode] = useState(false);

  return (
    <EntryContext.Provider value={{ writingMode, setWritingMode }}>
      {children}
    </EntryContext.Provider>
  );
}

export function useEntry() {
  const context = useContext(EntryContext);
  if (context === undefined) {
    throw new Error('useEntry must be used within an EntryProvider');
  }
  return context;
} 