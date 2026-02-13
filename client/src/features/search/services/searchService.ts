import { api } from "../../../lib/axios";

// --- ATENÇÃO: O 'export' aqui é obrigatório ---
export interface Lead {
  id: string;
  formattedAddress: string;
  displayName: { text: string };
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  analysis: {
    status: 'NO_WEBSITE' | 'HIGH_OPPORTUNITY' | 'MODERATE' | 'MODERN_SITE' | 'ERROR_ACCESSING' | 'UNKNOWN';
    opportunityScore: number;
    details?: string[];
    emails?: string[];
    socialLinks?: Array<{ network: string; url: string }>;
    isResponsive?: boolean;
    isSecure?: boolean;
    copyrightYear?: number;
  };
}

export interface SearchResponse {
  count: number;
  leads: Lead[];
}

export const searchLeads = async (niche: string, location: string): Promise<SearchResponse> => {
  // A tipagem <SearchResponse> aqui garante que o axios entenda o retorno
  const response = await api.post<SearchResponse>('/leads/search', { niche, location });
  return response.data;
};