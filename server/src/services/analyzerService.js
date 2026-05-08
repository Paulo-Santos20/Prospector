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

export const analyzeWebsite = async (url, businessName = '', userRatingCount = 0, priceLevel = 1) => {
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

  let htmlToAnalyze = "Empresa sem website próprio. Analise baseada no nome e nicho de mercado.";

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
    const aiInsight = await analyzeLeadWithAI(htmlToAnalyze, businessName);

    if (aiInsight) {
      console.log(`[IA] Inteligência gerada com sucesso para: ${businessName}`);
      result.aiData = {
        ownerName: aiInsight.ownerName || 'Responsável',
        mainPainPoint: aiInsight.mainPainPoint || 'Falta de presença digital otimizada',
        featuredItem: aiInsight.featuredItem || 'Serviços Gerais',
        designStrategy: aiInsight.designStrategy
      };

      if (aiInsight.emails && Array.isArray(aiInsight.emails)) {
        const aiEmails = extractEmailsFromText(aiInsight.emails.join(' '));
        aiEmails.forEach(e => result.emails.push(e));
      }
    }
  } catch (aiError) {
    console.error(`[IA] Erro na análise da Groq:`, aiError.message);
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

  return result;
};