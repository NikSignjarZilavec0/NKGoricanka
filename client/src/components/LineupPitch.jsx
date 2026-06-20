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

const sameId = (a, b) => a && b && String(a) === String(b);

/** A spot's match events, derived from the match scorers + cards (by playerId, name fallback). */
export function eventsForSpot(spot, scorers = [], cards = []) {
  const mine = (x, getId, getName) =>
    spot.playerId ? sameId(getId(x), spot.playerId)
      : (getName(x) || '').trim().toLowerCase() === (spot.name || '').trim().toLowerCase();
  const goals = scorers.filter((s) => mine(s, (x) => x.playerId, (x) => x.playerName)).length;
  const assists = spot.playerId ? scorers.filter((s) => sameId(s.assistPlayerId, spot.playerId)).length : 0;
  const yellow = cards.filter((c) => c.type === 'yellow' && mine(c, (x) => x.playerId, (x) => x.playerName)).length;
  const red = cards.filter((c) => c.type === 'red' && mine(c, (x) => x.playerId, (x) => x.playerName)).length;
  return { goals, assists, yellow, red };
}

/** A football pitch with placed players. Read-only display. */
export default function LineupPitch({ lineup = [], scorers = [], cards = [], backTo, className = '' }) {
  return (
    <div className={`pitch ${className}`}>
      <PitchLines />
      {lineup.map((s, i) => {
        const ev = eventsForSpot(s, scorers, cards);
        const inner = (
          <>
            {(ev.goals > 0 || ev.assists > 0 || ev.yellow > 0 || ev.red > 0) && (
              <div className="pitch-player__events">
                {ev.goals > 0 && <span className="pev pev--goal" title="Goli"><IconBall size={12} />{ev.goals > 1 ? `×${ev.goals}` : ''}</span>}
                {ev.assists > 0 && <span className="pev pev--assist" title="Asistence">A{ev.assists > 1 ? `×${ev.assists}` : ''}</span>}
                {ev.yellow > 0 && <span className="kard kard--y" title="Rumeni karton" />}
                {ev.red > 0 && <span className="kard kard--r" title="Rdeči karton" />}
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
          <Link key={i} to={`/players/${s.playerId}`} state={backTo ? { backTo, backLabel: 'Tekma' } : undefined} className="pitch-player pitch-player--link" style={style}>{inner}</Link>
        ) : (
          <div key={i} className="pitch-player" style={style}>{inner}</div>
        );
      })}
    </div>
  );
}
