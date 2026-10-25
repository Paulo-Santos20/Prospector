import axios from 'axios';
import pLimit from 'p-limit';
import { env } from '../config/env.js';

const GEOAPIFY_BASE_URL = 'https://api.geoapify.com';
const detailsLimit = pLimit(5);

const BROAD_CATEGORIES = [
  'commercial',
  'catering',
  'healthcare',
  'office',
  'service',
  'sport',
  'education',
  'entertainment',
  'leisure',
  'accommodation',
  'activity',
  'pet',
  'tourism',
];

const NICHE_CATEGORIES = {
  restaurante: ['catering.restaurant'],
  lanchonete: ['catering.fast_food'],
  pizzaria: ['catering.restaurant', 'catering.fast_food'],
  hamburgueria: ['catering.restaurant', 'catering.fast_food'],
  cafeteria: ['catering.cafe'],
  padaria: ['commercial.food_and_drink.bakery'],
  bar: ['catering.bar'],
  pub: ['catering.pub'],
  dentista: ['healthcare.dentist'],
  clinica: ['healthcare.clinic_or_praxis'],
  hospital: ['healthcare.hospital'],
  farmacia: ['healthcare.pharmacy'],
  academia: ['sport.fitness.gym', 'sport.fitness.fitness_centre'],
  pilates: ['sport.fitness.fitness_centre'],
  salao: ['service.beauty.hairdresser'],
  barbearia: ['service.beauty.hairdresser'],
  estetica: ['service.beauty', 'service.beauty.spa'],
  advogado: ['office.lawyer'],
  contador: ['office.accountant'],
  imobiliaria: ['office.estate_agent'],
  veterinaria: ['pet.veterinary'],
  pet: ['pet.shop', 'pet.veterinary'],
  hotel: ['accommodation.hotel'],
  pousada: ['accommodation.guest_house'],
  escola: ['education.school'],
  oficina: ['service.vehicle.repair.car'],
  mecanica: ['service.vehicle.repair.car'],
  lavanderia: ['service.cleaning.laundry'],
  viagem: ['service.travel_agency'],
  seguro: ['office.insurance'],
  arquiteto: ['office.architect'],
  supermercado: ['commercial.supermarket'],
  mercado: ['commercial.supermarket'],
  otica: ['commercial.health_and_beauty'],
  fisioterapia: ['healthcare.clinic_or_praxis'],
  psicologo: ['healthcare.clinic_or_praxis'],
  nutricionista: ['healthcare.clinic_or_praxis'],
  medico: ['healthcare.clinic_or_praxis'],
};

const ALIASES = {
  saloes: 'salao',
  hoteis: 'hotel',
  fisioterapeuta: 'fisioterapia',
};

const PHRASE_ALIASES = [
  ['estetica', 'estetica'],
  ['odont', 'dentista'],
  ['veterin', 'veterinaria'],
  ['fisioterap', 'fisioterapia'],
  ['psicolog', 'psicologo'],
  ['nutricion', 'nutricionista'],
  ['advocacia', 'advogado'],
  ['contabilidade', 'contador'],
  ['cabeleireir', 'salao'],
  ['barbearia', 'barbearia'],
  ['viagem', 'viagem'],
  ['turismo', 'viagem'],
];

const normalizeTerm = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const singularize = (term) => {
  if (NICHE_CATEGORIES[term]) return term;
  if (ALIASES[term]) return ALIASES[term];

  const first = term.split(' ')[0];
  if (NICHE_CATEGORIES[first]) return first;
  if (ALIASES[first]) return ALIASES[first];

  if (term.endsWith('s') && term.length > 4) {
    const candidate = term.slice(0, -1);
    if (NICHE_CATEGORIES[candidate]) return candidate;
  }

  if (first.endsWith('s') && first.length > 4) {
    const candidate = first.slice(0, -1);
    if (NICHE_CATEGORIES[candidate]) return candidate;
  }

  return term;
};

