
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface MobileNavContextType {
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <MobileNavContext.Provider value={{ isVisible, setIsVisible }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (context === undefined) {
    throw new Error('useMobileNav must be used within a MobileNavProvider');
  }
  return context;
}
