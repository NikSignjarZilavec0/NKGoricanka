import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { clubApi } from '../api/services.js';

const ClubContext = createContext(null);

export function ClubProvider({ children }) {
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await clubApi.get();
      setClub(data);
    } catch {
      setClub(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Apply the club's primary colour to the document so admin changes take effect
  // live. (The palette is red-only by design — the accent colour is not used.)
  useEffect(() => {
    if (club?.colors?.primary) document.documentElement.style.setProperty('--red', club.colors.primary);
  }, [club]);

  return (
    <ClubContext.Provider value={{ club, loading, refresh }}>{children}</ClubContext.Provider>
  );
}

export function useClub() {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used within ClubProvider');
  return ctx;
}
