import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';

const limit = pLimit(5);

export const getLeads = async (req, res) => {
  try {
    const { niche, location } = req.body;
    const rawLeads = await searchPlaces(niche, location);

    const enrichedLeads = await Promise.all(
      rawLeads.map((place) => 
        limit(async () => {
          try {
            const leadRef = db.collection('leads').doc(place.id);
            const doc = await leadRef.get();
            
            // CACHE DE 24 HORAS (86400000 ms)
            const cacheLimit = Date.now() - 86400000;

            if (doc.exists) {
              const data = doc.data();
              const isRecent = data.updatedAt.toMillis() > cacheLimit;
              
              // Se tiver análise de IA (aiData) e for recente, USA O CACHE
              if (isRecent && data.analysis?.aiData) {
                console.log(`📦 [CACHE 24H] ${place.displayName.text}`);
                return { ...place, analysis: data.analysis };
              }
            }

            // SE NÃO TEM CACHE OU PASSOU 24H, EXECUTA IA
            console.log(`🧪 [IA + SCRAPING] Processando: ${place.displayName.text}`);
            
            let analysis = await analyzeWebsite(
              place.websiteUri, 
              place.displayName.text, 
              place.userRatingCount, 
              place.priceLevel
            );

            // Tenta buscar e-mail no Google se não achar no site/IA
            if (!analysis.emails || analysis.emails.length === 0) {
              const extraEmails = await findEmailViaSearch(place.displayName.text, location);
              analysis.emails = extraEmails;
            }

            const finalLead = { ...place, analysis };

            // Salva no Firebase com timestamp atualizado
            await leadRef.set({
              ...finalLead,
              updatedAt: admin.firestore.Timestamp.now()
            }, { merge: true });

            return finalLead;

          } catch (err) {
            console.error(`Erro no lead ${place.id}:`, err);
            return { ...place, analysis: { status: 'ERROR', emails: [] } };
          }
        })
      )
    );

    res.json({ count: enrichedLeads.length, leads: enrichedLeads });
  } catch (error) {
    res.status(500).json({ error: 'Erro geral' });
  }
};