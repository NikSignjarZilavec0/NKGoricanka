import Match from '../models/Match.js';
import { publicPath } from '../middleware/upload.js';

function parseScorers(body) {
  if (body.scorers === undefined) return undefined;
  try {
    const arr = typeof body.scorers === 'string' ? JSON.parse(body.scorers) : body.scorers;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => s && s.playerName)
      .map((s) => ({
        playerName: String(s.playerName).trim(),
        minute: s.minute !== undefined && s.minute !== '' ? Number(s.minute) : undefined,
      }));
  } catch {
    return [];
  }
}

function buildFields(body, file) {
  const fields = {};
  ['opponent', 'location', 'competition', 'season', 'status'].forEach((k) => {
    if (body[k] !== undefined) fields[k] = body[k];
  });
  if (body.isHome !== undefined) fields.isHome = body.isHome === 'true' || body.isHome === true;
  if (body.date) fields.date = new Date(body.date);

  // Score: allow nested object or flat scoreOurs/scoreTheirs.
  const ours = body['score.ours'] ?? body.scoreOurs ?? body.ours;
  const theirs = body['score.theirs'] ?? body.scoreTheirs ?? body.theirs;
  if (ours !== undefined || theirs !== undefined) {
    fields.score = {
      ours: ours === '' || ours === undefined ? null : Number(ours),
      theirs: theirs === '' || theirs === undefined ? null : Number(theirs),
    };
  }

  const scorers = parseScorers(body);
  if (scorers !== undefined) fields.scorers = scorers;
  if (file) fields.opponentLogo = publicPath(file);
  return fields;
}

/** Public/admin: list matches, optionally filtered by status. */
export async function list(req, res, next) {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    // Upcoming: ascending by date. Finished/all: descending.
    const sort = status === 'upcoming' ? { date: 1 } : { date: -1 };
    const matches = await Match.find(filter).sort(sort);
    res.json(matches);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ error: 'Tekma ni najdena.' });
    res.json(match);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const match = await Match.create(buildFields(req.body, req.file));
    res.status(201).json(match);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, buildFields(req.body, req.file), {
      new: true,
      runValidators: true,
    });
    if (!match) return res.status(404).json({ error: 'Tekma ni najdena.' });
    res.json(match);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);
    if (!match) return res.status(404).json({ error: 'Tekma ni najdena.' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
