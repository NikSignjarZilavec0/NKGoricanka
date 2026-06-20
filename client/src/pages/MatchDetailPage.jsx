import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchesApi, playersApi } from '../api/services.js';
import { imageUrl, errMessage } from '../api/client.js';
import { formatDateTime, STATUS_LABELS } from '../utils/format.js';
import { useClub } from '../context/ClubContext.jsx';
import useMatchStream from '../hooks/useMatchStream.js';
import Logo from '../components/Logo.jsx';
import LineupPitch from '../components/LineupPitch.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { IconArrowLeft, IconCalendar, IconMapPin, IconBall } from '../components/icons.jsx';

export default function MatchDetailPage() {
  const { id } = useParams();
  const { club } = useClub();
  const [match, setMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    matchesApi.getById(id).then(setMatch).catch((e) => setError(errMessage(e))).finally(() => setLoading(false));
    playersApi.list().then(setPlayers).catch(() => setPlayers([]));
  }, [id]);

  // Resolve a scorer name to a player id (case-insensitive exact name match).
  const playerByName = new Map(players.map((p) => [p.name.trim().toLowerCase(), p._id]));
  const playerIdFor = (name) => playerByName.get((name || '').trim().toLowerCase());
  const nameOfId = (id) => players.find((p) => String(p._id) === String(id))?.name || '';

  // Real-time updates
  useMatchStream((m) => { if (m._id === id) setMatch(m); });

  useDocumentTitle(match ? `${club?.shortName || 'Goričanka'} : ${match.opponent}` : 'Tekma');

  if (loading) return <Loader full />;
  if (error || !match) {
    return (
      <div className="container section text-center">
        <h1>Tekma ni najdena</h1>
        <p className="text-muted">{error}</p>
        <Link to="/matches" className="btn btn--primary">Nazaj na tekme</Link>
      </div>
    );
  }

  const us = club?.shortName || 'Goričanka';
  const live = match.status === 'live';
  const finished = match.status === 'finished';
  const showScore = live || finished;
  const sc = (v) => (v == null ? (live ? 0 : '–') : v);

  const home = { name: match.isHome ? us : match.opponent, isUs: match.isHome, logo: match.isHome ? null : match.opponentLogo };
  const away = { name: match.isHome ? match.opponent : us, isUs: !match.isHome, logo: match.isHome ? match.opponentLogo : null };
  const homeScore = sc(match.isHome ? match.score?.ours : match.score?.theirs);
  const awayScore = sc(match.isHome ? match.score?.theirs : match.score?.ours);

  // Participants table (derive number/captain/keeper + events per player).
  const playerById = new Map(players.map((p) => [String(p._id), p]));
  const lineupById = new Map((match.lineup || []).map((s) => [String(s.playerId), s]));
  const evFor = (pid) => ({
    g: (match.scorers || []).filter((s) => String(s.playerId) === pid).length,
    a: (match.scorers || []).filter((s) => String(s.assistPlayerId) === pid).length,
    y: (match.cards || []).filter((c) => c.type === 'yellow' && String(c.playerId) === pid).length,
    r: (match.cards || []).filter((c) => c.type === 'red' && String(c.playerId) === pid).length,
  });
  const participants = (match.appearances || []).map((ap) => {
    const pid = String(ap.playerId || '');
    const pl = playerById.get(pid);
    const sp = lineupById.get(pid);
    return {
      id: ap.playerId, name: ap.playerName, started: ap.started,
      number: sp?.number ?? pl?.shirtNumber,
      isCaptain: !!sp?.isCaptain, isGoalkeeper: !!sp?.isGoalkeeper || pl?.position === 'goalkeeper',
      ...evFor(pid),
    };
  });
  const xi = participants.filter((p) => p.started);
  const bench = participants.filter((p) => !p.started);

  return (
    <>
      <section className={`match-detail ${live ? 'is-live' : ''}`}>
        <div className="container">
          <Link to="/matches" className="match-detail__back"><IconArrowLeft size={18} /> Vse tekme</Link>
          <div className="match-detail__comp">{match.competition}{match.season ? ` · ${match.season}` : ''}</div>

          <div className="match-detail__board">
            <Side team={home} />
            <div className="match-detail__center">
              {live && (
                <span className="badge badge--live match-detail__livebadge">
                  <span className="live-dot" />V živo{match.minute != null ? ` ${match.minute}'` : ''}
                </span>
              )}
              {showScore ? (
                <div className="match-detail__score">{homeScore}<span>:</span>{awayScore}</div>
              ) : (
                <div className="match-detail__vs">VS</div>
              )}
              {!live && <span className="match-detail__status">{STATUS_LABELS[match.status]}</span>}
            </div>
            <Side team={away} />
          </div>

          <div className="match-detail__meta">
            <span><IconCalendar /> {formatDateTime(match.date)}</span>
            {match.location && <span><IconMapPin /> {match.location}</span>}
            <span>{match.isHome ? 'Domača tekma' : 'Gostujoča tekma'}</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container match-detail__below">
          <div>
            <h2 className="section-title">Strelci</h2>
            {match.scorers?.length > 0 ? (
              <ul className="scorer-list">
                {match.scorers.map((s, i) => {
                  const pid = s.playerId || playerIdFor(s.playerName);
                  const inner = (
                    <>
                      <IconBall />
                      <strong>{s.playerName}</strong>
                      {(s.assistName || s.assistPlayerId) && (
                        <span className="scorer-list__assist">asist. {s.assistName || nameOfId(s.assistPlayerId)}</span>
                      )}
                      {s.minute ? <span className="scorer-list__min">{s.minute}'</span> : null}
                      {pid && <span className="scorer-list__go" aria-hidden="true">›</span>}
                    </>
                  );
                  return (
                    <li key={i}>
                      {pid
                        ? <Link to={`/players/${pid}`} state={{ backTo: `/matches/${id}`, backLabel: 'Tekma' }} className="scorer-list__box scorer-list__box--link">{inner}</Link>
                        : <span className="scorer-list__box">{inner}</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted">Ni vpisanih strelcev.</p>
            )}

            {match.cards?.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: 32 }}>Kartoni</h2>
                <ul className="scorer-list">
                  {match.cards.map((c, i) => {
                    const pid = c.playerId || playerIdFor(c.playerName);
                    const inner = (
                      <>
                        <span className={`kard ${c.type === 'red' ? 'kard--r' : 'kard--y'}`} />
                        <strong>{c.playerName}</strong>
                        {c.minute ? <span className="scorer-list__min">{c.minute}'</span> : null}
                        {pid && <span className="scorer-list__go" aria-hidden="true">›</span>}
                      </>
                    );
                    return (
                      <li key={i}>
                        {pid
                          ? <Link to={`/players/${pid}`} state={{ backTo: `/matches/${id}`, backLabel: 'Tekma' }} className="scorer-list__box scorer-list__box--link">{inner}</Link>
                          : <span className="scorer-list__box">{inner}</span>}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>

      {match.lineup?.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <h2 className="section-title">Postava — {us}</h2>
            <LineupPitch lineup={match.lineup} scorers={match.scorers || []} cards={match.cards || []} backTo={`/matches/${id}`} />
          </div>
        </section>
      )}

      {(xi.length > 0 || bench.length > 0) && (
        <section className="section section--tight">
          <div className="container">
            <h2 className="section-title">Nastopili — {us}</h2>
            {xi.length > 0 && <RosterTable title="Prva postava" rows={xi} backTo={`/matches/${id}`} />}
            {bench.length > 0 && <RosterTable title="Klop" rows={bench} backTo={`/matches/${id}`} />}
            {match.substitutions?.length > 0 && (
              <div className="roster-block">
                <h3 className="roster-sub">Zamenjave</h3>
                <ul className="subs">
                  {match.substitutions.map((s, i) => (
                    <li key={i} className="subs__item">
                      <span className="subs__min">{s.minute ? `${s.minute}'` : ''}</span>
                      <span className="subs__in">▲ {s.onName}</span>
                      <span className="subs__out">▼ {s.offName}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function RosterTable({ title, rows, backTo }) {
  return (
    <div className="roster-block">
      <h3 className="roster-sub">{title}</h3>
      <div className="card squad-wrap">
        <table className="squad roster-table">
          <thead>
            <tr>
              <th className="squad__rank">#</th>
              <th className="squad__player">Igralec</th>
              <th title="Goli">Goli</th>
              <th title="Asistence">Asist.</th>
              <th className="squad__card" title="Rumeni kartoni"><span className="kard kard--y" /></th>
              <th className="squad__card" title="Rdeči kartoni"><span className="kard kard--r" /></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || r.name}>
                <td className="squad__rank">{r.number ?? '–'}</td>
                <td className="squad__player">
                  <div className="squad__cell">
                    {r.id ? <Link to={`/players/${r.id}`} state={backTo ? { backTo, backLabel: 'Tekma' } : undefined} className="roster-name">{r.name}</Link> : <span className="roster-name">{r.name}</span>}
                    {r.isCaptain && <span className="roster-badge roster-badge--c" title="Kapetan">C</span>}
                    {r.isGoalkeeper && <span className="roster-badge roster-badge--gk" title="Vratar">GK</span>}
                  </div>
                </td>
                <td>{r.g || 0}</td>
                <td>{r.a || 0}</td>
                <td className="squad__card">{r.y || 0}</td>
                <td className="squad__card">{r.r || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Side({ team }) {
  return (
    <div className={`match-detail__side ${team.isUs ? 'is-us' : ''}`}>
      <div className="match-detail__crest">
        {team.isUs ? <Logo size={72} /> : team.logo ? <img src={imageUrl(team.logo)} alt={team.name} /> : <div className="match-detail__crest-fallback">{team.name[0]}</div>}
      </div>
      <span className="match-detail__name">{team.name}</span>
    </div>
  );
}
