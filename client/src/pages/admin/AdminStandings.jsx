import { useEffect, useState } from 'react';
import { standingsApi } from '../../api/services.js';
import { errMessage } from '../../api/client.js';
import { useSeason } from '../../context/SeasonContext.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const empty = (season) => ({
  season, group: '', groupOrder: 0, team: '', trend: '',
  played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0,
});

const TRENDS = [['', '—'], ['up', '▲ gor'], ['down', '▼ dol'], ['same', '● enako']];

export default function AdminStandings() {
  const { current, seasons } = useSeason();
  const [season, setSeason] = useState('');
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty(''));
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Lestvica — Admin');

  useEffect(() => { if (!season && current) setSeason(current); }, [current, season]);

  const load = (s) => standingsApi.list(s).then(setItems).catch(() => setItems([]));
  useEffect(() => { if (season) { setItems(null); load(season); } }, [season]);

  const openNew = () => { setEditing(null); setForm(empty(season)); setFile(null); setError(''); setModal(true); };
  const openEdit = (r) => {
    setEditing(r); setFile(null); setError('');
    setForm({
      season: r.season, group: r.group || '', groupOrder: r.groupOrder ?? 0, team: r.team, trend: r.trend || '',
      played: r.played, won: r.won, drawn: r.drawn, lost: r.lost, goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst,
    });
    setModal(true);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('teamLogo', file);
      if (editing) await standingsApi.update(editing._id, fd);
      else await standingsApi.create(fd);
      setModal(false);
      await load(season);
    } catch (err) {
      setError(errMessage(err, 'Shranjevanje ni uspelo.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (r) => {
    if (!window.confirm(`Izbrišem "${r.team}" iz lestvice?`)) return;
    await standingsApi.remove(r._id);
    await load(season);
  };

  const pts = (f) => 3 * (Number(f.won) || 0) + (Number(f.drawn) || 0);

  return (
    <>
      <div className="admin-page-head admin-page-head--row">
        <div>
          <h1>Lestvica</h1>
          <p className="text-muted">Ročni vnos; točke (3·Z + N) in razvrstitev sta samodejni.</p>
        </div>
        <div className="row">
          <input className="input" style={{ width: 130 }} list="seasons" value={season}
            onChange={(e) => setSeason(e.target.value)} placeholder="Sezona" />
          <datalist id="seasons">{(seasons || []).map((s) => <option key={s} value={s} />)}</datalist>
          <button className="btn btn--primary" onClick={openNew}>+ Nova vrstica</button>
        </div>
      </div>

      {!items ? <Loader /> : (
        <div className="card admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>#</th><th>Ekipa</th><th>Skupina</th><th>T</th><th>Z-N-P</th><th>Goli</th><th>Tč.</th><th></th></tr></thead>
            <tbody>
              {items.length === 0 && <tr><td colSpan={8} className="text-center text-muted">Ni vrstic za sezono {season}.</td></tr>}
              {items.map((r, i) => (
                <tr key={r._id}>
                  <td>{i + 1}</td>
                  <td><strong>{r.team}</strong></td>
                  <td>{r.group || '—'}<br /><small className="text-muted">red {r.groupOrder}</small></td>
                  <td>{r.played}</td>
                  <td>{r.won}-{r.drawn}-{r.lost}</td>
                  <td>{r.goalsFor}:{r.goalsAgainst}</td>
                  <td><strong>{r.points}</strong></td>
                  <td className="admin-actions">
                    <button className="btn btn--outline btn--sm" onClick={() => openEdit(r)}>Uredi</button>
                    <button className="btn btn--sm admin-del" onClick={() => onDelete(r)}>Izbriši</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} title={editing ? 'Uredi vrstico' : 'Nova vrstica'} onClose={() => setModal(false)} wide>
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="row">
            <div className="field" style={{ flex: 2 }}><label>Ekipa *</label>
              <input className="input" name="team" value={form.team} onChange={onChange} required /></div>
            <div className="field" style={{ flex: 1 }}><label>Sezona *</label>
              <input className="input" name="season" value={form.season} onChange={onChange} required /></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 2 }}><label>Skupina (npr. Prvenstveni del / Spodnji del)</label>
              <input className="input" name="group" value={form.group} onChange={onChange} placeholder="prazno = ena lestvica" /></div>
            <div className="field" style={{ flex: 1 }}><label>Vrstni red skupine</label>
              <input className="input" type="number" name="groupOrder" value={form.groupOrder} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Trend</label>
              <select className="select" name="trend" value={form.trend} onChange={onChange}>
                {TRENDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Tekme</label>
              <input className="input" type="number" min="0" name="played" value={form.played} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Zmage</label>
              <input className="input" type="number" min="0" name="won" value={form.won} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Neodločeno</label>
              <input className="input" type="number" min="0" name="drawn" value={form.drawn} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Porazi</label>
              <input className="input" type="number" min="0" name="lost" value={form.lost} onChange={onChange} /></div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Dani goli</label>
              <input className="input" type="number" min="0" name="goalsFor" value={form.goalsFor} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Prejeti goli</label>
              <input className="input" type="number" min="0" name="goalsAgainst" value={form.goalsAgainst} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Grb ekipe (neobvezno)</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></div>
          </div>
          <p className="text-muted">Točke (samodejno): <strong>{pts(form)}</strong></p>
          <div className="modal__foot">
            <button type="button" className="btn btn--outline" onClick={() => setModal(false)}>Prekliči</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? 'Shranjujem…' : 'Shrani'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
