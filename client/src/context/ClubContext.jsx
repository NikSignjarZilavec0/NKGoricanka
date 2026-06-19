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

  // Apply the club's primary colour + favicon (use the uploaded grb if set) so
  // admin changes take effect live.
  useEffect(() => {
    if (club?.colors?.primary) document.documentElement.style.setProperty('--red', club.colors.primary);
    const icon = document.querySelector("link[rel='icon']");
    if (icon) {
      const href = club?.logo
        ? (/^https?:\/\//i.test(club.logo) ? club.logo : (club.logo.startsWith('/') ? club.logo : `/${club.logo}`))
        : '/logo.svg';
      icon.setAttribute('href', href);
      icon.setAttribute('type', href.endsWith('.svg') ? 'image/svg+xml' : 'image/png');
    }
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
