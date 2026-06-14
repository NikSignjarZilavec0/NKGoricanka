import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: String(username).trim() });
    if (!user) {
      return res.status(401).json({ error: 'Napačno uporabniško ime ali geslo.' });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Napačno uporabniško ime ali geslo.' });
    }
    // Regenerate to avoid session fixation, then store the user id.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user._id.toString();
      req.session.username = user.username;
      res.json({ user: { id: user._id, username: user.username, role: user.role } });
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('nkg.sid');
    res.json({ ok: true });
  });
}

export async function me(req, res) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Ni prijavljen.' });
  }
  res.json({
    user: { id: req.session.userId, username: req.session.username, role: 'admin' },
  });
}
