import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { playersApi } from '../api/services.js';
import { imageUrl, errMessage } from '../api/client.js';
import { POSITION_LABELS, formatDate, ageFrom } from '../utils/format.js';
import { usePageSeason } from '../context/SeasonContext.jsx';
import SeasonSelect from '../components/SeasonSelect.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { IconArrowLeft, IconGlobe, IconCalendar, IconRuler } from '../components/icons.jsx';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const { season, setSeason, seasons } = usePageSeason();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    playersApi
      .getById(id, season)
      .then(setPlayer)
      .catch((e) => setError(errMessage(e, 'Igralec ni najden.')))
      .finally(() => setLoading(false));
  }, [id, season]);

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

  const statItems = [
    { label: 'Nastopi', value: stats.appearances ?? 0 },
    { label: 'Goli', value: stats.goals ?? 0 },
    { label: 'Asistence', value: stats.assists ?? 0 },
    { label: 'Rumeni kartoni', value: stats.yellowCards ?? 0 },
    { label: 'Rdeči kartoni', value: stats.redCards ?? 0 },
  ];

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
            <Link to="/players" className="player-hero__back"><IconArrowLeft size={18} /> Kader</Link>
            <span className="badge badge--light">{POSITION_LABELS[player.position]}</span>
            <h1>
              {player.shirtNumber != null && <span className="player-hero__num">{player.shirtNumber}</span>}
              {player.name}
            </h1>
            <div className="player-hero__facts">
              {player.nationality && <span><IconGlobe /> {player.nationality}</span>}
              {player.birthdate && <span><IconCalendar /> {formatDate(player.birthdate)}{age != null ? ` (${age} let)` : ''}</span>}
              {player.heightCm && <span><IconRuler /> {player.heightCm} cm</span>}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid--2 player-detail">
            <div>
              <div className="section-head" style={{ marginBottom: 18 }}>
                <h2 className="section-title" style={{ margin: 0 }}>Statistika{season ? ` ${season}` : ' (vse sezone)'}</h2>
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
              <h2 className="section-title">O igralcu</h2>
              <p>{player.bio || 'Opis igralca bo kmalu dodan.'}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
