// server/src/services/analyzerService.js
import axios from 'axios';
import * as cheerio from 'cheerio';
import { EMAIL_REGEX, SOCIAL_PATTERNS, YEAR_REGEX } from '../utils/patterns.js';

export const analyzeWebsite = async (url) => {
  if (!url) return { status: 'NO_WEBSITE', score: 0, details: [] };

  const result = {
    url,
    isSecure: url.startsWith('https'),
    isResponsive: false,
    copyrightYear: null,
    emails: [],
    socialLinks: [],
    techStack: [],
    opportunityScore: 0, // 0 a 100
    status: 'UNKNOWN'
  };

  try {
    // 1. Download do HTML (com timeout de 5s para não travar)
    const { data: html } = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 2. Carregar no Cheerio para análise
    const $ = cheerio.load(html);
    const bodyText = $('body').text();

    // --- ANÁLISE TÉCNICA ---
    
    // Check Responsividade (Meta Viewport)
    if ($('meta[name="viewport"]').length > 0) {
      result.isResponsive = true;
    }

    // Check Copyright (Ano)
    const footerText = $('footer').text() || $('div[class*="footer"]').text() || bodyText.slice(-2000); // Tenta pegar o final da página
    const yearMatch = footerText.match(YEAR_REGEX);
    if (yearMatch && yearMatch[1]) {
      result.copyrightYear = parseInt(yearMatch[1], 10);
    }

    // Check CMS/Tecnologia (Simples)
    if (html.includes('wp-content')) result.techStack.push('WordPress');
    if (html.includes('wix.com')) result.techStack.push('Wix');

    // --- ENRIQUECIMENTO (DATA MINING) ---

    // Emails (Mailto + Regex no texto)
    $('a[href^="mailto:"]').each((_, el) => {
      const email = $(el).attr('href').replace('mailto:', '');
      if (email) result.emails.push(email);
    });
    // Fallback: Procura no texto visível se não achou no mailto
    if (result.emails.length === 0) {
        const textEmails = bodyText.match(EMAIL_REGEX);
        if (textEmails) result.emails.push(...textEmails);
    }

    // Redes Sociais
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      for (const [network, regex] of Object.entries(SOCIAL_PATTERNS)) {
        if (regex.test(href)) {
          result.socialLinks.push({ network, url: href });
        }
      }
    });

    // Remover duplicatas
    result.emails = [...new Set(result.emails)];
    result.socialLinks = result.socialLinks.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i);

    // --- CÁLCULO DE PONTUAÇÃO (Oportunidade) ---
    // Quanto maior a pontuação, pior o site (mais oportunidade de venda)
    
    if (!result.isSecure) result.opportunityScore += 30;
    if (!result.isResponsive) result.opportunityScore += 40;
    
    const currentYear = new Date().getFullYear();
    if (result.copyrightYear && result.copyrightYear < currentYear - 2) {
      result.opportunityScore += 20; // Site abandonado há 2+ anos
    }

    // Classificação Final
    if (result.opportunityScore >= 50) result.status = 'HIGH_OPPORTUNITY'; // Crítico
    else if (result.opportunityScore >= 20) result.status = 'MODERATE';
    else result.status = 'MODERN_SITE';

    return result;

  } catch (error) {
    console.error(`Erro ao analisar ${url}:`, error.message);
    return { ...result, status: 'ERROR_ACCESSING', error: error.message };
  }
};