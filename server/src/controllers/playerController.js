import Player from '../models/Player.js';
import { publicPath } from '../middleware/upload.js';

const STAT_KEYS = ['appearances', 'goals', 'assists', 'yellowCards', 'redCards'];
const zeroStats = () => ({ appearances: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 });

/** Parse the nested stats object whether it arrives as JSON string or flat fields. */
function parseStats(body) {
  if (body.stats) {
    try {
      return typeof body.stats === 'string' ? JSON.parse(body.stats) : body.stats;
    } catch {
      /* fall through to flat parsing */
    }
  }
  const stats = {};
  STAT_KEYS.forEach((k) => {
    if (body[k] !== undefined) stats[k] = Number(body[k]) || 0;
  });
  return Object.keys(stats).length ? stats : undefined;
}

/** Read a seasonStats entry from a plain object or a Mongoose Map. */
function readSeason(seasonStats, season) {
  if (!seasonStats) return undefined;
  return seasonStats instanceof Map ? seasonStats.get(season) : seasonStats[season];
}
function allSeasonValues(seasonStats) {
  if (!seasonStats) return [];
  return seasonStats instanceof Map ? [...seasonStats.values()] : Object.values(seasonStats);
}

/** Resolve a player's stats for a given season (no season → totals across all seasons). */
function statsFor(seasonStats, season) {
  if (season) return { ...zeroStats(), ...(readSeason(seasonStats, season) || {}) };
  const total = zeroStats();
  allSeasonValues(seasonStats).forEach((s) => STAT_KEYS.forEach((k) => { total[k] += s?.[k] || 0; }));
  return total;
}

/** Attach a flat `stats` field for the requested season (keeps `seasonStats` too). */
function withStats(playerObj, season) {
  return { ...playerObj, stats: statsFor(playerObj.seasonStats, season) };
}

/** Profile fields shared across all seasons. */
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

/** Public/admin: list players (all seasons), with stats resolved for `?season=`. */
export async function list(req, res, next) {
  try {
    const order = { goalkeeper: 0, defender: 1, midfielder: 2, forward: 3 };
    const players = await Player.find().lean();
    players.sort(
      (a, b) =>
        (order[a.position] ?? 9) - (order[b.position] ?? 9) ||
        (a.shirtNumber ?? 99) - (b.shirtNumber ?? 99)
    );
    res.json(players.map((p) => withStats(p, req.query.season)));
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const player = await Player.findById(req.params.id).lean();
    if (!player) return res.status(404).json({ error: 'Igralec ni najden.' });
    res.json(withStats(player, req.query.season));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const fields = profileFields(req.body, req.file);
    const season = req.body.season;
    const stats = parseStats(req.body);
    if (season && stats) fields.seasonStats = { [season]: stats };
    const player = await Player.create(fields);
    res.status(201).json(withStats(player.toJSON(), season));
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Igralec ni najden.' });
    Object.assign(player, profileFields(req.body, req.file));
    const season = req.body.season;
    const stats = parseStats(req.body);
    if (season && stats) player.seasonStats.set(season, stats);
    await player.save();
    res.json(withStats(player.toJSON(), season));
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
