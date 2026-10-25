import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const groqKeys = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_FALLBACK
].filter(Boolean);

const SYSTEM_PROMPT = `Você é um Consultor de Conversão Digital especialista em análise de presença digital de pequenas e médias empresas.

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
  "recommendedActions": ["Ação 1", "Ação 2"],
  "designStrategy": {
    "style": "Ex: Minimalista, sofisticado, acolhedor",
    "primaryColor": "#RRGGBB",
    "secondaryColor": "#RRGGBB",
    "typography": { "heading": "Fonte para títulos", "body": "Fonte para texto" },
    "designReasoning": "Por que esse visual funciona para o negócio (até 25 palavras)",
    "referenceSite": "https://exemplo-de-referencia.com"
  },
  "featuredItem": "Produto ou serviço que deve aparecer em destaque"
}

NUNCA invente nome de proprietário, e-mail, telefone ou qualquer dado de contato ausente nos dados fornecidos.`;

const analyzeWithGroqKey = async (apiKey, contextDescription, cleanContent) => {
  const groq = new Groq({ apiKey });

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "user", 
        content: `Dados da Empresa:\n${contextDescription}\n\n${cleanContent ? `Conteúdo do Site (se disponível): ${cleanContent}` : '(Sem site ou conteúdo disponível)'}` 
      }
    ],
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  return JSON.parse(chatCompletion.choices[0].message.content);
};

const analyzeWithGroq = async (contextDescription, cleanContent) => {
  if (groqKeys.length === 0) return null;

  for (let i = 0; i < groqKeys.length; i++) {
    try {
      console.log(`[IA] Tentando Groq (chave ${i + 1}/${groqKeys.length})...`);
      const result = await analyzeWithGroqKey(groqKeys[i], contextDescription, cleanContent);
      if (result) return result;
    } catch (error) {
      console.error(`[IA] Groq chave ${i + 1} falhou:`, error.message);
    }
  }
  return null;
};

const analyzeWithGemini = async (contextDescription, cleanContent) => {
  if (!process.env.GEMINI_API_KEY) return null;

  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json"
    }
  });

  const prompt = `${SYSTEM_PROMPT}\n\nDados da Empresa:\n${contextDescription}\n\n${cleanContent ? `Conteúdo do Site (se disponível): ${cleanContent}` : '(Sem site ou conteúdo disponível)'}`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return JSON.parse(response.text());
};

export const analyzeLeadWithAI = async (companyData) => {
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

  const cleanContent = (htmlContent || '')
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, "")
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000);

  const contextDescription = buildContextDescription({
    businessName, rating, reviewCount, hasWebsite, isThirdParty,
    isSecure, isResponsive, emailCount, socialLinksCount, socialLinks,
    priceLevel, address, followerCount
  });

  // Groq (com fallback entre chaves) → Gemini
  const providers = [
    { name: 'Groq', fn: analyzeWithGroq },
    { name: 'Gemini', fn: analyzeWithGemini }
  ];

  for (const provider of providers) {
    try {
      const result = await provider.fn(contextDescription, cleanContent);
      if (result) {
        console.log(`[IA] Análise via ${provider.name} concluída para: ${businessName}`);
        return {
          ...result,
          businessName,
          analyzedAt: new Date().toISOString(),
          provider: provider.name
        };
      }
    } catch (error) {
      console.error(`[IA] Erro no ${provider.name}:`, error.message);
    }
  }

  console.error(`[IA] Todos os providers falharam para: ${businessName}`);
  return null;
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
