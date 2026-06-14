import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/Logo.jsx';

const NAV = [
  { to: '/admin', label: 'Nadzorna plošča', icon: '📊', end: true },
  { to: '/admin/news', label: 'Novice', icon: '📰' },
  { to: '/admin/players', label: 'Igralci', icon: '👕' },
  { to: '/admin/matches', label: 'Tekme', icon: '⚽' },
  { to: '/admin/club', label: 'Podatki kluba', icon: '🏟️' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const onLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="admin">
      <aside className={`admin__sidebar ${open ? 'is-open' : ''}`}>
        <Link to="/admin" className="admin__brand" onClick={() => setOpen(false)}>
          <Logo size={40} />
          <span>Admin</span>
        </Link>
        <nav className="admin__nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `admin__nav-link ${isActive ? 'is-active' : ''}`}>
              <span className="admin__nav-icon">{n.icon}</span> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__sidebar-foot">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin__nav-link">↗ Ogled strani</a>
          <button className="admin__nav-link admin__logout" onClick={onLogout}>⎋ Odjava</button>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__topbar">
          <button className="admin__menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Meni">☰</button>
          <span className="admin__topbar-title">Upravljanje vsebine</span>
          <span className="spacer" />
          <span className="admin__user">👤 {user?.username}</span>
        </header>
        <main className="admin__content">
          <Outlet />
        </main>
      </div>

      {open && <div className="admin__overlay" onClick={() => setOpen(false)} />}
    </div>
  );
}
