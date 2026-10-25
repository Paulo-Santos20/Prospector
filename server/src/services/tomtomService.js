import axios from 'axios';
import { env } from '../config/env.js';

const TOMTOM_BASE_URL = 'https://api.tomtom.com/search/2';
const SEARCH_RADIUS_METERS = 30_000;

const providerError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const ensureHttpUrl = (value) => {
  if (!value) return '';

  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  return `https://${trimmed}`;
};

export const normalizeTomTomGeocode = (result = {}) => ({
  lat: result.position?.lat,
  lon: result.position?.lon,
  formattedAddress: result.address?.freeformAddress || '',
});

export const normalizeTomTomPlace = (result = {}) => ({
  id: result.id,
  displayName: { text: result.poi?.name || 'Sem nome' },
  formattedAddress: result.address?.freeformAddress || '',
  websiteUri: ensureHttpUrl(result.poi?.url),
  internationalPhoneNumber: result.poi?.phone || '',
  rating: undefined,
  userRatingCount: undefined,
  priceLevel: undefined,
});

const geocodeLocation = async (location, apiKey) => {
  const response = await axios.get(
    `${TOMTOM_BASE_URL}/geocode/${encodeURIComponent(location)}.json`,
    {
      params: {
        key: apiKey,
        limit: 1,
        language: 'pt-BR',
      },
      timeout: 15_000,
    }
  );

  const result = response.data?.results?.[0];
  if (!result?.position) {
    throw providerError(`Localização "${location}" não encontrada no TomTom.`, 400);
  }

  return normalizeTomTomGeocode(result);
};

export const searchTomTom = async (niche, location) => {
  const apiKey = env.TOMTOM_API_KEY;

  if (!apiKey) {
    throw providerError('TomTom não configurado no servidor.', 503);
  }

  console.log(`🌐 Consultando TomTom para: "${niche} em ${location}"`);

  try {
    const { lat, lon } = await geocodeLocation(location, apiKey);

    const response = await axios.get(
      `${TOMTOM_BASE_URL}/search/${encodeURIComponent(niche)}.json`,
      {
        params: {
          key: apiKey,
          lat,
          lon,
          radius: SEARCH_RADIUS_METERS,
          limit: 100,
          language: 'pt-BR',
          idxSet: 'POI',
        },
        timeout: 15_000,
      }
    );

    const leads = (response.data?.results || [])
      .filter((result) => result.type === 'POI' && result.poi?.name && result.id)
      .map(normalizeTomTomPlace);

    const unique = [...new Map(leads.map((lead) => [lead.id, lead])).values()];

    console.log(`✅ TomTom retornou ${unique.length} locais.`);
    return unique;
  } catch (error) {
    if (error.status) throw error;

    const status = error.response?.status;
    console.error(
      `❌ Erro na API do TomTom (${status || 'sem resposta'}):`,
      error.response?.data?.errorDescription || error.message
    );

    if (status === 401 || status === 403) {
      throw providerError('Chave do TomTom inválida ou sem permissão.', 502);
    }

    if (status === 429) {
      throw providerError(
        'TomTom sem cota ou limite de requisições atingido. Tente novamente mais tarde.',
        429
      );
    }

    if (status === 400) {
      throw providerError('Localização ou termo inválido para o TomTom.', 400);
    }

    if (!status) {
      throw providerError('Falha de conexão com o TomTom. Tente novamente.', 503);
    }

    throw providerError(
      'Falha ao buscar locais no TomTom. Tente novamente.',
      status >= 500 ? 503 : 502
    );
  }
};
