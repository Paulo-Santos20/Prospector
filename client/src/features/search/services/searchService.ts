import { api, API_BASE_URL } from "../../../lib/axios";
import { auth } from "../../../lib/firebase";

export interface AiInsight {
  mainPainPoint?: string;
  urgency?: 'high' | 'medium' | 'low';
  conversionOpportunity?: 'A' | 'B' | 'C';
  keyMetrics?: {
    rating?: number;
    reviewCount?: number;
    totalFollowers?: number;
    platforms?: string[];
    priceLevel?: number;
    hasWebsite?: boolean;
    hasEmail?: boolean;
    hasSocial?: boolean;
  };
  specificIssues?: Array<{
    type: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
  recommendedActions?: string[];
  designStrategy?: {
    style?: string;
    primaryColor?: string;
    secondaryColor?: string;
    typography?: { heading?: string; body?: string };
    designReasoning?: string;
    referenceSite?: string;
  };
  featuredItem?: string;
  socialStats?: Record<string, { url: string; followerCount: number }>;
}

export interface Lead {
  id: string;
  formattedAddress: string;
  displayName: { text: string };
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
  analysis: {
    status: 'NO_WEBSITE' | 'HIGH_OPPORTUNITY' | 'MODERATE' | 'MODERN_SITE' | 'ERROR_ACCESSING' | 'UNKNOWN' | 'ANALYZING' | string;
    opportunityScore?: number;
    details?: string[];
    emails?: string[];
    socialLinks?: Array<{ network: string; url: string }>;
    isResponsive?: boolean;
    isSecure?: boolean;
    copyrightYear?: number;
    enrichedAt?: string;
    aiData?: AiInsight;
  };
}

export interface SearchResponse {
  count: number;
  leads: Lead[];
}

export interface ProviderStatus {
  configured: boolean;
  available: boolean;
  used: number;
  limit: number;
  resetsAt: string;
}

export interface ProviderStatusResponse {
  providers: Record<string, ProviderStatus>;
}

export const DEFAULT_PROVIDER = 'geoapify';

export const providerAttribution = (provider: string): string => {
  switch (provider) {
    case 'geoapify':
      return 'Powered by Geoapify · © OpenStreetMap contributors';
    case 'tomtom':
      return '© TomTom';
    case 'overpass':
      return '© OpenStreetMap contributors';
    case 'foursquare':
      return 'Powered by Foursquare';
    case 'google':
      return 'Powered by Google';
    default:
      return '';
  }
};

export const searchLeads = async (
  niche: string,
  location: string,
  provider: string = DEFAULT_PROVIDER
): Promise<SearchResponse> => {
  try {
    const response = await api.post<SearchResponse>('/leads/search', { niche, location, provider });
    return response.data;
  } catch (error) {
    const err = error as {
      response?: { data?: { error?: string } };
      message?: string;
    };
    console.error('[Search] Error:', err.response?.data || err.message || error);
    throw new Error(err.response?.data?.error || 'Não foi possível buscar leads. Tente novamente.');
  }
};

export type SearchStreamEvent =
  | { type: 'INIT'; total: number; leads: Lead[] }
  | { type: 'UPDATE'; lead: Lead }
  | { type: 'DONE'; count: number }
  | { type: 'ERROR'; message: string };

export const searchLeadsStream = async (
  niche: string,
  location: string,
  provider: string = DEFAULT_PROVIDER,
  onEvent: (event: SearchStreamEvent) => void,
  signal?: AbortSignal
): Promise<void> => {
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;

  const response = await fetch(`${API_BASE_URL}/leads/search/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ niche, location, provider }),
    signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (response.status === 401 && auth?.currentUser) {
      await auth.signOut();
    }
    throw new Error(payload?.error || 'Não foi possível buscar leads. Tente novamente.');
  }

  if (!response.body) {
    throw new Error('Seu navegador não suporta análise progressiva.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string) => {
    if (!line.trim()) return;

    let event: SearchStreamEvent;
    try {
      event = JSON.parse(line) as SearchStreamEvent;
    } catch {
      return;
    }

    if (event.type === 'ERROR') {
      throw new Error(event.message || 'Falha na busca.');
    }

    onEvent(event);
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) handleLine(line);
    }

    handleLine(buffer + decoder.decode());
  } finally {
    reader.releaseLock();
  }
};

export const getProviderStatus = async (): Promise<ProviderStatusResponse> => {
  const response = await api.get<ProviderStatusResponse>('/leads/provider-status');
  return response.data;
};

export const enrichLead = async (
  id: string
): Promise<{ alreadyEnriched: boolean; aiData?: AiInsight; socialLinks?: Lead['analysis']['socialLinks'] }> => {
  const response = await api.post('/leads/enrich', { id });
  return response.data;
};

export const fetchLeadById = async (id: string): Promise<Lead | null> => {
  try {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response.data;
  } catch {
    return null;
  }
};
