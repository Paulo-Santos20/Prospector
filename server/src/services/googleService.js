// server/src/services/googleService.js
import axios from 'axios';

const GOOGLE_API_URL = 'https://places.googleapis.com/v1/places:searchText';

export const searchPlaces = async (query, location) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) throw new Error('Google API Key não configurada');

  const textQuery = `${query} em ${location}`;

  try {
    const response = await axios.post(
      GOOGLE_API_URL,
      { textQuery: textQuery },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // FieldMask economiza dinheiro: pedimos SÓ o que precisamos
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.rating,places.userRatingCount'
        }
      }
    );

    return response.data.places || [];
  } catch (error) {
    console.error('Erro na API do Google:', error.response?.data || error.message);
    throw new Error('Falha ao buscar locais no Google Maps');
  }
};