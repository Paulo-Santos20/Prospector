import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  SOCIAL_PATTERNS,
  isThirdPartyUrl,
  extractEmailsFromText,
  extractEmailsFromMailtos,
  CONTACT_PATHS
} from '../utils/patterns.js';
import { analyzeLeadWithAI } from './aiService.js';

const TIMEOUT_MS = 10000;
const AXIOS_CONFIG = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
  },
  timeout: TIMEOUT_MS
};

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

const scrapePageForEmails = async ($, baseUrl) => {
  const emails = new Set();

  const textToScan = $('body').text();
  const textEmails = extractEmailsFromText(textToScan);
  textEmails.forEach(e => emails.add(e));

  const mailtoEmails = extractEmailsFromMailtos($);
  mailtoEmails.forEach(e => emails.add(e));

  $('meta').each((_, el) => {
    const content = $(el).attr('content') || '';
    const metaEmails = extractEmailsFromText(content);
    metaEmails.forEach(e => emails.add(e));
  });

  const jsonLdScripts = $('script[type="application/ld+json"]');
  jsonLdScripts.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const data = JSON.parse(content);
        const jsonEmails = extractEmailsFromText(JSON.stringify(data));
        jsonEmails.forEach(e => emails.add(e));
      }
    } catch {}
  });

  return Array.from(emails);
};

const scrapeContactPages = async (baseUrl) => {
  const allEmails = new Set();
  const baseDomain = new URL(baseUrl).origin;

  for (const path of CONTACT_PATHS.slice(0, 5)) {
    try {
      const contactUrl = baseDomain + path;
      const { data: html } = await axios.get(contactUrl, AXIOS_CONFIG);
      const $ = cheerio.load(html);
      const emails = await scrapePageForEmails($, contactUrl);
      emails.forEach(e => allEmails.add(e));
    } catch {
      // Silently continue to next contact page
    }
  }

  return Array.from(allEmails);
};

export const analyzeWebsite = async (url, businessName = '', userRatingCount = 0, priceLevel = 1, rating = 0, address = '') => {
  const cleanUrl = url?.toLowerCase().trim() || '';
  const hasNoUrl = !cleanUrl;

  const thirdPartyCheck = hasNoUrl ? { isThirdParty: false, reason: null } : isThirdPartyUrl(cleanUrl);
  const isThirdParty = thirdPartyCheck.isThirdParty;

  const result = {
    url: cleanUrl,
    isSecure: cleanUrl.startsWith('https'),
    isResponsive: false,
    copyrightYear: null,
    emails: [],
    socialLinks: [],
    opportunityScore: 0,
    status: 'UNKNOWN',
    isThirdParty: !!isThirdParty,
    aiData: null,
    thirdPartyReason: thirdPartyCheck.reason
  };

  let htmlToAnalyze = "Empresa sem website próprio. Analise baseada apenas nos dados estruturados.";

  if (!hasNoUrl && !isThirdParty) {
    try {
      console.log(`[SCRAPING] Acessando site próprio: ${cleanUrl}`);
      const { data: html } = await axios.get(cleanUrl, AXIOS_CONFIG);

      const $ = cheerio.load(html);
      htmlToAnalyze = $.html();

      const homeEmails = await scrapePageForEmails($, cleanUrl);
      homeEmails.forEach(e => result.emails.push(e));

      if ($('meta[name="viewport"]').length > 0) result.isResponsive = true;

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        for (const [network, regex] of Object.entries(SOCIAL_PATTERNS)) {
          if (regex.test(href)) result.socialLinks.push({ network, url: href });
        }
      });

      if (result.emails.length === 0) {
        console.log(`[SCRAPING] Nenhum email na home, buscando páginas de contato...`);
        const contactEmails = await scrapeContactPages(cleanUrl);
        contactEmails.forEach(e => result.emails.push(e));
      }
    } catch (error) {
      console.error(`[SCRAPING] Erro ao acessar ${cleanUrl}: ${error.message}`);
      result.status = 'ERROR_ACCESSING';
    }
  }

  try {
    const aiInsight = await analyzeLeadWithAI({
      businessName,
      htmlContent: htmlToAnalyze,
      rating,
      reviewCount: userRatingCount,
      hasWebsite: !hasNoUrl && !isThirdParty,
      isThirdParty,
      isSecure: result.isSecure,
      isResponsive: result.isResponsive,
      emailCount: result.emails.length,
      socialLinksCount: result.socialLinks.length,
      socialLinks: result.socialLinks,
      priceLevel,
      address
    });

    if (aiInsight) {
      console.log(`[IA] Inteligência gerada com sucesso para: ${businessName}`);
      result.aiData = {
        ownerName: aiInsight.ownerName || 'Responsável',
        mainPainPoint: aiInsight.mainPainPoint || 'Falta de presença digital otimizada',
        diagnosisReasoning: aiInsight.diagnosisReasoning || '',
        urgency: aiInsight.urgency || 'medium',
        conversionOpportunity: aiInsight.conversionOpportunity || 'B',
        keyIssues: aiInsight.keyIssues || [],
        recommendedActions: aiInsight.recommendedActions || [],
        designStrategy: aiInsight.designStrategy || null
      };

      if (aiInsight.emails && Array.isArray(aiInsight.emails)) {
        const aiEmails = extractEmailsFromText(aiInsight.emails.join(' '));
        aiEmails.forEach(e => result.emails.push(e));
      }
    }
  } catch (aiError) {
    console.error(`[IA] Erro na análise da Groq:`, aiError.message);
    result.aiData = {
      mainPainPoint: 'Análise técnica indisponível no momento',
      diagnosisReasoning: '',
      urgency: 'medium',
      conversionOpportunity: 'B',
      keyIssues: [],
      recommendedActions: []
    };
  }

  result.emails = [...new Set(result.emails.map(e => e.toLowerCase()))];

  if (hasNoUrl || isThirdParty) {
    result.status = 'NO_WEBSITE';
    let score = 70;
    if (userRatingCount > 100) score += 15;
    if (priceLevel >= 2) score += 15;
    result.opportunityScore = Math.min(score, 100);
    if (isThirdParty) result.socialLinks.push({ network: 'platform', url: cleanUrl });
  } else {
    let techScore = 0;
    if (!result.isSecure) techScore += 25;
    if (!result.isResponsive) techScore += 35;
    if (userRatingCount > 50) techScore += 20;
    if (result.emails.length === 0) techScore += 20;

    result.opportunityScore = Math.min(techScore, 100);
    if (result.status !== 'ERROR_ACCESSING') {
        result.status = result.opportunityScore >= 50 ? 'HIGH_OPPORTUNITY' : 'MODERN_SITE';
    }
  }

  result.aiData = removeUndefined(result.aiData);

  return result;
};

