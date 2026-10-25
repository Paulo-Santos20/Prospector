import { auth } from '../config/firebase.js';
import { allowedEmails } from '../config/env.js';

export const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Autenticação necessária', requestId: req.id });
  }

  try {
    const decoded = await auth.verifyIdToken(token);

    if (
      allowedEmails.size > 0 &&
      !allowedEmails.has((decoded.email || '').toLowerCase())
    ) {
      return res.status(403).json({ error: 'Acesso não autorizado', requestId: req.id });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      picture: decoded.picture || null,
    };
    next();
  } catch (err) {
    console.warn(`[${req.id}] token inválido:`, err.code || err.message);
    return res.status(401).json({ error: 'Sessão inválida ou expirada', requestId: req.id });
  }
};
