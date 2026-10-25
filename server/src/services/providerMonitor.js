// ponytail: in-memory daily usage tracker, resets on midnight change (not restart)
import { env } from '../config/env.js';

const providers = {
  google: { used: 0, limit: 6000, configured: Boolean(env.GOOGLE_MAPS_API_KEY) },
  overpass: { used: 0, limit: 100, configured: true },
  foursquare: { used: 0, limit: 500, configured: Boolean(env.FOURSQUARE_API_KEY) },
  geoapify: { used: 0, limit: 100, configured: Boolean(env.GEOAPIFY_API_KEY) },
  // ponytail: 80/dia ≈ 2.4K/mês, teto free do Search API é 2.5K/mês
  tomtom: { used: 0, limit: 80, configured: Boolean(env.TOMTOM_API_KEY) },
};

let lastResetDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

function checkReset() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== lastResetDate) {
    console.log(`[providerMonitor] Resetting counters: ${lastResetDate} -> ${today}`);
    for (const key of Object.keys(providers)) {
      providers[key].used = 0;
    }
    lastResetDate = today;
  }
}

function incrementUsage(provider) {
  checkReset();
  if (!providers[provider]) {
    console.warn(`[providerMonitor] Unknown provider: ${provider}`);
    return false;
  }
  providers[provider].used++;
  console.log(`[providerMonitor] ${provider}: ${providers[provider].used}/${providers[provider].limit}`);
  return true;
}

function isAvailable(provider) {
  checkReset();
  const p = providers[provider];
  if (!p) return false;
  return p.configured && p.used < p.limit;
}

function getProviderStatus() {
  checkReset();
  const status = {};
  for (const [name, p] of Object.entries(providers)) {
    status[name] = {
      configured: p.configured,
      available: p.configured && p.used < p.limit,
      used: p.used,
      limit: p.limit,
      resetsAt: lastResetDate,
    };
  }
  return status;
}

export { incrementUsage, isAvailable, getProviderStatus };
