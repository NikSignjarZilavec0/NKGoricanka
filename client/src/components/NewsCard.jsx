import { Link } from 'react-router-dom';
import { imageUrl } from '../api/client.js';
import { formatDate } from '../utils/format.js';

export default function NewsCard({ item }) {
  return (
    <article className="card news-card">
      <Link to={`/news/${item.slug}`} className="news-card__media">
        {item.coverImage ? (
          <img src={imageUrl(item.coverImage)} alt={item.title} loading="lazy" />
        ) : (
          <div className="news-card__placeholder" aria-hidden="true">NK Goričanka</div>
        )}
        {!item.published && <span className="badge badge--muted news-card__draft">Osnutek</span>}
      </Link>
      <div className="news-card__body">
        <time className="news-card__date">{formatDate(item.publishedAt || item.createdAt)}</time>
        <h3 className="news-card__title">
          <Link to={`/news/${item.slug}`}>{item.title}</Link>
        </h3>
        <p className="news-card__excerpt">{item.excerpt}</p>
        <Link to={`/news/${item.slug}`} className="news-card__more">Preberi več →</Link>
      </div>
    </article>
  );
}
