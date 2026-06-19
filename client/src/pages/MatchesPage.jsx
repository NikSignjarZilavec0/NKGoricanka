import { useEffect, useState } from 'react';
import { matchesApi } from '../api/services.js';
import MatchCard from '../components/MatchCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useMatchStream from '../hooks/useMatchStream.js';
import { usePageSeason } from '../context/SeasonContext.jsx';
import SeasonSelect from '../components/SeasonSelect.jsx';

const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date);
const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

export default function MatchesPage() {
  const { season, setSeason, seasons } = usePageSeason();
  const [tab, setTab] = useState('upcoming');
  const [data, setData] = useState({ live: null, upcoming: null, finished: null });
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Tekme');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      matchesApi.list('live', season).catch(() => []),
      matchesApi.list('upcoming', season).catch(() => []),
      matchesApi.list('finished', season).catch(() => []),
    ])
      .then(([live, upcoming, finished]) => setData({ live, upcoming, finished }))
      .finally(() => setLoading(false));
  }, [season]);

  // Real-time: merge any updated match into the correct bucket.
  useMatchStream((m) => {
    setData((d) => {
      if (!d.live) return d;
      const strip = (arr) => arr.filter((x) => x._id !== m._id);
      const next = { live: strip(d.live), upcoming: strip(d.upcoming), finished: strip(d.finished) };
      if (m.status === 'live') next.live = [m, ...next.live];
      else if (m.status === 'upcoming') next.upcoming = [...next.upcoming, m].sort(byDateAsc);
      else if (m.status === 'finished') next.finished = [m, ...next.finished].sort(byDateDesc);
      return next;
    });
  });

  const list = data[tab] || [];

  return (
    <>
      <PageHeader title="Tekme">
        <SeasonSelect value={season} onChange={setSeason} seasons={seasons} includeAll />
      </PageHeader>
      <section className="section">
        <div className="container">
          {loading ? (
            <Loader />
          ) : (
            <>
              {data.live?.length > 0 && (
                <div className="matches-live">
                  <div className="section-head">
                    <div>
                      <div className="eyebrow eyebrow--live"><span className="live-dot" /> Trenutno v živo</div>
                      <h2 className="section-title">Tekma v teku</h2>
                    </div>
                  </div>
                  <div className="grid grid--2">
                    {data.live.map((m) => <MatchCard key={m._id} match={m} />)}
                  </div>
                </div>
              )}

              <div className="tabs">
                <button className={`tab ${tab === 'upcoming' ? 'is-active' : ''}`} onClick={() => setTab('upcoming')}>
                  Prihajajoče {data.upcoming ? `(${data.upcoming.length})` : ''}
                </button>
                <button className={`tab ${tab === 'finished' ? 'is-active' : ''}`} onClick={() => setTab('finished')}>
                  Odigrane {data.finished ? `(${data.finished.length})` : ''}
                </button>
              </div>

              {list.length === 0 ? (
                <EmptyState
                  title={tab === 'upcoming' ? 'Ni prihajajočih tekem' : 'Ni odigranih tekem'}
                  text="Podatki bodo kmalu na voljo."
                />
              ) : (
                <div className="grid grid--2 matches-grid">
                  {list.map((m) => <MatchCard key={m._id} match={m} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
