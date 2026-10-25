import { searchSchema } from '../src/schemas/lead.js';

describe('searchSchema providers', () => {
  test('accepts geoapify and tomtom', () => {
    expect(
      searchSchema.parse({ niche: 'clinica', location: 'Recife', provider: 'geoapify' }).provider
    ).toBe('geoapify');
    expect(
      searchSchema.parse({ niche: 'clinica', location: 'Recife', provider: 'tomtom' }).provider
    ).toBe('tomtom');
  });

  test('defaults to geoapify', () => {
    expect(searchSchema.parse({ niche: 'clinica', location: 'Recife' }).provider).toBe('geoapify');
  });

  test('rejects unknown providers', () => {
    expect(() =>
      searchSchema.parse({ niche: 'clinica', location: 'Recife', provider: 'bing' })
    ).toThrow();
  });
});
