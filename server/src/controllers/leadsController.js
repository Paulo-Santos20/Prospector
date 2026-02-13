import pLimit from 'p-limit';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';

// Define o limite de tarefas simultâneas (ex: 5 por vez) 
// para não ser bloqueado pelo Google e não travar o servidor.
const limit = pLimit(5);

export const getLeads = async (req, res) => {
  try {
    const { niche, location } = req.body;

    if (!niche || !location) {
      return res.status(400).json({ error: 'Nicho e Localização são obrigatórios.' });
    }

    // 1. Busca os dados brutos no Google Places
    const rawLeads = await searchPlaces(niche, location);

    if (!rawLeads || rawLeads.length === 0) {
      return res.json({ count: 0, leads: [] });
    }

    // 2. Processamento Enriquecido com Limite de Concorrência
    const enrichedLeads = await Promise.all(
      rawLeads.map((place) => 
        limit(async () => {
          try {
            // Executa a análise do site (SSL, Responsividade, Scraping de E-mail)
            const analysis = await analyzeWebsite(place.websiteUri);
            
            // SE não achou e-mail no site OU o site é de terceiros (iFood/Insta)
            // Tenta a busca profunda no Google Search
            if (analysis.emails.length === 0) {
              const searchEmails = await findEmailViaSearch(place.displayName.text, location);
              
              if (searchEmails && searchEmails.length > 0) {
                // Mescla e remove duplicatas
                analysis.emails = [...new Set([...analysis.emails, ...searchEmails])];
              }
            }

            return { ...place, analysis };
          } catch (innerError) {
            // Se um lead específico der erro, retorna ele com análise vazia em vez de quebrar a lista toda
            console.error(`Erro ao processar lead ${place.displayName.text}:`, innerError.message);
            return { 
              ...place, 
              analysis: { status: 'ERROR', emails: [], opportunityScore: 50 } 
            };
          }
        })
      )
    );

    // 3. Resposta Final
    res.json({ 
      count: enrichedLeads.length, 
      leads: enrichedLeads 
    });

  } catch (error) {
    console.error('Erro geral no getLeads:', error);
    res.status(500).json({ error: 'Erro interno ao processar leads.' });
  }
};