// server/src/controllers/leadsController.js
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';

export const getLeads = async (req, res) => {
  try {
    const { niche, location } = req.body;

    if (!niche || !location) {
      return res.status(400).json({ error: 'Nicho e Localização são obrigatórios' });
    }

    // 1. Busca leads brutos no Google
    console.log(`🔍 Buscando: ${niche} em ${location}...`);
    const rawLeads = await searchPlaces(niche, location);

    if (!rawLeads.length) {
      return res.json({ message: 'Nenhum local encontrado', leads: [] });
    }

    // 2. Analisa cada site encontrado (Processamento Paralelo)
    // Usamos Promise.all para analisar 10-20 sites simultaneamente e ser rápido
    const enrichedLeads = await Promise.all(
      rawLeads.map(async (place) => {
        const websiteUrl = place.websiteUri;
        
        // Se não tem site, é oportunidade Ouro
        if (!websiteUrl) {
          return {
            ...place,
            analysis: {
              status: 'NO_WEBSITE',
              opportunityScore: 100, // Máxima prioridade
              details: ['Cliente não possui website cadastrado']
            }
          };
        }

        // Se tem site, faz o scraping e auditoria
        const analysis = await analyzeWebsite(websiteUrl);
        
        return {
          ...place,
          analysis
        };
      })
    );

    // 3. Ordena por maior oportunidade
    enrichedLeads.sort((a, b) => b.analysis.opportunityScore - a.analysis.opportunityScore);

    res.json({
      count: enrichedLeads.length,
      leads: enrichedLeads
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao processar leads' });
  }
};