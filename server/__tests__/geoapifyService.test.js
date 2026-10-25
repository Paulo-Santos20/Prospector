import {
  resolveNicheCategories,
  normalizeGeoapifyPlace,
  normalizeGeoapifyDetails,
} from '../src/services/geoapifyService.js';

describe('geoapifyService', () => {
  test('maps common niches with accents and plurals', () => {
    expect(resolveNicheCategories('Dentistas').categories).toContain('healthcare.dentist');
    expect(resolveNicheCategories('salões de beleza').categories).toContain(
      'service.beauty.hairdresser'
    );
    expect(resolveNicheCategories('academias').categories).toContain('sport.fitness.gym');
    expect(resolveNicheCategories('clínica odontológica').categories).toContain(
      'healthcare.dentist'
    );
    expect(resolveNicheCategories('agência de viagem').categories).toContain(
      'service.travel_agency'
    );
  });

  test('falls back to broad categories and name for unknown niches', () => {
    const result = resolveNicheCategories('loja de discos');

    expect(result.name).toBe('loja de discos');
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories).not.toContain('healthcare.dentist');
  });

  test('normalizes place and details', () => {
    const lead = normalizeGeoapifyPlace({
      properties: {
        place_id: 'p1',
        name: 'Padaria',
        formatted: 'Rua A, 1',
        website: 'https://padaria.com',
        contact: { phone: '+55 81 99999-0000', email: 'contato@padaria.com' },
      },
    });

    expect(lead).toMatchObject({
      id: 'p1',
      displayName: { text: 'Padaria' },
      formattedAddress: 'Rua A, 1',
      websiteUri: 'https://padaria.com',
      internationalPhoneNumber: '+55 81 99999-0000',
      email: 'contato@padaria.com',
    });

    expect(
      normalizeGeoapifyDetails({
        website: 'https://loja.com',
        contact: { phone: '+55 81 98888-0000', email: 'loja@loja.com' },
      })
    ).toEqual({
      websiteUri: 'https://loja.com',
      internationalPhoneNumber: '+55 81 98888-0000',
      email: 'loja@loja.com',
    });
  });

  test('normalizes missing details to empty strings', () => {
    expect(normalizeGeoapifyDetails({})).toEqual({
      websiteUri: '',
      internationalPhoneNumber: '',
      email: '',
    });
  });
});
