import { api } from "../../../lib/axios";

export interface Lead {
  id: string;
  formattedAddress: string;
  displayName: { text: string };
  websiteUri?: string;
  internationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: number;
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
    enrichedAt?: string;
    aiData?: {
      ownerName?: string;
      mainPainPoint?: string;
      diagnosisReasoning?: string;
      urgency?: 'high' | 'medium' | 'low';
      conversionOpportunity?: 'A' | 'B' | 'C';
      keyIssues?: string[];
      recommendedActions?: string[];
      designStrategy?: any;
      socialStats?: any;
    };
  };
}

export interface SearchResponse {
  count: number;
  leads: Lead[];
}

export const searchLeads = async (niche: string, location: string): Promise<SearchResponse> => {
  try {
    console.log('[Search] Searching for:', niche, 'in', location);
    const response = await api.post<SearchResponse>('/leads/search', { niche, location });
    console.log('[Search] Success:', response.data.count, 'leads found');
    return response.data;
  } catch (error: any) {
    console.error('[Search] Error:', error?.response?.data || error?.message || error);
    throw error;
  }
};

export const fetchLeadSocials = async (id: string, name: string, location: string) => {
  const response = await api.post('/leads/socials', { id, name, location });
  return response.data;
};

export const enrichLead = async (id: string): Promise<{ alreadyEnriched: boolean; aiData: any }> => {
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