import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { playersApi, matchesApi } from '../api/services.js';
import { imageUrl, errMessage } from '../api/client.js';
import { POSITION_LABELS, formatShortDate, ageFrom } from '../utils/format.js';
import { usePageSeason } from '../context/SeasonContext.jsx';
import { useClub } from '../context/ClubContext.jsx';
import SeasonSelect from '../components/SeasonSelect.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { IconArrowLeft, IconGlobe, IconCalendar, IconRuler, IconBall } from '../components/icons.jsx';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const back = location.state?.backTo
    ? { to: location.state.backTo, label: location.state.backLabel || 'Nazaj' }
    : { to: '/players', label: 'Kader' };
  const { season, setSeason, seasons } = usePageSeason();
  const { club } = useClub();
  const [player, setPlayer] = useState(null);
  const [matches, setMatches] = useState([]);
  const [shown, setShown] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const us = club?.shortName || 'Goričanka';

  useEffect(() => {
    setLoading(true);
    playersApi
      .getById(id, season)
      .then(setPlayer)
      .catch((e) => setError(errMessage(e, 'Igralec ni najden.')))
      .finally(() => setLoading(false));
  }, [id, season]);

  useEffect(() => {
    setShown(6);
    matchesApi.list('finished', season).then(setMatches).catch(() => setMatches([]));
  }, [season, id]);

  useDocumentTitle(player?.name || 'Igralec');

  if (loading) return <Loader full />;
  if (error || !player) {
    return (
      <div className="container section text-center">
        <h1>Igralec ni najden</h1>
        <p className="text-muted">{error}</p>
        <Link to="/players" className="btn btn--primary">Nazaj na kader</Link>
      </div>
    );
  }

  const initials = player.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const age = ageFrom(player.birthdate);
  const stats = player.stats || {};
  const pid = String(player._id);

  const statItems = [
    { label: 'Nastopi', value: stats.appearances ?? 0 },
    { label: 'Goli', value: stats.goals ?? 0 },
    { label: 'Asistence', value: stats.assists ?? 0 },
    { label: 'Rumeni kartoni', value: stats.yellowCards ?? 0 },
    { label: 'Rdeči kartoni', value: stats.redCards ?? 0 },
  ];

  // Matches this player took part in (appeared / scored / assisted / carded), newest first.
  const playerMatches = matches
    .filter((m) =>
      (m.appearances || []).some((a) => String(a.playerId) === pid) ||
      (m.scorers || []).some((s) => String(s.playerId) === pid || String(s.assistPlayerId) === pid) ||
      (m.cards || []).some((c) => String(c.playerId) === pid))
    .map((m) => ({
      id: m._id, date: m.date, opponent: m.opponent, isHome: m.isHome, score: m.score,
      g: (m.scorers || []).filter((s) => String(s.playerId) === pid).length,
      a: (m.scorers || []).filter((s) => String(s.assistPlayerId) === pid).length,
      y: (m.cards || []).filter((c) => c.type === 'yellow' && String(c.playerId) === pid).length,
      r: (m.cards || []).filter((c) => c.type === 'red' && String(c.playerId) === pid).length,
      started: (m.appearances || []).find((ap) => String(ap.playerId) === pid)?.started,
    }));

  return (
    <>
      <section className="player-hero">
        <div className="container player-hero__inner">
          <div className="player-hero__photo">
            {player.photo ? (
              <img src={imageUrl(player.photo)} alt={player.name} />
            ) : (
              <div className="player-hero__avatar">{initials}</div>
            )}
          </div>
          <div className="player-hero__info">
            <Link to={back.to} className="player-hero__back"><IconArrowLeft size={18} /> {back.label}</Link>
            <span className="badge badge--light player-hero__pos">{POSITION_LABELS[player.position]}</span>
            <h1>
              {player.shirtNumber != null && <span className="player-hero__num">{player.shirtNumber}</span>}
              {player.name}
            </h1>
            <div className="player-hero__facts">
              {player.nationality && <span><IconGlobe /> {player.nationality}</span>}
              {player.birthdate && <span><IconCalendar /> {formatShortDate(player.birthdate)}{age != null ? ` (${age} let)` : ''}</span>}
              {player.heightCm && <span><IconRuler /> {player.heightCm} cm</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid--2 player-detail">
            <div>
              <h2 className="section-title">Statistika</h2>
              <div className="player-season-pick">
                <SeasonSelect value={season} onChange={setSeason} seasons={seasons} includeAll />
              </div>
              <div className="stat-grid">
                {statItems.map((s) => (
                  <div key={s.label} className="stat-box">
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="section-title">Zadnje tekme</h2>
              {playerMatches.length === 0 ? (
                <p className="text-muted">{player.bio || 'Za izbrano sezono ni zabeleženih nastopov.'}</p>
              ) : (
                <>
                  <ul className="pmatch-list">
                    {playerMatches.slice(0, shown).map((m) => (
                      <li key={m.id}>
                        <Link to={`/matches/${m.id}`} className="pmatch">
                          <span className="pmatch__date">{formatShortDate(m.date)}</span>
                          <span className="pmatch__opp">
                            {m.isHome ? `${us} – ${m.opponent}` : `${m.opponent} – ${us}`}
                            {m.score?.ours != null && (
                              <span className="pmatch__score">{m.isHome ? `${m.score.ours}:${m.score.theirs}` : `${m.score.theirs}:${m.score.ours}`}</span>
                            )}
                          </span>
                          <span className="pmatch__ev">
                            {m.started === false && <span className="pmatch__badge pmatch__badge--sub" title="Z klopi">klop</span>}
                            {Array.from({ length: m.g }).map((_, k) => <span key={`g${k}`} className="pev-icon pev-icon--g" title="Gol"><IconBall size={15} /></span>)}
                            {Array.from({ length: m.a }).map((_, k) => <span key={`a${k}`} className="pev-icon pev-icon--a" title="Asistenca">A</span>)}
                            {Array.from({ length: m.y }).map((_, k) => <span key={`y${k}`} className="kard kard--y" title="Rumeni karton" />)}
                            {Array.from({ length: m.r }).map((_, k) => <span key={`r${k}`} className="kard kard--r" title="Rdeči karton" />)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {shown < playerMatches.length && (
                    <button className="btn btn--outline btn--sm" onClick={() => setShown((s) => s + 6)} style={{ marginTop: 6 }}>
                      Naloži več ({playerMatches.length - shown})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
