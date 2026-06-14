import { useEffect, useState } from 'react';
import { playersApi } from '../api/services.js';
import { POSITION_GROUPS } from '../utils/format.js';
import PlayerCard from '../components/PlayerCard.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function PlayersPage() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Igralski kader');

  useEffect(() => {
    playersApi.list().then(setPlayers).catch(() => setPlayers([])).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Igralski kader" subtitle="Naša ekipa po pozicijah" />
      <section className="section">
        <div className="container">
          {loading ? (
            <Loader />
          ) : players.length === 0 ? (
            <EmptyState title="Kader še ni objavljen" text="Igralci bodo kmalu dodani." icon="👕" />
          ) : (
            POSITION_GROUPS.map((group) => {
              const list = players.filter((p) => p.position === group.key);
              if (list.length === 0) return null;
              return (
                <div key={group.key} className="player-group">
                  <h2 className="section-title player-group__title">{group.label}</h2>
                  <div className="grid grid--4">
                    {list.map((p) => <PlayerCard key={p._id} player={p} />)}
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
