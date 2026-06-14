import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, matchesApi } from '../api/services.js';
import { useClub } from '../context/ClubContext.jsx';
import NewsCard from '../components/NewsCard.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function HomePage() {
  const { club } = useClub();
  const [news, setNews] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('NK Goričanka — uradna spletna stran');

  useEffect(() => {
    Promise.all([
      newsApi.listPublished().catch(() => []),
      matchesApi.list('finished').catch(() => []),
      matchesApi.list('upcoming').catch(() => []),
    ])
      .then(([n, finished, upcoming]) => {
        setNews(n.slice(0, 3));
        // "Zadnje tekme": recent results; fall back to upcoming if none played yet.
        setMatches((finished.length ? finished : upcoming).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero — text only */}
      <section className="hero">
        <div className="hero__overlay" />
        <div className="container hero__content">
          <span className="hero__eyebrow">Nogometni klub Goričanka</span>
          <h1 className="hero__title">
            {club?.name || 'NK Goričanka'}
            <span className="hero__title-accent">Uradna spletna stran</span>
          </h1>
        </div>
      </section>

      {loading ? (
        <Loader full />
      ) : (
        <>
          {/* Latest news */}
          <section className="section">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Aktualno</div>
                  <h2 className="section-title">Zadnje novice</h2>
                </div>
                <Link to="/news" className="btn btn--outline btn--sm">Vse novice</Link>
              </div>
              {news.length === 0 ? (
                <EmptyState title="Še ni novic" text="Novice bodo kmalu na voljo." />
              ) : (
                <div className="grid grid--3">
                  {news.map((n) => <NewsCard key={n._id} item={n} />)}
                </div>
              )}
            </div>
          </section>

          {/* Recent matches */}
          <section className="section section--tight">
            <div className="container">
              <div className="section-head">
                <div>
                  <div className="eyebrow">Rezultati</div>
                  <h2 className="section-title">Zadnje tekme</h2>
                </div>
                <Link to="/matches" className="btn btn--outline btn--sm">Vse tekme</Link>
              </div>
              {matches.length === 0 ? (
                <EmptyState title="Ni tekem" text="Podatki bodo kmalu na voljo." />
              ) : (
                <div className="grid grid--3">
                  {matches.map((m) => <MatchCard key={m._id} match={m} />)}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}
