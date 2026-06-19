import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useClub } from '../context/ClubContext.jsx';

const LINKS = [
  { to: '/', label: 'Domov', end: true },
  { to: '/news', label: 'Novice' },
  { to: '/players', label: 'Kader' },
  { to: '/matches', label: 'Tekme' },
  { to: '/standings', label: 'Lestvica' },
  { to: '/about', label: 'O klubu' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { club } = useClub();
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" onClick={close}>
          <Logo size={46} />
          <span className="navbar__brand-text">
            <strong>{club?.name || 'NK Goričanka'}</strong>
          </span>
        </Link>

        <button
          className={`navbar__burger ${open ? 'is-open' : ''}`}
          aria-label="Meni"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span /><span /><span />
        </button>

        <nav className={`navbar__nav ${open ? 'is-open' : ''}`}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `navbar__link ${isActive ? 'is-active' : ''}`}
              onClick={close}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
