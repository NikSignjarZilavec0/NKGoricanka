import { useEffect, useState } from 'react';
import { standingsApi } from '../api/services.js';
import { imageUrl } from '../api/client.js';
import { usePageSeason } from '../context/SeasonContext.jsx';
import { useClub } from '../context/ClubContext.jsx';
import SeasonSelect from '../components/SeasonSelect.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

function trendMark(t) {
  if (t === 'up') return <span className="trend trend--up">▲</span>;
  if (t === 'down') return <span className="trend trend--down">▼</span>;
  return <span className="trend trend--same">●</span>;
}

export default function StandingsPage() {
  const { season, setSeason, seasons } = usePageSeason();
  const { club } = useClub();
  const [rows, setRows] = useState(null);
  useDocumentTitle('Lestvica');
  const us = club?.shortName || 'Goričanka';

  useEffect(() => {
    setRows(null);
    standingsApi.list(season).then(setRows).catch(() => setRows([]));
  }, [season]);

  // group rows preserving API order (groupOrder, then points)
  const groups = [];
  if (rows) {
    const map = new Map();
    rows.forEach((r) => {
      const key = r.group || '';
      if (!map.has(key)) { map.set(key, []); groups.push({ label: key, rows: map.get(key) }); }
      map.get(key).push(r);
    });
  }

  return (
    <>
      <PageHeader title="Lestvica" subtitle={season ? `Sezona ${season}` : 'Razvrstitev ekip'}>
        <SeasonSelect value={season} onChange={setSeason} seasons={seasons} />
      </PageHeader>
      <section className="section">
        <div className="container">
          {!rows ? (
            <Loader />
          ) : rows.length === 0 ? (
            <EmptyState title="Lestvica ni na voljo" text="Podatki bodo kmalu dodani." />
          ) : (
            groups.map((g) => (
              <div key={g.label} className="standings-group">
                {g.label && <h2 className="section-title standings-group__title">{g.label}</h2>}
                <div className="card standings-wrap">
                  <table className="standings">
                    <thead>
                      <tr>
                        <th className="standings__pos">#</th>
                        <th className="standings__team">Ekipa</th>
                        <th>T</th>
                        <th className="col-hide-sm">Z</th><th className="col-hide-sm">N</th><th className="col-hide-sm">P</th>
                        <th className="standings__gd">Goli</th>
                        <th className="standings__pts">Tč.</th>
                        <th className="standings__tr"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((r, i) => {
                        const ours = r.team.toLowerCase().includes(us.toLowerCase());
                        return (
                          <tr key={r._id} className={ours ? 'is-us' : ''}>
                            <td className="standings__pos">{i + 1}</td>
                            <td className="standings__team">
                              <span className="standings__crest">
                                {r.teamLogo ? <img src={imageUrl(r.teamLogo)} alt="" /> : <span className="standings__crest-fallback">{r.team[0]}</span>}
                              </span>
                              {r.team}
                            </td>
                            <td>{r.played}</td>
                            <td className="col-hide-sm">{r.won}</td><td className="col-hide-sm">{r.drawn}</td><td className="col-hide-sm">{r.lost}</td>
                            <td className="standings__gd">{r.goalsFor}:{r.goalsAgainst}</td>
                            <td className="standings__pts">{r.points}</td>
                            <td className="standings__tr">{trendMark(r.trend)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
          <p className="text-muted standings-legend">T = tekme · Z = zmage · N = neodločeno · P = porazi · Tč. = točke</p>
        </div>
      </section>
    </>
  );
}
