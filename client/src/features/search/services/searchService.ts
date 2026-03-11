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
    status: 'NO_WEBSITE' | 'HIGH_OPPORTUNITY' | 'MODERATE' | 'MODERN_SITE' | 'ERROR_ACCESSING' | 'UNKNOWN' | 'ANALYZING' | string;
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

// O antigo searchLeads continua aqui caso precise, mas criamos o Streamer abaixo
export const fetchLeadSocials = async (id: string, name: string, location: string) => {
  const response = await api.post('/leads/socials', { id, name, location });
  return response.data;
};

// A NOVA MÁGICA: O Leitor de Stream
export const searchLeadsStream = async (
  niche: string, 
  location: string, 
  onInit: (leads: Lead[]) => void, 
  onUpdate: (lead: Lead) => void, 
  onDone: () => void,
  onError: (err: any) => void
) => {
  try {
    const baseUrl = api.defaults.baseURL || 'https://prospector-api-mngo.onrender.com/api';
    
    const response = await fetch(`${baseUrl}/leads/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, location })
    });

    if (!response.body) throw new Error('ReadableStream not supported');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Adiciona o novo pedaço (chunk) de dados no buffer e separa por quebra de linha (\n)
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Guarda o último pedaço (que pode estar cortado no meio) para o próximo ciclo
      buffer = lines.pop() || ''; 

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.type === 'INIT') onInit(data.leads);
            else if (data.type === 'UPDATE') onUpdate(data.lead);
            else if (data.type === 'DONE') onDone();
            else if (data.type === 'ERROR') onError(data.message);
          } catch (e) {
            console.error("Erro ao ler pedaço do stream", e);
          }
        }
      }
    }
  } catch (err) {
    onError(err);
  }
};