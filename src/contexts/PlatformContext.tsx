import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PlatformContextType {
  selectedPlatformId: string | null;
  setSelectedPlatformId: (id: string | null) => void;
  hasSelectedPlatform: boolean;
  requirePlatform: () => boolean;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};

interface PlatformProviderProps {
  children: ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({ children }) => {
  const [selectedPlatformId, setSelectedPlatformIdState] = useState<string | null>(null);

  useEffect(() => {
    // Initialize from localStorage on mount
    const storedPlatformId = localStorage.getItem('selected_platform_id');
    if (storedPlatformId) {
      setSelectedPlatformIdState(storedPlatformId);
    }
  }, []);

  const setSelectedPlatformId = (id: string | null) => {
    if (id) {
      localStorage.setItem('selected_platform_id', id);
    } else {
      localStorage.removeItem('selected_platform_id');
    }
    setSelectedPlatformIdState(id);
  };

  const hasSelectedPlatform = !!selectedPlatformId;

  const requirePlatform = () => {
    return hasSelectedPlatform;
  };

  const value: PlatformContextType = {
    selectedPlatformId,
    setSelectedPlatformId,
    hasSelectedPlatform,
    requirePlatform,
  };

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
};
