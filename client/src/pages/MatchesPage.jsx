import { useEffect, useState } from 'react';
import { matchesApi } from '../api/services.js';
import MatchCard from '../components/MatchCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function MatchesPage() {
  const [tab, setTab] = useState('upcoming');
  const [data, setData] = useState({ upcoming: null, finished: null });
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Tekme');

  useEffect(() => {
    Promise.all([
      matchesApi.list('upcoming').catch(() => []),
      matchesApi.list('finished').catch(() => []),
    ])
      .then(([upcoming, finished]) => setData({ upcoming, finished }))
      .finally(() => setLoading(false));
  }, []);

  const list = data[tab] || [];

  return (
    <>
      <PageHeader title="Tekme" subtitle="Razpored prihajajočih tekem in rezultati odigranih" />
      <section className="section">
        <div className="container">
          <div className="tabs">
            <button className={`tab ${tab === 'upcoming' ? 'is-active' : ''}`} onClick={() => setTab('upcoming')}>
              Prihajajoče {data.upcoming ? `(${data.upcoming.length})` : ''}
            </button>
            <button className={`tab ${tab === 'finished' ? 'is-active' : ''}`} onClick={() => setTab('finished')}>
              Odigrane {data.finished ? `(${data.finished.length})` : ''}
            </button>
          </div>

          {loading ? (
            <Loader />
          ) : list.length === 0 ? (
            <EmptyState
              title={tab === 'upcoming' ? 'Ni prihajajočih tekem' : 'Ni odigranih tekem'}
              text="Podatki bodo kmalu na voljo."
            />
          ) : (
            <div className="grid grid--2 matches-grid">
              {list.map((m) => <MatchCard key={m._id} match={m} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
