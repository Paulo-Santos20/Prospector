import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import leadsRoutes from './routes/leadsRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { getGlobalStats } from './controllers/statsController.js';
import { getUsageHandler } from './controllers/userController.js';
import { requireAuth } from './middleware/auth.js';
import { requestId } from './middleware/requestId.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import {
  allowedOrigins,
  env,
  hasFirebaseCredentials,
  isProduction,
} from './config/env.js';

const app = express();

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  return /^https:\/\/prospector-[a-z0-9-]+\.vercel\.app$/i.test(origin);
};

app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86_400,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(requestId);

morgan.token('request-id', (req) => req.id);
app.use(
  morgan(
    isProduction
      ? ':request-id :method :url :status :res[content-length] - :response-time ms'
      : 'dev'
  )
);

app.get('/', (_req, res) => {
  res.json({ status: 'Online', message: 'Prospector API' });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    firebaseConfigured: hasFirebaseCredentials,
    ai: {
      groq: Boolean(env.GROQ_API_KEY || env.GROQ_API_KEY_FALLBACK),
      gemini: Boolean(env.GEMINI_API_KEY),
    },
    providers: {
      foursquare: Boolean(env.FOURSQUARE_API_KEY),
      googleMaps: Boolean(env.GOOGLE_MAPS_API_KEY),
      geoapify: Boolean(env.GEOAPIFY_API_KEY),
      tomtom: Boolean(env.TOMTOM_API_KEY),
    },
  });
});

app.use('/api', apiLimiter);

app.use('/api/leads', requireAuth, leadsRoutes);
app.use('/api/crm', requireAuth, crmRoutes);
app.use('/api/users', requireAuth, userRoutes);
app.get('/api/stats', requireAuth, getGlobalStats);
app.get('/api/usage', requireAuth, getUsageHandler);

app.use(notFound);
app.use(errorHandler);

export default app;
