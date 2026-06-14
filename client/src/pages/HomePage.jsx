import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, matchesApi } from '../api/services.js';
import { useClub } from '../context/ClubContext.jsx';
import NewsCard from '../components/NewsCard.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import useMatchStream from '../hooks/useMatchStream.js';
import Logo from '../components/Logo.jsx';

const byDateAsc = (a, b) => new Date(a.date) - new Date(b.date);
const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

export default function HomePage() {
  const { club } = useClub();
  const [news, setNews] = useState([]);
  const [m, setM] = useState({ live: [], upcoming: [], finished: [] });
  const [loading, setLoading] = useState(true);

  useDocumentTitle('NK Goričanka — uradna spletna stran');

  useEffect(() => {
    Promise.all([
      newsApi.listPublished().catch(() => []),
      matchesApi.list('live').catch(() => []),
      matchesApi.list('upcoming').catch(() => []),
      matchesApi.list('finished').catch(() => []),
    ])
      .then(([n, live, upcoming, finished]) => {
        setNews(n.slice(0, 4));
        setM({ live, upcoming, finished });
      })
      .finally(() => setLoading(false));
  }, []);

  useMatchStream((match) => {
    setM((d) => {
      const strip = (arr) => arr.filter((x) => x._id !== match._id);
      const next = { live: strip(d.live), upcoming: strip(d.upcoming), finished: strip(d.finished) };
      if (match.status === 'live') next.live = [match, ...next.live];
      else if (match.status === 'upcoming') next.upcoming = [...next.upcoming, match].sort(byDateAsc);
      else if (match.status === 'finished') next.finished = [match, ...next.finished].sort(byDateDesc);
      return next;
    });
  });

  // Matches column: live first, then the next upcoming (if any), then recent results.
  const nextUp = m.upcoming[0];
  const colMatches = [...m.live, ...(nextUp ? [nextUp] : []), ...m.finished.slice(0, 3)];

  return (
    <>
      {/* Hero — team photo banner + club name */}
      <section className="home-hero">
        <div className="home-hero__overlay" />
        <div className="container home-hero__content">
          <Logo size={92} className="home-hero__crest" />
          <h1 className="home-hero__title">{club?.name || 'NK Goričanka'}</h1>
          <span className="home-hero__subtitle">Uradna spletna stran</span>
        </div>
        <div className="home-hero__caption">Prostor za fotografijo članske ekipe</div>
      </section>

      {loading ? (
        <Loader full />
      ) : (
        <section className="section">
          <div className="container home-cols">
            {/* News column */}
            <div className="home-col">
              <h2 className="section-title">Novice</h2>
              {news.length === 0 ? (
                <EmptyState title="Še ni novic" text="Novice bodo kmalu na voljo." />
              ) : (
                <div className="home-col__list">
                  {news.map((n) => <NewsCard key={n._id} item={n} />)}
                </div>
              )}
              <Link to="/news" className="btn btn--primary btn--block home-col__all">Vse novice</Link>
            </div>

            {/* Matches column */}
            <div className="home-col">
              <h2 className="section-title">Tekme</h2>
              {colMatches.length === 0 ? (
                <EmptyState title="Ni tekem" text="Razpored bo kmalu na voljo." />
              ) : (
                <div className="home-col__list">
                  {colMatches.map((match) => <MatchCard key={match._id} match={match} />)}
                </div>
              )}
              <Link to="/matches" className="btn btn--primary btn--block home-col__all">Vse tekme</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
