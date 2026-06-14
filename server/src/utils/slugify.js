/**
 * Turn a (possibly Slovenian) string into a URL-safe slug.
 * Handles šžč → szc and strips diacritics.
 */
export function slugify(input) {
  const map = { 'š': 's', 'ž': 'z', 'č': 'c', 'ć': 'c', 'đ': 'd' };
  return String(input)
    .toLowerCase()
    .replace(/[šžčćđ]/g, (ch) => map[ch] || ch)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove remaining accents
    .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics → dash
    .replace(/^-+|-+$/g, '') // trim dashes
    .replace(/-{2,}/g, '-'); // collapse repeats
}

/**
 * Ensure a slug is unique within a collection by appending -2, -3, ...
 * @param {import('mongoose').Model} Model
 * @param {string} base
 * @param {string} [excludeId] document id to ignore (for updates)
 */
export async function uniqueSlug(Model, base, excludeId) {
  const slug = slugify(base) || 'novica';
  let candidate = slug;
  let n = 2;
  /* eslint-disable no-await-in-loop */
  while (true) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await Model.exists(query);
    if (!exists) return candidate;
    candidate = `${slug}-${n}`;
    n += 1;
  }
}
