import { isProduction } from '../config/env.js';

export const notFound = (req, res, next) => {
  if (!req.path.startsWith('/api')) return next();
  res.status(404).json({ error: 'Rota não encontrada', requestId: req.id });
};

export const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  if (status >= 500) {
    console.error(`[${req.id}] ${req.method} ${req.originalUrl}`, err);
  }

  res.status(status).json({
    error:
      status >= 500 && isProduction
        ? 'Erro interno do servidor'
        : err.message || 'Erro interno do servidor',
    requestId: req.id,
  });
};
