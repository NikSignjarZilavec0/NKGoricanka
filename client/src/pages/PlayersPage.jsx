import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playersApi } from '../api/services.js';
import { POSITION_GROUPS, POSITION_LABELS } from '../utils/format.js';
import { imageUrl } from '../api/client.js';
import { usePageSeason } from '../context/SeasonContext.jsx';
import SeasonSelect from '../components/SeasonSelect.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { IconBall } from '../components/icons.jsx';

const initialsOf = (name) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

/** Compact event icons for the squad list (icon + count when > 1). */
function KaderIcons({ s = {} }) {
  return (
    <span className="kader-icons">
      {s.goals > 0 && <span className="kader-ic" title="Goli"><IconBall size={16} />{s.goals > 1 ? s.goals : ''}</span>}
      {s.assists > 0 && <span className="kader-ic kader-ic--a" title="Asistence"><span className="kader-ic__a">A</span>{s.assists > 1 ? s.assists : ''}</span>}
      {s.yellowCards > 0 && <span className="kader-ic" title="Rumeni kartoni"><span className="kard kard--y" />{s.yellowCards > 1 ? s.yellowCards : ''}</span>}
      {s.redCards > 0 && <span className="kader-ic" title="Rdeči kartoni"><span className="kard kard--r" />{s.redCards > 1 ? s.redCards : ''}</span>}
    </span>
  );
}

// Sortable stat categories (label + key in player.stats).
const SORTS = [
  { key: 'appearances', label: 'Nastopi' },
  { key: 'goals', label: 'Goli' },
  { key: 'assists', label: 'Asistence' },
  { key: 'yellowCards', label: 'Rumeni kartoni' },
  { key: 'redCards', label: 'Rdeči kartoni' },
];

export default function PlayersPage() {
  const { season, setSeason, seasons } = usePageSeason();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(null); // null = grouped by position; otherwise a stat key
  useDocumentTitle('Igralski kader');

  useEffect(() => {
    setLoading(true);
    playersApi.list(season).then(setPlayers).catch(() => setPlayers([])).finally(() => setLoading(false));
  }, [season]);

  // Public squad shows active players only.
  const visible = players.filter((p) => p.active !== false);

  const go = (id) => navigate(`/players/${id}`);

  const renderRows = (list, highlight) =>
    list.map((p, i) => {
      const s = p.stats || {};
      return (
        <tr
          key={p._id}
          className="squad__row"
          role="link"
          tabIndex={0}
          onClick={() => go(p._id)}
          onKeyDown={(e) => { if (e.key === 'Enter') go(p._id); }}
        >
          {highlight && <td className="squad__rank">{i + 1}</td>}
          <td className="squad__player">
            <div className="squad__cell">
              <span className="squad__avatar">
                {p.photo
                  ? <img src={imageUrl(p.photo)} alt="" loading="lazy" />
                  : <span className="squad__avatar-fb">{initialsOf(p.name)}</span>}
              </span>
              {p.shirtNumber != null && <span className="squad__num">{p.shirtNumber}</span>}
              <span className="squad__name">{p.name}</span>
              {highlight && <span className="squad__pos-tag">{POSITION_LABELS[p.position]}</span>}
            </div>
          </td>
          <td className={highlight === 'appearances' ? 'is-sorted' : ''}>{s.appearances ?? 0}</td>
          <td className={highlight === 'goals' ? 'is-sorted' : ''}>{s.goals ?? 0}</td>
          <td className={highlight === 'assists' ? 'is-sorted' : ''}>{s.assists ?? 0}</td>
          <td className={`squad__card ${highlight === 'yellowCards' ? 'is-sorted' : ''}`}>{s.yellowCards ?? 0}</td>
          <td className={`squad__card ${highlight === 'redCards' ? 'is-sorted' : ''}`}>{s.redCards ?? 0}</td>
        </tr>
      );
    });

  const headRow = (rankCol) => (
    <tr>
      {rankCol && <th className="squad__rank">#</th>}
      <th className="squad__player">Igralec</th>
      <th title="Nastopi">Nastopi</th>
      <th title="Goli">Goli</th>
      <th title="Asistence">Asist.</th>
      <th className="squad__card" title="Rumeni kartoni"><span className="kard kard--y" /></th>
      <th className="squad__card" title="Rdeči kartoni"><span className="kard kard--r" /></th>
    </tr>
  );

  return (
    <>
      <PageHeader title="Igralski kader">
        <SeasonSelect value={season} onChange={setSeason} seasons={seasons} includeAll />
      </PageHeader>
      <section className="section">
        <div className="container">
          {loading ? (
            <Loader />
          ) : visible.length === 0 ? (
            <EmptyState title="Kader še ni objavljen" text="Igralci bodo kmalu dodani." />
          ) : (
            <>
              <div className="squad-sort">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    className={`squad-sort__btn ${sortBy === s.key ? 'is-active' : ''}`}
                    onClick={() => setSortBy((cur) => (cur === s.key ? null : s.key))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {sortBy ? (
                <div className="card squad-wrap">
                  <table className="squad squad--ranked">
                    <thead>{headRow(true)}</thead>
                    <tbody>
                      {renderRows(
                        [...visible].sort((a, b) => (b.stats?.[sortBy] ?? 0) - (a.stats?.[sortBy] ?? 0)),
                        sortBy
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                POSITION_GROUPS.map((group) => {
                  const list = visible.filter((p) => p.position === group.key);
                  if (list.length === 0) return null;
                  return (
                    <div key={group.key} className="squad-group">
                      <h2 className="section-title squad-group__title">{group.label}</h2>
                      <div className="card kader-list">
                        {list.map((p) => (
                          <div
                            key={p._id}
                            className="kader-row"
                            role="link"
                            tabIndex={0}
                            onClick={() => go(p._id)}
                            onKeyDown={(e) => { if (e.key === 'Enter') go(p._id); }}
                          >
                            <span className="squad__avatar">
                              {p.photo
                                ? <img src={imageUrl(p.photo)} alt="" loading="lazy" />
                                : <span className="squad__avatar-fb">{initialsOf(p.name)}</span>}
                            </span>
                            {p.shirtNumber != null && <span className="squad__num">{p.shirtNumber}</span>}
                            <span className="kader-row__name">{p.name}</span>
                            <KaderIcons s={p.stats} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
