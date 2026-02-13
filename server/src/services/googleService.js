// server/src/services/googleService.js
import axios from 'axios';

// URL da nova API (Places API New)
const GOOGLE_API_URL = 'https://places.googleapis.com/v1/places:searchText';

export const searchPlaces = async (query, location) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google API Key não configurada no .env');
  }

  const textQuery = `${query} em ${location}`;

  console.log(`🌐 Consultando Google Maps para: "${textQuery}"`);

  try {
    const response = await axios.post(
      GOOGLE_API_URL,
      { textQuery: textQuery },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // FieldMask é CRÍTICO para economizar dinheiro.
          // Pedimos apenas os campos necessários.
          // websiteUri é o ouro aqui.
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.websiteUri,places.internationalPhoneNumber,places.rating,places.userRatingCount'
        }
      }
    );

    const places = response.data.places || [];
    console.log(`✅ Google retornou ${places.length} locais.`);
    return places;

  } catch (error) {
    // Tratamento de erro detalhado para ajudar no debug
    const status = error.response?.status;
    const message = error.response?.data?.error?.message || error.message;
    
    console.error(`❌ Erro na API do Google (${status}):`, message);
    
    if (status === 403) {
      throw new Error('Chave de API inválida ou faturamento não ativado no Google Cloud.');
    }
    
    throw new Error('Falha ao buscar locais no Google Maps.');
  }
};