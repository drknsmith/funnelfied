import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type ViewMode = 'my' | 'team';

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  canToggleViewMode: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  
  // Only super_admin and admin can toggle between views
  const canToggleViewMode = role === 'super_admin' || role === 'admin';
  
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    // Only load from localStorage if user can toggle
    if (canToggleViewMode) {
      const saved = localStorage.getItem('view-mode');
      if (saved === 'my' || saved === 'team') {
        return saved;
      }
    }
    return 'my';
  });

  // Force 'my' mode for users without toggle access
  useEffect(() => {
    if (!canToggleViewMode && viewMode !== 'my') {
      setViewModeState('my');
    }
  }, [canToggleViewMode, viewMode]);

  // Persist to localStorage when changed
  const setViewMode = (mode: ViewMode) => {
    if (canToggleViewMode) {
      localStorage.setItem('view-mode', mode);
      setViewModeState(mode);
    }
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, canToggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}
