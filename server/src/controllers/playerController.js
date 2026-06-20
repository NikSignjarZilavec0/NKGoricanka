import Player from '../models/Player.js';
import Match from '../models/Match.js';
import { publicPath } from '../middleware/upload.js';

const zeroStats = () => ({ appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 });

/**
 * Aggregate per-player stats from matches (single source of truth).
 * Keyed by playerId string. A player "appears" in a match if they are in the
 * appearances list OR they scored/assisted/were carded in it.
 */
function aggregateMatches(matches) {
  const map = new Map();
  const ensure = (k) => {
    if (!map.has(k)) map.set(k, zeroStats());
    return map.get(k);
  };
  for (const m of matches) {
    const appeared = new Set();
    (m.scorers || []).forEach((s) => {
      if (s.playerId) { ensure(String(s.playerId)).goals += 1; appeared.add(String(s.playerId)); }
      if (s.assistPlayerId) { ensure(String(s.assistPlayerId)).assists += 1; appeared.add(String(s.assistPlayerId)); }
    });
    (m.cards || []).forEach((c) => {
      if (c.playerId) {
        ensure(String(c.playerId))[c.type === 'red' ? 'redCards' : 'yellowCards'] += 1;
        appeared.add(String(c.playerId));
      }
    });
    (m.appearances || []).forEach((a) => { if (a.playerId) appeared.add(String(a.playerId)); });
    appeared.forEach((k) => { ensure(k).appearances += 1; });
  }
  return map;
}

/** Fetch the matches relevant to a season (all if none) with just the event fields. */
function matchesForSeason(season) {
  return Match.find(season ? { season } : {}).select('scorers cards appearances').lean();
}

/** Profile fields shared across all seasons (stats are derived, never stored here). */
function profileFields(body, file) {
  const fields = {};
  ['name', 'position', 'bio', 'nationality'].forEach((k) => {
    if (body[k] !== undefined) fields[k] = body[k];
  });
  if (body.shirtNumber !== undefined && body.shirtNumber !== '') fields.shirtNumber = Number(body.shirtNumber);
  if (body.heightCm !== undefined && body.heightCm !== '') fields.heightCm = Number(body.heightCm);
  if (body.birthdate) fields.birthdate = new Date(body.birthdate);
  if (body.active !== undefined) fields.active = body.active === 'true' || body.active === true;
  if (file) fields.photo = publicPath(file);
  return fields;
}

/** Public/admin: list players with stats derived for `?season=` (no season = all). */
export async function list(req, res, next) {
  try {
    const order = { goalkeeper: 0, defender: 1, midfielder: 2, forward: 3 };
    const [players, matches] = await Promise.all([
      Player.find().lean(),
      matchesForSeason(req.query.season),
    ]);
    const agg = aggregateMatches(matches);
    players.sort(
      (a, b) =>
        (order[a.position] ?? 9) - (order[b.position] ?? 9) ||
        (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
    );
    res.json(players.map((p) => ({ ...p, stats: agg.get(String(p._id)) || zeroStats() })));
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const player = await Player.findById(req.params.id).lean();
    if (!player) return res.status(404).json({ error: 'Igralec ni najden.' });
    const matches = await matchesForSeason(req.query.season);
    const agg = aggregateMatches(matches);
    res.json({ ...player, stats: agg.get(String(player._id)) || zeroStats() });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const player = await Player.create(profileFields(req.body, req.file));
    res.status(201).json({ ...player.toJSON(), stats: zeroStats() });
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const player = await Player.findByIdAndUpdate(req.params.id, profileFields(req.body, req.file), {
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
