import Standing from '../models/Standing.js';
import { publicPath } from '../middleware/upload.js';

const NUM = ['played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'groupOrder'];

function buildFields(body, file) {
  const f = {};
  ['season', 'group', 'team', 'trend'].forEach((k) => {
    if (body[k] !== undefined) f[k] = body[k];
  });
  NUM.forEach((k) => {
    if (body[k] !== undefined && body[k] !== '') f[k] = Number(body[k]);
  });
  if (file) f.teamLogo = publicPath(file);
  return f;
}

/** Public/admin: list standings for a season, ordered for display. */
export async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.season) filter.season = req.query.season;
    const rows = await Standing.find(filter).sort({
      groupOrder: 1,
      points: -1,
    });
    // tie-break by goal difference then goals scored (within the sort above)
    rows.sort(
      (a, b) =>
        a.groupOrder - b.groupOrder ||
        b.points - a.points ||
        b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
        b.goalsFor - a.goalsFor ||
        a.team.localeCompare(b.team)
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const row = await Standing.create(buildFields(req.body, req.file));
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const row = await Standing.findById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Vrstica ni najdena.' });
    Object.assign(row, buildFields(req.body, req.file));
    await row.save(); // pre-save recomputes points
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const row = await Standing.findByIdAndDelete(req.params.id);
    if (!row) return res.status(404).json({ error: 'Vrstica ni najdena.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
