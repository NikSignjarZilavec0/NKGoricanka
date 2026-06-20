import { useClub } from '../context/ClubContext.jsx';
import PageHeader from '../components/PageHeader.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { IconMapPin, IconMail, IconPhone } from '../components/icons.jsx';

export default function AboutPage() {
  const { club, loading } = useClub();
  useDocumentTitle('O klubu');

  if (loading) return <Loader full />;

  return (
    <>
      <PageHeader title="O klubu" />

      <section className="section">
        <div className="container about-grid">
          {/* History */}
          <div className="about-main">
            <h2 className="section-title">Zgodovina kluba</h2>
            {club?.history
              ? club.history.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)
              : <p className="text-muted">Zgodovina kluba bo kmalu na voljo.</p>}

            <div className="about-facts">
              {club?.foundedYear && (
                <div className="about-fact"><strong>{club.foundedYear}</strong><span>Leto ustanovitve</span></div>
              )}
              <div className="about-fact">
                <strong className="about-swatches">
                  <i style={{ background: club?.colors?.primary || 'var(--red-500)' }} />
                  <i style={{ background: club?.colors?.accent || 'var(--gold)' }} />
                </strong>
                <span>Klubske barve</span>
              </div>
            </div>
          </div>

          {/* Contact card */}
          <aside className="about-side card">
            <h3>Kontakt</h3>
            <ul className="about-contact">
              {club?.address && <li><IconMapPin /> {club.address}</li>}
              {club?.email && <li><IconMail /> <a href={`mailto:${club.email}`}>{club.email}</a></li>}
              {club?.phone && <li><IconPhone /> <a href={`tel:${club.phone.replace(/\s+/g, '')}`}>{club.phone}</a></li>}
            </ul>
            {club?.socialLinks && Object.values(club.socialLinks).some(Boolean) && (
              <>
                <h3 style={{ marginTop: 20 }}>Družbena omrežja</h3>
                <div className="about-social">
                  {Object.entries(club.socialLinks)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="btn btn--outline btn--sm">
                        {k[0].toUpperCase() + k.slice(1)}
                      </a>
                    ))}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>

      {/* Map */}
      {(club?.mapEmbedUrl || (club?.latitude && club?.longitude)) && (
        <section className="section section--tight">
          <div className="container">
            <h2 className="section-title">Lokacija</h2>
            <div className="map-wrap card">
              <iframe
                title="Lokacija kluba"
                src={
                  club.mapEmbedUrl ||
                  `https://www.openstreetmap.org/export/embed.html?bbox=${club.longitude - 0.01}%2C${club.latitude - 0.005}%2C${club.longitude + 0.01}%2C${club.latitude + 0.005}&layer=mapnik&marker=${club.latitude}%2C${club.longitude}`
                }
                loading="lazy"
              />
            </div>
            {club?.latitude && club?.longitude && (
              <p className="text-center" style={{ marginTop: 12 }}>
                <a
                  className="btn btn--outline btn--sm"
                  href={`https://www.openstreetmap.org/?mlat=${club.latitude}&mlon=${club.longitude}#map=16/${club.latitude}/${club.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Odpri v zemljevidu
                </a>
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