export const enrichLeadWithFullDiagnosis = async (leadData) => {
  const {
    businessName,
    websiteUri,
    userRatingCount = 0,
    priceLevel = 1,
    rating = 0,
    formattedAddress = '',
    socialLinks = []
  } = leadData;

  const cleanUrl = websiteUri?.toLowerCase().trim() || '';
  const hasNoUrl = !cleanUrl;
  const thirdPartyCheck = hasNoUrl ? { isThirdParty: false } : isThirdPartyUrl(cleanUrl);
  const isThirdParty = thirdPartyCheck.isThirdParty;

  const localResult = {
    isSecure: cleanUrl.startsWith('https'),
    isResponsive: false,
    emails: [],
    socialLinks: []
  };

  let htmlToAnalyze = "Empresa sem website próprio. Analise baseada apenas nos dados estruturados.";

  if (!hasNoUrl && !isThirdParty) {
    try {
      const { data: html } = await axios.get(cleanUrl, AXIOS_CONFIG);
      const $ = cheerio.load(html);
      htmlToAnalyze = $.html();
      localResult.isResponsive = $('meta[name="viewport"]').length > 0;
      localResult.emails = await scrapePageForEmails($, cleanUrl);
    } catch {}
  }

  const socialInfo = socialLinks.length > 0
    ? await getSocialMediaStats(socialLinks)
    : { followerCount: 0, socialStats: {} };

  const aiInsight = await analyzeLeadWithAI({
    businessName,
    htmlContent: htmlToAnalyze,
    rating,
    reviewCount: userRatingCount,
    hasWebsite: !hasNoUrl && !isThirdParty,
    isThirdParty,
    isSecure: localResult.isSecure,
    isResponsive: localResult.isResponsive,
    emailCount: localResult.emails.length,
    socialLinksCount: socialLinks.length,
    socialLinks,
    priceLevel,
    address: formattedAddress,
    followerCount: socialInfo.followerCount
  });

  return {
    aiData: aiInsight ? removeUndefined({
      ownerName: aiInsight.ownerName || 'Responsável',
      mainPainPoint: aiInsight.mainPainPoint || 'Falta de presença digital otimizada',
      diagnosisReasoning: aiInsight.diagnosisReasoning || '',
      urgency: aiInsight.urgency || 'medium',
      conversionOpportunity: aiInsight.conversionOpportunity || 'B',
      keyIssues: aiInsight.keyIssues || [],
      recommendedActions: aiInsight.recommendedActions || [],
      designStrategy: aiInsight.designStrategy || null,
      socialStats: socialInfo.socialStats
    }) : null,
    enrichedAt: new Date().toISOString()
  };
};

const getSocialMediaStats = async (socialLinks) => {
  const stats = {};
  let totalFollowers = 0;

  for (const link of socialLinks) {
    try {
      if (link.network === 'instagram') {
        const followerCount = await getInstagramFollowers(link.url);
        stats.instagram = { url: link.url, followerCount };
        totalFollowers += followerCount;
      } else if (link.network === 'facebook') {
        const followerCount = await getFacebookFollowers(link.url);
        stats.facebook = { url: link.url, followerCount };
        totalFollowers += followerCount;
      }
    } catch {}
  }

  return { followerCount: totalFollowers, socialStats: stats };
};

const getInstagramFollowers = async (instagramUrl) => {
  try {
    const { data: html } = await axios.get(instagramUrl, {
      ...AXIOS_CONFIG,
      timeout: 5000
    });

    const $ = cheerio.load(html);
    const scriptContent = $('script[type="application/ld+json"]').html();
    if (scriptContent) {
      const data = JSON.parse(scriptContent);
      return data.aggregateRating?.reviewCount || 0;
    }

    const metaFollowers = $('meta[property="og:description"]').attr('content');
    if (metaFollowers) {
      const match = metaFollowers.match(/([\d,]+)\s*seguidores/);
      if (match) return parseInt(match[1].replace(',', ''));
    }
  } catch {}
  return 0;
};

const getFacebookFollowers = async (facebookUrl) => {
  try {
    const { data: html } = await axios.get(facebookUrl, {
      ...AXIOS_CONFIG,
      timeout: 5000
    });

    const $ = cheerio.load(html);
    const metaContent = $('meta[property="og:description"]').attr('content');
    if (metaContent) {
      const match = metaContent.match(/([\d,.]+)\s*(likes?|seguidores?)/i);
      if (match) return parseInt(match[1].replace('.', ''));
    }
  } catch {}
  return 0;
};