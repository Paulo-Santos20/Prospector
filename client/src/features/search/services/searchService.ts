import { api } from "../../../lib/axios";

export interface Lead {
  id: string;
  formattedAddress: string;
  displayName: { text: string };
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  notes?: string;
  analysis: {
    status: 'NO_WEBSITE' | 'HIGH_OPPORTUNITY' | 'MODERATE' | 'MODERN_SITE' | 'ERROR_ACCESSING' | 'UNKNOWN' | string;
    opportunityScore?: number;
    details?: string[];
    emails?: string[];
    socialLinks?: Array<{ network: string; url: string }>;
    isResponsive?: boolean;
    isSecure?: boolean;
    copyrightYear?: number;
    aiData?: any;
  };
}

export interface SearchResponse {
  count: number;
  leads: Lead[];
}

export const searchLeads = async (niche: string, location: string): Promise<SearchResponse> => {
  const response = await api.post<SearchResponse>('/leads/search', { niche, location });
  return response.data;
};

export const fetchLeadSocials = async (id: string, name: string, location: string) => {
  const response = await api.post('/leads/socials', { id, name, location });
  return response.data;
};