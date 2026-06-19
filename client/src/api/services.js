import api from './client.js';

/* ----------------------------- Public reads ----------------------------- */
export const clubApi = {
  get: () => api.get('/club').then((r) => r.data),
  update: (formData) =>
    api.put('/club', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
};

export const newsApi = {
  listPublished: () => api.get('/news').then((r) => r.data),
  getBySlug: (slug) => api.get(`/news/${slug}`).then((r) => r.data),
  // admin
  listAll: () => api.get('/news/admin/all').then((r) => r.data),
  getById: (id) => api.get(`/news/admin/${id}`).then((r) => r.data),
  create: (formData) => api.post('/news', formData, fd()).then((r) => r.data),
  update: (id, formData) => api.put(`/news/${id}`, formData, fd()).then((r) => r.data),
  remove: (id) => api.delete(`/news/${id}`).then((r) => r.data),
};

export const playersApi = {
  list: (season) => api.get('/players', { params: season ? { season } : {} }).then((r) => r.data),
  getById: (id) => api.get(`/players/${id}`).then((r) => r.data),
  create: (formData) => api.post('/players', formData, fd()).then((r) => r.data),
  update: (id, formData) => api.put(`/players/${id}`, formData, fd()).then((r) => r.data),
  remove: (id) => api.delete(`/players/${id}`).then((r) => r.data),
};

export const standingsApi = {
  list: (season) => api.get('/standings', { params: season ? { season } : {} }).then((r) => r.data),
  create: (formData) => api.post('/standings', formData, fd()).then((r) => r.data),
  update: (id, formData) => api.put(`/standings/${id}`, formData, fd()).then((r) => r.data),
  remove: (id) => api.delete(`/standings/${id}`).then((r) => r.data),
};

export const seasonsApi = {
  get: () => api.get('/seasons').then((r) => r.data),
};

export const matchesApi = {
  list: (status, season) =>
    api.get('/matches', { params: { ...(status ? { status } : {}), ...(season ? { season } : {}) } }).then((r) => r.data),
  getById: (id) => api.get(`/matches/${id}`).then((r) => r.data),
  create: (formData) => api.post('/matches', formData, fd()).then((r) => r.data),
  update: (id, formData) => api.put(`/matches/${id}`, formData, fd()).then((r) => r.data),
  remove: (id) => api.delete(`/matches/${id}`).then((r) => r.data),
  // Live coverage
  generateLiveKey: (id) => api.post(`/matches/${id}/live-key`).then((r) => r.data),
  liveUpdate: (id, key, data) =>
    api
      .patch(`/matches/${id}/live`, data, { headers: key ? { 'x-live-key': key } : {} })
      .then((r) => r.data),
  streamUrl: () => '/api/matches/stream',
};

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

function fd() {
  return { headers: { 'Content-Type': 'multipart/form-data' } };
}
