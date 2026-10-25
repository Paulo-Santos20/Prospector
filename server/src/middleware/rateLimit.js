import { rateLimit } from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em instantes.' },
});
