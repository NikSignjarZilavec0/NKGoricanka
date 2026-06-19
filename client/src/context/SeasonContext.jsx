import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { seasonsApi } from '../api/services.js';

const SeasonContext = createContext(null);

/**
 * Provides the list of available seasons + the current (default) season.
 * Season SELECTION is local to each page (defaults to current on every visit).
 */
export function SeasonProvider({ children }) {
  const [seasons, setSeasons] = useState([]);
  const [current, setCurrent] = useState('');
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await seasonsApi.get();
      setSeasons(data.seasons || []);
      setCurrent(data.current || data.seasons?.[0] || '');
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SeasonContext.Provider value={{ seasons, current, loading, refresh }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error('useSeason must be used within SeasonProvider');
  return ctx;
}

/**
 * Page-local season state that defaults to (and resets to) the current season
 * each time the page mounts / the current season loads.
 */
export function usePageSeason() {
  const { current, seasons } = useSeason();
  const [season, setSeason] = useState(current);
  useEffect(() => { setSeason(current); }, [current]);
  return { season, setSeason, seasons, current };
}
