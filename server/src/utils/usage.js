export const usageDateKey = (date = new Date()) => date.toISOString().slice(0, 10);

export const usageDocId = (uid, date = new Date()) => `${uid}_${usageDateKey(date)}`;

export const buildQuotaError = (kind, used, limit) => ({
  error: 'Limite diário atingido',
  kind,
  used,
  limit,
  resetAt: `${usageDateKey(new Date(Date.now() + 24 * 60 * 60 * 1000))}T00:00:00.000Z`,
});
