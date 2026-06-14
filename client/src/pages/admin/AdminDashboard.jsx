import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi, playersApi, matchesApi } from '../../api/services.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { IconNewspaper, IconUsers, IconCalendar } from '../../components/icons.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  useDocumentTitle('Nadzorna plošča — Admin');

  useEffect(() => {
    Promise.all([
      newsApi.listAll().catch(() => []),
      playersApi.list().catch(() => []),
      matchesApi.list().catch(() => []),
    ]).then(([news, players, matches]) => {
      setStats({
        news: news.length,
        newsDrafts: news.filter((n) => !n.published).length,
        players: players.length,
        matches: matches.length,
        upcoming: matches.filter((m) => m.status === 'upcoming').length,
      });
    });
  }, []);

  if (!stats) return <Loader />;

  const cards = [
    { to: '/admin/news', label: 'Novice', value: stats.news, sub: `${stats.newsDrafts} osnutkov`, Icon: IconNewspaper },
    { to: '/admin/players', label: 'Igralci', value: stats.players, sub: 'v kadru', Icon: IconUsers },
    { to: '/admin/matches', label: 'Tekme', value: stats.matches, sub: `${stats.upcoming} prihajajočih`, Icon: IconCalendar },
  ];

  return (
    <>
      <div className="admin-page-head">
        <h1>Pozdravljen, {user?.username}</h1>
        <p className="text-muted">Tukaj upravljaš vsebino spletne strani NK Goričanka.</p>
      </div>

      <div className="grid grid--3 admin-stats">
        {cards.map(({ to, label, value, sub, Icon }) => (
          <Link key={to} to={to} className="card admin-stat">
            <span className="admin-stat__icon"><Icon /></span>
            <div className="admin-stat__num">{value}</div>
            <div className="admin-stat__label">{label}</div>
            <div className="admin-stat__sub text-muted">{sub}</div>
          </Link>
        ))}
      </div>

      <div className="card admin-help">
        <h3>Hitra navodila</h3>
        <ul>
          <li><strong>Novice</strong> — dodajaj objave, naloži naslovno sliko, objavi ali skrij.</li>
          <li><strong>Igralci</strong> — uredi kader, fotografije in statistiko.</li>
          <li><strong>Tekme</strong> — vnesi razpored, rezultate in strelce.</li>
          <li><strong>Podatki kluba</strong> — zgodovina, kontakt, barve in družbena omrežja.</li>
        </ul>
        <p className="text-muted">
          Začetni podatki so demonstracijski (placeholder) — zamenjaj jih z dejanskimi.
        </p>
      </div>
    </>
  );
}
