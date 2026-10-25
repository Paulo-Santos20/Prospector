import {
  ensureHttpUrl,
  normalizeTomTomGeocode,
  normalizeTomTomPlace,
} from '../src/services/tomtomService.js';

describe('tomtomService', () => {
  test('normalizes POI with contact fields and adds https when missing', () => {
    const lead = normalizeTomTomPlace({
      id: 'tt1',
      poi: { name: 'Barbearia', phone: '+55 81 99999-0000', url: 'www.barbearia.com' },
      address: { freeformAddress: 'Rua A, 1' },
    });

    expect(lead).toMatchObject({
      id: 'tt1',
      displayName: { text: 'Barbearia' },
      formattedAddress: 'Rua A, 1',
      internationalPhoneNumber: '+55 81 99999-0000',
      websiteUri: 'https://www.barbearia.com',
    });
  });

  test('keeps absolute urls and handles missing url', () => {
    expect(ensureHttpUrl('http://loja.com')).toBe('http://loja.com');
    expect(ensureHttpUrl('//loja.com')).toBe('https://loja.com');
    expect(ensureHttpUrl('')).toBe('');
  });

  test('normalizes geocode position', () => {
    expect(
      normalizeTomTomGeocode({
        position: { lat: -8.05, lon: -34.9 },
        address: { freeformAddress: 'Recife' },
      })
    ).toEqual({
      lat: -8.05,
      lon: -34.9,
      formattedAddress: 'Recife',
    });
  });
});
