import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findSocialLinks } from '../services/socialScraper.js';

const limit = pLimit(2);

// LISTAGEM RÁPIDA
export const getLeads = async (req, res) => {
  try {
    const { niche, location } = req.body;
    const rawLeads = await searchPlaces(niche, location);

    const enrichedLeads = await Promise.all(
      rawLeads.map((place) => 
        limit(async () => {
          const leadRef = db.collection('leads').doc(place.id);
          const doc = await leadRef.get();
          const cacheLimit = Date.now() - 86400000;

          if (doc.exists) {
            const data = doc.data();
            if (data.updatedAt?.toMillis() > cacheLimit && data.analysis?.aiData) {
              return { ...place, analysis: data.analysis, notes: data.notes };
            }
          }

          let analysis = await analyzeWebsite(place.websiteUri, place.displayName.text, place.userRatingCount, place.priceLevel);
          const finalLead = { ...place, analysis };
          await leadRef.set({ ...finalLead, updatedAt: admin.firestore.Timestamp.now() }, { merge: true });
          return finalLead;
        })
      )
    );
    res.json({ count: enrichedLeads.length, leads: enrichedLeads });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar leads' });
  }
};

// BUSCA DE REDES SOCIAIS (SOB DEMANDA)
export const getSocials = async (req, res) => {
  try {
    const { id, name, location } = req.body;
    const socials = await findSocialLinks(name, location);
    
    const leadRef = db.collection('leads').doc(id);
    await leadRef.update({
      'analysis.socialLinks': socials,
      updatedAt: admin.firestore.Timestamp.now()
    });

    res.json(socials);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar redes sociais' });
  }
};