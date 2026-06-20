import { useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Logo from '../../components/Logo.jsx';
import {
  IconDashboard, IconNewspaper, IconUsers, IconCalendar, IconShield, IconTable,
  IconLayers, IconExternal, IconLogout, IconMenu, IconUser,
} from '../../components/icons.jsx';

const NAV = [
  { to: '/admin', label: 'Nadzorna plošča', Icon: IconDashboard, end: true },
  { to: '/admin/news', label: 'Novice', Icon: IconNewspaper },
  { to: '/admin/players', label: 'Igralci', Icon: IconUsers },
  { to: '/admin/matches', label: 'Tekme', Icon: IconCalendar },
  { to: '/admin/standings', label: 'Lestvica', Icon: IconTable },
  { to: '/admin/seasons', label: 'Sezone', Icon: IconLayers },
  { to: '/admin/club', label: 'Podatki kluba', Icon: IconShield },
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
          <Logo size={38} />
          <span>Admin</span>
        </Link>
        <nav className="admin__nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `admin__nav-link ${isActive ? 'is-active' : ''}`}>
              <span className="admin__nav-icon"><Icon /></span> {label}
            </NavLink>
          ))}
        </nav>
        <div className="admin__sidebar-foot">
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin__nav-link">
            <span className="admin__nav-icon"><IconExternal /></span> Ogled strani
          </a>
          <button className="admin__nav-link admin__logout" onClick={onLogout}>
            <span className="admin__nav-icon"><IconLogout /></span> Odjava
          </button>
        </div>
      </aside>

      <div className="admin__main">
        <header className="admin__topbar">
          <button className="admin__menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Meni"><IconMenu /></button>
          <span className="admin__topbar-title">Upravljanje vsebine</span>
          <span className="spacer" />
          <span className="admin__user"><IconUser /> {user?.username}</span>
        </header>
        <main className="admin__content">
          <Outlet />
        </main>
      </div>

      {open && <div className="admin__overlay" onClick={() => setOpen(false)} />}
    </div>
  );
}
