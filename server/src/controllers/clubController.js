import ClubInfo from '../models/ClubInfo.js';
import Match from '../models/Match.js';
import Standing from '../models/Standing.js';
import { publicPath } from '../middleware/upload.js';

/** Public: the canonical season list (+ any used by matches/standings) and the current season. */
export async function seasons(req, res, next) {
  try {
    const info = await getClubInfo();
    const sets = await Promise.all([Match.distinct('season'), Standing.distinct('season')]);
    const all = new Set([...(info.seasons || []), ...sets.flat()].filter(Boolean));
    if (info.currentSeason) all.add(info.currentSeason);
    // newest first (string sort works for "YYYY/YY")
    const list = [...all].sort().reverse();
    res.json({ seasons: list, current: info.currentSeason || list[0] || '' });
  } catch (err) {
    next(err);
  }
}

/** Always return the singleton, creating an empty one if needed. */
export async function getClubInfo() {
  let info = await ClubInfo.findOne({ key: 'singleton' });
  if (!info) info = await ClubInfo.create({ key: 'singleton' });
  return info;
}

/** Public: club info. */
export async function get(req, res, next) {
  try {
    const info = await getClubInfo();
    res.json(info);
  } catch (err) {
    next(err);
  }
}

/** Admin: update club info (logo optional). */
export async function update(req, res, next) {
  try {
    const info = await getClubInfo();
    const b = req.body;

    ['name', 'shortName', 'history', 'address', 'email', 'phone', 'mapEmbedUrl', 'currentSeason'].forEach((k) => {
      if (b[k] !== undefined) info[k] = b[k];
    });

    // Season list management (canonical list of seasons).
    if (b.seasons !== undefined) {
      const arr = typeof b.seasons === 'string' ? JSON.parse(b.seasons) : b.seasons;
      if (Array.isArray(arr)) {
        info.seasons = [...new Set(arr.map((s) => String(s).trim()).filter(Boolean))].sort().reverse();
      }
    }
    // Ensure the current season is always part of the list.
    if (info.currentSeason && !info.seasons.includes(info.currentSeason)) {
      info.seasons = [...new Set([info.currentSeason, ...info.seasons])].sort().reverse();
    }
    if (b.foundedYear !== undefined && b.foundedYear !== '')
      info.foundedYear = Number(b.foundedYear);
    if (b.latitude !== undefined && b.latitude !== '') info.latitude = Number(b.latitude);
    if (b.longitude !== undefined && b.longitude !== '') info.longitude = Number(b.longitude);

    if (b['colors.primary'] !== undefined) info.colors.primary = b['colors.primary'];
    if (b['colors.accent'] !== undefined) info.colors.accent = b['colors.accent'];
    if (b.colors) {
      const colors = typeof b.colors === 'string' ? JSON.parse(b.colors) : b.colors;
      if (colors.primary) info.colors.primary = colors.primary;
      if (colors.accent) info.colors.accent = colors.accent;
    }

    ['facebook', 'instagram', 'youtube', 'twitter'].forEach((net) => {
      const flat = b[`socialLinks.${net}`];
      if (flat !== undefined) info.socialLinks[net] = flat;
    });
    if (b.socialLinks) {
      const sl = typeof b.socialLinks === 'string' ? JSON.parse(b.socialLinks) : b.socialLinks;
      Object.entries(sl).forEach(([k, v]) => {
        if (info.socialLinks[k] !== undefined) info.socialLinks[k] = v;
      });
    }

    // Uploaded files: logo and/or team photo (multer .fields → req.files).
    if (req.files?.logo?.[0]) info.logo = publicPath(req.files.logo[0]);
    if (req.files?.teamPhoto?.[0]) info.teamPhoto = publicPath(req.files.teamPhoto[0]);

    await info.save();
    res.json(info);
  } catch (err) {
    next(err);
  }
}
