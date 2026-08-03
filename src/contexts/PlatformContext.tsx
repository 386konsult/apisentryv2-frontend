import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PlatformOwner {
  name: string;
  email: string;
}

interface PlatformContextType {
  selectedPlatformId: string | null;
  selectedPlatformName: string | null;
  setSelectedPlatformId: (id: string | null) => void;
  hasSelectedPlatform: boolean;
  /** null = still checking, true = accessible, false = no access */
  isPlatformAccessible: boolean | null;
  /** Populated when isPlatformAccessible === false so UI can show who owns the workspace */
  platformOwner: PlatformOwner | null;
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

const API_BASE = () =>
  (import.meta as any).env?.VITE_API_URL ?? 'https://staging.breachnet.io/api/v1';

const authHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return token ? { Authorization: `Token ${token}` } : {};
};

const accessCacheKey = (id: string) => `platform_accessible_${id}`;

export const PlatformProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedPlatformId, setSelectedPlatformIdState] = useState<string | null>(null);
  const [selectedPlatformName, setSelectedPlatformName] = useState<string | null>(null);
  const [isPlatformAccessible, setIsPlatformAccessible] = useState<boolean | null>(null);
  const [platformOwner, setPlatformOwner] = useState<PlatformOwner | null>(null);

  // On mount: seed from cache so reload skips the verifying spinner entirely
  useEffect(() => {
    const storedId = localStorage.getItem('selected_platform_id');
    if (!storedId) return;

    if (localStorage.getItem(accessCacheKey(storedId)) === 'true') {
      // Already verified before — skip the spinner, go straight to content
      setIsPlatformAccessible(true);
      try {
        const stored = localStorage.getItem('user_platforms');
        if (stored) {
          const platforms = JSON.parse(stored);
          const match = platforms.find((p: any) => p.id === storedId);
          if (match?.name) setSelectedPlatformName(match.name);
        }
      } catch {}
    }

    setSelectedPlatformIdState(storedId);
  }, []);

  // Validate access + fetch owner info whenever selected platform changes
  useEffect(() => {
    if (!selectedPlatformId) {
      setIsPlatformAccessible(null);
      setSelectedPlatformName(null);
      setPlatformOwner(null);
      return;
    }

    // Only show verifying spinner for platforms not yet cached as accessible
    if (localStorage.getItem(accessCacheKey(selectedPlatformId)) !== 'true') {
      setIsPlatformAccessible(null); // "checking…"
    }
    setPlatformOwner(null);

    // Verify in background — updates state whether cached or not
    fetch(`${API_BASE()}/platforms/${selectedPlatformId}/`, {
      headers: authHeaders(),
    })
      .then(res => {
        if (!res.ok) throw Object.assign(new Error('no_access'), { status: res.status });
        return res.json();
      })
      .then(data => {
        localStorage.setItem(accessCacheKey(selectedPlatformId), 'true');
        setIsPlatformAccessible(true);
        setSelectedPlatformName(data.name ?? null);
      })
      .catch(() => {
        localStorage.removeItem(accessCacheKey(selectedPlatformId));
        setIsPlatformAccessible(false);
        setSelectedPlatformName(null);

        fetch(`${API_BASE()}/platforms/${selectedPlatformId}/public-info/`, {
          headers: authHeaders(),
        })
          .then(r => (r.ok ? r.json() : null))
          .then(info => {
            if (info) {
              setSelectedPlatformName(info.name ?? null);
              setPlatformOwner({
                name: info.owner_name ?? info.owner_email ?? 'Unknown',
                email: info.owner_email ?? '',
              });
            }
          })
          .catch(() => {/* silently ignore — owner info is best-effort */});
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
        platformOwner,
        requirePlatform: () => !!selectedPlatformId,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};
