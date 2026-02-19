import axios from 'axios';
import { type Lead } from '../../search/services/searchService';

// Ajuste para a sua URL do Render
const API_URL = 'https://prospector-api-mngo.onrender.com/api/crm';

export const saveLeadToCRM = async (lead: Lead) => {
  const response = await axios.post(API_URL, { lead });
  return response.data;
};

export const getCRMLeads = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const updateLeadStatus = async (id: string, crmStatus: string) => {
  const response = await axios.put(`${API_URL}/${id}`, { crmStatus });
  return response.data;
};

export const updateLeadNotes = async (id: string, notes: string) => {
  const response = await axios.put(`${API_URL}/${id}`, { notes });
  return response.data;
};