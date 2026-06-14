import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errMessage } from '../../api/client.js';
import Logo from '../../components/Logo.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useDocumentTitle('Prijava — Admin');

  if (!loading && user) return <Navigate to="/admin" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(location.state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(errMessage(err, 'Prijava ni uspela.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card card" onSubmit={onSubmit}>
        <div className="login-card__head">
          <Logo size={64} />
          <h1>Administracija</h1>
          <p className="text-muted">Prijavite se za upravljanje vsebine.</p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <div className="field">
          <label htmlFor="username">Uporabniško ime</label>
          <input id="username" className="input" value={username}
            onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div className="field">
          <label htmlFor="password">Geslo</label>
          <input id="password" type="password" className="input" value={password}
            onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>

        <button className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Prijavljanje…' : 'Prijava'}
        </button>

        <a href="/" className="login-card__back">← Nazaj na spletno stran</a>
      </form>
    </div>
  );
}
