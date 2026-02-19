import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';
import { findSocialLinks } from '../services/socialScraper.js';

// Reduzido para 2 para garantir estabilidade e evitar timeouts coletivos
const limit = pLimit(2);

export const getLeads = async (req, res) => {
  try {
    const { niche, location } = req.body;
    console.log(`🌐 Consultando Google Maps para: "${niche} em ${location}"`);
    
    const rawLeads = await searchPlaces(niche, location);
    console.log(`✅ Google retornou ${rawLeads.length} locais.`);

    const enrichedLeads = await Promise.all(
      rawLeads.map((place) => 
        limit(async () => {
          try {
            const leadRef = db.collection('leads').doc(place.id);
            const doc = await leadRef.get();
            const cacheLimit = Date.now() - 86400000; // Cache de 24h

            if (doc.exists) {
              const data = doc.data();
              if (data.updatedAt && data.updatedAt.toMillis() > cacheLimit && data.analysis?.aiData) {
                console.log(`📦 [CACHE] ${place.displayName.text}`);
                return { ...place, analysis: data.analysis };
              }
            }

            console.log(`🧪 [IA + SOCIAL] Processando: ${place.displayName.text}`);

            // 1. Análise de Website e IA
            let analysis = await analyzeWebsite(place.websiteUri, place.displayName.text, place.userRatingCount, place.priceLevel);

            // 2. Busca Híbrida de Redes Sociais (Com timeout de 15s e Fallback)
            const socials = await findSocialLinks(place.displayName.text, location);
            if (socials.length > 0) {
              if (!analysis.socialLinks) analysis.socialLinks = [];
              socials.forEach(s => {
                if (!analysis.socialLinks.some(existing => existing.network === s.network)) {
                  analysis.socialLinks.push(s);
                }
              });
            }

            // 3. Busca de E-mails
            if (!analysis.emails || analysis.emails.length === 0) {
              analysis.emails = await findEmailViaSearch(place.displayName.text, location);
            }

            const finalLead = { ...place, analysis };
            
            // Salva no Firebase
            await leadRef.set({ 
              ...finalLead, 
              updatedAt: admin.firestore.Timestamp.now() 
            }, { merge: true });

            return finalLead;
          } catch (err) {
            console.error(`❌ Erro no lead ${place.displayName.text}:`, err.message);
            return { ...place, analysis: { status: 'ERROR', details: [err.message] } };
          }
        })
      )
    );

    res.json({ count: enrichedLeads.length, leads: enrichedLeads });
  } catch (error) {
    console.error("❌ Erro Geral:", error);
    res.status(500).json({ error: 'Erro ao processar leads' });
  }
};