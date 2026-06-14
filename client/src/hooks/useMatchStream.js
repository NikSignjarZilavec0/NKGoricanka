import { useEffect, useRef } from 'react';

/**
 * Subscribe to the live match SSE stream. Calls onMatch(match) for every
 * broadcast update. EventSource auto-reconnects on drop.
 */
export default function useMatchStream(onMatch) {
  const cbRef = useRef(onMatch);
  cbRef.current = onMatch;

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const es = new EventSource('/api/matches/stream');
    const handler = (e) => {
      try {
        cbRef.current?.(JSON.parse(e.data));
      } catch {
        /* ignore malformed event */
      }
    };
    es.addEventListener('match', handler);
    return () => {
      es.removeEventListener('match', handler);
      es.close();
    };
  }, []);
}
