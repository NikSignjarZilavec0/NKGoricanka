import { useEffect } from 'react';

/** Accessible-ish modal dialog used by admin CRUD forms. */
export default function Modal({ open, title, onClose, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" onMouseDown={onClose}>
      <div className={`modal__dialog ${wide ? 'modal__dialog--wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Zapri">✕</button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
