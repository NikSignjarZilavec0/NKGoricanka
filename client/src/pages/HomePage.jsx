import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, matchesApi } from '../api/services.js';
import { useClub } from '../context/ClubContext.jsx';
import NewsCard from '../components/NewsCard.jsx';
import MatchCard from '../components/MatchCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import {
  IconNewspaper, IconUsers, IconCalendar, IconShield, IconArrowRight,
} from '../components/icons.jsx';

const QUICK_LINKS = [
  { to: '/news', Icon: IconNewspaper, title: 'Novice', text: 'Zadnje iz kluba' },
  { to: '/players', Icon: IconUsers, title: 'Kader', text: 'Naši igralci' },
  { to: '/matches', Icon: IconCalendar, title: 'Tekme', text: 'Razpored & rezultati' },
  { to: '/about', Icon: IconShield, title: 'O klubu', text: 'Zgodovina & kontakt' },
];

export default function HomePage() {
  const { club } = useClub();
  const [news, setNews] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useDocumentTitle('NK Goričanka — uradna spletna stran');

  useEffect(() => {
    Promise.all([
      newsApi.listPublished().catch(() => []),
      matchesApi.list('upcoming').catch(() => []),
      matchesApi.list('finished').catch(() => []),
    ])
      .then(([n, up, fin]) => {
        setNews(n.slice(0, 3));
        setUpcoming(up.slice(0, 1));
        setRecent(fin.slice(0, 1));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero__overlay" />
        <div className="container hero__content">
          <span className="hero__eyebrow">Nogometni klub · Goričko, Prekmurje</span>
          <h1 className="hero__title">
            {club?.name || 'NK Goričanka'}
            <span className="hero__title-accent">Ponos našega kraja</span>
          </h1>
          <p className="hero__lead">
            Spremljajte novice, igralski kader, razpored tekem in rezultate našega kluba.
            Skupaj nosimo rdečo.
          </p>
          <div className="hero__cta">
            <Link to="/matches" className="btn btn--light">Razpored tekem<IconArrowRight /></Link>
            <Link to="/players" className="btn btn--ghost">Spoznaj ekipo</Link>
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="container quicklinks">
        {QUICK_LINKS.map(({ to, Icon, title, text }) => (
          <Link key={to} to={to} className="quicklink card">
            <span className="quicklink__icon"><Icon /></span>
            <div>
              <strong>{title}</strong>
              <small>{text}</small>
            </div>
          </Link>
        ))}
      </section>

      {loading ? (
        <Loader full />
      ) : (
        <>
          {/* Matches strip */}
          {(upcoming.length > 0 || recent.length > 0) && (
            <section className="section section--tight">
              <div className="container">
                <div className="home-matches">
                  {recent[0] && (
                    <div>
                      <h2 className="section-title">Zadnji rezultat</h2>
                      <MatchCard match={recent[0]} />
                    </div>
                  )}
                  {upcoming[0] && (
                    <div>
                      <h2 className="section-title">Naslednja tekma</h2>
                      <MatchCard match={upcoming[0]} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

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

          {/* CTA band */}
          <section className="cta-band">
            <div className="container cta-band__inner">
              <h2>Postani del naše zgodbe</h2>
              <p>Podpri klub na tekmah in spremljaj naše novice.</p>
              <Link to="/about" className="btn btn--light">Kontaktiraj nas<IconArrowRight /></Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}
