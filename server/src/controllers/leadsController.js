import pLimit from 'p-limit';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';
import { searchPlaces } from '../services/googleService.js';
import { analyzeWebsite, enrichLeadWithFullDiagnosis } from '../services/analyzerService.js';
import { findSocialLinks } from '../services/socialScraper.js';
import { findEmailViaSearch } from '../services/googleSearchService.js';

const limit = pLimit(2);

const removeUndefined = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter(item => item !== undefined);
  }
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = removeUndefined(value);
      }
    }
    return result;
  }
  return obj;
};

export const getLeads = async (req, res) => {
  try {
    const { niche, location } = req.body;
    const rawLeads = await searchPlaces(niche, location);

    const enrichedLeads = await Promise.all(
      rawLeads.map((place) =>
        limit(async () => {
          const leadRef = db.collection('leads').doc(place.id);
          const doc = await leadRef.get();
          const cacheLimit = Date.now() - 864000000;

          if (doc.exists) {
            const data = doc.data();
            if (data.updatedAt?.toMillis() > cacheLimit && data.analysis?.aiData) {
              return { ...place, analysis: data.analysis, notes: data.notes };
            }
          }

          let analysis = await analyzeWebsite(
            place.websiteUri,
            place.displayName.text,
            place.userRatingCount,
            place.priceLevel,
            place.rating,
            place.formattedAddress
          );

          const finalLead = { ...place, analysis };

          await leadRef.set({ ...finalLead, updatedAt: admin.firestore.Timestamp.now() }, { merge: true });

          return finalLead;
        })
      )
    );
    res.json({ count: enrichedLeads.length, leads: enrichedLeads });
  } catch (error) {
    console.error('getLeads error:', error);
    res.status(500).json({ error: 'Erro ao buscar leads', details: error.message });
  }
};

export const enrichLead = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID do lead é obrigatório' });
    }

    const leadRef = db.collection('leads').doc(id);
    const doc = await leadRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const leadData = doc.data();

    if (leadData.analysis?.enrichedAt) {
      const enrichedCacheLimit = Date.now() - 604800000;
      if (leadData.analysis.enrichedAt > enrichedCacheLimit) {
        return res.json({
          alreadyEnriched: true,
          aiData: leadData.analysis.aiData
        });
      }
    }

    const [socials] = await Promise.all([
      findSocialLinks(leadData.displayName?.text || '', leadData.formattedAddress || '')
    ]);

    const enrichment = await enrichLeadWithFullDiagnosis({
      businessName: leadData.displayName?.text || '',
      websiteUri: leadData.websiteUri,
      userRatingCount: leadData.userRatingCount || 0,
      priceLevel: leadData.priceLevel || 1,
      rating: leadData.rating || 0,
      formattedAddress: leadData.formattedAddress || '',
      socialLinks: socials
    });

    await leadRef.update({
      'analysis.socialLinks': socials.length > 0 ? socials : (leadData.analysis?.socialLinks || []),
      'analysis.emails': leadData.analysis?.emails || [],
      'analysis.aiData': removeUndefined({
        ...leadData.analysis?.aiData,
        ...enrichment.aiData
      }),
      'analysis.enrichedAt': admin.firestore.Timestamp.fromDate(new Date(enrichment.enrichedAt)),
      updatedAt: admin.firestore.Timestamp.now()
    });

    const updatedDoc = await leadRef.get();

    res.json({
      alreadyEnriched: false,
      aiData: updatedDoc.data()?.analysis?.aiData,
      socialLinks: socials
    });
  } catch (error) {
    console.error("Erro no enrichLead:", error);
    res.status(500).json({ error: 'Erro ao enriquecer lead' });
  }
};

export const getSocials = async (req, res) => {
  try {
    const { id, name, location } = req.body;
    console.log(`[SOCIALS] Buscando dados para: ${name}`);

    const [socials, emails] = await Promise.all([
      findSocialLinks(name, location),
      findEmailViaSearch(name, location)
    ]);

    const leadRef = db.collection('leads').doc(id);
    await leadRef.update({
      'analysis.socialLinks': socials,
      'analysis.emails': emails.length > 0 ? emails : admin.firestore.FieldValue.arrayUnion(),
      updatedAt: admin.firestore.Timestamp.now()
    });

    res.json({ socialLinks: socials, emails: emails });
  } catch (error) {
    console.error("Erro na busca de sociais:", error);
    res.status(500).json({ error: 'Erro ao buscar redes e e-mails' });
  }
};

export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID do lead é obrigatório' });
    }

    const leadRef = db.collection('leads').doc(id);
    const doc = await leadRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Erro ao buscar lead por ID:", error);
    res.status(500).json({ error: 'Erro ao buscar lead' });
  }
};