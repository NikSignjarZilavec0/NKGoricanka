import axios from 'axios';

/**
 * Single axios instance. Same-origin in production (Express serves the build);
 * in dev, Vite proxies /api to :5000. withCredentials keeps the session cookie.
 */
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

/** Build an absolute-ish URL for an uploaded/static image path. */
export function imageUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
}

/** Extract a human-friendly error message from an axios error. */
export function errMessage(err, fallback = 'Prišlo je do napake.') {
  return err?.response?.data?.error || err?.message || fallback;
}

/**
 * Copy text to the clipboard. The async Clipboard API only works in secure
 * contexts (HTTPS/localhost); the site runs over plain HTTP, so fall back to a
 * hidden textarea + execCommand. Returns true on success.
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export default api;
