"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

const PageTransitionContext = createContext(false);

export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <PageTransitionContext.Provider value={hasMounted}>
      {children}
    </PageTransitionContext.Provider>
  );
}

export function useHasMounted() {
  return useContext(PageTransitionContext);
} 