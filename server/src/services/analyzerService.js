import axios from 'axios';
import * as cheerio from 'cheerio';
import { EMAIL_REGEX, SOCIAL_PATTERNS, YEAR_REGEX } from '../utils/patterns.js';
import { analyzeLeadWithAI } from './aiService.js';

const THIRD_PARTY_DOMAINS = [
  'ifood.com.br', 'instagram.com', 'facebook.com', 'wa.me', 
  'whatsapp.com', 'deliverymaniac.com', 'goomer.app', 
  'menudino.com', 'ubereats.com', 'linktr.ee', 
  'business.site', 'site.google.com', 'globo.com', 'uol.com.br',
  'youtube.com', 'tiktok.com', 'yelp.com', 'tripadvisor.com'
];

/**
 * Analisa o website e integra Inteligência Artificial.
 * Corrigido para garantir que a IA processe a estratégia mesmo sem site próprio.
 */
export const analyzeWebsite = async (url, businessName = '', userRatingCount = 0, priceLevel = 1) => {
  const cleanUrl = url?.toLowerCase().trim() || '';
  const isThirdParty = cleanUrl && THIRD_PARTY_DOMAINS.some(domain => cleanUrl.includes(domain));
  const hasNoUrl = !cleanUrl;

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
    aiData: null
  };

  // --- LOGICA DE INTELIGÊNCIA UNIVERSAL ---
  // Se não tem site ou é rede social, a IA analisa apenas o nome/nicho
  // Se tem site próprio, fazemos o scraping antes para enviar o HTML para a IA
  let htmlToAnalyze = "Empresa sem website próprio. Analise baseada no nome e nicho de mercado.";

  if (!hasNoUrl && !isThirdParty) {
    try {
      console.log(`🌐 [SCRAPING] Acessando site próprio: ${cleanUrl}`);
      const { data: html } = await axios.get(cleanUrl, {
        timeout: 10000,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
        }
      });
      
      const $ = cheerio.load(html);
      htmlToAnalyze = $.html(); // Enviamos o HTML completo para a Groq

      // Extração técnica básica via Cheerio
      const textToScan = $('body').text();
      const matches = textToScan.match(EMAIL_REGEX);
      if (matches) matches.forEach(e => result.emails.push(e.toLowerCase()));
      if ($('meta[name="viewport"]').length > 0) result.isResponsive = true;
      
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        for (const [network, regex] of Object.entries(SOCIAL_PATTERNS)) {
          if (regex.test(href)) result.socialLinks.push({ network, url: href });
        }
      });
    } catch (error) {
      console.error(`⚠️ [SCRAPING] Erro ao acessar ${cleanUrl}: ${error.message}`);
      result.status = 'ERROR_ACCESSING';
    }
  }

  // --- CHAMADA IA GROQ (Sempre executada) ---
  // Garante que mesmo "Sem Site" tenha Dor de Conversão e Paleta de Cores
  try {
    const aiInsight = await analyzeLeadWithAI(htmlToAnalyze, businessName);
    
    if (aiInsight) {
      console.log(`✨ [IA] Inteligência gerada com sucesso para: ${businessName}`);
      result.aiData = {
        ownerName: aiInsight.ownerName || 'Responsável',
        mainPainPoint: aiInsight.mainPainPoint || 'Falta de presença digital otimizada',
        featuredItem: aiInsight.featuredItem || 'Serviços Gerais',
        designStrategy: aiInsight.designStrategy // Cores vêm aqui
      };
      
      if (aiInsight.emails && Array.isArray(aiInsight.emails)) {
        result.emails = [...new Set([...result.emails, ...aiInsight.emails])];
      }
    }
  } catch (aiError) {
    console.error(`❌ [IA] Erro na análise da Groq:`, aiError.message);
  }

  // --- FINALIZAÇÃO DO STATUS E SCORE ---
  if (hasNoUrl || isThirdParty) {
    result.status = 'NO_WEBSITE';
    let score = 70; // Score alto pois não tem site próprio
    if (userRatingCount > 100) score += 15;
    if (priceLevel >= 2) score += 15;
    result.opportunityScore = Math.min(score, 100);
    if (isThirdParty) result.socialLinks.push({ network: 'platform', url: cleanUrl });
  } else {
    // Cálculo técnico para sites próprios
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