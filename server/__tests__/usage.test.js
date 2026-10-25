import { buildQuotaError, usageDateKey, usageDocId } from '../src/utils/usage.js';

describe('usage utils', () => {
  test('builds a stable daily date key in UTC', () => {
    const date = new Date('2026-10-25T23:59:00.000Z');
    expect(usageDateKey(date)).toBe('2026-10-25');
  });

  test('builds one usage document per user per day', () => {
    const date = new Date('2026-10-25T12:00:00.000Z');
    expect(usageDocId('abc123', date)).toBe('abc123_2026-10-25');
  });

  test('returns quota metadata without exposing internals', () => {
    const error = buildQuotaError('analyses', 100, 100);
    expect(error).toMatchObject({ kind: 'analyses', used: 100, limit: 100 });
    expect(error.resetAt).toMatch(/T00:00:00\.000Z$/);
  });
});
