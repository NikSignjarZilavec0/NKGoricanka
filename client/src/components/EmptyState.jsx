/** Friendly empty/placeholder state. */
export default function EmptyState({ title = 'Ni vsebine', text, icon = '📭' }) {
  return (
    <div className="empty-wrap">
      <div style={{ fontSize: '2.6rem', marginBottom: 8 }}>{icon}</div>
      <h3 style={{ marginBottom: 6 }}>{title}</h3>
      {text && <p className="text-muted">{text}</p>}
    </div>
  );
}
