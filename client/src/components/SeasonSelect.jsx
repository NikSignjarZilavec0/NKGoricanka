import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from './icons.jsx';

/**
 * Controlled, page-local season picker (shown in a page header).
 * Custom popover (not a native <select>) so the open list matches the theme.
 * Hidden when there is only one season (and no "all" option needed).
 */
export default function SeasonSelect({ value, onChange, seasons = [], includeAll = false, alwaysShow = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!alwaysShow && !includeAll && (!seasons || seasons.length <= 1)) return null;

  const options = includeAll
    ? [{ v: '', label: 'Vse sezone' }, ...seasons.map((s) => ({ v: s, label: s }))]
    : seasons.map((s) => ({ v: s, label: s }));
  const currentLabel = options.find((o) => o.v === value)?.label || (includeAll ? 'Vse sezone' : value);

  const pick = (v) => { onChange(v); setOpen(false); };

  return (
    <div className={`season-pick ${className}`} ref={ref}>
      <span className="season-pick__label">Sezona</span>
      <div className="season-pick__box">
        <button
          type="button"
          className="season-pick__btn"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span>{currentLabel}</span>
          <IconChevronDown size={16} className={`season-pick__chev ${open ? 'is-open' : ''}`} />
        </button>
        {open && (
          <ul className="season-pick__menu" role="listbox">
            {options.map((o) => (
              <li key={o.v || 'all'}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.v === value}
                  className={`season-pick__opt ${o.v === value ? 'is-active' : ''}`}
                  onClick={() => pick(o.v)}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
