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

export default api;
