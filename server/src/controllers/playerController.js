import Player from '../models/Player.js';
import { publicPath } from '../middleware/upload.js';

/** Parse the nested stats object whether it arrives as JSON string or flat fields. */
function parseStats(body) {
  if (body.stats) {
    try {
      return typeof body.stats === 'string' ? JSON.parse(body.stats) : body.stats;
    } catch {
      /* fall through to flat parsing */
    }
  }
  const keys = ['appearances', 'goals', 'assists', 'yellowCards', 'redCards'];
  const stats = {};
  keys.forEach((k) => {
    if (body[k] !== undefined) stats[k] = Number(body[k]) || 0;
  });
  return Object.keys(stats).length ? stats : undefined;
}

function buildFields(body, file) {
  const fields = {};
  ['name', 'position', 'bio', 'nationality'].forEach((k) => {
    if (body[k] !== undefined) fields[k] = body[k];
  });
  if (body.shirtNumber !== undefined && body.shirtNumber !== '')
    fields.shirtNumber = Number(body.shirtNumber);
  if (body.heightCm !== undefined && body.heightCm !== '')
    fields.heightCm = Number(body.heightCm);
  if (body.birthdate) fields.birthdate = new Date(body.birthdate);
  if (body.active !== undefined) fields.active = body.active === 'true' || body.active === true;
  const stats = parseStats(body);
  if (stats) fields.stats = stats;
  if (file) fields.photo = publicPath(file);
  return fields;
}

/** Public/admin: list players (sorted by position then shirt number). */
export async function list(req, res, next) {
  try {
    const order = { goalkeeper: 0, defender: 1, midfielder: 2, forward: 3 };
    const players = await Player.find().lean();
    players.sort(
      (a, b) =>
        (order[a.position] ?? 9) - (order[b.position] ?? 9) ||
        (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
    );
    res.json(players);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Igralec ni najden.' });
    res.json(player);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const player = await Player.create(buildFields(req.body, req.file));
    res.status(201).json(player);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const fields = buildFields(req.body, req.file);
    const player = await Player.findByIdAndUpdate(req.params.id, fields, {
      new: true,
      runValidators: true,
    });
    if (!player) return res.status(404).json({ error: 'Igralec ni najden.' });
    res.json(player);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const player = await Player.findByIdAndDelete(req.params.id);
    if (!player) return res.status(404).json({ error: 'Igralec ni najden.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
