import crypto from 'crypto';

// In-memory session store. This resets if the server restarts, which is
// fine here — it just means the admin has to log in again. No database
// table needed for something this small.
const activeSessions = new Set();

export function createSession() {
  const token = crypto.randomBytes(24).toString('hex');
  activeSessions.add(token);
  return token;
}

export function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
