import axios from 'axios';
import * as cheerio from 'cheerio';
import { EMAIL_REGEX, SOCIAL_PATTERNS, YEAR_REGEX } from '../utils/patterns.js';

const THIRD_PARTY_DOMAINS = [
  'ifood.com.br', 'instagram.com', 'facebook.com', 'wa.me', 
  'whatsapp.com', 'deliverymaniac.com', 'goomer.app', 
  'menudino.com', 'ubereats.com', 'linktr.ee', 
  'business.site', 'site.google.com'
];

/**
 * Analisa o website e calcula o Score de Oportunidade (0-100)
 * Baseado em Saúde Técnica + Relevância do Negócio
 */
export const analyzeWebsite = async (url, userRatingCount = 0, priceLevel = 1) => {
  const result = {
    url,
    isSecure: url?.startsWith('https') || false,
    isResponsive: false,
    copyrightYear: null,
    emails: [],
    socialLinks: [],
    opportunityScore: 0,
    status: 'UNKNOWN',
    isThirdParty: false
  };

  // 1. Caso não tenha URL ou seja plataforma de terceiros
  const isThirdParty = url && THIRD_PARTY_DOMAINS.some(domain => url.toLowerCase().includes(domain));

  if (!url || isThirdParty) {
    result.status = 'NO_WEBSITE';
    result.isThirdParty = !!isThirdParty;
    
    // Algoritmo: Se não tem site, começa com 60 pontos (dor alta)
    let score = 60;
    
    // Adiciona bônus por Prova Social (Poder de compra)
    if (userRatingCount > 500) score += 30;
    else if (userRatingCount > 100) score += 20;
    else if (userRatingCount > 20) score += 10;

    // Adiciona bônus por ticket médio (Price Level)
    if (priceLevel >= 3) score += 10;

    result.opportunityScore = Math.min(score, 100);
    return result;
  }

  // 2. Scraping para sites próprios
  try {
    const { data: html } = await axios.get(url, {
      timeout: 8000,
      headers: { 'User-Agent': 'Mozilla/5.0...' }
    });

    const $ = cheerio.load(html);
    const textToScan = $('body').text();
    const foundEmails = new Set();

    // Extração de E-mails
    $('a[href^="mailto:"]').each((_, el) => {
      const email = $(el).attr('href').replace(/mailto:/i, '').split('?')[0].trim();
      if (email) foundEmails.add(email.toLowerCase());
    });
    const matches = textToScan.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (matches) matches.forEach(email => foundEmails.add(email.toLowerCase()));
    result.emails = Array.from(foundEmails);

    // Redes Sociais
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      for (const [network, regex] of Object.entries(SOCIAL_PATTERNS)) {
        if (regex.test(href)) result.socialLinks.push({ network, url: href });
      }
    });

    // Análise Técnica
    if ($('meta[name="viewport"]').length > 0) result.isResponsive = true;
    const yearMatch = textToScan.match(YEAR_REGEX);
    if (yearMatch) result.copyrightYear = parseInt(yearMatch[1]);

    // --- ALGORITMO DE SCORING (Lead Scoring 2.0) ---
    let score = 0;

    // Saúde Técnica (Máx 60)
    if (!result.isSecure) score += 20;
    if (!result.isResponsive) score += 30;
    const currentYear = new Date().getFullYear();
    if (result.copyrightYear && result.copyrightYear < currentYear) score += 10;

    // Potencial Financeiro / Relevância (Máx 40)
    if (userRatingCount > 100) score += 25;
    else if (userRatingCount > 30) score += 15;
    
    if (priceLevel >= 2) score += 15;

    result.opportunityScore = Math.min(score, 100);
    result.status = result.opportunityScore >= 50 ? 'HIGH_OPPORTUNITY' : 'MODERN_SITE';

    return result;

  } catch (error) {
    return { ...result, status: 'ERROR_ACCESSING', opportunityScore: 50 };
  }
};