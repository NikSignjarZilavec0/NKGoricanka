import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function NotFoundPage() {
  useDocumentTitle('Stran ni najdena');
  return (
    <section className="notfound">
      <div className="container">
        <div className="notfound__code">404</div>
        <h1>Stran ni najdena</h1>
        <p className="text-muted">Žal iskane strani ni mogoče najti.</p>
        <Link to="/" className="btn btn--primary">Nazaj na domačo stran</Link>
      </div>
    </section>
  );
}
