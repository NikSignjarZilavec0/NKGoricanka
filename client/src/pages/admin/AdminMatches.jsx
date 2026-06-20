import { useEffect, useState } from 'react';
import { matchesApi, playersApi } from '../../api/services.js';
import { errMessage, copyToClipboard } from '../../api/client.js';
import { formatDateTime, STATUS_LABELS, toDateTimeInput } from '../../utils/format.js';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const EMPTY = {
  opponent: '', isHome: true, date: '', location: '', competition: '1. MNL Murska Sobota',
  season: '2025/26', status: 'upcoming', scoreOurs: '', scoreTheirs: '', minute: '',
};

export default function AdminMatches() {
  const [items, setItems] = useState(null);
  const [players, setPlayers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [scorers, setScorers] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [liveInfo, setLiveInfo] = useState(null); // { match, liveUrl, liveKey }
  const [liveBusy, setLiveBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useDocumentTitle('Tekme — Admin');

  const load = () => matchesApi.list().then(setItems).catch(() => setItems([]));
  useEffect(() => {
    load();
    playersApi.list().then(setPlayers).catch(() => setPlayers([]));
  }, []);

  const openLive = async (m) => {
    setLiveBusy(true);
    try {
      const res = await matchesApi.generateLiveKey(m._id);
      setLiveInfo({ match: m, ...res });
      setCopied(false);
    } catch (err) {
      window.alert(errMessage(err, 'Ni bilo mogoče ustvariti povezave.'));
    } finally {
      setLiveBusy(false);
    }
  };
  const copyLive = async () => {
    const ok = await copyToClipboard(liveInfo.liveUrl);
    if (ok) setCopied(true);
    else window.prompt('Kopiraj povezavo ročno (Ctrl+C):', liveInfo.liveUrl);
  };

  const openNew = () => { setEditing(null); setForm(EMPTY); setScorers([]); setFile(null); setError(''); setModal(true); };
  const openEdit = (m) => {
    setEditing(m); setFile(null); setError('');
    setForm({
      opponent: m.opponent || '', isHome: m.isHome !== false, date: toDateTimeInput(m.date),
      location: m.location || '', competition: m.competition || '', season: m.season || '',
      status: m.status || 'upcoming',
      scoreOurs: m.score?.ours ?? '', scoreTheirs: m.score?.theirs ?? '', minute: m.minute ?? '',
    });
    setScorers((m.scorers || []).map((s) => ({ playerName: s.playerName, minute: s.minute ?? '' })));
    setModal(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const addScorer = () => setScorers((s) => [...s, { playerName: '', minute: '' }]);
  const updateScorer = (i, key, val) => setScorers((s) => s.map((sc, idx) => idx === i ? { ...sc, [key]: val } : sc));
  const removeScorer = (i) => setScorers((s) => s.filter((_, idx) => idx !== i));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      ['opponent', 'location', 'competition', 'season', 'status'].forEach((k) => fd.append(k, form[k]));
      fd.append('isHome', String(form.isHome));
      fd.append('date', form.date);
      fd.append('scoreOurs', form.scoreOurs);
      fd.append('scoreTheirs', form.scoreTheirs);
      fd.append('minute', form.minute);
      fd.append('scorers', JSON.stringify(
        scorers.filter((s) => s.playerName.trim()).map((s) => ({ playerName: s.playerName.trim(), minute: s.minute })))
      );
      if (file) fd.append('opponentLogo', file);
      if (editing) await matchesApi.update(editing._id, fd);
      else await matchesApi.create(fd);
      setModal(false);
      await load();
    } catch (err) {
      setError(errMessage(err, 'Shranjevanje ni uspelo.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (m) => {
    if (!window.confirm(`Izbrišem tekmo proti "${m.opponent}"?`)) return;
    await matchesApi.remove(m._id);
    await load();
  };

  if (!items) return <Loader />;

  const showScore = form.status === 'finished' || form.status === 'live';

  return (
    <>
      <div className="admin-page-head admin-page-head--row">
        <div><h1>Tekme</h1><p className="text-muted">{items.length} tekem</p></div>
        <button className="btn btn--primary" onClick={openNew}>+ Nova tekma</button>
      </div>

      <div className="card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Datum</th><th>Tekma</th><th>D/G</th><th>Rezultat</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="text-center text-muted">Ni tekem.</td></tr>}
            {items.map((m) => (
              <tr key={m._id}>
                <td>{formatDateTime(m.date)}</td>
                <td><strong>{m.opponent}</strong><br /><small className="text-muted">{m.competition}</small></td>
                <td>{m.isHome ? 'Doma' : 'Gosti'}</td>
                <td>{(m.status === 'finished' || m.status === 'live') && m.score?.ours != null ? `${m.score.ours} : ${m.score.theirs}` : '–'}</td>
                <td><span className={`badge ${m.status === 'finished' ? 'badge--green' : m.status === 'cancelled' ? 'badge--gray' : m.status === 'live' ? 'badge--live' : ''}`}>{STATUS_LABELS[m.status]}</span></td>
                <td className="admin-actions">
                  <button className="btn btn--outline btn--sm" disabled={liveBusy} onClick={() => openLive(m)}>Živo</button>
                  <button className="btn btn--outline btn--sm" onClick={() => openEdit(m)}>Uredi</button>
                  <button className="btn btn--sm admin-del" onClick={() => onDelete(m)}>Izbriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} title={editing ? 'Uredi tekmo' : 'Nova tekma'} onClose={() => setModal(false)} wide>
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert--error">{error}</div>}
          <datalist id="player-names">
            {players.map((p) => <option key={p._id} value={p.name} />)}
          </datalist>
          <div className="row">
            <div className="field" style={{ flex: 2 }}><label>Nasprotnik *</label>
              <input className="input" name="opponent" value={form.opponent} onChange={onChange} required /></div>
            <div className="field" style={{ flex: 1 }}><label>Status</label>
              <select className="select" name="status" value={form.status} onChange={onChange}>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Datum in ura *</label>
              <input className="input" type="datetime-local" name="date" value={form.date} onChange={onChange} required /></div>
            <div className="field" style={{ flex: 1 }}><label>Lokacija</label>
              <input className="input" name="location" value={form.location} onChange={onChange} /></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Tekmovanje</label>
              <input className="input" name="competition" value={form.competition} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Sezona</label>
              <input className="input" name="season" value={form.season} onChange={onChange} placeholder="2025/26" /></div>
            <label className="checkbox" style={{ alignSelf: 'center' }}>
              <input type="checkbox" name="isHome" checked={form.isHome} onChange={onChange} /> Domača tekma
            </label>
          </div>

          {showScore && (
            <>
              <h4 className="admin-form-section">Rezultat</h4>
              <div className="row">
                <div className="field" style={{ flex: 1 }}><label>Naši goli</label>
                  <input className="input" type="number" min="0" name="scoreOurs" value={form.scoreOurs} onChange={onChange} /></div>
                <div className="field" style={{ flex: 1 }}><label>Goli nasprotnika</label>
                  <input className="input" type="number" min="0" name="scoreTheirs" value={form.scoreTheirs} onChange={onChange} /></div>
                <div className="field" style={{ flex: 1 }}><label>Minuta {form.status === 'live' ? '(v živo)' : ''}</label>
                  <input className="input" type="number" min="0" max="130" name="minute" value={form.minute} onChange={onChange} /></div>
              </div>

              <h4 className="admin-form-section">Strelci <button type="button" className="btn btn--outline btn--sm" onClick={addScorer}>+ Dodaj</button></h4>
              {scorers.length === 0 && <p className="text-muted">Ni vnesenih strelcev.</p>}
              {scorers.map((s, i) => (
                <div className="row scorer-row" key={i}>
                  <input className="input" style={{ flex: 2 }} list="player-names" placeholder="Ime strelca" value={s.playerName} onChange={(e) => updateScorer(i, 'playerName', e.target.value)} />
                  <input className="input" style={{ flex: 1 }} type="number" min="1" max="130" placeholder="min." value={s.minute} onChange={(e) => updateScorer(i, 'minute', e.target.value)} />
                  <button type="button" className="btn btn--sm admin-del" onClick={() => removeScorer(i)}>✕</button>
                </div>
              ))}
            </>
          )}

          <div className="field" style={{ marginTop: 14 }}>
            <label>Grb nasprotnika (neobvezno)</label>
            <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          <div className="modal__foot">
            <button type="button" className="btn btn--outline" onClick={() => setModal(false)}>Prekliči</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? 'Shranjujem…' : 'Shrani'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!liveInfo} title="Povezava za živo posodabljanje" onClose={() => setLiveInfo(null)}>
        {liveInfo && (
          <>
            <p className="text-muted">
              Pošlji to povezavo osebi na tekmi (<strong>{liveInfo.match.opponent}</strong>). Z njo lahko v živo
              posodablja rezultat, strelce, minuto in status — brez prijave. Posodobitve so takoj vidne obiskovalcem.
            </p>
            <div className="field">
              <label>Povezava za živo</label>
              <input className="input" readOnly value={liveInfo.liveUrl} onFocus={(e) => e.target.select()} />
            </div>
            <div className="modal__foot">
              <a className="btn btn--outline" href={liveInfo.liveUrl} target="_blank" rel="noopener noreferrer">Odpri</a>
              <button className="btn btn--primary" onClick={copyLive}>{copied ? 'Kopirano ✓' : 'Kopiraj povezavo'}</button>
            </div>
            <p className="text-muted" style={{ marginTop: 10, fontSize: '0.85rem' }}>
              Z ustvarjanjem nove povezave prejšnja preneha veljati.
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
