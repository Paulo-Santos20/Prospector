// server/src/services/foursquareService.js
import axios from 'axios';
import { env } from '../config/env.js';

const FSQ_API_URL = 'https://places-api.foursquare.com/places/search';

export const normalizeFoursquarePlace = (place) => ({
  id: place.fsq_place_id || place.fsq_id,
  displayName: { text: place.name || 'Sem nome' },
  formattedAddress: place.location?.formatted_address || '',
  websiteUri: place.website || '',
  internationalPhoneNumber: place.tel || '',
  // Foursquare uses 0-10 scale, normalize to 0-5 to match Google
  rating: place.rating != null ? place.rating / 2 : undefined,
  userRatingCount: undefined,
  priceLevel: place.price ?? undefined,
});

export const searchFoursquare = async (query, location) => {
  const apiKey = env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    const error = new Error('Foursquare não configurado no servidor.');
    error.status = 503;
    throw error;
  }

  console.log(`🌐 Consultando Foursquare para: "${query} em ${location}"`);

  try {
    const response = await axios.get(FSQ_API_URL, {
      params: {
        near: location,
        query: query,
        limit: 50,
        fields: 'name,location,tel,website,rating,categories,price'
      },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Places-Api-Version': '2025-06-17'
      },
      timeout: 15_000
    });

    const results = response.data.results || [];
    console.log(`✅ Foursquare retornou ${results.length} locais.`);

    return results.filter((place) => place.fsq_place_id || place.fsq_id).map(normalizeFoursquarePlace);

  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`❌ Erro na API do Foursquare (${status}):`, message);

    if (status === 401 || status === 403) {
      const apiError = new Error('Chave de API do Foursquare inválida ou expirada.');
      apiError.status = 502;
      throw apiError;
    }

    if (status === 429) {
      const apiError = new Error(
        'Foursquare sem créditos disponíveis no momento. Use o Overpass ou aguarde a renovação.'
      );
      apiError.status = 429;
      throw apiError;
    }

    const apiError = new Error('Falha ao buscar locais no Foursquare. Tente novamente.');
    apiError.status = 502;
    throw apiError;
  }
};
