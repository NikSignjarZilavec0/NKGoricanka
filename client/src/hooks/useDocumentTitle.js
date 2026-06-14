import { useEffect } from 'react';

/**
 * Update document.title on client-side navigation. (Initial load + crawler
 * meta is handled server-side by the SEO middleware.)
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return;
    const prev = document.title;
    document.title = title.includes('Goričanka') ? title : `${title} — NK Goričanka`;
    return () => {
      document.title = prev;
    };
  }, [title]);
}
