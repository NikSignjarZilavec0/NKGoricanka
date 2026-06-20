import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { matchesApi, playersApi } from '../api/services.js';
import { errMessage } from '../api/client.js';
import { useClub } from '../context/ClubContext.jsx';
import Loader from '../components/Loader.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Logo from '../components/Logo.jsx';
import PlayerSelect from '../components/PlayerSelect.jsx';

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
  const [scorerId, setScorerId] = useState('');
  const [scorerMin, setScorerMin] = useState('');
  const [cardId, setCardId] = useState('');
  const [cardType, setCardType] = useState('yellow');
  const [cardMin, setCardMin] = useState('');
  const [subOnId, setSubOnId] = useState('');
  const [subOffId, setSubOffId] = useState('');
  const [subMin, setSubMin] = useState('');
  const [players, setPlayers] = useState([]);
  const nameOf = (pid) => players.find((p) => p._id === pid)?.name || '';

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
          scorers: (m.scorers || []).map((s) => ({ playerId: s.playerId || '', playerName: s.playerName, minute: s.minute ?? '' })),
          cards: (m.cards || []).map((c) => ({ playerId: c.playerId || '', playerName: c.playerName, type: c.type, minute: c.minute ?? '' })),
          substitutions: (m.substitutions || []).map((x) => ({ offPlayerId: x.offPlayerId || '', offName: x.offName, onPlayerId: x.onPlayerId || '', onName: x.onName, minute: x.minute ?? '' })),
        });
      })
      .catch((e) => setMsg({ type: 'error', text: errMessage(e, 'Tekma ni najdena.') }))
      .finally(() => setLoading(false));
    playersApi.list().then(setPlayers).catch(() => setPlayers([]));
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
        scorers: (next.scorers || []).filter((s) => s.playerId),
        cards: (next.cards || []).filter((c) => c.playerId),
        substitutions: (next.substitutions || []).filter((x) => x.onPlayerId || x.offPlayerId),
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
          <span className="live-block__label">Strelci (goli)</span>
          {state.scorers.length === 0 && <p className="text-muted" style={{ margin: '4px 0' }}>Ni vpisanih golov.</p>}
          {state.scorers.map((s, i) => (
            <div className="live-scorer" key={i}>
              <span><strong>{s.playerName}</strong>{s.minute ? ` ${s.minute}'` : ''}</span>
              <button className="btn btn--sm admin-del" disabled={saving}
                onClick={() => push({ ...state, scorers: state.scorers.filter((_, idx) => idx !== i) })}>Odstrani</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
            <PlayerSelect players={players} value={scorerId} onChange={setScorerId} style={{ flex: 2 }} placeholder="— strelec —" />
            <input className="input" style={{ width: 64, flex: 'none' }} type="number" min="1" max="130" placeholder="min." value={scorerMin} onChange={(e) => setScorerMin(e.target.value)} />
            <button className="btn btn--primary btn--sm" disabled={saving || !scorerId}
              onClick={() => { push({ ...state, scorers: [...state.scorers, { playerId: scorerId, playerName: nameOf(scorerId), minute: scorerMin }] }); setScorerId(''); setScorerMin(''); }}>
              Dodaj
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="live-block">
          <span className="live-block__label">Kartoni</span>
          {(!state.cards || state.cards.length === 0) && <p className="text-muted" style={{ margin: '4px 0' }}>Ni vpisanih kartonov.</p>}
          {(state.cards || []).map((c, i) => (
            <div className="live-scorer" key={i}>
              <span><strong>{c.playerName}</strong> · {c.type === 'red' ? 'rdeči' : 'rumeni'}{c.minute ? ` ${c.minute}'` : ''}</span>
              <button className="btn btn--sm admin-del" disabled={saving}
                onClick={() => push({ ...state, cards: state.cards.filter((_, idx) => idx !== i) })}>Odstrani</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
            <PlayerSelect players={players} value={cardId} onChange={setCardId} style={{ flex: 2 }} placeholder="— igralec —" />
            <select className="select" style={{ width: 96, flex: 'none' }} value={cardType} onChange={(e) => setCardType(e.target.value)}>
              <option value="yellow">Rumeni</option>
              <option value="red">Rdeči</option>
            </select>
            <input className="input" style={{ width: 64, flex: 'none' }} type="number" min="1" max="130" placeholder="min." value={cardMin} onChange={(e) => setCardMin(e.target.value)} />
            <button className="btn btn--primary btn--sm" disabled={saving || !cardId}
              onClick={() => { push({ ...state, cards: [...(state.cards || []), { playerId: cardId, playerName: nameOf(cardId), type: cardType, minute: cardMin }] }); setCardId(''); setCardMin(''); }}>
              Dodaj
            </button>
          </div>
        </div>

        {/* Substitutions */}
        <div className="live-block">
          <span className="live-block__label">Zamenjave</span>
          {(!state.substitutions || state.substitutions.length === 0) && <p className="text-muted" style={{ margin: '4px 0' }}>Ni vpisanih zamenjav.</p>}
          {(state.substitutions || []).map((x, i) => (
            <div className="live-scorer" key={i}>
              <span><span style={{ color: '#4bd998' }}>▲ {x.onName}</span> <span style={{ color: 'var(--red-300)' }}>▼ {x.offName}</span>{x.minute ? ` ${x.minute}'` : ''}</span>
              <button className="btn btn--sm admin-del" disabled={saving}
                onClick={() => push({ ...state, substitutions: state.substitutions.filter((_, idx) => idx !== i) })}>Odstrani</button>
            </div>
          ))}
          <div className="row" style={{ marginTop: 10, flexWrap: 'nowrap' }}>
            <PlayerSelect players={players} value={subOnId} onChange={setSubOnId} style={{ flex: 1 }} placeholder="— vstopil —" />
            <PlayerSelect players={players} value={subOffId} onChange={setSubOffId} style={{ flex: 1 }} placeholder="— zamenjal —" />
            <input className="input" style={{ width: 56, flex: 'none' }} type="number" min="1" max="130" placeholder="min." value={subMin} onChange={(e) => setSubMin(e.target.value)} />
            <button className="btn btn--primary btn--sm" disabled={saving || (!subOnId && !subOffId)}
              onClick={() => {
                push({ ...state, substitutions: [...(state.substitutions || []), { onPlayerId: subOnId, onName: nameOf(subOnId), offPlayerId: subOffId, offName: nameOf(subOffId), minute: subMin }] });
                setSubOnId(''); setSubOffId(''); setSubMin('');
              }}>Dodaj</button>
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
