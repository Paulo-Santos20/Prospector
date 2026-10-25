import { buildOverpassQuery, normalizeElement } from '../src/services/overpassService.js';
import { normalizeFoursquarePlace } from '../src/services/foursquareService.js';

const bbox = { south: -8.1, west: -35, north: -8, east: -34.9 };

describe('overpassService', () => {
  test('searches the niche instead of every amenity in the bbox', () => {
    const query = buildOverpassQuery('restaurantes', bbox);

    expect(query).toContain('nwr["name"~"restaurantes",i]');
    expect(query).toContain('nwr["amenity"~"restaurante",i]');
    expect(query).not.toMatch(/node\["amenity"\]/);
  });

  test('sanitizes quotes that could break the Overpass query', () => {
    const query = buildOverpassQuery('pizza"];out;', bbox);

    expect(query).not.toContain('"]');
    expect(query).toContain('pizza\\];out;');
  });

  test('normalizes missing website and phone to empty strings', () => {
    const lead = normalizeElement({
      type: 'node',
      id: 1,
      tags: { name: '  Padaria  ', amenity: 'bakery' },
    });

    expect(lead.displayName.text).toBe('Padaria');
    expect(lead.websiteUri).toBe('');
    expect(lead.internationalPhoneNumber).toBe('');
    expect(lead.formattedAddress).toBe('');
  });
});

describe('foursquareService', () => {
  test('uses fsq_place_id and normalizes rating to 0-5', () => {
    const lead = normalizeFoursquarePlace({
      fsq_place_id: 'abc123',
      name: 'Cafe',
      location: { formatted_address: 'Rua A, 1' },
      rating: 8,
      price: 2,
    });

    expect(lead.id).toBe('abc123');
    expect(lead.formattedAddress).toBe('Rua A, 1');
    expect(lead.rating).toBe(4);
    expect(lead.websiteUri).toBe('');
  });

  test('falls back to legacy fsq_id', () => {
    expect(normalizeFoursquarePlace({ fsq_id: 'old', name: 'Loja' }).id).toBe('old');
  });
});
