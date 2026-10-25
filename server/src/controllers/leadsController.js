import pLimit from 'p-limit';
import admin from 'firebase-admin';
import { db } from '../config/firebase.js';
import { env } from '../config/env.js';
import { searchPlaces } from '../services/googleService.js';
import { searchOverpass } from '../services/overpassService.js';
import { searchFoursquare } from '../services/foursquareService.js';
import { searchGeoapify } from '../services/geoapifyService.js';
import { searchTomTom } from '../services/tomtomService.js';
import { analyzeWebsite, enrichLeadWithFullDiagnosis } from '../services/analyzerService.js';
import { incrementUsage, getProviderStatus as getStatus } from '../services/providerMonitor.js';
import { consumeQuota } from '../services/usageService.js';
import { buildQuotaError } from '../utils/usage.js';

const limit = pLimit(5);
const CACHE_TTL_MS = 10 * 24 * 60 * 60 * 1000;
const ENRICH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const removeUndefined = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined).filter((item) => item !== undefined);
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

const normalizePlace = (place) => ({
  ...place,
  displayName: { text: place.displayName?.text || 'Sem nome' },
  formattedAddress: place.formattedAddress || '',
  websiteUri: place.websiteUri || '',
  internationalPhoneNumber: place.internationalPhoneNumber || '',
  nationalPhoneNumber: place.nationalPhoneNumber || '',
});

const withProviderEmail = (analysis, email) => {
  if (!email) return analysis;

  return {
    ...analysis,
    emails: [...new Set([String(email).toLowerCase(), ...(analysis?.emails || [])])],
  };
};

const timestampToMillis = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

const searchRawLeads = async (req) => {
  const { niche, location, provider = 'geoapify', limit: requestedLimit } = req.body;

  if (provider === 'both') {
    const error = new Error('Busca combinada estará disponível em breve');
    error.status = 400;
    throw error;
  }

  const quota = await consumeQuota(req.user.uid, 'searches');
  if (!quota.allowed) {
    return { quotaError: buildQuotaError('searches', quota.used, quota.limit) };
  }

  const maxLeads = Math.min(
    env.MAX_LEADS_PER_SEARCH,
    Number.isInteger(requestedLimit) ? requestedLimit : env.MAX_LEADS_PER_SEARCH
  );

  let rawLeads;
  if (provider === 'google') {
    rawLeads = await searchPlaces(niche, location);
  } else if (provider === 'overpass') {
    rawLeads = await searchOverpass(niche, location);
  } else if (provider === 'foursquare') {
    rawLeads = await searchFoursquare(niche, location);
  } else if (provider === 'geoapify') {
    rawLeads = await searchGeoapify(niche, location, maxLeads);
  } else if (provider === 'tomtom') {
    rawLeads = await searchTomTom(niche, location);
  } else {
    const error = new Error('Provider inválido');
    error.status = 400;
    throw error;
  }

  incrementUsage(provider);

  const selectedLeads = (rawLeads || [])
    .filter((place) => place?.id)
    .slice(0, maxLeads)
    .map(normalizePlace);

  return { selectedLeads };
};

const analyzeLead = async (place) => {
  const { email, ...placeData } = place;
  const leadRef = db.collection('leads').doc(placeData.id);
  const doc = await leadRef.get();

  if (doc.exists) {
    const data = doc.data();
    if (
      timestampToMillis(data.updatedAt) > Date.now() - CACHE_TTL_MS &&
      data.analysis?.aiData
    ) {
      return { ...placeData, analysis: withProviderEmail(data.analysis, email) };
    }
  }

  const analysis = await analyzeWebsite(
    placeData.websiteUri,
    placeData.displayName.text,
    placeData.userRatingCount,
    placeData.priceLevel,
    placeData.rating,
    placeData.formattedAddress
  );

  const finalLead = { ...placeData, analysis: withProviderEmail(analysis, email) };
  await leadRef.set(
    { ...removeUndefined(finalLead), updatedAt: admin.firestore.Timestamp.now() },
    { merge: true }
  );

  return finalLead;
};

