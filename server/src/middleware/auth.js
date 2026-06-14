/**
 * Guard admin routes. The session stores `userId` after a successful login.
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Neavtoriziran dostop. Prijava je obvezna.' });
}
