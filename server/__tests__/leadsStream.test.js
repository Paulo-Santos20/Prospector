import { jest } from '@jest/globals';

const places = [
  {
    id: 'place-1',
    displayName: { text: 'Clinica A' },
    formattedAddress: 'Rua A, 1',
    websiteUri: '',
    email: 'contato@clinica-a.com',
  },
  {
    id: 'place-2',
    displayName: { text: 'Clinica B' },
    formattedAddress: 'Rua B, 2',
    websiteUri: 'https://clinica-b.com',
  },
];

const createResponse = () => {
  const chunks = [];

  return {
    chunks,
    headers: {},
    writableEnded: false,
    destroyed: false,
    statusCode: 0,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    flushHeaders() {},
    write(chunk) {
      chunks.push(String(chunk));
      return true;
    },
    end() {
      this.writableEnded = true;
    },
    on() {},
  };
};

let streamLeads;

beforeAll(async () => {
  jest.unstable_mockModule('../src/services/usageService.js', () => ({
    consumeQuota: jest.fn(async () => ({ allowed: true, used: 1, limit: 50 })),
  }));

  jest.unstable_mockModule('../src/services/providerMonitor.js', () => ({
    incrementUsage: jest.fn(),
    getProviderStatus: jest.fn(() => ({})),
  }));

  jest.unstable_mockModule('../src/services/geoapifyService.js', () => ({
    searchGeoapify: jest.fn(async () => places),
  }));

  jest.unstable_mockModule('../src/services/analyzerService.js', () => ({
    analyzeWebsite: jest.fn(async () => ({
      status: 'NO_WEBSITE',
      opportunityScore: 70,
      emails: [],
      aiData: { mainPainPoint: 'Sem site' },
    })),
    enrichLeadWithFullDiagnosis: jest.fn(),
  }));

  jest.unstable_mockModule('../src/config/firebase.js', () => ({
    db: {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false }),
          set: async () => undefined,
        }),
      }),
    },
  }));

  ({ streamLeads } = await import('../src/controllers/leadsController.js'));
});

describe('leads stream', () => {
  test('emits init, one update per lead and done', async () => {
    const res = createResponse();
    const next = jest.fn();

    await streamLeads(
      {
        user: { uid: 'user-1' },
        body: { niche: 'clinica', location: 'Recife', provider: 'geoapify' },
      },
      res,
      next
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.headers['content-type']).toContain('application/x-ndjson');
    expect(res.headers['x-accel-buffering']).toBe('no');

    const events = res.chunks
      .join('')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));

    expect(events[0]).toMatchObject({ type: 'INIT', total: 2 });
    expect(events[0].leads.every((lead) => lead.analysis.status === 'ANALYZING')).toBe(true);

    const updates = events.filter((event) => event.type === 'UPDATE');
    expect(updates).toHaveLength(2);
    expect(updates.find((event) => event.lead.id === 'place-1').lead.analysis.status).toBe(
      'NO_WEBSITE'
    );
    expect(events.at(-1)).toEqual({ type: 'DONE', count: 2 });
  });
});
