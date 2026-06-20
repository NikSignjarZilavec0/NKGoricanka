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
                  const pid = playerIdFor(s.playerName);
                  const inner = (
                    <>
                      <IconBall />
                      <strong>{s.playerName}</strong>
                      {s.minute ? <span className="scorer-list__min">{s.minute}'</span> : null}
                      {pid && <span className="scorer-list__go" aria-hidden="true">›</span>}
                    </>
                  );
                  return (
                    <li key={i}>
                      {pid
                        ? <Link to={`/players/${pid}`} className="scorer-list__box scorer-list__box--link">{inner}</Link>
                        : <span className="scorer-list__box">{inner}</span>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-muted">Ni vpisanih strelcev.</p>
            )}
          </div>
        </div>
      </section>

      {match.lineup?.length > 0 && (
        <section className="section section--tight">
          <div className="container">
            <h2 className="section-title">Postava — {us}</h2>
            <LineupPitch lineup={match.lineup} scorers={match.scorers || []} />
          </div>
        </section>
      )}
    </>
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
