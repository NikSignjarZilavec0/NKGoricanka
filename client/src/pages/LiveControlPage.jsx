import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { matchesApi } from '../api/services.js';
import { errMessage } from '../api/client.js';
import { useClub } from '../context/ClubContext.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Logo from '../components/Logo.jsx';

const STATUSES = [
  { v: 'upcoming', label: 'Pred tekmo' },
  { v: 'live', label: 'V živo' },
  { v: 'finished', label: 'Konec' },
];

export default function LiveControlPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const key = params.get('key') || '';
  const { club } = useClub();

  const [match, setMatch] = useState(null);
  const [state, setState] = useState(null); // { status, minute, ours, theirs, scorers }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [scorerName, setScorerName] = useState('');
  const [scorerMin, setScorerMin] = useState('');

  useDocumentTitle('Živo upravljanje');

  useEffect(() => {
    matchesApi.getById(id)
      .then((m) => {
        setMatch(m);
        setState({
          status: m.status,
          minute: m.minute ?? '',
          ours: m.score?.ours ?? 0,
          theirs: m.score?.theirs ?? 0,
          scorers: (m.scorers || []).map((s) => ({ playerName: s.playerName, minute: s.minute ?? '' })),
        });
      })
      .catch((e) => setMsg({ type: 'error', text: errMessage(e, 'Tekma ni najdena.') }))
      .finally(() => setLoading(false));
  }, [id]);

  const push = async (next) => {
    setState(next);
    setSaving(true);
    setMsg(null);
    try {
      const updated = await matchesApi.liveUpdate(id, key, {
        status: next.status,
        minute: next.minute === '' ? null : Number(next.minute),
        scoreOurs: next.ours,
        scoreTheirs: next.theirs,
        scorers: next.scorers.filter((s) => s.playerName.trim()),
      });
      setMatch(updated);
      setMsg({ type: 'success', text: 'Posodobljeno ✓ — vidno na strani v živo' });
    } catch (e) {
      setMsg({ type: 'error', text: errMessage(e, 'Posodobitev ni uspela.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="live-panel"><Loader full /></div>;
  if (!state) {
    return (
      <div className="live-panel"><div className="live-panel__inner">
        {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}
        <Link to="/" className="btn btn--outline">Domov</Link>
      </div></div>
    );
  }

  const us = club?.shortName || 'Goričanka';
  const step = (field, delta) => push({ ...state, [field]: Math.max(0, Number(state[field] || 0) + delta) });

  return (
    <div className="live-panel">
      <div className="live-panel__inner">
        <header className="live-panel__head">
          <Logo size={40} />
          <div>
            <strong>Živo upravljanje</strong>
            <small>{us} vs {match?.opponent}</small>
          </div>
        </header>

        {!key && <div className="alert alert--info">Brez ključa v povezavi je posodabljanje mogoče le, če si prijavljen kot administrator.</div>}
        {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}

        {/* Status */}
        <div className="live-block">
          <span className="live-block__label">Status tekme</span>
          <div className="live-seg">
            {STATUSES.map((s) => (
              <button key={s.v} className={`live-seg__btn ${state.status === s.v ? 'is-active' : ''}`}
                onClick={() => push({ ...state, status: s.v })} disabled={saving}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Minute */}
        <div className="live-block">
          <span className="live-block__label">Minuta</span>
          <input className="input" type="number" min="0" max="130" value={state.minute}
            onChange={(e) => setState({ ...state, minute: e.target.value })}
            onBlur={() => push(state)} placeholder="npr. 67" />
        </div>

        {/* Score */}
        <div className="live-block">
          <span className="live-block__label">Rezultat</span>
          <div className="live-score">
            <Stepper label={us} value={state.ours} onMinus={() => step('ours', -1)} onPlus={() => step('ours', 1)} disabled={saving} />
            <div className="live-score__sep">:</div>
            <Stepper label={match?.opponent} value={state.theirs} onMinus={() => step('theirs', -1)} onPlus={() => step('theirs', 1)} disabled={saving} />
          </div>
        </div>

        {/* Scorers */}
        <div className="live-block">
          <span className="live-block__label">Strelci</span>
          {state.scorers.length === 0 && <p className="text-muted" style={{ margin: '4px 0' }}>Ni vpisanih strelcev.</p>}
          {state.scorers.map((s, i) => (
            <div className="live-scorer" key={i}>
              <span><strong>{s.playerName}</strong>{s.minute ? ` ${s.minute}'` : ''}</span>
              <button className="btn btn--sm admin-del" disabled={saving}
                onClick={() => push({ ...state, scorers: state.scorers.filter((_, idx) => idx !== i) })}>Odstrani</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
            <input className="input" style={{ flex: 2 }} placeholder="Ime strelca" value={scorerName} onChange={(e) => setScorerName(e.target.value)} />
            <input className="input" style={{ flex: 1 }} type="number" min="1" max="130" placeholder="min." value={scorerMin} onChange={(e) => setScorerMin(e.target.value)} />
            <button className="btn btn--primary btn--sm" disabled={saving || !scorerName.trim()}
              onClick={() => { push({ ...state, scorers: [...state.scorers, { playerName: scorerName.trim(), minute: scorerMin }] }); setScorerName(''); setScorerMin(''); }}>
              Dodaj
            </button>
          </div>
        </div>

        <p className="live-panel__foot text-muted">{saving ? 'Shranjujem…' : 'Vsaka sprememba je takoj vidna obiskovalcem.'}</p>
        <Link to={`/matches/${id}`} className="btn btn--outline btn--block" target="_blank" rel="noopener noreferrer">Odpri javni prikaz tekme</Link>
      </div>
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus, disabled }) {
  return (
    <div className="live-stepper">
      <span className="live-stepper__team">{label}</span>
      <div className="live-stepper__controls">
        <button className="live-stepper__btn" onClick={onMinus} disabled={disabled} aria-label="manj">−</button>
        <span className="live-stepper__val">{value}</span>
        <button className="live-stepper__btn" onClick={onPlus} disabled={disabled} aria-label="več">+</button>
      </div>
    </div>
  );
}
