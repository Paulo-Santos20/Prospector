// server/src/services/overpassService.js
import axios from 'axios';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
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
      console.log('⚠️ Localização não encontrada no Nominatim');
      return [];
    }

    // Step 2: Build and execute Overpass query
    const overpassQuery = buildOverpassQuery(query, bbox);
    const response = await axios.post(
      OVERPASS_URL,
      `data=${encodeURIComponent(overpassQuery)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const elements = response.data.elements || [];
    console.log(`✅ Overpass retornou ${elements.length} elementos.`);

    // Step 3: Normalize to standard format
    const leads = elements.map(element => normalizeElement(element));
    return leads;

  } catch (error) {
    console.error('❌ Erro na Overpass API:', error.message);
    return [];
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
    return null;
  }
};

// Build Overpass QL query
const buildOverpassQuery = (query, bbox) => {
  const { south, west, north, east } = bbox;

  // Ponytail: Simple keyword search using amenity tag
  // OSM uses amenity tags, not free text search
  // This is a limitation - we search all amenities in the area
  return `[out:json][timeout:60];
(
  node["amenity"](${south},${west},${north},${east});
  way["amenity"](${south},${west},${north},${east});
  relation["amenity"](${south},${west},${north},${east});
);
out center tags;`;
};

// Normalize OSM element to standard lead format
const normalizeElement = (element) => {
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
  const websiteUri = tags.website || tags.url || undefined;

  // Get phone
  const internationalPhoneNumber = tags.phone || tags['contact:phone'] || undefined;

  // Infer price level from amenity type
  const priceLevel = PRICE_LEVEL_MAP[tags.amenity];

  return {
    id,
    displayName: { text: displayName },
    formattedAddress,
    websiteUri,
    internationalPhoneNumber,
    rating: undefined,
    userRatingCount: undefined,
    priceLevel,
  };
};
