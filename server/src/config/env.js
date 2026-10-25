import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const integer = (fallback) => z.coerce.number().int().positive().catch(fallback);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).catch('development'),
  PORT: integer(10000),
  ALLOWED_ORIGINS: z
    .string()
    .catch('http://localhost:5173,http://127.0.0.1:5173,https://prospector-dun.vercel.app'),
  FIREBASE_JSON: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FOURSQUARE_API_KEY: z.string().optional(),
  GEOAPIFY_API_KEY: z.string().optional(),
  TOMTOM_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_API_KEY_FALLBACK: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  PAGESPEED_API_KEY: z.string().optional(),
  OWNER_UID: z.string().optional(),
  ALLOWED_EMAILS: z.string().catch(''),
  MAX_LEADS_PER_SEARCH: integer(20),
  MAX_SEARCHES_PER_DAY: integer(50),
  MAX_ANALYSES_PER_DAY: integer(100),
  MAX_AI_CALLS_PER_DAY: integer(100),
});

export const env = schema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const allowedOrigins = env.ALLOWED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
export const allowedEmails = new Set(
  env.ALLOWED_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export const localFirebasePath = path.resolve(
  process.cwd(),
  'src/config/firebase-service-account.json'
);

export const hasFirebaseCredentials = Boolean(
  env.FIREBASE_JSON ||
    (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) ||
    fs.existsSync(localFirebasePath)
);

if (!hasFirebaseCredentials && !isTest) {
  const message =
    'Firebase Admin sem credenciais: defina FIREBASE_JSON ou FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY.';
  if (isProduction) {
    console.error(`[env] ${message}`);
    process.exit(1);
  }
  console.warn(`[env] ${message} O servidor inicia, mas rotas autenticadas falharão.`);
}

if (!env.FOURSQUARE_API_KEY && !isTest) {
  console.warn('[env] FOURSQUARE_API_KEY ausente: busca Foursquare desabilitada.');
}

if (!env.GEOAPIFY_API_KEY && !isTest) {
  console.warn('[env] GEOAPIFY_API_KEY ausente: busca Geoapify desabilitada.');
}

if (!env.TOMTOM_API_KEY && !isTest) {
  console.warn('[env] TOMTOM_API_KEY ausente: busca TomTom desabilitada.');
}

if (!env.GROQ_API_KEY && !env.GEMINI_API_KEY && !isTest) {
  console.warn('[env] Nenhuma chave de IA configurada: análises usarão fallback.');
}
