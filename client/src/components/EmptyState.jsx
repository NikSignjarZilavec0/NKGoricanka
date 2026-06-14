import { IconInbox } from './icons.jsx';

/** Minimal empty/placeholder state with a clean line icon. */
export default function EmptyState({ title = 'Ni vsebine', text, icon }) {
  return (
    <div className="empty-wrap">
      <div style={{ color: 'var(--red-300)', marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
        {icon || <IconInbox size={44} stroke={1.5} />}
      </div>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {text && <p className="text-muted">{text}</p>}
    </div>
  );
}
