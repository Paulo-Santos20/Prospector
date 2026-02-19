import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';
import { findInstagramProfile } from '../services/socialScraper.js';

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
            const cacheLimit = Date.now() - 86400000; // 24h

            if (doc.exists) {
              const data = doc.data();
              const isRecent = data.updatedAt.toMillis() > cacheLimit;
              if (isRecent && data.analysis?.aiData) {
                return { ...place, analysis: data.analysis };
              }
            }

            // --- IA + SCRAPING + REDES SOCIAIS ---
            let analysis = await analyzeWebsite(
              place.websiteUri, 
              place.displayName.text, 
              place.userRatingCount, 
              place.priceLevel
            );

            // Busca Instagram se não achou no site ou se está sem site
            const instaUrl = await findInstagramProfile(place.displayName.text, location);
            if (instaUrl) {
              if (!analysis.socialLinks) analysis.socialLinks = [];
              const exists = analysis.socialLinks.some(s => s.network === 'instagram');
              if (!exists) analysis.socialLinks.push({ network: 'instagram', url: instaUrl });
            }

            // Tenta buscar e-mail externamente
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