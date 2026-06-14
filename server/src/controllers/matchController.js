import crypto from 'node:crypto';
import Match, { MATCH_STATUS } from '../models/Match.js';
import { publicPath } from '../middleware/upload.js';
import { addClient, broadcastMatch } from '../live/liveBus.js';

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
  if (body.minute !== undefined) fields.minute = body.minute === '' ? null : Number(body.minute);

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
    broadcastMatch(match.toJSON());
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
    broadcastMatch(match.toJSON());
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

/* ----------------------------- Live coverage ---------------------------- */

/** SSE stream of match updates (public). */
export function stream(req, res) {
  addClient(res);
}

/** Admin: (re)generate a per-match live key and return the shareable URL. */
export async function generateLiveKey(req, res, next) {
  try {
    const match = await Match.findById(req.params.id).select('+liveKey');
    if (!match) return res.status(404).json({ error: 'Tekma ni najdena.' });
    match.liveKey = crypto.randomBytes(16).toString('hex');
    await match.save();
    const base = (process.env.SITE_URL || '').replace(/\/$/, '');
    res.json({ liveKey: match.liveKey, liveUrl: `${base}/live/${match._id}?key=${match.liveKey}` });
  } catch (err) {
    next(err);
  }
}

/**
 * Live update from a contributor at the match.
 * Auth: a valid live key (header `x-live-key` / body / query) OR an admin session.
 */
export async function liveUpdate(req, res, next) {
  try {
    const match = await Match.findById(req.params.id).select('+liveKey');
    if (!match) return res.status(404).json({ error: 'Tekma ni najdena.' });

    const provided = req.get('x-live-key') || req.body?.liveKey || req.query.key;
    const isAdmin = Boolean(req.session && req.session.userId);
    if (!isAdmin && (!match.liveKey || provided !== match.liveKey)) {
      return res.status(401).json({ error: 'Neveljaven ali manjkajoč ključ za živo posodabljanje.' });
    }

    const b = req.body || {};
    if (b.status !== undefined && MATCH_STATUS.includes(b.status)) match.status = b.status;
    if (b.minute !== undefined) match.minute = b.minute === '' || b.minute === null ? null : Number(b.minute);

    const ours = b.scoreOurs ?? b['score.ours'];
    const theirs = b.scoreTheirs ?? b['score.theirs'];
    if (ours !== undefined || theirs !== undefined) {
      match.score = {
        ours: ours === '' || ours == null ? match.score?.ours ?? null : Number(ours),
        theirs: theirs === '' || theirs == null ? match.score?.theirs ?? null : Number(theirs),
      };
    }

    const scorers = parseScorers(b);
    if (scorers !== undefined) match.scorers = scorers;

    match.liveUpdatedAt = new Date();
    await match.save();

    const json = match.toJSON();
    broadcastMatch(json);
    res.json(json);
  } catch (err) {
    next(err);
  }
}
