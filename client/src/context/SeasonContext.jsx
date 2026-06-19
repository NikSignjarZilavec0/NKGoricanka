import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { seasonsApi } from '../api/services.js';

const SeasonContext = createContext(null);

export function SeasonProvider({ children }) {
  const [seasons, setSeasons] = useState([]);
  const [current, setCurrent] = useState('');
  const [season, setSeason] = useState(''); // selected season
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await seasonsApi.get();
      setSeasons(data.seasons || []);
      setCurrent(data.current || '');
      // keep the user's choice if still valid, else default to current
      setSeason((prev) => (prev && data.seasons?.includes(prev) ? prev : data.current || data.seasons?.[0] || ''));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SeasonContext.Provider value={{ seasons, current, season, setSeason, loading, refresh }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider');
  return ctx;
}
