import { useEffect, useState } from 'react';
import { matchesApi, playersApi } from '../../api/services.js';
import { errMessage, copyToClipboard } from '../../api/client.js';
import { formatDateTime, STATUS_LABELS, toDateTimeInput } from '../../utils/format.js';
import Modal from '../../components/Modal.jsx';
import Loader from '../../components/Loader.jsx';
import LineupEditor from '../../components/LineupEditor.jsx';
import PlayerSelect from '../../components/PlayerSelect.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useSeason } from '../../context/SeasonContext.jsx';

const EMPTY = {
  opponent: '', isHome: true, date: '', location: '', competition: '1. MNL Murska Sobota',
  season: '2025/26', status: 'upcoming', scoreOurs: '', scoreTheirs: '', minute: '',
};

export default function AdminMatches() {
  const { seasons } = useSeason();
  const [items, setItems] = useState(null);
  const [players, setPlayers] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [scorers, setScorers] = useState([]);
  const [cards, setCards] = useState([]);
  const [appearances, setAppearances] = useState([]); // [{ playerId, playerName, started }]
  const [subs, setSubs] = useState([]); // [{ offPlayerId, offName, onPlayerId, onName, minute }]
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [liveInfo, setLiveInfo] = useState(null); // { match, liveUrl, liveKey }
  const [liveBusy, setLiveBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lineupMatch, setLineupMatch] = useState(null);
  const [lineupSaving, setLineupSaving] = useState(false);
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

  const saveLineup = async (lineupArr) => {
    setLineupSaving(true);
    try {
      const fd = new FormData();
      fd.append('lineup', JSON.stringify(lineupArr));
      await matchesApi.update(lineupMatch._id, fd);
      setLineupMatch(null);
      await load();
    } catch (err) {
      window.alert(errMessage(err, 'Shranjevanje postave ni uspelo.'));
    } finally {
      setLineupSaving(false);
    }
  };

  const openNew = () => {
    setEditing(null); setForm(EMPTY); setScorers([]); setCards([]); setAppearances([]); setSubs([]);
    setFile(null); setError(''); setModal(true);
  };
  const openEdit = (m) => {
    setEditing(m); setFile(null); setError('');
    setForm({
      opponent: m.opponent || '', isHome: m.isHome !== false, date: toDateTimeInput(m.date),
      location: m.location || '', competition: m.competition || '', season: m.season || '',
      status: m.status || 'upcoming',
      scoreOurs: m.score?.ours ?? '', scoreTheirs: m.score?.theirs ?? '', minute: m.minute ?? '',
    });
    setScorers((m.scorers || []).map((s) => ({
      playerId: s.playerId || '', playerName: s.playerName || '', minute: s.minute ?? '',
      assistPlayerId: s.assistPlayerId || '', assistName: s.assistName || '',
    })));
    setCards((m.cards || []).map((c) => ({
      playerId: c.playerId || '', playerName: c.playerName || '', type: c.type || 'yellow', minute: c.minute ?? '',
    })));
    setAppearances((m.appearances || []).map((a) => ({ playerId: a.playerId || '', playerName: a.playerName || '', started: !!a.started })));
    setSubs((m.substitutions || []).map((s) => ({
      offPlayerId: s.offPlayerId || '', offName: s.offName || '', onPlayerId: s.onPlayerId || '', onName: s.onName || '', minute: s.minute ?? '',
    })));
    setModal(true);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const nameOf = (id) => players.find((p) => p._id === id)?.name || '';

  // Scorers
  const addScorer = () => setScorers((s) => [...s, { playerId: '', playerName: '', minute: '', assistPlayerId: '', assistName: '' }]);
  const patchScorer = (i, patch) => setScorers((s) => s.map((sc, idx) => (idx === i ? { ...sc, ...patch } : sc)));
  const removeScorer = (i) => setScorers((s) => s.filter((_, idx) => idx !== i));

  // Cards
  const addCard = () => setCards((c) => [...c, { playerId: '', playerName: '', type: 'yellow', minute: '' }]);
  const patchCard = (i, patch) => setCards((c) => c.map((cd, idx) => (idx === i ? { ...cd, ...patch } : cd)));
  const removeCard = (i) => setCards((c) => c.filter((_, idx) => idx !== i));

  // Appearances (who played): 'xi' (started) | 'bench' | 'none'
  const statusOf = (id) => {
    const a = appearances.find((x) => x.playerId === id);
    return a ? (a.started ? 'xi' : 'bench') : 'none';
  };
  const setStatus = (p, st) => setAppearances((a) => {
    const rest = a.filter((x) => x.playerId !== p._id);
    return st === 'none' ? rest : [...rest, { playerId: p._id, playerName: p.name, started: st === 'xi' }];
  });
  const clearAppearances = () => setAppearances([]);

  // Substitutions
  const addSub = () => setSubs((s) => [...s, { offPlayerId: '', offName: '', onPlayerId: '', onName: '', minute: '' }]);
  const patchSub = (i, patch) => setSubs((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const removeSub = (i) => setSubs((s) => s.filter((_, idx) => idx !== i));

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
        scorers.filter((s) => s.playerId).map((s) => ({
          playerId: s.playerId, playerName: s.playerName || nameOf(s.playerId), minute: s.minute,
          assistPlayerId: s.assistPlayerId || null, assistName: s.assistPlayerId ? (s.assistName || nameOf(s.assistPlayerId)) : '',
        }))));
      fd.append('cards', JSON.stringify(
        cards.filter((c) => c.playerId).map((c) => ({
          playerId: c.playerId, playerName: c.playerName || nameOf(c.playerId), type: c.type, minute: c.minute,
        }))));
      fd.append('appearances', JSON.stringify(
        appearances.filter((a) => a.playerId).map((a) => ({ playerId: a.playerId, playerName: a.playerName || nameOf(a.playerId), started: !!a.started }))));
      fd.append('substitutions', JSON.stringify(
        subs.filter((s) => s.offPlayerId || s.onPlayerId).map((s) => ({
          offPlayerId: s.offPlayerId || null, offName: s.offPlayerId ? (s.offName || nameOf(s.offPlayerId)) : '',
          onPlayerId: s.onPlayerId || null, onName: s.onPlayerId ? (s.onName || nameOf(s.onPlayerId)) : '', minute: s.minute,
        }))));
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
                  <button className="btn btn--outline btn--sm" onClick={() => setLineupMatch(m)}>Postava{m.lineup?.length ? ` (${m.lineup.length})` : ''}</button>
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
              <select className="select" name="season" value={form.season} onChange={onChange}>
                {((seasons || []).includes(form.season) || !form.season ? (seasons || []) : [form.season, ...(seasons || [])]).map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
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

              <h4 className="admin-form-section">Strelci (goli) <button type="button" className="btn btn--outline btn--sm" onClick={addScorer}>+ Dodaj gol</button></h4>
              {scorers.length === 0 && <p className="text-muted">Ni vnesenih golov.</p>}
              {scorers.map((s, i) => (
                <div className="row scorer-row ev-row" key={i} style={{ alignItems: 'center' }}>
                  <PlayerSelect players={players} value={s.playerId} onChange={(id) => patchScorer(i, { playerId: id, playerName: nameOf(id) })} style={{ flex: 2 }} placeholder="— strelec —" />
                  <input className="input" style={{ width: 70, flex: 'none' }} type="number" min="1" max="130" placeholder="min." value={s.minute} onChange={(e) => patchScorer(i, { minute: e.target.value })} />
                  <PlayerSelect players={players} value={s.assistPlayerId} onChange={(id) => patchScorer(i, { assistPlayerId: id, assistName: nameOf(id) })} style={{ flex: 2 }} placeholder="— asistenca (neobvezno) —" />
                  <button type="button" className="btn btn--sm admin-del" onClick={() => removeScorer(i)}>✕</button>
                </div>
              ))}

              <h4 className="admin-form-section">Kartoni <button type="button" className="btn btn--outline btn--sm" onClick={addCard}>+ Dodaj karton</button></h4>
              {cards.length === 0 && <p className="text-muted">Ni vnesenih kartonov.</p>}
              {cards.map((c, i) => (
                <div className="row scorer-row ev-row" key={i} style={{ alignItems: 'center' }}>
                  <PlayerSelect players={players} value={c.playerId} onChange={(id) => patchCard(i, { playerId: id, playerName: nameOf(id) })} style={{ flex: 2 }} placeholder="— igralec —" />
                  <select className="select" style={{ width: 120, flex: 'none' }} value={c.type} onChange={(e) => patchCard(i, { type: e.target.value })}>
                    <option value="yellow">Rumeni</option>
                    <option value="red">Rdeči</option>
                  </select>
                  <input className="input" style={{ width: 70, flex: 'none' }} type="number" min="1" max="130" placeholder="min." value={c.minute} onChange={(e) => patchCard(i, { minute: e.target.value })} />
                  <button type="button" className="btn btn--sm admin-del" onClick={() => removeCard(i)}>✕</button>
                </div>
              ))}

              <h4 className="admin-form-section">
                Nastopi — prva postava / klop
                <button type="button" className="btn btn--outline btn--sm" onClick={clearAppearances}>Počisti</button>
              </h4>
              <p className="text-muted" style={{ marginTop: -6, fontSize: '0.84rem' }}>Označi, kdo je v prvi postavi (Prva) in kdo na klopi (Klop). Oboji dobijo nastop.</p>
              <div className="appear-grid">
                {players.filter((p) => p.active !== false).map((p) => {
                  const st = statusOf(p._id);
                  return (
                    <div key={p._id} className={`appear-row appear-row--${st}`}>
                      <span className="appear-row__nm">{p.shirtNumber != null ? `${p.shirtNumber}. ` : ''}{p.name}</span>
                      <select className="select appear-row__sel" value={st} onChange={(e) => setStatus(p, e.target.value)}>
                        <option value="none">—</option>
                        <option value="xi">Prva</option>
                        <option value="bench">Klop</option>
                      </select>
                    </div>
                  );
                })}
              </div>

              <h4 className="admin-form-section">Zamenjave <button type="button" className="btn btn--outline btn--sm" onClick={addSub}>+ Dodaj zamenjavo</button></h4>
              {subs.length === 0 && <p className="text-muted">Ni vnesenih zamenjav.</p>}
              {subs.map((s, i) => (
                <div className="row scorer-row ev-row" key={i} style={{ alignItems: 'center' }}>
                  <span className="sub-arrow sub-arrow--in" title="vstopil">▲</span>
                  <PlayerSelect players={players} value={s.onPlayerId} onChange={(id) => patchSub(i, { onPlayerId: id, onName: nameOf(id) })} style={{ flex: 2 }} placeholder="— vstopil —" />
                  <span className="sub-arrow sub-arrow--out" title="zamenjal">▼</span>
                  <PlayerSelect players={players} value={s.offPlayerId} onChange={(id) => patchSub(i, { offPlayerId: id, offName: nameOf(id) })} style={{ flex: 2 }} placeholder="— zamenjal —" />
                  <input className="input" style={{ width: 64, flex: 'none' }} type="number" min="1" max="130" placeholder="min." value={s.minute} onChange={(e) => patchSub(i, { minute: e.target.value })} />
                  <button type="button" className="btn btn--sm admin-del" onClick={() => removeSub(i)}>✕</button>
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

      <Modal open={!!lineupMatch} title={lineupMatch ? `Postava — ${lineupMatch.opponent}` : 'Postava'} onClose={() => setLineupMatch(null)} wide>
        {lineupMatch && (
          <LineupEditor
            initialLineup={lineupMatch.lineup || []}
            players={players}
            scorers={lineupMatch.scorers || []}
            onCancel={() => setLineupMatch(null)}
            onSave={saveLineup}
            saving={lineupSaving}
          />
        )}
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
