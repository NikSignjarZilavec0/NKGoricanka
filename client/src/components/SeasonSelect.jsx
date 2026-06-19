import { useSeason } from '../context/SeasonContext.jsx';

/** Season picker shown in the navbar. Hidden if there's only one season. */
export default function SeasonSelect({ className = '' }) {
  const { seasons, season, setSeason } = useSeason();
  if (!seasons || seasons.length <= 1) return null;
  return (
    <label className={`season-select ${className}`}>
      <span className="season-select__label">Sezona</span>
      <select className="season-select__input" value={season} onChange={(e) => setSeason(e.target.value)}>
        {seasons.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </label>
  );
}