export const resolveNicheCategories = (niche) => {
  const normalized = normalizeTerm(niche);

  for (const [needle, key] of PHRASE_ALIASES) {
    if (normalized.includes(needle)) {
      return { categories: NICHE_CATEGORIES[key], name: null };
    }
  }

  const key = singularize(normalized);
  if (NICHE_CATEGORIES[key]) {
    return { categories: NICHE_CATEGORIES[key], name: null };
  }

  return { categories: BROAD_CATEGORIES, name: normalized || 'empresa' };
};

export const normalizeGeoapifyPlace = (feature = {}) => {
  const props = feature.properties || {};

  return {
    id: props.place_id,
    displayName: { text: props.name || 'Sem nome' },
    formattedAddress: props.formatted || '',
    websiteUri: props.website || '',
    internationalPhoneNumber: props.contact?.phone || '',
    email: props.contact?.email || '',
    rating: undefined,
    userRatingCount: undefined,
    priceLevel: undefined,
  };
};

export const normalizeGeoapifyDetails = (properties = {}) => ({
  websiteUri: properties.website || '',
  internationalPhoneNumber: properties.contact?.phone || '',
  email: properties.contact?.email || '',
});

const providerError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const mapGeoapifyError = (error) => {
  const status = error.response?.status;

  console.error(
    `❌ Erro na API do Geoapify (${status || 'sem resposta'}):`,
    error.response?.data?.message || error.message
  );

  if (status === 401 || status === 403) {
    return providerError('Chave do Geoapify inválida ou sem permissão.', 502);
  }

  if (status === 429) {
    return providerError(
      'Geoapify sem créditos ou limite de requisições atingido. Tente novamente mais tarde.',
      429
    );
  }

  if (status === 400) {
    return providerError('Localização ou categoria inválida para o Geoapify.', 400);
  }

  if (!status) {
    return providerError('Falha de conexão com o Geoapify. Tente novamente.', 503);
  }

  return providerError(
    'Falha ao buscar locais no Geoapify. Tente novamente.',
    status >= 500 ? 503 : 502
  );
};

const geocodeLocation = async (location, apiKey) => {
  const response = await axios.get(`${GEOAPIFY_BASE_URL}/v1/geocode/search`, {
    params: {
      text: location,
      format: 'json',
      limit: 1,
      lang: 'pt',
      apiKey,
    },
    timeout: 15_000,
  });

  const result = response.data?.results?.[0];
  if (!result?.place_id) {
    throw providerError(`Localização "${location}" não encontrada no Geoapify.`, 400);
  }

  return result;
};

const getPlaceDetails = async (placeId, apiKey) => {
  try {
    const response = await axios.get(`${GEOAPIFY_BASE_URL}/v2/place-details`, {
      params: {
        id: placeId,
        features: 'details',
        lang: 'pt',
        apiKey,
      },
      timeout: 15_000,
    });

    return normalizeGeoapifyDetails(response.data?.features?.[0]?.properties || {});
  } catch (error) {
    if (error.response?.status === 404) {
      return normalizeGeoapifyDetails();
    }
    throw error;
  }
};

export const searchGeoapify = async (niche, location, maxLeads = 20) => {
  const apiKey = env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw providerError('Geoapify não configurado no servidor.', 503);
  }

  console.log(`🌐 Consultando Geoapify para: "${niche} em ${location}"`);

  try {
    const place = await geocodeLocation(location, apiKey);
    const { categories, name } = resolveNicheCategories(niche);

    const params = {
      categories: categories.join(','),
      filter: `place:${place.place_id}`,
      limit: Math.min(Math.max(Number(maxLeads) || 20, 1), 100),
      lang: 'pt',
      apiKey,
    };

    if (name) params.name = name;

    const response = await axios.get(`${GEOAPIFY_BASE_URL}/v2/places`, {
      params,
      timeout: 15_000,
    });

    const places = (response.data?.features || [])
      .filter((feature) => feature.properties?.place_id && feature.properties?.name)
      .map(normalizeGeoapifyPlace);

    const leads = await Promise.all(
      places.map((lead) =>
        detailsLimit(async () => {
          const details = await getPlaceDetails(lead.id, apiKey);
          return { ...lead, ...details };
        })
      )
    );

    console.log(`✅ Geoapify retornou ${leads.length} locais.`);
    return leads;
  } catch (error) {
    if (error.status) throw error;
    throw mapGeoapifyError(error);
  }
};
