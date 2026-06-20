import { useEffect, useState } from 'react';
import { clubApi } from '../../api/services.js';
import { errMessage } from '../../api/client.js';
import { useClub } from '../../context/ClubContext.jsx';
import { useSeason } from '../../context/SeasonContext.jsx';
import Loader from '../../components/Loader.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';

const sortDesc = (arr) => [...new Set(arr)].sort().reverse();

export default function AdminSeasons() {
  const { refresh: refreshClub } = useClub();
  const { refresh: refreshSeasons } = useSeason();
  const [seasons, setSeasons] = useState(null);
  const [current, setCurrent] = useState('');
  const [newSeason, setNewSeason] = useState('');
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Sezone — Admin');

  useEffect(() => {
    clubApi.get().then((c) => {
      setSeasons(sortDesc(c.seasons?.length ? c.seasons : [c.currentSeason].filter(Boolean)));
      setCurrent(c.currentSeason || '');
    });
  }, []);

  const persist = async (nextSeasons, nextCurrent) => {
    setSaving(true); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('seasons', JSON.stringify(nextSeasons));
      fd.append('currentSeason', nextCurrent);
      await clubApi.update(fd);
      setSeasons(sortDesc(nextSeasons));
      setCurrent(nextCurrent);
      await refreshClub();
      await refreshSeasons();
      setMsg({ type: 'success', text: 'Sezone so shranjene.' });
    } catch (err) {
      setMsg({ type: 'error', text: errMessage(err, 'Shranjevanje ni uspelo.') });
    } finally {
      setSaving(false);
    }
  };

  const addSeason = (e) => {
    e.preventDefault();
    const s = newSeason.trim();
    if (!s) return;
    if (seasons.includes(s)) { setMsg({ type: 'error', text: 'Ta sezona že obstaja.' }); return; }
    const next = sortDesc([...seasons, s]);
    setNewSeason('');
    // First season added becomes current automatically.
    persist(next, current || s);
  };

  const makeCurrent = (s) => persist(seasons, s);

  const removeSeason = (s) => {
    if (s === current) { setMsg({ type: 'error', text: 'Trenutne sezone ni mogoče izbrisati — najprej nastavi drugo kot trenutno.' }); return; }
    if (!window.confirm(`Izbrišem sezono "${s}" s seznama?\n(Tekme, lestvica in statistika igralcev za to sezono se NE izbrišejo.)`)) return;
    persist(seasons.filter((x) => x !== s), current);
  };

  if (!seasons) return <Loader />;

  return (
    <>
      <div className="admin-page-head"><h1>Sezone</h1>
        <p className="text-muted">Dodajaj sezone in določi, katera je trenutna (privzeta na strani).</p></div>

      {msg && <div className={`alert alert--${msg.type}`}>{msg.text}</div>}

      <div className="card admin-form" style={{ marginBottom: 22 }}>
        <h3 className="admin-subhead">Dodaj sezono</h3>
        <form className="row" onSubmit={addSeason} style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1, maxWidth: 220, marginBottom: 0 }}>
            <label>Nova sezona</label>
            <input className="input" value={newSeason} onChange={(e) => setNewSeason(e.target.value)} placeholder="npr. 2026/27" />
          </div>
          <button className="btn btn--primary" disabled={saving || !newSeason.trim()}>+ Dodaj sezono</button>
        </form>
      </div>

      <div className="card admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Sezona</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {seasons.length === 0 && <tr><td colSpan={3} className="text-center text-muted">Ni sezon.</td></tr>}
            {seasons.map((s) => (
              <tr key={s}>
                <td><strong>{s}</strong></td>
                <td>{s === current
                  ? <span className="badge badge--green">Trenutna</span>
                  : <span className="text-muted">—</span>}</td>
                <td className="admin-actions">
                  {s !== current && <button className="btn btn--outline btn--sm" disabled={saving} onClick={() => makeCurrent(s)}>Nastavi kot trenutno</button>}
                  <button className="btn btn--sm admin-del" disabled={saving} onClick={() => removeSeason(s)}>Izbriši</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card admin-form" style={{ marginTop: 22 }}>
        <h3 className="admin-subhead">Kako delujejo sezone</h3>
        <ul className="text-muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
          <li><strong>Igralci so v vseh sezonah</strong> — istega igralca ni treba dodajati znova. Spremeni se le njegova <strong>statistika za posamezno sezono</strong> (admin → Igralci, zgoraj izbereš sezono).</li>
          <li><strong>Tekme in lestvica</strong> pripadajo eni sezoni — pri vnosu izbereš, kateri.</li>
          <li><strong>Trenutna sezona</strong> je tista, ki jo obiskovalci vidijo privzeto; povsod jo lahko zamenjajo z izbirnikom sezone.</li>
        </ul>
      </div>
    </>
  );
}
