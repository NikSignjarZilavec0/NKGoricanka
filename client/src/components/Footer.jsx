import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useClub } from '../context/ClubContext.jsx';

const SOCIAL = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'X / Twitter' },
];

export default function Footer() {
  const { club } = useClub();
  const year = new Date().getFullYear();
  const social = club?.socialLinks || {};

  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="footer__brand">
            <Logo size={52} />
            <strong>{club?.name || 'NK Goričanka'}</strong>
          </div>
          <p className="footer__muted">
            {club?.shortName || 'Goričanka'} — nogometni klub iz Goričkega, Prekmurje.
          </p>
        </div>

        <div>
          <h4 className="footer__title">Povezave</h4>
          <ul className="footer__links">
            <li><Link to="/news">Novice</Link></li>
            <li><Link to="/players">Igralski kader</Link></li>
            <li><Link to="/matches">Tekme</Link></li>
            <li><Link to="/about">O klubu</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="footer__title">Kontakt</h4>
          <ul className="footer__links">
            {club?.address && <li>{club.address}</li>}
            {club?.email && <li><a href={`mailto:${club.email}`}>{club.email}</a></li>}
            {club?.phone && <li><a href={`tel:${club.phone.replace(/\s+/g, '')}`}>{club.phone}</a></li>}
          </ul>
        </div>

        <div>
          <h4 className="footer__title">Sledite nam</h4>
          <div className="footer__social">
            {SOCIAL.filter((s) => social[s.key]).map((s) => (
              <a key={s.key} href={social[s.key]} target="_blank" rel="noopener noreferrer" className="footer__social-link">
                {s.label}
              </a>
            ))}
            {!SOCIAL.some((s) => social[s.key]) && (
              <span className="footer__muted">Kmalu na voljo.</span>
            )}
          </div>
        </div>
      </div>

      <div className="footer__bar">
        <div className="container footer__bar-inner">
          <span>© {year} {club?.name || 'NK Goričanka'}. Vse pravice pridržane.</span>
        </div>
      </div>
    </footer>
  );
}
