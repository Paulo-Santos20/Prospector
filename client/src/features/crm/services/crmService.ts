import { api } from '../../../lib/axios';
import { type Lead } from '../../search/services/searchService';

const API_URL = '/crm';

export type CRMStatus =
  | 'SAVED'
  | 'CONTACTED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST';

export interface CRMLead {
  id: string;
  leadId: string;
  status: CRMStatus;
  notes?: string;
  tags?: string[];
  dealValue?: number | null;
  followUpAt?: string | null;
  proposalData?: Record<string, unknown>;
  snapshot?: {
    displayName?: { text?: string } | null;
    formattedAddress?: string;
    internationalPhoneNumber?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number | null;
    userRatingCount?: number;
    priceLevel?: number | null;
    analysis?: { status?: string; opportunityScore?: number };
  };
}

export const saveLeadToCRM = async (lead: Lead | string) => {
  const leadId = typeof lead === 'string' ? lead : lead.id;
  const response = await api.post(API_URL, { leadId });
  return response.data;
};

export const getCRMLeads = async (): Promise<CRMLead[]> => {
  const response = await api.get(API_URL);
  return response.data;
};

export const updateLeadStatus = async (id: string, status: CRMStatus) => {
  const response = await api.patch(`${API_URL}/${id}`, { status });
  return response.data;
};

export const updateLeadNotes = async (leadId: string, notes: string) => {
  const response = await api.patch(`${API_URL}/by-lead/${leadId}`, { notes });
  return response.data;
};

export const saveProposalData = async (leadId: string, proposalData: Record<string, unknown>) => {
  const response = await api.patch(`${API_URL}/by-lead/${leadId}`, { proposalData });
  return response.data;
};
