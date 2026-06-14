import ClubInfo from '../models/ClubInfo.js';
import { publicPath } from '../middleware/upload.js';

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

    ['name', 'shortName', 'history', 'address', 'email', 'phone', 'mapEmbedUrl'].forEach((k) => {
      if (b[k] !== undefined) info[k] = b[k];
    });
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

    if (req.file) info.logo = publicPath(req.file);

    await info.save();
    res.json(info);
  } catch (err) {
    next(err);
  }
}
