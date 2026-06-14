import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsApi } from '../api/services.js';
import { imageUrl, errMessage } from '../api/client.js';
import { formatDate } from '../utils/format.js';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { IconArrowLeft } from '../components/icons.jsx';

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    newsApi
      .getBySlug(slug)
      .then(setItem)
      .catch((e) => setError(errMessage(e, 'Novica ni najdena.')))
      .finally(() => setLoading(false));
  }, [slug]);

  useDocumentTitle(item?.title || 'Novica');

  if (loading) return <Loader full />;

  if (error || !item) {
    return (
      <div className="container section text-center">
        <h1>Novica ni najdena</h1>
        <p className="text-muted">{error || 'Ta novica ne obstaja ali je bila odstranjena.'}</p>
        <Link to="/news" className="btn btn--primary">Nazaj na novice</Link>
      </div>
    );
  }

  return (
    <article>
      <header className="article-hero">
        {item.coverImage && (
          <img src={imageUrl(item.coverImage)} alt={item.title} className="article-hero__img" />
        )}
        <div className="article-hero__overlay" />
        <div className="container article-hero__content">
          <Link to="/news" className="article-hero__back"><IconArrowLeft size={18} /> Vse novice</Link>
          <h1>{item.title}</h1>
          <div className="article-hero__meta">
            <time>{formatDate(item.publishedAt || item.createdAt)}</time>
            {item.author && <span>· {item.author}</span>}
          </div>
        </div>
      </header>

      <div className="container article-body">
        {String(item.content)
          .split(/\n\s*\n/)
          .map((para, i) => <p key={i}>{para}</p>)}

        <div className="article-footer">
          <Link to="/news" className="btn btn--outline">← Nazaj na vse novice</Link>
        </div>
      </div>
    </article>
  );
}
