import { useRef, useState } from 'react';
import { imageUrl } from '../api/client.js';
import { PitchLines } from './LineupPitch.jsx';

const clamp = (v) => Math.max(3, Math.min(97, v));
const initialsOf = (name) => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
// Spread freshly added players so they don't stack on the same spot.
const defaultPos = (idx) => ({ x: 15 + (idx % 5) * 17.5, y: 82 - Math.floor(idx / 5) * 15 });

/**
 * Drag-and-drop lineup editor for our team. Manages a local lineup array and
 * hands it back via onSave. Players come from the roster (bench) or added manually.
 */
export default function LineupEditor({ initialLineup = [], players = [], scorers = [], onCancel, onSave, saving }) {
  const [lineup, setLineup] = useState(() => initialLineup.map((s) => ({ ...s })));
  const [selected, setSelected] = useState(null);
  const pitchRef = useRef(null);

  const placedIds = new Set(lineup.map((s) => s.playerId).filter(Boolean));
  const bench = players.filter((p) => !placedIds.has(p._id));

  const update = (i, patch) => setLineup((L) => L.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeAt = (i) => { setLineup((L) => L.filter((_, idx) => idx !== i)); setSelected(null); };
  // Captain and goalkeeper are exclusive.
  const setExclusive = (i, key, val) =>
    setLineup((L) => L.map((s, idx) => ({ ...s, [key]: idx === i ? val : (val ? false : s[key]) })));

  const addFromRoster = (p) => {
    setLineup((L) => [...L, {
      playerId: p._id, name: p.name, number: p.shirtNumber ?? '', photo: p.photo || '',
      ...defaultPos(L.length), isCaptain: false, isGoalkeeper: p.position === 'goalkeeper',
    }]);
    setSelected(lineup.length);
  };

  const addManual = () => {
    const name = window.prompt('Ime igralca (samo za to postavo):');
    if (!name || !name.trim()) return;
    setLineup((L) => [...L, {
      playerId: null, name: name.trim(), number: '', photo: '',
      ...defaultPos(L.length), isCaptain: false, isGoalkeeper: false,
    }]);
    setSelected(lineup.length);
  };

  const startDrag = (e, index) => {
    e.preventDefault();
    setSelected(index);
    const start = { x: e.clientX, y: e.clientY };
    const move = (ev) => {
      const rect = pitchRef.current.getBoundingClientRect();
      const x = clamp(((ev.clientX - rect.left) / rect.width) * 100);
      const y = clamp(((ev.clientY - rect.top) / rect.height) * 100);
      update(index, { x, y });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const sel = selected != null ? lineup[selected] : null;

  return (
    <div className="lineup-editor">
      <p className="text-muted lineup-editor__hint">
        Povleci igralce iz klopi na igrišče in jih razporedi. Klikni krogec za urejanje (številka, kapetan,
        golman, kartoni, asistence). Goli se preberejo iz strelcev tekme. Postava je neobvezna.
      </p>
      <div className="lineup-editor__grid">
        <div className="pitch pitch--edit" ref={pitchRef}>
          <PitchLines />
          {lineup.map((s, i) => (
            <div
              key={i}
              className={`pitch-player ${selected === i ? 'is-selected' : ''}`}
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
              onPointerDown={(e) => startDrag(e, i)}
            >
              <div className={`pitch-player__disc ${s.isGoalkeeper ? 'is-gk' : ''}`}>
                {s.photo ? <img src={imageUrl(s.photo)} alt="" /> : <span className="pitch-player__init">{initialsOf(s.name)}</span>}
                {s.isGoalkeeper && <span className="pitch-player__gk">GK</span>}
                {s.isCaptain && <span className="pitch-player__cap">C</span>}
                {s.number !== '' && s.number != null && <span className="pitch-player__num">{s.number}</span>}
              </div>
              <span className="pitch-player__name">{s.name}</span>
            </div>
          ))}
        </div>

        <div className="lineup-editor__side">
          {sel ? (
            <div className="card lineup-ctl">
              <div className="lineup-ctl__head">
                <strong>{sel.name}</strong>
                <button type="button" className="btn btn--sm admin-del" onClick={() => removeAt(selected)}>Odstrani</button>
              </div>
              <div className="field"><label>Številka</label>
                <input className="input" type="number" min="1" max="99" value={sel.number}
                  onChange={(e) => update(selected, { number: e.target.value })} /></div>
              <div className="row" style={{ gap: 18 }}>
                <label className="checkbox"><input type="checkbox" checked={sel.isCaptain} onChange={(e) => setExclusive(selected, 'isCaptain', e.target.checked)} /> Kapetan</label>
                <label className="checkbox"><input type="checkbox" checked={sel.isGoalkeeper} onChange={(e) => setExclusive(selected, 'isGoalkeeper', e.target.checked)} /> Golman</label>
              </div>
              <p className="text-muted" style={{ margin: '4px 0 0', fontSize: '0.8rem' }}>Goli, asistence in kartoni se prikažejo samodejno iz podatkov tekme.</p>
            </div>
          ) : (
            <div className="card lineup-ctl"><p className="text-muted" style={{ margin: 0 }}>Klikni igralca na igrišču za urejanje.</p></div>
          )}

          <div className="card lineup-bench">
            <div className="lineup-bench__head">
              <strong>Klop ({bench.length})</strong>
              <button type="button" className="btn btn--outline btn--sm" onClick={addManual}>+ Ročno</button>
            </div>
            {bench.length === 0 && <p className="text-muted" style={{ margin: '6px 0 0' }}>Vsi igralci so na igrišču.</p>}
            <div className="lineup-bench__list">
              {bench.map((p) => (
                <button type="button" key={p._id} className="lineup-bench__item" onClick={() => addFromRoster(p)}>
                  <span className="lineup-bench__av">
                    {p.photo ? <img src={imageUrl(p.photo)} alt="" /> : initialsOf(p.name)}
                  </span>
                  <span className="lineup-bench__nm">{p.shirtNumber != null ? `${p.shirtNumber}. ` : ''}{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="modal__foot">
        <button type="button" className="btn btn--outline" onClick={onCancel}>Prekliči</button>
        {lineup.length > 0 && (
          <button type="button" className="btn btn--ghost" onClick={() => { setLineup([]); setSelected(null); }}>Počisti</button>
        )}
        <button type="button" className="btn btn--primary" disabled={saving} onClick={() => onSave(lineup)}>
          {saving ? 'Shranjujem…' : 'Shrani postavo'}
        </button>
      </div>
    </div>
  );
}
