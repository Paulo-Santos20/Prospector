// ponytail: in-memory daily usage tracker, resets on midnight change (not restart)

const providers = {
  google: { used: 0, limit: 6000 },
  overpass: { used: 0, limit: 100 },
  foursquare: { used: 0, limit: 500 },
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
  return p.used < p.limit;
}

function getProviderStatus() {
  checkReset();
  const status = {};
  for (const [name, p] of Object.entries(providers)) {
    status[name] = {
      available: p.used < p.limit,
      used: p.used,
      limit: p.limit,
      resetsAt: lastResetDate,
    };
  }
  return status;
}

export { incrementUsage, isAvailable, getProviderStatus };
