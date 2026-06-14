import { imageUrl } from '../api/client.js';
import { formatDateTime, STATUS_LABELS } from '../utils/format.js';
import { useClub } from '../context/ClubContext.jsx';
import Logo from './Logo.jsx';

/** A single fixture/result row. Always shows the match from our perspective. */
export default function MatchCard({ match }) {
  const { club } = useClub();
  const us = club?.shortName || 'Goričanka';
  const finished = match.status === 'finished';
  const hasScore = match.score && match.score.ours != null && match.score.theirs != null;

  const home = match.isHome ? us : match.opponent;
  const away = match.isHome ? match.opponent : us;
  const homeScore = match.isHome ? match.score?.ours : match.score?.theirs;
  const awayScore = match.isHome ? match.score?.theirs : match.score?.ours;

  let resultClass = '';
  if (finished && hasScore) {
    if (match.score.ours > match.score.theirs) resultClass = 'is-win';
    else if (match.score.ours < match.score.theirs) resultClass = 'is-loss';
    else resultClass = 'is-draw';
  }

  const statusBadge = {
    upcoming: 'badge--gold',
    finished: 'badge--green',
    cancelled: 'badge--gray',
  }[match.status];

  return (
    <div className={`card match-card ${resultClass}`}>
      <div className="match-card__top">
        <span className="match-card__comp">{match.competition}</span>
        <span className={`badge ${statusBadge}`}>{STATUS_LABELS[match.status]}</span>
      </div>

      <div className="match-card__teams">
        <Team name={home} logo={match.isHome ? null : match.opponentLogo} isUs={match.isHome} />
        <div className="match-card__center">
          {finished && hasScore ? (
            <div className="match-card__score">{homeScore}<span>:</span>{awayScore}</div>
          ) : (
            <div className="match-card__vs">VS</div>
          )}
          <span className="match-card__venue">{match.isHome ? 'Doma' : 'V gosteh'}</span>
        </div>
        <Team name={away} logo={match.isHome ? match.opponentLogo : null} isUs={!match.isHome} />
      </div>

      <div className="match-card__bottom">
        <span>🗓 {formatDateTime(match.date)}</span>
        {match.location && <span>📍 {match.location}</span>}
      </div>

      {finished && match.scorers?.length > 0 && (
        <div className="match-card__scorers">
          ⚽ {match.scorers.map((s) => `${s.playerName}${s.minute ? ` ${s.minute}'` : ''}`).join(', ')}
        </div>
      )}
    </div>
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
