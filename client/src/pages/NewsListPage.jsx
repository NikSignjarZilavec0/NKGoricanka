import { useEffect, useState } from 'react';
import { newsApi } from '../api/services.js';
import NewsCard from '../components/NewsCard.jsx';
import Loader from '../components/Loader.jsx';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NewsListPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Novice');

  useEffect(() => {
    newsApi.listPublished().then(setNews).catch(() => setNews([])).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Novice" />
      <section className="section">
        <div className="container">
          {loading ? (
            <Loader />
          ) : news.length === 0 ? (
            <EmptyState title="Ni novic" text="Novice bodo kmalu na voljo." />
          ) : (
            <div className="grid grid--3">
              {news.map((n) => <NewsCard key={n._id} item={n} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
