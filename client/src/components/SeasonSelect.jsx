/**
 * Controlled, page-local season picker (shown in a page header).
 * Hidden when there is only one season (and no "all" option needed).
 */
export default function SeasonSelect({ value, onChange, seasons = [], includeAll = false, className = '' }) {
  if (!includeAll && (!seasons || seasons.length <= 1)) return null;
  return (
    <label className={`season-pick ${className}`}>
      <span className="season-pick__label">Sezona</span>
      <select className="season-pick__input" value={value} onChange={(e) => onChange(e.target.value)}>
        {includeAll && <option value="">Vse sezone</option>}
        {seasons.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </label>
  );
}
