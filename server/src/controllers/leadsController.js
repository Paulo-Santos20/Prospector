import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite } from '../services/analyzerService.js';
import { findSocialLinks } from '../services/socialScraper.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';

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
          const cacheLimit = Date.now() - 86400000; // Cache de 24h

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

// BUSCA DE REDES SOCIAIS E E-MAILS (SOB DEMANDA)
export const getSocials = async (req, res) => {
  try {
    const { id, name, location } = req.body;
    console.log(`🔎 Buscando dados profundos (Redes e E-mails) para: ${name}`);
    
    // Dispara as duas buscas ao mesmo tempo para máxima velocidade
    const [socials, emails] = await Promise.all([
      findSocialLinks(name, location),
      findEmailViaSearch(name, location)
    ]);
    
    // Atualiza o banco com tudo o que achou
    const leadRef = db.collection('leads').doc(id);
    await leadRef.update({
      'analysis.socialLinks': socials,
      'analysis.emails': emails,
      updatedAt: admin.firestore.Timestamp.now()
    });

    // Retorna as duas listas para o Frontend
    res.json({ socialLinks: socials, emails: emails });
  } catch (error) {
    console.error("Erro na busca sob demanda:", error);
    res.status(500).json({ error: 'Erro ao buscar redes e e-mails' });
  }
};