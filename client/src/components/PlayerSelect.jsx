/** Native <select> of players (active first, inactive grouped). Value = playerId. */
export default function PlayerSelect({ players, value, onChange, placeholder = '— izberi igralca —', className = 'select', style }) {
  const active = players.filter((p) => p.active !== false);
  const inactive = players.filter((p) => p.active === false);
  return (
    <select className={className} style={style} value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {active.map((p) => (
        <option key={p._id} value={p._id}>{p.shirtNumber != null ? `${p.shirtNumber}. ` : ''}{p.name}</option>
      ))}
      {inactive.length > 0 && (
        <optgroup label="Neaktivni">
          {inactive.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
        </optgroup>
      )}
    </select>
  );
}
