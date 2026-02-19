import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';
import { findSocialLinks } from '../services/socialScraper.js'; // O NOVO SERVIÇO

const limit = pLimit(3); // Reduzi para 3 para o Google não bloquear por excesso de requisições

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
            const cacheLimit = Date.now() - 86400000; // Cache de 24h

            if (doc.exists) {
              const data = doc.data();
              if (data.updatedAt.toMillis() > cacheLimit && data.analysis?.aiData) {
                return { ...place, analysis: data.analysis };
              }
            }

            // 1. Análise Base e IA
            let analysis = await analyzeWebsite(place.websiteUri, place.displayName.text, place.userRatingCount, place.priceLevel);

            // 2. BUSCA NO GOOGLE (Instagram, FB, iFood)
            const socials = await findSocialLinks(place.displayName.text, location);
            if (socials.length > 0) {
              if (!analysis.socialLinks) analysis.socialLinks = [];
              socials.forEach(s => {
                if (!analysis.socialLinks.some(existing => existing.network === s.network)) {
                  analysis.socialLinks.push(s);
                }
              });
            }

            // 3. E-mails extras
            if (!analysis.emails || analysis.emails.length === 0) {
              analysis.emails = await findEmailViaSearch(place.displayName.text, location);
            }

            const finalLead = { ...place, analysis };
            await leadRef.set({ ...finalLead, updatedAt: admin.firestore.Timestamp.now() }, { merge: true });

            return finalLead;
          } catch (err) {
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