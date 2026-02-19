import { api } from "../../../lib/axios";

export interface Lead {
  id: string;
  formattedAddress: string;
  displayName: { text: string };
  websiteUri?: string;
  internationalPhoneNumber?: string;
  notes?: string;
  analysis: {
    status: string;
    emails?: string[];
    socialLinks?: Array<{ network: string; url: string }>;
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