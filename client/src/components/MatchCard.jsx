import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client.js';
import { formatDateTime, STATUS_LABELS } from '../utils/format.js';
import { useClub } from '../context/ClubContext.jsx';
import Logo from './Logo.jsx';
import { IconCalendar, IconMapPin, IconBall } from './icons.jsx';

/** A single fixture/result card. Always shown from our perspective. Clickable → detail. */
export default function MatchCard({ match }) {
  const { club } = useClub();
  const us = club?.shortName || 'Goričanka';
  const live = match.status === 'live';
  const finished = match.status === 'finished';
  const showScore = finished || live;
  const sc = (v) => (v == null ? (live ? 0 : null) : v);

  const home = match.isHome ? us : match.opponent;
  const away = match.isHome ? match.opponent : us;
  const homeScore = sc(match.isHome ? match.score?.ours : match.score?.theirs);
  const awayScore = sc(match.isHome ? match.score?.theirs : match.score?.ours);

  let resultClass = '';
  if (finished && match.score?.ours != null && match.score?.theirs != null) {
    if (match.score.ours > match.score.theirs) resultClass = 'is-win';
    else if (match.score.ours < match.score.theirs) resultClass = 'is-loss';
    else resultClass = 'is-draw';
  }
  if (live) resultClass = 'is-live';

  return (
    <Link to={`/matches/${match._id}`} className={`card match-card ${resultClass}`}>
      <div className="match-card__top">
        <span className="match-card__comp">{match.competition}</span>
        {live ? (
          <span className="badge badge--live">
            <span className="live-dot" />V živo{match.minute != null ? ` ${match.minute}'` : ''}
          </span>
        ) : (
          <span className={`badge ${finished ? 'badge--green' : match.status === 'cancelled' ? 'badge--gray' : ''}`}>
            {STATUS_LABELS[match.status]}
          </span>
        )}
      </div>

      <div className="match-card__teams">
        <Team name={home} logo={match.isHome ? null : match.opponentLogo} isUs={match.isHome} />
        <div className="match-card__center">
          {showScore && homeScore != null ? (
            <div className="match-card__score">{homeScore}<span>:</span>{awayScore}</div>
          ) : (
            <div className="match-card__vs">VS</div>
          )}
          <span className="match-card__venue">{match.isHome ? 'Doma' : 'V gosteh'}</span>
        </div>
        <Team name={away} logo={match.isHome ? match.opponentLogo : null} isUs={!match.isHome} />
      </div>

      <div className="match-card__bottom">
        <span><IconCalendar /> {formatDateTime(match.date)}</span>
        {match.location && <span><IconMapPin /> {match.location}</span>}
      </div>

      {showScore && match.scorers?.length > 0 && (
        <div className="match-card__scorers">
          <IconBall />
          {match.scorers.map((s) => `${s.playerName}${s.minute ? ` ${s.minute}'` : ''}`).join(', ')}
        </div>
      )}
    </Link>
  );
}

function Team({ name, logo, isUs }) {
  return (
    <div className={`match-card__team ${isUs ? 'is-us' : ''}`}>
      <div className="match-card__crest">
        {isUs ? <Logo size={40} /> : logo ? <img src={imageUrl(logo)} alt={name} /> : <div className="match-card__crest-fallback">{name[0]}</div>}
      </div>
      <span className="match-card__team-name">{name}</span>
    </div>
  );
}
