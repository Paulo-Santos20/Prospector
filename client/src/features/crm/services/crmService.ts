import { api } from '../../../lib/axios';
import { type Lead } from '../../search/services/searchService';

const API_URL = '/crm';

export const saveLeadToCRM = async (lead: Lead) => {
  const response = await api.post(API_URL, { lead });
  return response.data;
};

export const getCRMLeads = async () => {
  const response = await api.get(API_URL);
  return response.data;
};

export const updateLeadStatus = async (id: string, crmStatus: string) => {
  const response = await api.put(`${API_URL}/${id}`, { crmStatus });
  return response.data;
};

export const updateLeadNotes = async (id: string, notes: string) => {
  const response = await api.put(`${API_URL}/${id}`, { notes });
  return response.data;
};

// Nova função limpa usando apenas o axios para enviar a proposta pro backend
export const saveProposalData = async (leadId: string, proposalData: any) => {
  const response = await api.put(`${API_URL}/${leadId}`, { proposalData });
  return response.data;
};