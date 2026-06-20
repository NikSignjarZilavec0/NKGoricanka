import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client.js';
import { IconBall } from './icons.jsx';

const initialsOf = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** Pitch markings (shared by the read-only pitch and the editor). */
export function PitchLines() {
  return (
    <div className="pitch__lines" aria-hidden="true">
      <span className="pitch__circle" />
      <span className="pitch__spot" />
      <span className="pitch__box pitch__box--top" />
      <span className="pitch__box pitch__box--bottom" />
      <span className="pitch__halfway" />
    </div>
  );
}

/** Goals for a lineup spot, derived from the match scorers (matched by name). */
export function goalsForSpot(spot, scorers = []) {
  const n = (spot.name || '').trim().toLowerCase();
  if (!n) return 0;
  return scorers.filter((s) => (s.playerName || '').trim().toLowerCase() === n).length;
}

/** A football pitch with placed players. Read-only display. */
export default function LineupPitch({ lineup = [], scorers = [], className = '' }) {
  return (
    <div className={`pitch ${className}`}>
      <PitchLines />
      {lineup.map((s, i) => {
        const goals = goalsForSpot(s, scorers);
        const inner = (
          <>
            {(goals > 0 || s.assists > 0 || s.yellowCards > 0 || s.redCards > 0) && (
              <div className="pitch-player__events">
                {goals > 0 && <span className="pev pev--goal" title="Goli"><IconBall size={12} />{goals > 1 ? `×${goals}` : ''}</span>}
                {s.assists > 0 && <span className="pev pev--assist" title="Asistence">A{s.assists > 1 ? `×${s.assists}` : ''}</span>}
                {s.yellowCards > 0 && <span className="kard kard--y" title="Rumeni karton" />}
                {s.redCards > 0 && <span className="kard kard--r" title="Rdeči karton" />}
              </div>
            )}
            <div className={`pitch-player__disc ${s.isGoalkeeper ? 'is-gk' : ''}`}>
              {s.photo ? <img src={imageUrl(s.photo)} alt="" /> : <span className="pitch-player__init">{initialsOf(s.name)}</span>}
              {s.isGoalkeeper && <span className="pitch-player__gk" title="Vratar">GK</span>}
              {s.isCaptain && <span className="pitch-player__cap" title="Kapetan">C</span>}
              {s.number != null && s.number !== '' && <span className="pitch-player__num">{s.number}</span>}
            </div>
            <span className="pitch-player__name">{s.name}</span>
          </>
        );
        const style = { left: `${s.x}%`, top: `${s.y}%` };
        return s.playerId ? (
          <Link key={i} to={`/players/${s.playerId}`} className="pitch-player pitch-player--link" style={style}>{inner}</Link>
        ) : (
          <div key={i} className="pitch-player" style={style}>{inner}</div>
        );
      })}
    </div>
  );
}
