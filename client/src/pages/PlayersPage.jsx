import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playersApi } from '../api/services.js';
import { POSITION_GROUPS } from '../utils/format.js';
import { imageUrl } from '../api/client.js';
import { usePageSeason } from '../context/SeasonContext.jsx';
import SeasonSelect from '../components/SeasonSelect.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const initialsOf = (name) =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

export default function PlayersPage() {
  const { season, setSeason, seasons } = usePageSeason();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Igralski kader');

  useEffect(() => {
    setLoading(true);
    playersApi.list(season).then(setPlayers).catch(() => setPlayers([])).finally(() => setLoading(false));
  }, [season]);

  return (
    <>
      <PageHeader title="Igralski kader">
        <SeasonSelect value={season} onChange={setSeason} seasons={seasons} />
      </PageHeader>
      <section className="section">
        <div className="container">
          {loading ? (
            <Loader />
          ) : players.length === 0 ? (
            <EmptyState title="Kader še ni objavljen" text="Igralci bodo kmalu dodani." />
          ) : (
            POSITION_GROUPS.map((group) => {
              const list = players.filter((p) => p.position === group.key);
              if (list.length === 0) return null;
              return (
                <div key={group.key} className="squad-group">
                  <h2 className="section-title squad-group__title">{group.label}</h2>
                  <div className="card squad-wrap">
                    <table className="squad">
                      <thead>
                        <tr>
                          <th className="squad__player">Igralec</th>
                          <th title="Nastopi">Nastopi</th>
                          <th title="Goli">Goli</th>
                          <th title="Asistence">Asist.</th>
                          <th className="squad__card" title="Rumeni kartoni"><span className="kard kard--y" /></th>
                          <th className="squad__card" title="Rdeči kartoni"><span className="kard kard--r" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((p) => {
                          const s = p.stats || {};
                          const go = () => navigate(`/players/${p._id}`);
                          return (
                            <tr
                              key={p._id}
                              className="squad__row"
                              role="link"
                              tabIndex={0}
                              onClick={go}
                              onKeyDown={(e) => { if (e.key === 'Enter') go(); }}
                            >
                              <td className="squad__player">
                                <span className="squad__avatar">
                                  {p.photo
                                    ? <img src={imageUrl(p.photo)} alt="" loading="lazy" />
                                    : <span className="squad__avatar-fb">{initialsOf(p.name)}</span>}
                                </span>
                                {p.shirtNumber != null && <span className="squad__num">{p.shirtNumber}</span>}
                                <span className="squad__name">{p.name}</span>
                              </td>
                              <td>{s.appearances ?? 0}</td>
                              <td>{s.goals ?? 0}</td>
                              <td>{s.assists ?? 0}</td>
                              <td className="squad__card">{s.yellowCards ?? 0}</td>
                              <td className="squad__card">{s.redCards ?? 0}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
