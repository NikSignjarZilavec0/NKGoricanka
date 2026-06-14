import { useEffect, useState } from 'react';
import { newsApi } from '../../api/services.js';
import { imageUrl, errMessage } from '../../api/client.js';
import { formatDate } from '../../utils/format.js';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const EMPTY = { title: '', excerpt: '', content: '', author: 'NK Goričanka', published: true };

export default function AdminNews() {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Novice — Admin');

  const load = () => newsApi.listAll().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(EMPTY); setFile(null); setError(''); setModal(true); };
  const openEdit = async (item) => {
    setError('');
    const full = await newsApi.getById(item._id).catch(() => item);
    setEditing(full);
    setForm({
      title: full.title || '', excerpt: full.excerpt || '', content: full.content || '',
      author: full.author || 'NK Goričanka', published: !!full.published,
    });
    setFile(null);
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
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('coverImage', file);
      if (editing) await newsApi.update(editing._id, fd);
      else await newsApi.create(fd);
      setModal(false);
      await load();
    } catch (err) {
      setError(errMessage(err, 'Shranjevanje ni uspelo.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (item) => {
    if (!window.confirm(`Izbrišem novico "${item.title}"?`)) return;
    await newsApi.remove(item._id);
    await load();
  };

  const togglePublish = async (item) => {
    const fd = new FormData();
    fd.append('published', String(!item.published));
    await newsApi.update(item._id, fd);
    await load();
  };

  if (!items) return <Loader />;

  return (
    <>
      <div className="admin-page-head admin-page-head--row">
        <div><h1>Novice</h1><p className="text-muted">{items.length} objav</p></div>
        <button className="btn btn--primary" onClick={openNew}>+ Nova novica</button>
      </div>

      <div className="card admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Slika</th><th>Naslov</th><th>Datum</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="text-center text-muted">Ni novic.</td></tr>}
            {items.map((n) => (
              <tr key={n._id}>
                <td>
                  {n.coverImage
                    ? <img className="admin-thumb" src={imageUrl(n.coverImage)} alt="" />
                    : <div className="admin-thumb admin-thumb--empty">—</div>}
                </td>
                <td><strong>{n.title}</strong><br /><small className="text-muted">{n.slug}</small></td>
                <td>{formatDate(n.publishedAt || n.createdAt)}</td>
                <td>
                  <button className={`badge ${n.published ? 'badge--green' : 'badge--muted'}`} onClick={() => togglePublish(n)}>
                    {n.published ? 'Objavljeno' : 'Osnutek'}
                  </button>
                </td>
                <td className="admin-actions">
                  <button className="btn btn--outline btn--sm" onClick={() => openEdit(n)}>Uredi</button>
                  <button className="btn btn--sm admin-del" onClick={() => onDelete(n)}>Izbriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} title={editing ? 'Uredi novico' : 'Nova novica'} onClose={() => setModal(false)} wide>
        <form onSubmit={onSubmit}>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="field">
            <label>Naslov *</label>
            <input className="input" name="title" value={form.title} onChange={onChange} required />
          </div>
          <div className="field">
            <label>Izsek (kratek opis)</label>
            <input className="input" name="excerpt" value={form.excerpt} onChange={onChange}
              placeholder="Če je prazno, se ustvari samodejno." />
          </div>
          <div className="field">
            <label>Vsebina *</label>
            <textarea className="textarea" name="content" value={form.content} onChange={onChange} rows={10} required />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Avtor</label>
              <input className="input" name="author" value={form.author} onChange={onChange} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Naslovna slika {editing && '(pusti prazno za ohranitev)'}</label>
              <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>
          {editing?.coverImage && !file && (
            <img className="admin-preview" src={imageUrl(editing.coverImage)} alt="Trenutna slika" />
          )}
          <label className="checkbox">
            <input type="checkbox" name="published" checked={form.published} onChange={onChange} /> Objavljeno
          </label>
          <div className="modal__foot">
            <button type="button" className="btn btn--outline" onClick={() => setModal(false)}>Prekliči</button>
            <button className="btn btn--primary" disabled={saving}>{saving ? 'Shranjujem…' : 'Shrani'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
