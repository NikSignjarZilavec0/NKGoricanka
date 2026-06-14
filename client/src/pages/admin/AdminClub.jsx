import { useEffect, useState } from 'react';
import { clubApi } from '../../api/services.js';
import { imageUrl, errMessage } from '../../api/client.js';
import { useClub } from '../../context/ClubContext.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

export default function AdminClub() {
  const { refresh } = useClub();
  const [form, setForm] = useState(null);
  const [file, setFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Podatki kluba — Admin');

  useEffect(() => {
    clubApi.get().then((c) => {
      setForm({
        name: c.name || '', shortName: c.shortName || '', foundedYear: c.foundedYear || '',
        history: c.history || '', address: c.address || '', email: c.email || '', phone: c.phone || '',
        primary: c.colors?.primary || '#c8102e', accent: c.colors?.accent || '#ffcc00',
        facebook: c.socialLinks?.facebook || '', instagram: c.socialLinks?.instagram || '',
        youtube: c.socialLinks?.youtube || '', twitter: c.socialLinks?.twitter || '',
        mapEmbedUrl: c.mapEmbedUrl || '', latitude: c.latitude ?? '', longitude: c.longitude ?? '',
      });
      setLogoPreview(c.logo ? imageUrl(c.logo) : '/logo.svg');
    });
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    if (f) setLogoPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg(null);
    try {
      const fd = new FormData();
      ['name', 'shortName', 'foundedYear', 'history', 'address', 'email', 'phone', 'mapEmbedUrl', 'latitude', 'longitude']
        .forEach((k) => fd.append(k, form[k]));
      fd.append('colors', JSON.stringify({ primary: form.primary, accent: form.accent }));
      fd.append('socialLinks', JSON.stringify({
        facebook: form.facebook, instagram: form.instagram, youtube: form.youtube, twitter: form.twitter,
      }));
      if (file) fd.append('logo', file);
      await clubApi.update(fd);
      await refresh();
      setMsg({ type: 'success', text: 'Podatki kluba so shranjeni.' });
    } catch (err) {
      setMsg({ type: 'error', text: errMessage(err, 'Shranjevanje ni uspelo.') });
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <Loader />;

  return (
    <>
      <div className="admin-page-head"><h1>Podatki kluba</h1>
        <p className="text-muted">Urejaj osnovne podatke, zgodovino, barve in povezave.</p></div>

      {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}

      <form onSubmit={onSubmit} className="card admin-form">
        <h3 className="admin-subhead">Osnovno</h3>
        <div className="row">
          <div className="field" style={{ flex: 2 }}><label>Ime kluba</label>
            <input className="input" name="name" value={form.name} onChange={onChange} /></div>
          <div className="field" style={{ flex: 1 }}><label>Kratko ime</label>
            <input className="input" name="shortName" value={form.shortName} onChange={onChange} /></div>
          <div className="field" style={{ flex: 1 }}><label>Leto ustanovitve</label>
            <input className="input" type="number" name="foundedYear" value={form.foundedYear} onChange={onChange} /></div>
        </div>

        <div className="field"><label>Zgodovina</label>
          <textarea className="textarea" name="history" value={form.history} onChange={onChange} rows={8} /></div>

        <h3 className="admin-subhead">Kontakt</h3>
        <div className="row">
          <div className="field" style={{ flex: 2 }}><label>Naslov</label>
            <input className="input" name="address" value={form.address} onChange={onChange} /></div>
          <div className="field" style={{ flex: 1 }}><label>E-pošta</label>
            <input className="input" type="email" name="email" value={form.email} onChange={onChange} /></div>
          <div className="field" style={{ flex: 1 }}><label>Telefon</label>
            <input className="input" name="phone" value={form.phone} onChange={onChange} /></div>
        </div>

        <h3 className="admin-subhead">Barve in grb</h3>
        <div className="row">
          <div className="field"><label>Primarna (rdeča)</label>
            <input className="color-input" type="color" name="primary" value={form.primary} onChange={onChange} /></div>
          <div className="field"><label>Poudarek (rumena)</label>
            <input className="color-input" type="color" name="accent" value={form.accent} onChange={onChange} /></div>
          <div className="field" style={{ flex: 1 }}><label>Grb / logotip</label>
            <input className="input" type="file" accept="image/*" onChange={onFile} /></div>
          {logoPreview && <img className="admin-preview" src={logoPreview} alt="Grb" style={{ height: 70, width: 'auto' }} />}
        </div>

        <h3 className="admin-subhead">Družbena omrežja</h3>
        <div className="row">
          {[['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube'], ['twitter', 'X / Twitter']].map(([k, label]) => (
            <div key={k} className="field" style={{ flex: 1, minWidth: 220 }}>
              <label>{label}</label>
              <input className="input" name={k} value={form[k]} onChange={onChange} placeholder="https://…" />
            </div>
          ))}
        </div>

        <h3 className="admin-subhead">Lokacija (zemljevid)</h3>
        <div className="row">
          <div className="field" style={{ flex: 1 }}><label>Zemljepisna širina (lat)</label>
            <input className="input" name="latitude" value={form.latitude} onChange={onChange} placeholder="46.801" /></div>
          <div className="field" style={{ flex: 1 }}><label>Zemljepisna dolžina (lon)</label>
            <input className="input" name="longitude" value={form.longitude} onChange={onChange} placeholder="16.034" /></div>
        </div>
        <div className="field"><label>OpenStreetMap embed URL (neobvezno — sicer se sestavi iz lat/lon)</label>
          <input className="input" name="mapEmbedUrl" value={form.mapEmbedUrl} onChange={onChange} /></div>

        <div className="modal__foot">
          <button className="btn btn--primary" disabled={saving}>{saving ? 'Shranjujem…' : 'Shrani spremembe'}</button>
        </div>
      </form>
    </>
  );
}
