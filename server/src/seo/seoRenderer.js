import fs from 'node:fs';
import News from '../models/News.js';
import Player from '../models/Player.js';
import { getClubInfo } from '../controllers/clubController.js';

/** Minimal HTML-attribute escaping for injected meta content. */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absUrl(siteUrl, pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/**
 * Resolve SEO metadata for a given public path.
 * Returns { title, description, image, url, type }.
 */
async function metaForPath(pathname, { siteUrl }) {
  const club = await getClubInfo().catch(() => null);
  const clubName = club?.name || 'NK Goričanka';
  const defaultImage = absUrl(siteUrl, club?.logo || '/og-default.svg');
  const url = absUrl(siteUrl, pathname);

  const base = {
    title: clubName,
    description:
      'Uradna spletna stran nogometnega kluba NK Goričanka — novice, igralski kader, razpored tekem in rezultati.',
    image: defaultImage,
    url,
    type: 'website',
  };

  // /news/:slug → article-specific tags
  const newsMatch = pathname.match(/^\/news\/([^/?#]+)/);
  if (newsMatch) {
    const item = await News.findOne({ slug: newsMatch[1], published: true })
      .select('title excerpt content coverImage publishedAt')
      .lean()
      .catch(() => null);
    if (item) {
      const desc = item.excerpt || String(item.content || '').replace(/\s+/g, ' ').slice(0, 180);
      return {
        title: `${item.title} — ${clubName}`,
        description: desc,
        image: item.coverImage ? absUrl(siteUrl, item.coverImage) : defaultImage,
        url,
        type: 'article',
        publishedTime: item.publishedAt,
      };
    }
  }

  // /players/:id → player-specific tags
  const playerMatch = pathname.match(/^\/players\/([a-f0-9]{24})/i);
  if (playerMatch) {
    const p = await Player.findById(playerMatch[1]).select('name position photo bio').lean().catch(() => null);
    if (p) {
      const posMap = {
        goalkeeper: 'vratar',
        defender: 'branilec',
        midfielder: 'vezist',
        forward: 'napadalec',
      };
      return {
        title: `${p.name} — ${clubName}`,
        description: p.bio || `${p.name}, ${posMap[p.position] || ''} pri ${clubName}.`,
        image: p.photo ? absUrl(siteUrl, p.photo) : defaultImage,
        url,
        type: 'profile',
      };
    }
  }

  // Static public sections
  const sections = {
    '/news': { title: `Novice — ${clubName}`, description: 'Najnovejše novice in dogodki kluba NK Goričanka.' },
    '/players': { title: `Igralski kader — ${clubName}`, description: 'Igralski kader NK Goričanka po pozicijah.' },
    '/matches': { title: `Tekme — ${clubName}`, description: 'Razpored prihajajočih tekem in rezultati odigranih tekem NK Goričanka.' },
    '/about': { title: `O klubu — ${clubName}`, description: 'Zgodovina, kontakt in lokacija nogometnega kluba NK Goričanka.' },
  };
  if (sections[pathname]) return { ...base, ...sections[pathname] };

  if (pathname === '/' || pathname === '') {
    return { ...base, title: `${clubName} — uradna spletna stran` };
  }

  return base;
}

/** Build the <head> meta block injected at the marker. */
function buildHead(meta) {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:site_name" content="NK Goričanka" />`,
    `<meta property="og:locale" content="sl_SI" />`,
    `<meta property="og:type" content="${esc(meta.type)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    meta.image ? `<meta property="og:image" content="${esc(meta.image)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    meta.image ? `<meta name="twitter:image" content="${esc(meta.image)}" />` : '',
    meta.publishedTime
      ? `<meta property="article:published_time" content="${esc(new Date(meta.publishedTime).toISOString())}" />`
      : '',
  ];
  return tags.filter(Boolean).join('\n    ');
}

/**
 * Express middleware that serves the SPA index.html with route-aware SEO tags.
 * @param {{ templatePath: string, siteUrl: string }} opts
 */
export function createSeoMiddleware({ templatePath, siteUrl }) {
  let template = '';
  try {
    template = fs.readFileSync(templatePath, 'utf-8');
  } catch (err) {
    console.warn(`[seo] Could not read template at ${templatePath}: ${err.message}`);
  }

  return async function seoMiddleware(req, res, next) {
    if (!template) return next();
    try {
      const meta = await metaForPath(req.path, { siteUrl });
      const head = buildHead(meta);
      const html = template
        .replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`)
        .replace('<!--SEO_TAGS-->', head);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch (err) {
      next(err);
    }
  };
}
