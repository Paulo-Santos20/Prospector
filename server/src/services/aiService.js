import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const analyzeLeadWithAI = async (companyData) => {
  if (!process.env.GROQ_API_KEY) return null;

  const {
    businessName,
    htmlContent,
    rating = 0,
    reviewCount = 0,
    hasWebsite = false,
    isThirdParty = false,
    isSecure = false,
    isResponsive = false,
    emailCount = 0,
    socialLinksCount = 0,
    socialLinks = [],
    priceLevel = 1,
    address = '',
    followerCount = 0
  } = companyData;

  try {
    const cleanContent = (htmlContent || '')
      .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
      .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    const contextDescription = buildContextDescription({
      businessName,
      rating,
      reviewCount,
      hasWebsite,
      isThirdParty,
      isSecure,
      isResponsive,
      emailCount,
      socialLinksCount,
      socialLinks,
      priceLevel,
      address,
      followerCount
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Você é um Consultor de Conversão Digital especialista em análise de presença digital de pequenas e médias empresas.

REGRAS IMPORTANTES:
1. Analise TODOS os dados fornecidos para criar um diagnóstico preciso
2. NÃO escreva parágrafos explicativos longos - retorne dados estruturados
3. Cada campo do JSON deve ter um valor direto e objetivo
4. Use TERMINOLOGIA COMERCIAL CURTA - máximo 10 palavras para mainPainPoint

Retorne APENAS este JSON, sem texto adicional:
{
  "mainPainPoint": "Problema principal em até 10 palavras (ex: 'Sem site próprio + email ausente')",
  "urgency": "high|medium|low",
  "conversionOpportunity": "A|B|C",
  "keyMetrics": {
    "rating": 0-5 ou null,
    "reviewCount": número ou 0,
    "totalFollowers": número ou 0,
    "platforms": ["instagram", "facebook", etc] ou [],
    "priceLevel": 1-4,
    "hasWebsite": true|false,
    "hasEmail": true|false,
    "hasSocial": true|false
  },
  "specificIssues": [
    { "type": "no_website|no_email|no_social|low_rating|high_competition|other", "impact": "high|medium|low", "description": "Descrição curta do problema" }
  ],
  "recommendedActions": ["Ação 1", "Ação 2"]
}`
        },
        {
          role: "user",
          content: `Dados da Empresa:
${contextDescription}

${cleanContent ? `Conteúdo do Site (se disponível): ${cleanContent}` : '(Sem site ou conteúdo disponível)'}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content);
    return {
      ...result,
      businessName,
      analyzedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[IA] Erro na análise da Groq:`, error.message);
    return null;
  }
};

const buildContextDescription = (data) => {
  const lines = [];

  lines.push(`EMPRESA: ${data.businessName}`);
  lines.push(`LOCALIZAÇÃO: ${data.address || 'Não disponível'}`);
  lines.push(`---DADOS PRESENÇA DIGITAL---`);

  if (!data.hasWebsite && !data.isThirdParty) {
    lines.push(`SITE: NÃO`);
  } else if (data.isThirdParty) {
    lines.push(`SITE: Apenas redes sociais/perfis (NÃO)`);
  } else {
    lines.push(`SITE: SIM`);
  }

  if (data.hasWebsite && !data.isThirdParty) {
    lines.push(`SSL: ${data.isSecure ? 'SIM' : 'NÃO'}`);
    lines.push(`MOBILE: ${data.isResponsive ? 'SIM' : 'NÃO'}`);
  }

  lines.push(`---DADOS REPUTAÇÃO---`);
  lines.push(`NOTA: ${data.rating > 0 ? data.rating : 'N/A'}`);
  lines.push(`REVIEWS: ${data.reviewCount}`);
  lines.push(`PREÇO: ${getPriceLevelDescription(data.priceLevel)}`);

  lines.push(`---CANAIS---`);
  lines.push(`EMAIL: ${data.emailCount > 0 ? 'SIM' : 'NÃO'}`);
  lines.push(`REDES SOCIAIS: ${data.socialLinksCount > 0 ? 'SIM' : 'NÃO'}`);

  if (data.socialLinksCount > 0) {
    const socialNames = data.socialLinks.map(s => s.network).join(', ');
    lines.push(`PLATAFORMAS: ${socialNames}`);
    if (data.followerCount > 0) {
      lines.push(`SEGUIDORES: ${data.followerCount}`);
    }
  }

  return lines.join('\n');
};

const getPriceLevelDescription = (priceLevel) => {
  const descriptions = {
    0: 'Não especificado',
    1: 'Econômico',
    2: 'Intermediário',
    3: 'Premium',
    4: 'Luxo'
  };
  return descriptions[priceLevel] || 'Não especificado';
};