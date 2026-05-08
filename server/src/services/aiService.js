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
    const cleanContent = htmlContent
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
Seu objetivo é identificar a PRINCIPAIS DOR DE CONVERSÃO do cliente com base nos dados disponíveis.

REGRAS IMPORTANTES:
1. Analise TODOS os dados fornecidos para criar um diagnóstico preciso
2. O diagnóstico deve ser específico, não genérico - use os dados reais
3. Se não há site, mencione a ausência de canal próprio
4. Se há site mas sem SSL ou não responsivo, mencione problemas técnicos
5. Se há site bom mas nota baixa no Google, sugira gestão de reputação
6. Se tem muitos reviews mas nota baixa, isso é prioritário
7. Se não tem email profissional nem redes sociais, mencione falta de canais de contato
8. Use TERMINOLOGIA COMERCIAL - evite termos técnicos demais

CLASSIFICAÇÃO DE URGÊNCIA:
- HIGH: Sem presença digital, site quebrado, sem SSL, nota muito baixa (<3.5) com muitos reviews, ou empresa muito grande com presença digital precária
- MEDIUM: Site existente mas com problemas técnicos, nota entre 3.5-4.2, ou falta de algum canal importante
- LOW: Boa presença digital mas com espaço para melhoria, ou nota alta com poucos reviews

CLASSIFICAÇÃO DE OPORTUNIDADE (A-B-C):
- A: Empresa grande (muitos reviews OU alto priceLevel) COM sérios problemas de conversão - POTENCIAL ALTO
- B: Empresa média com problemas moderados de conversão - POTENCIAL MÉDIO
- C: Empresa pequena ou problemas menores - POTENCIAL MENOR

Retorne APENAS este JSON, sem texto adicional:
{
  "mainPainPoint": "A principal dor de conversão em 1-2 frases (terminologia comercial)",
  "diagnosisReasoning": "Explicação técnica breve de por que este é o problema principal, citing dados reais",
  "urgency": "high|medium|low",
  "conversionOpportunity": "A|B|C",
  "keyIssues": ["problema1", "problema2", "problema3"],
  "recommendedActions": ["ação1", "ação2"]
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
      temperature: 0.5,
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
    lines.push(`PRESENÇA DIGITAL: Nenhum website encontrado (oportunidade alta)`);
  } else if (data.isThirdParty) {
    lines.push(`PRESENÇA DIGITAL: Apenas redes sociais/perfis (sem site próprio)`);
  } else {
    lines.push(`PRESENÇA DIGITAL: Website próprio encontrado`);
  }

  if (data.hasWebsite && !data.isThirdParty) {
    if (data.isSecure) {
      lines.push(`SEGURANÇA: ✓ SSL/HTTPS habilitado`);
    } else {
      lines.push(`SEGURANÇA: ✗ SEM SSL - crítico para conversão`);
    }

    if (data.isResponsive) {
      lines.push(`MOBILE: ✓ Site responsivo`);
    } else {
      lines.push(`MOBILE: ✗ Site NÃO responsivo - perdendo tráfego mobile`);
    }
  }

  lines.push(`---DADOS REPUTAÇÃO---`);
  lines.push(`NOTA GOOGLE: ${data.rating > 0 ? `${data.rating}/5` : 'Não disponível'}`);

  if (data.reviewCount > 0) {
    lines.push(`QUANTIDADE REVIEWS: ${data.reviewCount} avaliações no Google`);
    if (data.rating < 3.5 && data.reviewCount > 20) {
      lines.push(`⚠️ ALERTA: Muitos reviews com nota baixa - gestão de reputação urgente`);
    } else if (data.rating >= 4.5 && data.reviewCount > 50) {
      lines.push(`✓ Empresa bem avaliada com volume significativo`);
    }
  } else {
    lines.push(`QUANTIDADE REVIEWS: Poucas ou nenhuma avaliação`);
  }

  lines.push(`NICHO: ${getPriceLevelDescription(data.priceLevel)}`);

  lines.push(`---CANAIS DE CONTATO---`);

  if (data.emailCount > 0) {
    lines.push(`EMAIL: ${data.emailCount} email(s) encontrado(s) no site`);
  } else {
    lines.push(`EMAIL: ✗ Nenhum email profissional encontrado`);
  }

  if (data.socialLinksCount > 0) {
    lines.push(`REDES SOCIAIS: ${data.socialLinksCount} link(s) encontrados`);
    const socialNames = data.socialLinks.map(s => s.network).join(', ');
    lines.push(`PLATAFORMAS: ${socialNames}`);

    if (data.followerCount > 0) {
      lines.push(`SEGUIDORES: ~${data.followerCount.toLocaleString()}`);
    }
  } else {
    lines.push(`REDES SOCIAIS: ✗ Nenhum link de redes sociais encontrado`);
  }

  return lines.join('\n');
};

const getPriceLevelDescription = (priceLevel) => {
  const descriptions = {
    0: 'Não especificado',
    1: 'Econômico/Básico',
    2: 'Intermediário',
    3: 'Premium',
    4: 'Alto Luxo/Enterprise'
  };
  return descriptions[priceLevel] || 'Não especificado';
};