import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client.js';
import { POSITION_LABELS } from '../utils/format.js';

export default function PlayerCard({ player }) {
  const initials = player.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Link to={`/players/${player._id}`} className="card player-card">
      <div className="player-card__media">
        {player.photo ? (
          <img src={imageUrl(player.photo)} alt={player.name} loading="lazy" />
        ) : (
          <div className="player-card__avatar" aria-hidden="true">{initials}</div>
        )}
        {player.shirtNumber != null && (
          <span className="player-card__number">{player.shirtNumber}</span>
        )}
      </div>
      <div className="player-card__body">
        <span className="player-card__pos">{POSITION_LABELS[player.position]}</span>
        <h3 className="player-card__name">{player.name}</h3>
        <div className="player-card__stats">
          <span><strong>{player.stats?.appearances ?? 0}</strong> nast.</span>
          <span><strong>{player.stats?.goals ?? 0}</strong> gol.</span>
          <span><strong>{player.stats?.assists ?? 0}</strong> asist.</span>
        </div>
      </div>
    </Link>
  );
}
