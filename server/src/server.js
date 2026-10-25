import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`Prospector API rodando na porta ${env.PORT}`);
});

const shutdown = (signal) => {
  console.log(`[${signal}] encerrando servidor...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (error) => {
  console.error('[unhandledRejection]', error);
});