export const getLeads = async (req, res, next) => {
  try {
    const { quotaError, selectedLeads } = await searchRawLeads(req);
    if (quotaError) return res.status(429).json(quotaError);

    const enrichedLeads = await Promise.all(
      selectedLeads.map((place) => limit(() => analyzeLead(place)))
    );

    res.json({ count: enrichedLeads.length, leads: enrichedLeads });
  } catch (error) {
    next(error);
  }
};

export const streamLeads = async (req, res, next) => {
  let closed = false;
  res.on('close', () => {
    closed = true;
  });

  const send = (event) => {
    if (closed || res.writableEnded || res.destroyed) return false;
    try {
      res.write(`${JSON.stringify(event)}\n`);
      return true;
    } catch {
      closed = true;
      return false;
    }
  };

  try {
    const { quotaError, selectedLeads } = await searchRawLeads(req);
    if (quotaError) return res.status(429).json(quotaError);
    if (closed) return;

    res.status(200);
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    send({
      type: 'INIT',
      total: selectedLeads.length,
      leads: selectedLeads.map((place) => ({
        ...place,
        analysis: { status: 'ANALYZING' },
      })),
    });

    let completed = 0;
    await Promise.all(
      selectedLeads.map((place) =>
        limit(async () => {
          if (closed) return;

          let lead;
          try {
            lead = await analyzeLead(place);
          } catch (error) {
            console.error(`[STREAM] Falha ao analisar ${place.id}:`, error.message);
            lead = {
              ...place,
              analysis: {
                status: 'UNKNOWN',
                opportunityScore: 0,
                details: [error.message || 'Falha ao analisar lead'],
              },
            };
          }

          if (closed) return;
          completed += 1;
          send({ type: 'UPDATE', lead });
        })
      )
    );

    if (closed) return;
    send({ type: 'DONE', count: completed });
    res.end();
  } catch (error) {
    if (res.headersSent) {
      send({ type: 'ERROR', message: error.message || 'Falha na busca' });
      if (!res.writableEnded) res.end();
      return;
    }
    next(error);
  }
};

export const enrichLead = async (req, res, next) => {
  try {
    const { id } = req.body;
    const leadRef = db.collection('leads').doc(id);
    const doc = await leadRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const leadData = doc.data();
    const enrichedAt = timestampToMillis(leadData.analysis?.enrichedAt);

    if (enrichedAt > Date.now() - ENRICH_TTL_MS) {
      return res.json({
        alreadyEnriched: true,
        aiData: leadData.analysis.aiData,
        socialLinks: leadData.analysis.socialLinks || [],
      });
    }

    const quota = await consumeQuota(req.user.uid, 'analyses');
    if (!quota.allowed) {
      return res.status(429).json(buildQuotaError('analyses', quota.used, quota.limit));
    }

    const socials = leadData.analysis?.socialLinks || [];

    const enrichment = await enrichLeadWithFullDiagnosis({
      businessName: leadData.displayName?.text || '',
      websiteUri: leadData.websiteUri,
      userRatingCount: leadData.userRatingCount || 0,
      priceLevel: leadData.priceLevel || 1,
      rating: leadData.rating || 0,
      formattedAddress: leadData.formattedAddress || '',
      socialLinks: socials,
    });

    await leadRef.update({
      'analysis.socialLinks': socials,
      'analysis.emails': leadData.analysis?.emails || [],
      'analysis.aiData': removeUndefined({
        ...(leadData.analysis?.aiData || {}),
        ...(enrichment.aiData || {}),
      }),
      'analysis.enrichedAt': admin.firestore.Timestamp.fromDate(new Date(enrichment.enrichedAt)),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const updatedDoc = await leadRef.get();

    res.json({
      alreadyEnriched: false,
      aiData: updatedDoc.data()?.analysis?.aiData,
      socialLinks: socials,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const doc = await db.collection('leads').doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    next(error);
  }
};

export const getProviderStatus = async (_req, res) => {
  res.json({ providers: getStatus() });
};
