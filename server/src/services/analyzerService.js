import * as cheerio from 'cheerio';
import {
  SOCIAL_PATTERNS,
  isThirdPartyUrl,
  extractEmailsFromText,
  extractEmailsFromMailtos,
  CONTACT_PATHS,
} from '../utils/patterns.js';
import { analyzeLeadWithAI } from './aiService.js';
import { safeFetch } from './safeFetch.js';
import { normalizeAiInsight } from '../schemas/ai.js';
import { normalizeUrl } from '../utils/url.js';

const FETCH_OPTIONS = {
  timeoutMs: 10_000,
  maxBytes: 2 * 1024 * 1024,
};

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

const scrapePageForEmails = async ($) => {
  const emails = new Set();

  extractEmailsFromText($('body').text()).forEach((email) => emails.add(email));
  extractEmailsFromMailtos($).forEach((email) => emails.add(email));

  $('meta').each((_, el) => {
    const content = $(el).attr('content') || '';
    extractEmailsFromText(content).forEach((email) => emails.add(email));
  });

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (!content) return;
      const data = JSON.parse(content);
      extractEmailsFromText(JSON.stringify(data)).forEach((email) => emails.add(email));
    } catch {
      // JSON-LD inválido: ignora
    }
  });

  return Array.from(emails);
};

const scrapeContactPages = async (baseUrl) => {
  const baseDomain = new URL(baseUrl).origin;
  const pages = await Promise.allSettled(
    CONTACT_PATHS.slice(0, 3).map(async (path) => {
      const { text } = await safeFetch(baseDomain + path, FETCH_OPTIONS);
      return scrapePageForEmails(cheerio.load(text));
    })
  );

  const allEmails = new Set();
  for (const page of pages) {
    if (page.status === 'fulfilled') {
      page.value.forEach((email) => allEmails.add(email));
    }
  }

  return Array.from(allEmails);
};

const dedupeSocials = (socialLinks) => {
  const seen = new Set();
  return socialLinks.filter((link) => {
    const key = `${link.network}:${link.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const analyzeWebsite = async (
  url,
  businessName = '',
  userRatingCount = 0,
  priceLevel = 1,
  rating = 0,
  address = ''
) => {
  const cleanUrl = normalizeUrl(url);
  const hasNoUrl = !cleanUrl;

  const thirdPartyCheck = hasNoUrl
    ? { isThirdParty: false, reason: null }
    : isThirdPartyUrl(cleanUrl);
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
    thirdPartyReason: thirdPartyCheck.reason,
  };

  let htmlToAnalyze =
    'Empresa sem website próprio. Analise baseada apenas nos dados estruturados.';

  if (!hasNoUrl && !isThirdParty) {
    try {
      console.log(`[SCRAPING] Acessando site próprio: ${cleanUrl}`);
      const { text: html } = await safeFetch(cleanUrl, FETCH_OPTIONS);
      const $ = cheerio.load(html);
      htmlToAnalyze = $.html();

      const homeEmails = await scrapePageForEmails($);
      homeEmails.forEach((email) => result.emails.push(email));

      if ($('meta[name="viewport"]').length > 0) result.isResponsive = true;

      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        for (const [network, regex] of Object.entries(SOCIAL_PATTERNS)) {
          if (regex.test(href)) result.socialLinks.push({ network, url: href });
        }
      });

      if (result.emails.length === 0) {
        console.log('[SCRAPING] Nenhum email na home, buscando páginas de contato...');
        const contactEmails = await scrapeContactPages(cleanUrl);
        contactEmails.forEach((email) => result.emails.push(email));
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
      address,
    });

    if (aiInsight) {
      console.log(`[IA] Inteligência gerada com sucesso para: ${businessName}`);
      result.aiData = normalizeAiInsight(aiInsight);
    }
  } catch (aiError) {
    console.error('[IA] Erro na análise:', aiError.message);
    result.aiData = {
      mainPainPoint: 'Análise técnica indisponível no momento',
      urgency: 'medium',
      conversionOpportunity: 'B',
      specificIssues: [],
      recommendedActions: [],
    };
  }

  result.emails = [...new Set(result.emails.map((email) => email.toLowerCase()))];
  result.socialLinks = dedupeSocials(result.socialLinks);

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
      result.status =
        result.opportunityScore >= 50 ? 'HIGH_OPPORTUNITY' : 'MODERN_SITE';
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
    socialLinks = [],
  } = leadData;

  const cleanUrl = normalizeUrl(websiteUri);
  const hasNoUrl = !cleanUrl;
  const thirdPartyCheck = hasNoUrl ? { isThirdParty: false } : isThirdPartyUrl(cleanUrl);
  const isThirdParty = thirdPartyCheck.isThirdParty;

  const localResult = {
    isSecure: cleanUrl.startsWith('https'),
    isResponsive: false,
    emails: [],
    socialLinks: [],
  };

  let htmlToAnalyze =
    'Empresa sem website próprio. Analise baseada apenas nos dados estruturados.';

  if (!hasNoUrl && !isThirdParty) {
    try {
      const { text: html } = await safeFetch(cleanUrl, FETCH_OPTIONS);
      const $ = cheerio.load(html);
      htmlToAnalyze = $.html();
      localResult.isResponsive = $('meta[name="viewport"]').length > 0;
      localResult.emails = await scrapePageForEmails($);
    } catch {
      // Mantém os dados estruturados para a IA mesmo se o site falhar
    }
  }

  const socialInfo =
    socialLinks.length > 0
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
    followerCount: socialInfo.followerCount,
  });

  return {
    aiData: aiInsight
      ? removeUndefined({
          ...normalizeAiInsight(aiInsight),
          socialStats: socialInfo.socialStats,
        })
      : null,
    enrichedAt: new Date().toISOString(),
  };
};

const getSocialMediaStats = async () => ({ followerCount: 0, socialStats: {} });
