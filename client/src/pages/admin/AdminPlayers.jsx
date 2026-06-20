import { useEffect, useState } from 'react';
import { playersApi } from '../../api/services.js';
import { imageUrl, errMessage } from '../../api/client.js';
import { POSITION_LABELS, POSITION_GROUPS, toDateInput } from '../../utils/format.js';
import { useSeason } from '../../context/SeasonContext.jsx';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const EMPTY = {
  name: '', season: '', position: 'midfielder', shirtNumber: '', birthdate: '', heightCm: '',
  nationality: 'Slovenija', bio: '', active: true,
  appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0,
};

export default function AdminPlayers() {
  const { current, seasons } = useSeason();
  const [adminSeason, setAdminSeason] = useState('');
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Igralci — Admin');

  useEffect(() => { if (!adminSeason && current) setAdminSeason(current); }, [current, adminSeason]);
  const load = () => playersApi.list(adminSeason).then(setItems).catch(() => setItems([]));
  useEffect(() => { if (adminSeason) { setItems(null); load(); } }, [adminSeason]);

  const openNew = () => { setEditing(null); setForm({ ...EMPTY, season: adminSeason }); setFile(null); setError(''); setModal(true); };
  const openEdit = (p) => {
    setEditing(p); setFile(null); setError('');
    setForm({
      name: p.name || '', season: p.season || '', position: p.position, shirtNumber: p.shirtNumber ?? '',
      birthdate: toDateInput(p.birthdate), heightCm: p.heightCm ?? '',
      nationality: p.nationality || 'Slovenija', bio: p.bio || '', active: p.active !== false,
      appearances: p.stats?.appearances ?? 0, goals: p.stats?.goals ?? 0, assists: p.stats?.assists ?? 0,
      yellowCards: p.stats?.yellowCards ?? 0, redCards: p.stats?.redCards ?? 0,
    });
    setModal(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      ['name', 'position', 'shirtNumber', 'birthdate', 'heightCm', 'nationality', 'bio', 'active']
        .forEach((k) => fd.append(k, form[k]));
      fd.append('season', adminSeason); // stats apply to the selected season
      fd.append('stats', JSON.stringify({
        appearances: Number(form.appearances) || 0, goals: Number(form.goals) || 0,
        assists: Number(form.assists) || 0, yellowCards: Number(form.yellowCards) || 0,
        redCards: Number(form.redCards) || 0,
      }));
      if (file) fd.append('photo', file);
      if (editing) await playersApi.update(editing._id, fd);
      else await playersApi.create(fd);
      setModal(false);
      await load();
    } catch (err) {
      setError(errMessage(err, 'Shranjevanje ni uspelo.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!window.confirm(`Izbrišem igralca "${p.name}"?`)) return;
    await playersApi.remove(p._id);
    await load();
  };

  if (!items) return <Loader />;

  return (
    <>
      <div className="admin-page-head admin-page-head--row">
        <div><h1>Igralci</h1><p className="text-muted">{items.length} v kadru · sezona {adminSeason}</p></div>
        <div className="row">
          <input className="input" style={{ width: 130 }} list="seasons-pl" value={adminSeason}
            onChange={(e) => setAdminSeason(e.target.value)} placeholder="Sezona" />
          <datalist id="seasons-pl">{(seasons || []).map((s) => <option key={s} value={s} />)}</datalist>
          <button className="btn btn--primary" onClick={openNew}>+ Nov igralec</button>
        </div>
      </div>

      {POSITION_GROUPS.map((g) => {
        const list = items.filter((p) => p.position === g.key);
        if (!list.length) return null;
        return (
          <div key={g.key} className="card admin-table-wrap" style={{ marginBottom: 20 }}>
            <h3 className="admin-subhead">{g.label}</h3>
            <table className="admin-table">
              <thead><tr><th>#</th><th>Foto</th><th>Ime</th><th>G/A</th><th></th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p._id}>
                    <td>{p.shirtNumber ?? '–'}</td>
                    <td>{p.photo ? <img className="admin-thumb admin-thumb--round" src={imageUrl(p.photo)} alt="" /> : <div className="admin-thumb admin-thumb--round admin-thumb--empty">—</div>}</td>
                    <td><strong>{p.name}</strong>{!p.active && <span className="badge badge--muted" style={{ marginLeft: 8 }}>Neaktiven</span>}</td>
                    <td>{p.stats?.goals ?? 0} / {p.stats?.assists ?? 0}</td>
                    <td className="admin-actions">
                      <button className="btn btn--outline btn--sm" onClick={() => openEdit(p)}>Uredi</button>
                      <button className="btn btn--sm admin-del" onClick={() => onDelete(p)}>Izbriši</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <Modal open={modal} title={editing ? 'Uredi igralca' : 'Nov igralec'} onClose={() => setModal(false)} wide>
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="row">
            <div className="field" style={{ flex: 2 }}>
              <label>Ime in priimek *</label>
              <input className="input" name="name" value={form.name} onChange={onChange} required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Pozicija *</label>
              <select className="select" name="position" value={form.position} onChange={onChange}>
                {Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}><label>Št. dresa</label>
              <input className="input" type="number" name="shirtNumber" min="1" max="99" value={form.shirtNumber} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Datum rojstva</label>
              <input className="input" type="date" name="birthdate" value={form.birthdate} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Višina (cm)</label>
              <input className="input" type="number" name="heightCm" min="100" max="250" value={form.heightCm} onChange={onChange} /></div>
            <div className="field" style={{ flex: 1 }}><label>Državljanstvo</label>
              <input className="input" name="nationality" value={form.nationality} onChange={onChange} /></div>
          </div>
          <div className="field">
            <label>Opis / biografija</label>
            <textarea className="textarea" name="bio" value={form.bio} onChange={onChange} rows={4} />
          </div>

          <h4 className="admin-form-section">Statistika — sezona {adminSeason}</h4>
          <p className="text-muted" style={{ marginTop: -6, fontSize: '0.85rem' }}>
            Statistika velja samo za sezono <strong>{adminSeason}</strong>. Osnovni podatki (ime, pozicija, številka,
            fotografija …) so skupni vsem sezonam. Za drugo sezono zgoraj zamenjaj sezono.
          </p>
          <div className="row">
            {[['appearances', 'Nastopi'], ['goals', 'Goli'], ['assists', 'Asist.'], ['yellowCards', 'Rumeni'], ['redCards', 'Rdeči']].map(([k, label]) => (
              <div key={k} className="field" style={{ flex: 1 }}>
                <label>{label}</label>
                <input className="input" type="number" min="0" name={k} value={form[k]} onChange={onChange} />
              </div>
            ))}
          </div>

          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Fotografija {editing && '(pusti prazno za ohranitev)'}</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </div>
            <label className="checkbox" style={{ alignSelf: 'center' }}>
              <input type="checkbox" name="active" checked={form.active} onChange={onChange} /> Aktiven
            </label>
          </div>
          {editing?.photo && !file && <img className="admin-preview admin-preview--round" src={imageUrl(editing.photo)} alt="Trenutna" />}

          <div className="modal__foot">
            <button type="button" className="btn btn--outline" onClick={() => setModal(false)}>Prekliči</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? 'Shranjujem…' : 'Shrani'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
