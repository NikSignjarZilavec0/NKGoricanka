/* eslint-disable no-unused-vars */

/** 404 for unknown API routes. */
export function apiNotFound(req, res) {
  res.status(404).json({ error: 'Vir ni najden.' });
}

/** Central error handler — keeps responses consistent and hides stack traces. */
export function errorHandler(err, req, res, next) {
  // Multer / upload errors
  if (err && err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Slika je prevelika (največ 5 MB).'
        : 'Napaka pri nalaganju datoteke.';
    return res.status(400).json({ error: msg });
  }

  // Mongoose validation / cast / duplicate key
  if (err && err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Napaka pri validaciji.', details: err.message });
  }
  if (err && err.name === 'CastError') {
    return res.status(400).json({ error: 'Neveljaven identifikator.' });
  }
  if (err && err.code === 11000) {
    return res.status(409).json({ error: 'Zapis s temi podatki že obstaja.' });
  }

  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.expose ? err.message : 'Prišlo je do napake na strežniku.',
  });
}
