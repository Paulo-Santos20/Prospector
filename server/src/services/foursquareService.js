// server/src/services/foursquareService.js
import axios from 'axios';

const FSQ_API_URL = 'https://places-api.foursquare.com/places/search';

export const searchFoursquare = async (query, location) => {
  const apiKey = process.env.FOURSQUARE_API_KEY;

  if (!apiKey) {
    throw new Error('Foursquare API Key não configurada no .env');
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
      }
    });

    const results = response.data.results || [];
    console.log(`✅ Foursquare retornou ${results.length} locais.`);

    return results.map(place => ({
      id: place.fsq_id,
      displayName: { text: place.name },
      formattedAddress: place.location?.formatted_address,
      websiteUri: place.website,
      internationalPhoneNumber: place.tel,
      // Foursquare uses 0-10 scale, normalize to 0-5 to match Google
      rating: place.rating != null ? place.rating / 2 : undefined,
      userRatingCount: undefined,
      priceLevel: place.price
    }));

  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    console.error(`❌ Erro na API do Foursquare (${status}):`, message);

    if (status === 401 || status === 403) {
      throw new Error('Chave de API do Foursquare inválida ou expirada.');
    }

    return [];
  }
};
