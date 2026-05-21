import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PlatformContextType {
  selectedPlatformId: string | null;
  selectedPlatformName: string | null;
  setSelectedPlatformId: (id: string | null) => void;
  hasSelectedPlatform: boolean;
  /** null = still checking, true = accessible, false = no access */
  isPlatformAccessible: boolean | null;
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

export const PlatformProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPlatformId, setSelectedPlatformIdState] = useState<string | null>(null);
  const [selectedPlatformName, setSelectedPlatformName] = useState<string | null>(null);
  const [isPlatformAccessible, setIsPlatformAccessible] = useState<boolean | null>(null);

  // Load stored platform ID on mount
  useEffect(() => {
    const storedId = localStorage.getItem('selected_platform_id');
    if (storedId) {
      setSelectedPlatformIdState(storedId);
    }
  }, []);

  // Validate access whenever the selected platform changes
  useEffect(() => {
    if (!selectedPlatformId) {
      setIsPlatformAccessible(null);
      setSelectedPlatformName(null);
      return;
    }

    setIsPlatformAccessible(null); // mark as "checking"

    const apiBase = import.meta.env.VITE_API_URL || 'https://staging.breachnet.io/api/v1';
    const token = localStorage.getItem('auth_token');

    fetch(`${apiBase}/platforms/${selectedPlatformId}/`, {
      headers: token ? { Authorization: `Token ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('no_access');
        return res.json();
      })
      .then(data => {
        setIsPlatformAccessible(true);
        setSelectedPlatformName(data.name ?? null);
      })
      .catch(() => {
        setIsPlatformAccessible(false);
        setSelectedPlatformName(null);
      });
  }, [selectedPlatformId]);

  const setSelectedPlatformId = (id: string | null) => {
    if (id) {
      localStorage.setItem('selected_platform_id', id);
    } else {
      localStorage.removeItem('selected_platform_id');
    }
    setSelectedPlatformIdState(id);
  };

  return (
    <PlatformContext.Provider
      value={{
        selectedPlatformId,
        selectedPlatformName,
        setSelectedPlatformId,
        hasSelectedPlatform: !!selectedPlatformId,
        isPlatformAccessible,
        requirePlatform: () => !!selectedPlatformId,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
