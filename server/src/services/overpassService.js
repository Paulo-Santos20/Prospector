// server/src/services/overpassService.js
import axios from 'axios';

const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Ponytail: Amenity to price level mapping - simple lookup, no need for config
const PRICE_LEVEL_MAP = {
  fast_food: 1,
  cafe: 1,
  restaurant: 2,
  bar: 2,
  pub: 2,
  biergarten: 2,
  food_court: 1,
  ice_cream: 1,
  bakery: 1,
  butcher: 1,
  delicatessen: 1,
  greengrocer: 1,
  marketplace: 1,
  supermarket: 1,
  convenience: 1,
};

export const searchOverpass = async (query, location) => {
  console.log(`🌐 Consultando Overpass API para: "${query} em ${location}"`);

  try {
    // Step 1: Get bounding box from Nominatim
    const bbox = await getBoundingBox(location);
    if (!bbox) {
      const error = new Error('Localização não encontrada. Tente ser mais específico.');
      error.status = 400;
      throw error;
    }

    // Step 2: Build and execute Overpass query
    const overpassQuery = buildOverpassQuery(query, bbox);
    let response;

    for (const url of OVERPASS_URLS) {
      try {
        response = await axios.post(
          url,
          `data=${encodeURIComponent(overpassQuery)}`,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'ProspectorApp/1.0',
            },
            timeout: 25_000,
          }
        );
        break;
      } catch (error) {
        const status = error.response?.status;
        console.warn(`⚠️ Overpass ${url} indisponível (${status || error.code || error.message})`);
        // A 400 means the query itself is invalid; another mirror will reject it too.
        if (status === 400) throw error;
      }
    }

    if (!response) {
      const error = new Error('Overpass indisponível no momento. Tente novamente em instantes.');
      error.status = 503;
      throw error;
    }

    const elements = response.data.elements || [];
    console.log(`✅ Overpass retornou ${elements.length} elementos.`);

    const seen = new Set();
    return elements
      .map((element) => normalizeElement(element))
      .filter((lead) => {
        if (lead.displayName.text === 'Sem nome' || seen.has(lead.id)) return false;
        seen.add(lead.id);
        return true;
      });

  } catch (error) {
    console.error('❌ Erro na Overpass API:', error.message);
    throw error;
  }
};

// Get bounding box from Nominatim
const getBoundingBox = async (location) => {
  try {
    const response = await axios.get(NOMINATIM_URL, {
      params: {
        q: location,
        format: 'json',
        limit: 1,
      },
      headers: {
        // Ponytail: Nominatim requires a user agent
        'User-Agent': 'ProspectorApp/1.0',
      },
      timeout: 10_000,
    });

    if (response.data.length === 0) return null;

    const { boundingbox } = response.data[0];
    // Nominatim returns [south, north, west, east]
    return {
      south: parseFloat(boundingbox[0]),
      north: parseFloat(boundingbox[1]),
      west: parseFloat(boundingbox[2]),
      east: parseFloat(boundingbox[3]),
    };
  } catch (error) {
    console.error('Erro ao buscar bounding box:', error.message);
    const serviceError = new Error('Serviço de localização indisponível. Tente novamente.');
    serviceError.status = 503;
    throw serviceError;
  }
};

// Strip Overpass QL syntax; the term is used inside a quoted regex.
const sanitizeTerm = (value) =>
  String(value || '')
    .normalize('NFKC')
    .replace(/[\\"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildOverpassQuery = (query, bbox) => {
  const { south, west, north, east } = bbox;
  const term = sanitizeTerm(query);
  if (!term) throw new Error('Nicho inválido para busca no Overpass');
  const terms = [term];

  // ponytail: naive PT plural -> singular; covers "clínicas", "restaurantes".
  // Add a proper synonym map if search quality needs it.
  if (term.length > 4 && /s$/i.test(term)) terms.push(term.slice(0, -1));

  const filters = terms.flatMap((value) => {
    const escaped = escapeRegex(value);
    return ['name', 'shop', 'amenity', 'cuisine', 'healthcare', 'office'].map(
      (tag) => `nwr["${tag}"~"${escaped}",i](${south},${west},${north},${east});`
    );
  });

  return `[out:json][timeout:60];
(
${filters.join('\n')}
);
out center tags;`;
};

// Normalize OSM element to standard lead format
export const normalizeElement = (element) => {
  const tags = element.tags || {};
  const type = element.type;

  // Build ID
  const id = `${type}_${element.id}`;

  // Build display name
  const displayName = tags.name || tags['name:en'] || tags['name:pt'] || 'Sem nome';

  // Build formatted address from OSM tags
  const addressParts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean);
  const formattedAddress = addressParts.join(', ') || '';

  // Get website
  const websiteUri = tags.website || tags.url || tags['contact:website'] || '';

  // Get phone
  const internationalPhoneNumber = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';

  // Infer price level from amenity type
  const priceLevel = PRICE_LEVEL_MAP[tags.amenity];

  return {
    id,
    displayName: { text: displayName.trim() },
    formattedAddress,
    websiteUri,
    internationalPhoneNumber,
    rating: undefined,
    userRatingCount: undefined,
    priceLevel,
  };
};
